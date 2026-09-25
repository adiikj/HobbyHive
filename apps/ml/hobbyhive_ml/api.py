"""HTTP API for the HobbyHive topic model. The Express backend is its only client.

Run: uv run uvicorn hobbyhive_ml.api:app --port 8002
"""

import json
import threading
from contextlib import asynccontextmanager
from functools import lru_cache

from fastapi import FastAPI
from pydantic import BaseModel, Field

from . import classifier
from .embedder import EMBEDDING_DIM, MODEL_NAME, embed
from .rag import generate
from .rag.answer import ask as ask_bea
from .rag.index import get_index

MAX_BATCH = 64
MAX_CHARS = 4000  # posts longer than this are truncated; the model's context is ~512 tokens anyway


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Load weights and the ONNX session once, so the first real request isn't slow
    classifier.load()
    embed(["warm up"])

    # Ask Bea: build the knowledge index and load the local LLM in the background, so the service is up at once.
    # Until the LLM is ready, Bea answers with quotes (the extractive path).
    def warm_bea() -> None:
        try:
            get_index()
        except Exception as exc:
            print(f"[bea] knowledge index not built yet: {exc}")
        generate.ensure_loaded()

    threading.Thread(target=warm_bea, daemon=True).start()
    yield


app = FastAPI(title="HobbyHive ML", version="1.0.0", lifespan=lifespan)


@lru_cache(maxsize=1)
def search_config() -> dict:
    """Ranking settings chosen by eval_search.py (instruction prefix, hive boost, relevance cut-off)."""
    return json.loads((classifier.MODELS_DIR / "search_config.json").read_text())


class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=MAX_BATCH)


class EmbedResponse(BaseModel):
    model: str
    dim: int
    embeddings: list[list[float]]


class QueryRequest(BaseModel):
    text: str = Field(min_length=1)


class QueryResponse(BaseModel):
    embedding: list[float]
    hive_probabilities: dict[str, float]  # P(query is about each hive), for hybrid ranking
    hive_boost: float
    min_score: float


class ClassifyItem(BaseModel):
    text: str = Field(min_length=1)
    hive: str | None = Field(default=None, description="Slug of the hive the post is in / about to go into")


class ClassifyRequest(BaseModel):
    items: list[ClassifyItem] = Field(min_length=1, max_length=MAX_BATCH)


class ClassifyResult(BaseModel):
    suggested_hive: str | None
    suggested_confidence: float
    is_spam_like: bool
    hive_score: float | None
    alternative: str | None
    alternative_score: float | None
    is_off_topic_for_hive: bool
    top: list[tuple[str, float]]


class ClassifyResponse(BaseModel):
    model_version: str
    results: list[ClassifyResult]


@app.get("/health")
def health() -> dict:
    _, labels, rule, card = classifier.load()
    return {
        "status": "ok",
        "embedding_model": MODEL_NAME,
        "labels": labels,
        "trained_at": card["trained_at"],
        "off_topic_rule": {"max_hive_score": rule.max_hive_score, "min_alternative_score": rule.min_alternative_score},
        "test_metrics": card["test_metrics"],
        "bea_language_model": generate.status(),
    }


@app.post("/embed", response_model=EmbedResponse)
def embed_texts(req: EmbedRequest) -> EmbedResponse:
    vectors = embed([t[:MAX_CHARS] for t in req.texts])
    return EmbedResponse(model=MODEL_NAME, dim=EMBEDDING_DIM, embeddings=vectors.round(6).tolist())


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest) -> QueryResponse:
    """Everything the backend needs to rank posts for a search query:
    score = cosine(post, query) + hive_boost * P(post's hive | query); keep score >= min_score."""
    config = search_config()
    text = req.text[:MAX_CHARS]
    vector = embed([config["query_instruction"] + text])[0]
    probabilities = classifier.predict([text])[0].probabilities
    return QueryResponse(
        embedding=vector.round(6).tolist(),
        hive_probabilities={k: round(v, 4) for k, v in probabilities.items() if k != classifier.OFF_TOPIC},
        hive_boost=config["hive_boost"],
        min_score=config["min_score"],
    )


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    hive: str | None = None


@app.post("/ask")
def ask(req: AskRequest) -> dict:
    """Ask Bea: local RAG over posts and comments. Returns the answer, its evidence, and a full trace."""
    return ask_bea(req.question.strip(), req.hive)


@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest) -> ClassifyResponse:
    _, labels, _, card = classifier.load()
    hives = [item.hive if item.hive in labels else None for item in req.items]
    predictions = classifier.predict([item.text[:MAX_CHARS] for item in req.items], hives)
    results = []
    for p in predictions:
        top = sorted(p.probabilities.items(), key=lambda kv: kv[1], reverse=True)[:3]
        results.append(
            ClassifyResult(
                suggested_hive=p.suggested_hive,
                suggested_confidence=round(p.suggested_confidence, 4),
                is_spam_like=p.is_spam_like,
                hive_score=None if p.hive_score is None else round(p.hive_score, 4),
                alternative=p.alternative,
                alternative_score=None if p.alternative_score is None else round(p.alternative_score, 4),
                is_off_topic_for_hive=p.is_off_topic_for_hive,
                top=[(label, round(prob, 4)) for label, prob in top],
            )
        )
    return ClassifyResponse(model_version=card["trained_at"], results=results)
