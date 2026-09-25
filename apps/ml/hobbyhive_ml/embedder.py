"""Sentence embeddings: BAAI/bge-small-en-v1.5 (quantized ONNX) run directly on ONNX Runtime.

Tuned for a small VM (1 GB RAM shared with another service): no memory arena, no pre-packed weight copies,
batches capped, inputs capped — ~120 MB resident vs ~230 MB through fastembed, with identical vectors.
"""

import os
from functools import lru_cache
from pathlib import Path

import numpy as np

MODEL_NAME = "BAAI/bge-small-en-v1.5"
MODEL_REPO = "Qdrant/bge-small-en-v1.5-onnx-Q"  # same weights fastembed uses, so stored vectors stay valid
EMBEDDING_DIM = 384
CACHE_DIR = Path(__file__).resolve().parent.parent / ".model_cache"
MAX_TOKENS = 256  # posts are short; capping keeps activation memory small
BATCH_SIZE = 16
THREADS = int(os.environ.get("ML_THREADS", "2"))  # one per vCPU on a B2ats-class VM


def _model_files() -> tuple[Path, Path]:
    from huggingface_hub import hf_hub_download  # only imported when the files aren't cached yet

    local = CACHE_DIR / "bge-small-en-v1.5-onnx-q"
    model, tokenizer = local / "model_optimized.onnx", local / "tokenizer.json"
    if not (model.exists() and tokenizer.exists()):
        for name in ("model_optimized.onnx", "tokenizer.json"):
            hf_hub_download(MODEL_REPO, name, local_dir=str(local))
    return model, tokenizer


@lru_cache(maxsize=1)
def _session():
    import onnxruntime as ort
    from tokenizers import Tokenizer

    model_path, tokenizer_path = _model_files()
    options = ort.SessionOptions()
    options.intra_op_num_threads = THREADS
    options.inter_op_num_threads = 1
    options.enable_cpu_mem_arena = False  # return memory after each batch instead of holding a growing arena
    options.enable_mem_pattern = False
    options.add_session_config_entry("session.use_prepacking", "0")  # no second, pre-packed copy of the weights
    session = ort.InferenceSession(str(model_path), sess_options=options, providers=["CPUExecutionProvider"])

    tokenizer = Tokenizer.from_file(str(tokenizer_path))
    tokenizer.enable_truncation(MAX_TOKENS)
    tokenizer.enable_padding()
    return session, tokenizer, {i.name for i in session.get_inputs()}


def embed(texts: list[str]) -> np.ndarray:
    """Unit-length embeddings, shape (len(texts), 384). Normalised so dot product = cosine similarity."""
    if not texts:
        return np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
    session, tokenizer, input_names = _session()
    out = []
    for start in range(0, len(texts), BATCH_SIZE):
        encoded = tokenizer.encode_batch(texts[start : start + BATCH_SIZE])
        feed = {
            "input_ids": np.array([e.ids for e in encoded], dtype=np.int64),
            "attention_mask": np.array([e.attention_mask for e in encoded], dtype=np.int64),
        }
        if "token_type_ids" in input_names:
            feed["token_type_ids"] = np.array([e.type_ids for e in encoded], dtype=np.int64)
        cls = session.run(None, feed)[0][:, 0]  # bge uses the [CLS] token as the sentence embedding
        out.append(cls / np.linalg.norm(cls, axis=1, keepdims=True))
    return np.vstack(out).astype(np.float32)
