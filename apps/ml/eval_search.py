"""Retrieval benchmark for search-by-meaning over the real HobbyHive posts.

Each query names the hive its good results belong to. Compares plain query embeddings, BGE's query
instruction, and hybrid ranking (similarity + the topic classifier's belief that the query is about the
post's hive); picks the configuration and cut-off, and saves them to models/search_config.json for the API.

Run: uv run python eval_search.py   (after train.py)
"""

import json

import numpy as np

from hobbyhive_ml.classifier import load
from hobbyhive_ml.embedder import embed
from train import MODELS, REPORTS, load_real_posts

QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "
# Relevance here is "same hive", which is exactly what the hive boost rewards — so a larger boost flatters the
# metric while turning search into "list the hive". Cap it so text similarity stays the main signal.
MAX_HIVE_BOOST = 0.3

QUERIES = [
    ("improving at spinning moves", "dance"),
    ("beautiful evening light photos", "photography"),
    ("homemade bread", "cooking"),
    ("feeling nervous before performing on stage", "singing"),
    ("getting stronger at the gym", "fitness"),
    ("fixing bugs in my program", "coding"),
    ("backpacking abroad", "travel"),
    ("beating a hard boss", "gaming"),
    ("painting with watercolors", "art"),
    ("writing my first novel", "writing"),
    ("playing chords on guitar", "music"),
    ("favourite anime series", "anime"),
    ("drawing my pet", "art"),
    ("staying on beat when freestyling", "dance"),
]


def evaluate(label: str, scores: np.ndarray, doc_hives: list[str]) -> dict:
    ratios, rel, irr = [], [], []
    for (_, hive), row in zip(QUERIES, scores):
        n_relevant = sum(h == hive for h in doc_hives)
        top = np.argsort(-row)[:3]
        hits = sum(doc_hives[i] == hive for i in top)
        ratios.append(hits / min(3, n_relevant))  # 1.0 = as good as possible for this query
        rel += [row[i] for i in range(len(doc_hives)) if doc_hives[i] == hive]
        irr += [row[i] for i in range(len(doc_hives)) if doc_hives[i] != hive]
    rel, irr = np.array(rel), np.array(irr)
    cuts = np.arange(0.30, 1.20, 0.01)
    best = max(cuts, key=lambda c: (rel >= c).mean() - (irr >= c).mean())  # Youden's J
    result = {
        "label": label,
        "top3_quality": float(np.mean(ratios)),
        "min_score": round(float(best), 2),
        "relevant_kept": float((rel >= best).mean()),
        "irrelevant_kept": float((irr >= best).mean()),
    }
    print(
        f"{label:38s} top-3 quality {result['top3_quality']:.2f} (1.0 = best possible) | cut-off {best:.2f} keeps "
        f"{result['relevant_kept']:.0%} relevant / {result['irrelevant_kept']:.0%} irrelevant"
    )
    return result


def main() -> None:
    texts, hives = load_real_posts()
    if not texts:
        raise SystemExit("needs the app database (real posts) — check apps/backend/.env DATABASE_URL")
    seen, docs, doc_hives = set(), [], []
    for t, h in zip(texts, hives):  # de-duplicate identical demo posts so copies don't inflate scores
        if t not in seen:
            seen.add(t)
            docs.append(t)
            doc_hives.append(h)
    doc_vecs = embed(docs)
    queries = [q for q, _ in QUERIES]

    plain = embed(queries)
    instructed = embed([QUERY_INSTRUCTION + q for q in queries])
    results = [
        {**evaluate("plain query", plain @ doc_vecs.T, doc_hives), "instruction": False, "hive_boost": 0.0},
        {**evaluate("query + BGE instruction", instructed @ doc_vecs.T, doc_hives), "instruction": True, "hive_boost": 0.0},
    ]

    # Hybrid: add the topic model's belief that the query is about each post's hive
    model, labels, _, _ = load()
    col = {label: i for i, label in enumerate(labels)}
    hive_boost = np.array([[p[col[h]] for h in doc_hives] for p in model.predict_proba(plain)])
    for base_label, base, instr in [("plain", plain, False), ("instruction", instructed, True)]:
        for lam in (0.1, 0.2, 0.3, 0.5):
            r = evaluate(f"hybrid ({base_label}) λ={lam}", base @ doc_vecs.T + lam * hive_boost, doc_hives)
            results.append({**r, "instruction": instr, "hive_boost": lam})

    eligible = [r for r in results if r["hive_boost"] <= MAX_HIVE_BOOST]
    chosen = max(eligible, key=lambda r: (round(r["top3_quality"], 2), -r["irrelevant_kept"]))
    config = {
        "query_instruction": QUERY_INSTRUCTION if chosen["instruction"] else "",
        "hive_boost": chosen["hive_boost"],
        "min_score": chosen["min_score"],
        "benchmark": {"queries": len(QUERIES), "posts": len(docs), "top3_quality": round(chosen["top3_quality"], 3)},
    }
    (MODELS / "search_config.json").write_text(json.dumps(config, indent=2))

    lines = [
        "# Search by meaning — benchmark",
        "",
        f"{len(QUERIES)} queries over {len(docs)} real posts; relevant = same hive. "
        "Top-3 quality = hits in top 3 ÷ best achievable.",
        "",
        "| Ranking | Top-3 quality | Cut-off | Relevant kept | Irrelevant kept |",
        "|---|---|---|---|---|",
        *[
            f"| {r['label']} | {r['top3_quality']:.2f} | {r['min_score']:.2f} | {r['relevant_kept']:.0%} | {r['irrelevant_kept']:.0%} |"
            for r in results
        ],
        "",
        f"Chosen: {chosen['label']} (λ capped at {MAX_HIVE_BOOST}, since relevance here is \"same hive\").",
    ]
    (REPORTS / "search.md").write_text("\n".join(lines) + "\n")
    print(f"\nchosen: {chosen['label']} → models/search_config.json, reports/search.md")


if __name__ == "__main__":
    main()
