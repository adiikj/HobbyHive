"""Checks that a rewritten sentence says nothing its source doesn't — and explains exactly what it added."""

from dataclasses import dataclass

import numpy as np

from ..embedder import embed
from .text import content_terms

# Words a faithful third-person rewrite may add ("Priya says that her…")
FRAMING = frozenset(content_terms("says said saying found finds mentions mentioned suggests suggested recommends shares shared "
                                  "reckons thinks explains notes noticed replied adds also person people"))
MIN_SUPPORTED = 0.8  # precision: share of the rewrite's content words found in the source (no invented facts)
MIN_KEPT = 0.8  # recall: share of the source's content words kept ("counting out loud" without "the 8s" fails)
MIN_SIMILARITY = 0.7  # semantic sanity check on top of the word-level checks


@dataclass
class FaithCheck:
    passed: bool
    unsupported: list[str]  # words the rewrite added that the source doesn't support
    dropped: list[str]  # source words the rewrite left out
    supported_share: float
    kept_share: float
    similarity: float

    @property
    def reason(self) -> str | None:
        if self.passed:
            return None
        if self.supported_share < MIN_SUPPORTED:
            return "added words not in the source"
        if self.kept_share < MIN_KEPT:
            return "dropped key details"
        return "meaning drifted from the source"


def check(rewrite: str, source: str, author_name: str) -> FaithCheck:
    source_terms = set(content_terms(source))
    allowed = source_terms | FRAMING | set(content_terms(author_name))
    terms = content_terms(rewrite)
    unsupported = [t for t in dict.fromkeys(terms) if t not in allowed]
    dropped = [t for t in dict.fromkeys(content_terms(source)) if t not in set(terms)]
    share = 1.0 if not terms else sum(t in allowed for t in terms) / len(terms)
    kept = 1.0 if not source_terms else 1 - len(dropped) / len(source_terms)
    a, b = embed([rewrite, source])
    similarity = float(np.dot(a, b))
    return FaithCheck(
        passed=bool(rewrite.strip()) and share >= MIN_SUPPORTED and kept >= MIN_KEPT and similarity >= MIN_SIMILARITY,
        unsupported=unsupported,
        dropped=dropped,
        supported_share=round(share, 3),
        kept_share=round(kept, 3),
        similarity=round(similarity, 3),
    )
