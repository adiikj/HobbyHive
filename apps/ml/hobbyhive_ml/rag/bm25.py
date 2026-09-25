"""Okapi BM25, written out so every score can be explained (which query terms matched, and how much each added)."""

import math
from collections import Counter

from .text import content_terms


class BM25:
    def __init__(self, documents: list[str], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.docs = [Counter(content_terms(d)) for d in documents]
        self.lengths = [sum(d.values()) for d in self.docs]
        self.avg_len = (sum(self.lengths) / len(self.lengths)) if self.docs else 0.0
        df = Counter(term for d in self.docs for term in d)
        n = len(self.docs)
        # Lucene-style IDF: always positive, rarer terms weigh more
        self.idf = {term: math.log(1 + (n - f + 0.5) / (f + 0.5)) for term, f in df.items()}

    def score(self, query: str) -> tuple[list[float], list[dict[str, float]]]:
        """Score every document; also return, per document, each matched query term's contribution."""
        terms = content_terms(query)
        scores, contributions = [], []
        for doc, length in zip(self.docs, self.lengths):
            parts: dict[str, float] = {}
            for term in set(terms):
                tf = doc.get(term, 0)
                if tf:
                    norm = self.k1 * (1 - self.b + self.b * length / (self.avg_len or 1))
                    parts[term] = self.idf[term] * tf * (self.k1 + 1) / (tf + norm)
            scores.append(sum(parts.values()))
            contributions.append(parts)
        return scores, contributions
