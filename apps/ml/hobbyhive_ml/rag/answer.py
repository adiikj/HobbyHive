"""Ask Bea, end to end: retrieve → re-rank → pick evidence → rewrite → verify → compose. Returns the answer plus a
trace of every step, so the UI can show exactly why Bea said what she said."""

import json
import re
import time
from pathlib import Path

import numpy as np

from . import generate
from .faithfulness import check
from .index import Candidate, get_index


CONFIG_PATH = Path(__file__).resolve().parents[2] / "models" / "rag_config.json"
# relative_margin: evidence must be nearly as relevant as the best passage, so a strong answer isn't padded with stragglers
DEFAULTS = {"use_rerank": True, "min_relevance": 0.0, "relative_margin": 0.1, "max_evidence": 3, "candidates": 20, "mmr_lambda": 0.7}


def load_config() -> dict:
    try:
        return {**DEFAULTS, **json.loads(CONFIG_PATH.read_text())}
    except FileNotFoundError:
        return dict(DEFAULTS)


def relevance(c: Candidate, use_rerank: bool) -> float:
    return c.rerank if use_rerank and c.rerank is not None else c.dense


def select_evidence(candidates: list[Candidate], k: int, lam: float, use_rerank: bool) -> list[Candidate]:
    """Maximal Marginal Relevance: prefer relevant passages, penalise ones that repeat what's already chosen;
    at most one passage per post so a single thread can't dominate."""
    chosen: list[Candidate] = []
    pool = list(candidates)
    rel = {id(c): relevance(c, use_rerank) for c in pool}
    lo, hi = min(rel.values(), default=0), max(rel.values(), default=1)
    norm = {k_: (v - lo) / ((hi - lo) or 1) for k_, v in rel.items()}
    while pool and len(chosen) < k:
        def mmr(c: Candidate) -> float:
            redundancy = max((float(np.dot(c.vector, s.vector)) for s in chosen), default=0.0)
            return lam * norm[id(c)] - (1 - lam) * redundancy

        best = max(pool, key=mmr)
        pool.remove(best)
        if any(s.chunk.post_id == best.chunk.post_id for s in chosen):
            continue
        chosen.append(best)
    return chosen


_FIRST_PERSON = re.compile(r"\b(i|i'm|im|i've|ive|i'd|my|me|mine|myself)\b", re.IGNORECASE)


def needs_rewrite(text: str) -> bool:
    """Only first-person notes need rephrasing ("fixed it for me" -> "fixed it for him"); fragments like
    "First time freestyling ever. Be kind" read fine quoted, and the small model tends to mangle them."""
    return bool(_FIRST_PERSON.search(text.replace("’", "'")))


def first_name(full_name: str) -> str:
    return full_name.split()[0] if full_name.strip() else full_name


def quote(c: Candidate) -> str:
    verb = "replied" if c.chunk.kind == "comment" else "posted"
    return f"{first_name(c.chunk.author_name)} {verb}: “{c.chunk.text}”"


def intro(evidence: list[Candidate], hive_name: str | None) -> str:
    people = list(dict.fromkeys(first_name(c.chunk.author_name) for c in evidence))
    where = f"in {hive_name}" if hive_name else "here"
    if len(people) == 1:
        return f"{people[0]} has shared something about this."
    return f"A few people {where} have talked about this."


