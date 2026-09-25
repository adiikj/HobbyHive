"""Optional local rewriting with a small instruct LLM (Qwen2.5-0.5B, int4, ONNX Runtime GenAI — no API).

Off by default: it needs ~350 MB loaded and ~530 MB while generating, which a 1 GB VM running two services can't
spare, and evaluation showed it adds little (about half its rewrites fail the faithfulness check and get quoted
anyway). Enable with BEA_LOCAL_LLM=1 on a bigger host (and `uv sync --group llm`).

The model is given one small, checkable job: turn a single member's note into one third-person sentence. It never
answers the question itself; faithfulness.py verifies every rewrite before Bea uses it.
"""

import os
import threading
from pathlib import Path

from ..embedder import CACHE_DIR

MODEL_REPO = "hazemmabbas/Qwen2.5-0.5B-int4-block-32-acc-3-Instruct-onnx-cpu"
MODEL_DIR = Path(CACHE_DIR) / "qwen2.5-0.5b-instruct-genai"
MAX_NEW_TOKENS = 60

SYSTEM = "Rewrite the person's note as one sentence about them, in third person. Keep every fact. Add nothing new."
SHOTS = [
    ("Sofia", "my loaf got way lighter once I let the dough proof overnight",
     "Sofia says her loaf got way lighter once she let the dough proof overnight."),
    ("Marcus", "Weighing the flour instead of using cups fixed it for me.",
     "Marcus says weighing the flour instead of using cups fixed it for him."),
]

_state = {"status": "not_loaded", "model": None, "tokenizer": None}
_load_lock = threading.Lock()
_generate_lock = threading.Lock()  # one generation at a time on this CPU


def enabled() -> bool:
    return os.environ.get("BEA_LOCAL_LLM", "0") == "1"


def status() -> str:
    if not enabled() and _state["status"] != "ready":
        return "disabled"
    return _state["status"]  # not_loaded | downloading | loading | ready | unavailable


def ensure_loaded(download: bool = True) -> bool:
    """Load the model (downloading it first if needed). Safe to call from a background thread. No-op unless enabled."""
    if not enabled():
        return False
    with _load_lock:
        if _state["status"] == "ready":
            return True
        try:
            if not (MODEL_DIR / "genai_config.json").exists():
                if not download:
                    _state["status"] = "unavailable"
                    return False
                _state["status"] = "downloading"
                from huggingface_hub import snapshot_download

                snapshot_download(MODEL_REPO, local_dir=str(MODEL_DIR))
            _state["status"] = "loading"
            import onnxruntime_genai as og

            model = og.Model(str(MODEL_DIR))
            _state.update(model=model, tokenizer=og.Tokenizer(model), status="ready")
            return True
        except Exception as exc:  # the pipeline falls back to extractive answers
            print(f"[bea] local LLM unavailable: {exc}")
            _state["status"] = "unavailable"
            return False


def _chat(messages: list[dict[str, str]]) -> str:
    import onnxruntime_genai as og

    model, tokenizer = _state["model"], _state["tokenizer"]
    prompt = "".join(f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n" for m in messages) + "<|im_start|>assistant\n"
    ids = tokenizer.encode(prompt)
    params = og.GeneratorParams(model)
    params.set_search_options(max_length=len(ids) + MAX_NEW_TOKENS, do_sample=False)  # greedy: deterministic, explainable
    generator = og.Generator(model, params)
    generator.append_tokens(ids)
    out = []
    while not generator.is_done():
        generator.generate_next_token()
        out.append(generator.get_next_tokens()[0])
    return tokenizer.decode(out).strip()


_cache: dict[tuple[str, str], str] = {}  # only real rewrites are cached, never "model not ready"
MAX_CACHE = 4096


def rewrite(author_first_name: str, note: str) -> str | None:
    """One-sentence third-person rewrite of a note, or None if the model isn't ready. Cached: evidence repeats."""
    key = (author_first_name, note)
    if key in _cache:
        return _cache[key]
    if _state["status"] != "ready":
        return None
    messages = [{"role": "system", "content": SYSTEM}]
    for name, text, reply in SHOTS:
        messages += [{"role": "user", "content": f"{name}: {text}"}, {"role": "assistant", "content": reply}]
    messages.append({"role": "user", "content": f"{author_first_name}: {note}"})
    with _generate_lock:
        result = _chat(messages).split("\n")[0].strip()
    if len(_cache) >= MAX_CACHE:
        _cache.pop(next(iter(_cache)))
    _cache[key] = result
    return result
