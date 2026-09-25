"""Ask Bea pipeline tests: each stage in isolation, then the whole thing on a tiny in-memory corpus."""

import numpy as np
import pytest

from hobbyhive_ml.rag import answer as answer_mod
from hobbyhive_ml.rag import generate, index as index_mod
from hobbyhive_ml.rag.bm25 import BM25
from hobbyhive_ml.rag.corpus import build_chunks, is_question
from hobbyhive_ml.rag.faithfulness import check
from hobbyhive_ml.rag.index import KnowledgeIndex
from hobbyhive_ml.rag.text import content_terms, stem


def row(kind, text, post_id="p1", comment_id=None, author="Priya Sharma", hive="dance", parent=None, t="2026-01-01"):
    return (kind, post_id, comment_id, text, author, author.split()[0].lower(), hive, hive.title(), t, parent)


def test_stemming_and_stopwords_are_predictable():
    assert stem("spinning") == "spin" and stem("doubles") == "double" and stem("two") == "2"
    assert content_terms("I'm spinning the doubles!") == ["spin", "double"]


def test_bm25_explains_which_terms_matched():
    bm25 = BM25(["spotting fixed my turns", "sourdough bread recipe"])
    scores, parts = bm25.score("how to fix turns")
    assert scores[0] > 0 and scores[1] == 0
    assert set(parts[0]) == {"fix", "turn"}


def test_chunking_drops_reactions_and_duplicates_and_keeps_reply_context():
    chunks, stats = build_chunks([
        row("post", "Anyone have tips for staying on beat during freestyle?"),
        row("comment", "Keep it up!", comment_id="c1", parent="Anyone have tips…?"),
        row("comment", "Count the 8s out loud at first. Feels silly, works.", comment_id="c2", author="Diego Alvarez", parent="Anyone have tips for staying on beat during freestyle?"),
        row("post", "Anyone have tips for staying on beat during freestyle?", post_id="p2", author="Marcus Chen"),
    ])
    assert stats.skipped_low_information == 1 and stats.skipped_duplicates == 1
    reply = next(c for c in chunks if c.kind == "comment")
    assert reply.text.startswith("Count the 8s") and "staying on beat" in reply.retrieval_text
    assert next(c for c in chunks if c.kind == "post").is_question


def test_only_first_person_notes_are_rewritten():
    assert answer_mod.needs_rewrite("Weighing the flour fixed it for me.")
    assert answer_mod.needs_rewrite("I’m nervous but excited")
    assert not answer_mod.needs_rewrite("First time freestyling ever. Be kind")


def test_question_detection():
    assert is_question("Anyone have tips for staying on beat?")
    assert not is_question("Week 2: spotting is clicking. Singles are stable now.")


def test_faithfulness_accepts_framing_and_rejects_invented_facts():
    ok = check("Priya says in week 2 spotting is clicking and her singles are stable now.", "Week 2: spotting is clicking. Singles are stable now.", "Priya Sharma")
    bad = check("Priya says week three was her best performance with a perfect score.", "Week 3: first double! Landed 2 out of 10.", "Priya Sharma")
    assert ok.passed, ok
    assert not bad.passed and bad.reason == "added words not in the source"
    assert {"best", "performance", "perfect", "score"} <= set(bad.unsupported)


def test_faithfulness_rejects_dropped_details():
    lossy = check("Diego says counting out loud works.", "Count the 8s out loud at first. Feels silly, works.", "Diego Alvarez")
    assert not lossy.passed and lossy.reason == "dropped key details" and "8s" in lossy.dropped


@pytest.fixture
def tiny_index(monkeypatch):
    chunks, stats = build_chunks([
        row("post", "Week 2: spotting is clicking. Singles are stable now.", post_id="p1"),
        row("post", "Mirror vs no mirror: turns out I rely on it way too much", post_id="p2"),
        row("comment", "Count the 8s out loud at first. Feels silly, works.", post_id="p3", comment_id="c1", author="Diego Alvarez", parent="Anyone have tips for staying on beat during freestyle?"),
        row("post", "Sketchbook page from this morning's coffee shop session.", post_id="p4", author="Aisha Khan", hive="art"),
    ])
    idx = KnowledgeIndex(chunks, stats)
    monkeypatch.setattr(answer_mod, "get_index", lambda *a, **k: idx)
    monkeypatch.setattr(answer_mod, "load_config", lambda: {**answer_mod.DEFAULTS, "use_rerank": False, "min_relevance": 0.54})
    monkeypatch.setattr(generate, "_state", {"status": "not_loaded", "model": None, "tokenizer": None})
    return idx


def test_search_is_scoped_to_the_hive(tiny_index):
    assert {c.chunk.hive_slug for c in tiny_index.search("sketching", hive="dance")} == {"dance"}


def test_answers_with_quotes_and_evidence_when_the_llm_is_not_ready(tiny_index):
    result = answer_mod.ask("tips for staying on beat when freestyling", "dance")
    assert result["mode"] == "extractive"
    assert result["evidence"][0]["text"].startswith("Count the 8s")
    assert "Diego replied: “Count the 8s" in "".join(s["text"] for s in result["answer"])
    assert result["trace"]["rewrites"][0]["reason"] == "not first-person, quoted as written"
    assert all(set(s) == {"text", "evidence"} for s in result["answer"])


def test_abstains_when_nothing_is_relevant(tiny_index):
    result = answer_mod.ask("best crampons for glacier hiking", "dance")
    assert result["mode"] == "none" and result["evidence"] == []
    assert "couldn't find anyone" in result["answer"][0]["text"]


def test_evidence_takes_at_most_one_chunk_per_post(tiny_index):
    cands = tiny_index.search("turns and spotting practice", hive="dance")
    for c in cands:
        c.chunk.__dict__  # frozen dataclass sanity
    chosen = answer_mod.select_evidence(cands + cands, k=3, lam=0.7, use_rerank=False)
    assert len({c.chunk.post_id for c in chosen}) == len(chosen)


def test_index_refresh_only_embeds_new_or_edited_chunks():
    rows = [row("post", "Week 2: spotting is clicking. Singles are stable now.", post_id="p1")]
    first = KnowledgeIndex(*build_chunks(rows))
    rows.append(row("post", "Mirror vs no mirror: turns out I rely on it way too much", post_id="p2"))
    second = KnowledgeIndex(*build_chunks(rows), previous=first)
    assert first.embedded_on_build == 1 and second.embedded_on_build == 1
    assert np.allclose(second.vectors[0], first.vectors[0])
