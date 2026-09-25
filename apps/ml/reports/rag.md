# Ask Bea — evaluation

38 questions (30 answerable, 8 not), 38 chunks from 44 posts + 48 comments.

| Ranking | Recall@1 | Recall@3 | MRR |
|---|---|---|---|
| BM25 (keywords) | 0.93 | 1.00 | 0.96 |
| Embeddings (meaning) | 1.00 | 1.00 | 1.00 |
| Hybrid (RRF) | 0.97 | 1.00 | 0.98 |
| Hybrid + re-rank | 0.97 | 1.00 | 0.98 |

Abstain threshold: dense score ≥ 0.540 → answerable answered correctly 90%, unanswerable abstained 100%.

Evidence sentences: 38. Quoted as written (not first-person): 38. Local rewrites accepted by the faithfulness check: 0/0 (rejected ones fall back to quotes).

