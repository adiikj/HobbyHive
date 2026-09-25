"""Cross-encoder re-ranking: reads the question and each passage together (slower, but sharper than embeddings)."""

from functools import lru_cache

from ..embedder import CACHE_DIR

RERANK_MODEL = "Xenova/ms-marco-MiniLM-L-6-v2"


@lru_cache(maxsize=1)
def _model():
    # Imported lazily: the re-ranker is off in production (see models/rag_config.json), so fastembed isn't needed there
    from fastembed.rerank.cross_encoder import TextCrossEncoder

    return TextCrossEncoder(RERANK_MODEL, cache_dir=str(CACHE_DIR))


def rerank_scores(query: str, passages: list[str]) -> list[float]:
    """passages should be retrieval texts (replies include the post they answer)."""
    """Relevance logits (higher = more relevant; roughly > 0 means relevant)."""
    if not passages:
        return []
    return [float(s) for s in _model().rerank(query, passages)]
