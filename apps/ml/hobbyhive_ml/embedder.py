"""Sentence embeddings with a small local ONNX model (no PyTorch, ~250 MB RAM)."""

from functools import lru_cache
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBEDDING_DIM = 384
CACHE_DIR = Path(__file__).resolve().parent.parent / ".model_cache"


@lru_cache(maxsize=1)
def _model() -> TextEmbedding:
    return TextEmbedding(MODEL_NAME, cache_dir=str(CACHE_DIR))


def embed(texts: list[str]) -> np.ndarray:
    """Unit-length embeddings, shape (len(texts), 384). Normalised so dot product = cosine similarity."""
    if not texts:
        return np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
    vectors = np.array(list(_model().embed(texts)), dtype=np.float32)
    return vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