def ask(question: str, hive: str | None = None) -> dict:
    config = load_config()
    timings: dict[str, float] = {}
    t0 = time.perf_counter()

    index = get_index()
    candidates = index.search(question, hive=hive, k=config["candidates"])
    timings["retrieve_ms"] = (time.perf_counter() - t0) * 1000

    t = time.perf_counter()
    if config["use_rerank"] and candidates:
        from .rerank import rerank_scores  # optional stage; off by default

        for c, s in zip(candidates, rerank_scores(question, [c.chunk.retrieval_text for c in candidates])):
            c.rerank = s
        candidates.sort(key=lambda c: c.rerank, reverse=True)
    timings["rerank_ms"] = (time.perf_counter() - t) * 1000

    answers = [c for c in candidates if not c.chunk.is_question]
    best = max((relevance(c, config["use_rerank"]) for c in answers), default=float("-inf"))
    floor = max(config["min_relevance"], best - config["relative_margin"])
    relevant = [c for c in answers if relevance(c, config["use_rerank"]) >= floor]
    evidence = select_evidence(relevant, config["max_evidence"], config["mmr_lambda"], config["use_rerank"])
    hive_name = evidence[0].chunk.hive_name if evidence else None

    t = time.perf_counter()
    segments, rewrites = [], []
    if evidence:
        segments.append({"text": intro(evidence, hive_name) + " ", "evidence": []})
        for i, c in enumerate(evidence):
            wants_rewrite = needs_rewrite(c.chunk.text)
            draft = generate.rewrite(first_name(c.chunk.author_name), c.chunk.text) if wants_rewrite else None
            verdict = check(draft, c.chunk.text, c.chunk.author_name) if draft else None
            still_first_person = bool(draft) and needs_rewrite(draft)  # the one job it had
            used_rewrite = bool(verdict and verdict.passed) and not still_first_person
            sentence = draft if used_rewrite else quote(c)
            segments.append({"text": sentence + " ", "evidence": [i]})
            rewrites.append(
                {
                    "evidence": i,
                    "source": c.chunk.text,
                    "draft": draft,
                    "accepted": used_rewrite,
                    "reason": None
                    if used_rewrite
                    else "not first-person, quoted as written"
                    if not wants_rewrite
                    else (
                        ("local language model is off" if generate.status() == "disabled" else "language model not ready")
                        if not draft
                        else verdict.reason or "still first-person"
                    ),
                    "unsupported_words": verdict.unsupported if verdict else [],
                    "dropped_words": verdict.dropped if verdict else [],
                    "supported_share": verdict.supported_share if verdict else None,
                    "kept_share": verdict.kept_share if verdict else None,
                    "similarity": verdict.similarity if verdict else None,
                }
            )
    else:
        where = "in this hive" if hive else "in the hives"
        segments.append(
            {"text": f"I couldn't find anyone {where} talking about that yet. Why not ask the hive with a post? Someone's bound to have tried it.", "evidence": []}
        )
    timings["compose_ms"] = (time.perf_counter() - t) * 1000
    timings["total_ms"] = (time.perf_counter() - t0) * 1000

    return {
        "mode": "none" if not evidence else ("extractive" if not any(r["accepted"] for r in rewrites) else "generated" if all(r["accepted"] for r in rewrites) else "mixed"),
        "answer": segments,
        "evidence": [
            {
                "chunk_id": c.chunk.id,
                "kind": c.chunk.kind,
                "post_id": c.chunk.post_id,
                "comment_id": c.chunk.comment_id,
                "author_name": c.chunk.author_name,
                "author_username": c.chunk.author_username,
                "text": c.chunk.text,
                "created_at": c.chunk.created_at,
            }
            for c in evidence
        ],
        "trace": {
            "index": {**index.stats.__dict__},
            "hive": hive,
            "config": config,
            "candidates": [
                {
                    "text": c.chunk.text,
                    "author": c.chunk.author_name,
                    "kind": c.chunk.kind,
                    "keyword_score": round(c.bm25, 3),
                    "keyword_rank": c.bm25_rank,
                    "matched_terms": c.matched_terms,
                    "meaning_score": round(c.dense, 3),
                    "meaning_rank": c.dense_rank,
                    "fused_score": round(c.rrf, 5),
                    "rerank_score": None if c.rerank is None else round(c.rerank, 3),
                    "passed_threshold": relevance(c, config["use_rerank"]) >= config["min_relevance"],
                    "close_to_best": relevance(c, config["use_rerank"]) >= floor,
                    "is_question": c.chunk.is_question,
                    "replying_to": c.chunk.context,
                    "selected": any(c is e for e in evidence),
                }
                for c in candidates[:8]
            ],
            "generator": generate.status(),
            "rewrites": rewrites,
            "timings_ms": {k: round(v, 1) for k, v in timings.items()},
        },
    }
