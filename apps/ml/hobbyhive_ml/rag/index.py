"""Hybrid retrieval: BM25 (exact words) + dense embeddings (meaning), fused with Reciprocal Rank Fusion."""

import threading
import time
from dataclasses import dataclass, field

import numpy as np

from ..embedder import embed
from .bm25 import BM25
from .corpus import Chunk, CorpusStats, load_chunks

QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "
RRF_K = 60  # standard RRF constant: dampens how much the very top ranks dominate
REFRESH_SECONDS = 120


@dataclass
class Candidate:
    chunk: Chunk
    bm25: float
    bm25_rank: int | None  # None = no keyword overlap at all
    matched_terms: dict[str, float]
    dense: float
    dense_rank: int
    rrf: float
    rerank: float | None = None
    vector: np.ndarray = field(default=None, repr=False)


class KnowledgeIndex:
    def __init__(self, chunks: list[Chunk], stats: CorpusStats, previous: "KnowledgeIndex | None" = None):
        self.chunks, self.stats = chunks, stats
        self.bm25 = BM25([c.retrieval_text for c in chunks])
        # Incremental: reuse vectors of chunks whose retrieval text hasn't changed; embed only new/edited ones.
        # Keeps refreshes cheap on a burstable VM, where every CPU-second spends credits.
        known = previous.vector_by_key if previous else {}
        keys = [(c.id, c.retrieval_text) for c in chunks]
        missing = [i for i, k in enumerate(keys) if k not in known]
        fresh = embed([chunks[i].retrieval_text for i in missing])
        self.vectors = np.zeros((len(chunks), fresh.shape[1] if len(missing) else 384), dtype=np.float32)
        for i, k in enumerate(keys):
            if k in known:
                self.vectors[i] = known[k]
        for j, i in enumerate(missing):
            self.vectors[i] = fresh[j]
        self.vector_by_key = {k: self.vectors[i] for i, k in enumerate(keys)}
        self.embedded_on_build = len(missing)
        self.built_at = time.time()

    def search(self, query: str, hive: str | None = None, k: int = 20) -> list[Candidate]:
        idx = [i for i, c in enumerate(self.chunks) if hive is None or c.hive_slug == hive]
        if not idx:
            return []
        bm25_all, contributions = self.bm25.score(query)
        bm25 = np.array([bm25_all[i] for i in idx])
        q = embed([QUERY_INSTRUCTION + query])[0]
        dense = self.vectors[idx] @ q

        bm25_order = [j for j in np.argsort(-bm25) if bm25[j] > 0]
        bm25_rank = {j: r + 1 for r, j in enumerate(bm25_order)}
        dense_rank = {j: r + 1 for r, j in enumerate(np.argsort(-dense))}

        candidates = []
        for j, i in enumerate(idx):
            rrf = 1 / (RRF_K + dense_rank[j]) + (1 / (RRF_K + bm25_rank[j]) if j in bm25_rank else 0.0)
            candidates.append(
                Candidate(
                    chunk=self.chunks[i],
                    bm25=float(bm25[j]),
                    bm25_rank=bm25_rank.get(j),
                    matched_terms={t: round(v, 3) for t, v in contributions[i].items()},
                    dense=float(dense[j]),
                    dense_rank=dense_rank[j],
                    rrf=rrf,
                    vector=self.vectors[i],
                )
            )
        candidates.sort(key=lambda c: c.rrf, reverse=True)
        return candidates[:k]


_index: KnowledgeIndex | None = None
_lock = threading.Lock()


def get_index(max_age: float = REFRESH_SECONDS) -> KnowledgeIndex:
    """The current index, rebuilt from the database when older than max_age (new posts/comments show up within minutes)."""
    global _index
    with _lock:
        if _index is None or time.time() - _index.built_at > max_age:
            _index = KnowledgeIndex(*load_chunks(), previous=_index)
        return _index
