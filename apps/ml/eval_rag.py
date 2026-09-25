"""Ask Bea evaluation: retrieval quality, when to abstain, and how often local rewrites survive the faithfulness check.

Compares four rankings (BM25, embeddings, hybrid RRF, hybrid + cross-encoder re-rank) on data/rag_eval.json,
picks the relevance signal + threshold that best separates answerable from unanswerable questions, writes
models/rag_config.json (read by the API) and reports/rag.md.

Run: uv run python eval_rag.py   (needs the app database)
"""

import json
from pathlib import Path

import numpy as np

from hobbyhive_ml.rag import generate
from hobbyhive_ml.rag.answer import CONFIG_PATH, DEFAULTS, ask
from hobbyhive_ml.rag.index import get_index
from hobbyhive_ml.rag.rerank import rerank_scores

ROOT = Path(__file__).resolve().parent
EVAL = json.loads((ROOT / "data" / "rag_eval.json").read_text())["questions"]
K = 20


def is_hit(text: str, expected: list[str]) -> bool:
    return any(e.lower() in text.lower() for e in expected)


def first_hit_rank(ordered_texts: list[str], expected: list[str]) -> int | None:
    for r, t in enumerate(ordered_texts, 1):
        if is_hit(t, expected):
            return r
    return None


def main() -> None:
    index = get_index(max_age=0)
    rankings = {name: [] for name in ("BM25 (keywords)", "Embeddings (meaning)", "Hybrid (RRF)", "Hybrid + re-rank")}
    signals = []  # per question: best non-question candidate's dense / rerank score, and whether top-1 is correct

    for item in EVAL:
        cands = [c for c in index.search(item["q"], hive=item["hive"], k=K) if not c.chunk.is_question]
        for c, s in zip(cands, rerank_scores(item["q"], [c.chunk.retrieval_text for c in cands])):
            c.rerank = s
        orders = {
            "BM25 (keywords)": sorted(cands, key=lambda c: c.bm25, reverse=True),
            "Embeddings (meaning)": sorted(cands, key=lambda c: c.dense, reverse=True),
            "Hybrid (RRF)": sorted(cands, key=lambda c: c.rrf, reverse=True),
            "Hybrid + re-rank": sorted(cands, key=lambda c: c.rerank, reverse=True),
        }
        if item["expected"]:
            for name, ordered in orders.items():
                rankings[name].append(first_hit_rank([c.chunk.text for c in ordered], item["expected"]))
        signals.append(
            {
                "answerable": bool(item["expected"]),
                "dense": {"score": max(c.dense for c in cands), "top_ok": bool(item["expected"]) and is_hit(orders["Embeddings (meaning)"][0].chunk.text, item["expected"])},
                "rerank": {"score": max(c.rerank for c in cands), "top_ok": bool(item["expected"]) and is_hit(orders["Hybrid + re-rank"][0].chunk.text, item["expected"])},
            }
        )

    retrieval = {}
    for name, ranks in rankings.items():
        retrieval[name] = {
            "recall@1": np.mean([r is not None and r <= 1 for r in ranks]),
            "recall@3": np.mean([r is not None and r <= 3 for r in ranks]),
            "mrr": np.mean([1 / r if r else 0 for r in ranks]),
        }
        print(f"{name:22s} R@1 {retrieval[name]['recall@1']:.2f}  R@3 {retrieval[name]['recall@3']:.2f}  MRR {retrieval[name]['mrr']:.2f}")

    # Abstention: answer only if the best passage clears a threshold. Balanced accuracy =
    # mean(answerable → answered with a correct top passage, unanswerable → abstained).
    best = None
    for signal in ("dense", "rerank"):
        scores = sorted({round(s[signal]["score"], 3) for s in signals})
        for t in scores + [scores[-1] + 1]:
            ans = [s for s in signals if s["answerable"]]
            una = [s for s in signals if not s["answerable"]]
            answered_ok = np.mean([s[signal]["score"] >= t and s[signal]["top_ok"] for s in ans])
            abstained = np.mean([s[signal]["score"] < t for s in una])
            bal = (answered_ok + abstained) / 2
            if best is None or bal > best["balanced"] + 1e-9:
                best = {"signal": signal, "threshold": t, "balanced": bal, "answered_ok": answered_ok, "abstained": abstained}
    print(f"abstention: {best}")

    config = {**DEFAULTS, "use_rerank": best["signal"] == "rerank", "min_relevance": float(best["threshold"])}
    CONFIG_PATH.write_text(json.dumps(config, indent=2))

    # Generation: run the full pipeline on answerable questions; count rewrites that pass the faithfulness check
    generate.ensure_loaded()  # rewrite stats only when BEA_LOCAL_LLM=1
    rewrites, examples = [], []
    for item in EVAL:
        if not item["expected"]:
            continue
        result = ask(item["q"], item["hive"])
        for r in result["trace"]["rewrites"]:
            rewrites.append(r)
            if r["draft"] and len(examples) < 8 and all(e["source"] != r["source"] for e in examples):
                examples.append(r)
    attempted = [r for r in rewrites if r["draft"]]
    accepted = sum(r["accepted"] for r in attempted)
    skipped = sum((r["reason"] or "").startswith("not first-person") for r in rewrites)
    llm_on = generate.status() == "ready"
    print(
        f"evidence sentences {len(rewrites)}: {skipped} not first-person (quoted); "
        + (f"rewrites accepted {accepted}/{len(attempted)}" if llm_on else "local LLM off, so the rest are quoted too")
    )

    lines = [
        "# Ask Bea — evaluation",
        "",
        f"{len(EVAL)} questions ({sum(bool(i['expected']) for i in EVAL)} answerable, {sum(not i['expected'] for i in EVAL)} not), "
        f"{index.stats.chunks} chunks from {index.stats.posts} posts + {index.stats.comments} comments.",
        "",
        "| Ranking | Recall@1 | Recall@3 | MRR |",
        "|---|---|---|---|",
        *[f"| {n} | {m['recall@1']:.2f} | {m['recall@3']:.2f} | {m['mrr']:.2f} |" for n, m in retrieval.items()],
        "",
        f"Abstain threshold: {best['signal']} score ≥ {best['threshold']:.3f} → answerable answered correctly "
        f"{best['answered_ok']:.0%}, unanswerable abstained {best['abstained']:.0%}.",
        "",
        f"Evidence sentences: {len(rewrites)}. Quoted as written (not first-person): {skipped}. "
        + (
            f"Local rewrites accepted by the faithfulness check: {accepted}/{len(attempted)} (rejected ones fall back to quotes)."
            if llm_on
            else "Local LLM off (default for small servers; BEA_LOCAL_LLM=1 to enable): all evidence is quoted verbatim."
        ),
        "",
        *[
            f"- {'✓' if e['accepted'] else '✗'} “{e['source']}” → “{e['draft']}”"
            + ("" if e["accepted"] else f" ({e['reason']}"
               + (f": added {', '.join(e['unsupported_words'])}" if e["unsupported_words"] else "")
               + (f"; dropped {', '.join(e['dropped_words'])}" if e["reason"] == "dropped key details" else "") + ")")
            for e in examples
        ],
    ]
    (ROOT / "reports" / "rag.md").write_text("\n".join(lines) + "\n")
    print("wrote models/rag_config.json, reports/rag.md")


if __name__ == "__main__":
    main()
