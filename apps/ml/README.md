# HobbyHive ML

Everything runs locally: no paid APIs.

- **Topic model:** hive suggestion in the composer, off-topic review queue for moderators, search by meaning
- **Ask Bea:** RAG assistant that answers only from hive posts and comments, cites them, and shows its working

**Stack:** `bge-small-en-v1.5` (quantized ONNX) · logistic regression · BM25 + dense hybrid retrieval · pgvector · FastAPI · optional Qwen2.5-0.5B

Runs in ~245 MB (built for a 1 GB VM shared with the API): see [`../../deploy`](../../deploy/README.md).

## Results

| | |
|---|---|
| Hive classification (13 classes) | 79% accuracy (TF-IDF baseline: 21%) |
| Off-topic flag | 66% recall at 4.1% false alarms |
| Search top-3 quality | 0.57 → 0.90 with hybrid ranking |
| Ask Bea | 90% of answerable questions answered, 100% of unanswerable declined |

Details: [`reports/metrics.md`](reports/metrics.md), [`reports/search.md`](reports/search.md), [`reports/rag.md`](reports/rag.md). Training data is synthetic (520 posts).

## Run

```bash
uv sync
uv run python train.py        # train + evaluate
uv run python eval_search.py  # search benchmark
uv run python eval_rag.py     # Ask Bea evaluation
uv run pytest -q
uv run uvicorn hobbyhive_ml.api:app --port 8002
```

`npm run dev` from the repo root starts it with the app. After retraining: `pnpm --filter @hobbyhive/backend ml:backfill --all`.
