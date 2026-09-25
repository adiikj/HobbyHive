"""Loads the trained hive classifier and turns probabilities into product decisions."""

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np

from .embedder import embed

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
OFF_TOPIC = "off_topic"


@dataclass
class Prediction:
    probabilities: dict[str, float]
    suggested_hive: str | None  # best-matching real hive (never "off_topic")
    suggested_confidence: float
    is_spam_like: bool  # the "off_topic" class itself wins
    hive_score: float | None  # P(post's own hive), when a hive is given
    alternative: str | None  # most likely label other than the post's hive (may be "off_topic")
    alternative_score: float | None
    # Flag only when the hive looks unlikely AND the model is confident about somewhere else —
    # short or vague posts ("Week 3: landed 2 out of 10!") are uncertain, not off-topic.
    is_off_topic_for_hive: bool


@dataclass(frozen=True)
class FlagRule:
    max_hive_score: float  # the post's own hive must look unlikely…
    min_alternative_score: float  # …and another label must look likely


class LinearSoftmax:
    """Inference-only multinomial logistic regression: softmax(X·Wᵀ + b). Same maths as scikit-learn's
    predict_proba, without importing scikit-learn (~60 MB) on the serving box. Weights come from train.py."""

    def __init__(self, coef: np.ndarray, intercept: np.ndarray, classes: np.ndarray):
        self.coef_, self.intercept_, self.classes_ = coef, intercept, classes

    @classmethod
    def load(cls, path: Path) -> "LinearSoftmax":
        data = np.load(path, allow_pickle=False)
        return cls(data["coef"], data["intercept"], data["classes"])

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        logits = X @ self.coef_.T + self.intercept_
        logits -= logits.max(axis=1, keepdims=True)
        exp = np.exp(logits)
        return exp / exp.sum(axis=1, keepdims=True)


@lru_cache(maxsize=1)
def load() -> tuple[LinearSoftmax, list[str], FlagRule, dict]:
    model = LinearSoftmax.load(MODELS_DIR / "classifier.npz")
    card = json.loads((MODELS_DIR / "model_card.json").read_text())
    rule = FlagRule(card["off_topic_rule"]["max_hive_score"], card["off_topic_rule"]["min_alternative_score"])
    return model, list(model.classes_), rule, card


def should_flag(hive_score: float, alternative_score: float, rule: FlagRule) -> bool:
    return hive_score < rule.max_hive_score and alternative_score >= rule.min_alternative_score


def predict(texts: list[str], hives: list[str | None] | None = None) -> list[Prediction]:
    model, labels, rule, _ = load()
    hives = hives or [None] * len(texts)
    probs = model.predict_proba(embed(texts))
    results = []
    for row, hive in zip(probs, hives):
        by_label = {label: float(p) for label, p in zip(labels, row)}
        hive_labels = [(label, p) for label, p in by_label.items() if label != OFF_TOPIC]
        best_hive, best_p = max(hive_labels, key=lambda lp: lp[1])
        hive_score = by_label.get(hive) if hive else None
        alternative, alternative_score = (None, None)
        if hive:
            alternative, alternative_score = max(
                ((label, p) for label, p in by_label.items() if label != hive), key=lambda lp: lp[1]
            )
        results.append(
            Prediction(
                probabilities=by_label,
                suggested_hive=best_hive,
                suggested_confidence=best_p,
                is_spam_like=max(by_label, key=by_label.get) == OFF_TOPIC,
                hive_score=hive_score,
                alternative=alternative,
                alternative_score=alternative_score,
                is_off_topic_for_hive=hive_score is not None and should_flag(hive_score, alternative_score, rule),
            )
        )
    return results


def placement_scores(probs: np.ndarray, labels: list[str], hives: list[str]) -> tuple[np.ndarray, np.ndarray]:
    """For each row: P(hive the post was placed in), and the best probability among all other labels."""
    index = {label: i for i, label in enumerate(labels)}
    hive_scores = np.array([probs[i, index[h]] for i, h in enumerate(hives)])
    others = probs.copy()
    for i, h in enumerate(hives):
        others[i, index[h]] = -1
    return hive_scores, others.max(axis=1)
