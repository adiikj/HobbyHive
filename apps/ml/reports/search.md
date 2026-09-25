# Search by meaning — benchmark

14 queries over 36 real posts; relevant = same hive. Top-3 quality = hits in top 3 ÷ best achievable.

| Ranking | Top-3 quality | Cut-off | Relevant kept | Irrelevant kept |
|---|---|---|---|---|
| plain query | 0.57 | 0.54 | 75% | 24% |
| query + BGE instruction | 0.55 | 0.51 | 71% | 18% |
| hybrid (plain) λ=0.1 | 0.74 | 0.57 | 87% | 15% |
| hybrid (plain) λ=0.2 | 0.88 | 0.58 | 90% | 14% |
| hybrid (plain) λ=0.3 | 0.90 | 0.59 | 92% | 14% |
| hybrid (plain) λ=0.5 | 0.94 | 0.62 | 92% | 10% |
| hybrid (instruction) λ=0.1 | 0.77 | 0.54 | 81% | 12% |
| hybrid (instruction) λ=0.2 | 0.88 | 0.55 | 88% | 11% |
| hybrid (instruction) λ=0.3 | 0.90 | 0.57 | 90% | 9% |
| hybrid (instruction) λ=0.5 | 0.94 | 0.59 | 92% | 8% |

Chosen: hybrid (instruction) λ=0.3 (λ capped at 0.3, since relevance here is "same hive").
