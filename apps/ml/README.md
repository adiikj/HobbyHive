# HobbyHive ML

Topic model that keeps each hive on topic. Powers three features:

- **Hive suggestion** in the composer ("this sounds like Gaming")
- **Off-topic review queue** for hive moderators
- **Search by meaning** and "More like this"

**Stack:** `bge-small-en-v1.5` embeddings (local ONNX) · logistic regression · pgvector · FastAPI

## Results

| | |
|---|---|
| Hive classification (13 classes) | 79% accuracy (TF-IDF baseline: 21%) |
| Off-topic flag | 65% recall at 3.3% false alarms |
| Search top-3 quality | 0.57 → 0.90 with hybrid ranking |

Details: [`reports/metrics.md`](reports/metrics.md), [`reports/search.md`](reports/search.md). Training data is synthetic (520 posts).

## Run

```bash
uv sync
uv run python train.py        # train + evaluate
uv run python eval_search.py  # search benchmark
uv run pytest -q
uv run uvicorn hobbyhive_ml.api:app --port 8002
```

`npm run dev` from the repo root starts it with the app. After retraining: `pnpm --filter @hobbyhive/backend ml:backfill --all`.
