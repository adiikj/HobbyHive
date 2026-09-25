"""Trains and evaluates the HobbyHive hive classifier.

Pipeline:
  1. Embed the labelled posts (data/hobby_posts.csv) with a local sentence-embedding model.
  2. Hold out 20% as a test set (stratified). Everything below is tuned on the other 80% only.
  3. Compare against baselines: TF-IDF + logistic regression (words only) and nearest centroid (no training).
  4. Tune logistic regression's C with 5-fold cross-validation.
  5. Pick the off-topic threshold from out-of-fold probabilities (never the test set).
  6. Report test metrics, a confusion matrix, off-topic flagging quality, and a check on real HobbyHive posts.
  7. Refit on all data and save models/classifier.npz (weights for numpy inference) + models/model_card.json.

Run: uv run python train.py
"""

import csv
import hashlib
import json
import os
import random
from datetime import datetime, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: E402
from sklearn.linear_model import LogisticRegression  # noqa: E402
from sklearn.metrics import (  # noqa: E402
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
)
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_predict, train_test_split  # noqa: E402
from sklearn.pipeline import make_pipeline  # noqa: E402

from hobbyhive_ml.classifier import OFF_TOPIC, FlagRule, LinearSoftmax, placement_scores, should_flag  # noqa: E402
from hobbyhive_ml.embedder import MODEL_NAME, embed  # noqa: E402

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "hobby_posts.csv"
VAGUE = ROOT / "data" / "vague_posts.txt"  # hive-agnostic posts: calibration only, must never be flagged
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"
SEED = 42
# Operating point for the off-topic flag. Off-topic posts are rare in a real feed, so "precision on a
# 50/50 test mix" overstates quality; what moderators feel is how often LEGITIMATE posts get flagged.
MAX_FALSE_ALARM_RATE = 0.02  # at most 2% of on-topic posts flagged…
MAX_VAGUE_FALSE_ALARM_RATE = 0.05  # …and at most 1 in 20 short/vague ones


def load_dataset() -> tuple[list[str], np.ndarray]:
    with DATA.open() as f:
        rows = list(csv.DictReader(f))
    return [r["text"] for r in rows], np.array([r["label"] for r in rows])


def placement_scenarios(labels: np.ndarray, hobbies: list[str], rng: random.Random):
    """For off-topic evaluation: each on-topic post placed in its own hive (should NOT flag) and in a
    random wrong hive (SHOULD flag); each off_topic post placed in a random hive (SHOULD flag).
    Returns (row index, hive it was posted in, should_flag)."""
    scenarios = []
    for i, label in enumerate(labels):
        if label == OFF_TOPIC:
            scenarios.append((i, rng.choice(hobbies), True))
        else:
            scenarios.append((i, label, False))
            scenarios.append((i, rng.choice([h for h in hobbies if h != label]), True))
    return scenarios


def load_vague_posts() -> list[str]:
    return [line.strip() for line in VAGUE.read_text().splitlines() if line.strip() and not line.startswith("#")]


def vague_scenarios(n: int, hobbies: list[str], rng: random.Random) -> list[tuple[str, bool]]:
    """Each vague post placed in a random hive — it fits anywhere, so it should never be flagged."""
    return [(rng.choice(hobbies), False) for _ in range(n)]


def flag_metrics(hive_scores: np.ndarray, alt_scores: np.ndarray, truth: np.ndarray, rule: FlagRule, vague: np.ndarray) -> dict:
    """truth = should be flagged; vague = row is a hive-agnostic post (a subset of the should-not-flag rows)."""
    flagged = np.array([should_flag(h, a, rule) for h, a in zip(hive_scores, alt_scores)])
    p, r, f, _ = precision_recall_fscore_support(truth, flagged, average="binary", zero_division=0)
    legit = ~truth
    return {
        "precision": float(p),
        "recall": float(r),
        "f1": float(f),
        "false_alarm_rate": float(flagged[legit].mean()),
        "vague_false_alarm_rate": float(flagged[vague].mean()) if vague.any() else 0.0,
        "flagged": int(flagged.sum()),
    }


def choose_rule(hive_scores: np.ndarray, alt_scores: np.ndarray, truth: np.ndarray, vague: np.ndarray) -> tuple[FlagRule, dict]:
    """Search both thresholds for the highest recall within the false-alarm budget; ties go to the most
    conservative rule (lowest hive cut-off, highest confidence bar)."""
    results = []
    for max_hive in np.round(np.arange(0.02, 0.55, 0.01), 2):
        for min_alt in np.round(np.arange(0.20, 0.96, 0.02), 2):
            rule = FlagRule(float(max_hive), float(min_alt))
            results.append((rule, flag_metrics(hive_scores, alt_scores, truth, rule, vague)))
    within_budget = [
        (r, m)
        for r, m in results
        if m["false_alarm_rate"] <= MAX_FALSE_ALARM_RATE and m["vague_false_alarm_rate"] <= MAX_VAGUE_FALSE_ALARM_RATE
    ]
    if not within_budget:
        raise RuntimeError("no flag rule meets the false-alarm budget — relax it or improve the model")
    return max(within_budget, key=lambda rm: (rm[1]["recall"], -rm[0].max_hive_score, rm[0].min_alternative_score))


def load_real_posts() -> tuple[list[str], list[str]]:
    """Real HobbyHive posts (text, hive slug) straight from the app database, if reachable."""
    try:
        import psycopg
        from dotenv import dotenv_values

        url = os.environ.get("DATABASE_URL") or dotenv_values(ROOT.parent / "backend" / ".env").get("DATABASE_URL")
        if not url:
            return [], []
        with psycopg.connect(url.replace("&pgbouncer=true", "").replace("?pgbouncer=true", ""), connect_timeout=15) as conn:
            rows = conn.execute('SELECT p.content, h.slug FROM "Post" p JOIN "Hobby" h ON h.id = p."hobbyId"').fetchall()
        return [r[0] for r in rows], [r[1] for r in rows]
    except Exception as exc:  # the report still works offline
        print(f"  (skipping real-post check: {exc.__class__.__name__}: {exc})")
        return [], []


def main() -> None:
    REPORTS.mkdir(exist_ok=True)
    MODELS.mkdir(exist_ok=True)
    rng = random.Random(SEED)

    texts, labels = load_dataset()
    data_hash = hashlib.sha256(DATA.read_bytes()).hexdigest()[:12]
    print(f"dataset: {len(texts)} posts, {len(set(labels))} classes, sha256 {data_hash}")

    print(f"embedding with {MODEL_NAME}…")
    X = embed(texts)

    idx_train, idx_test = train_test_split(
        np.arange(len(texts)), test_size=0.2, stratify=labels, random_state=SEED
    )
    X_train, X_test, y_train, y_test = X[idx_train], X[idx_test], labels[idx_train], labels[idx_test]
    texts_train = [texts[i] for i in idx_train]
    texts_test = [texts[i] for i in idx_test]
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

    # --- Baselines ---------------------------------------------------------------------------
    tfidf = make_pipeline(TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True), LogisticRegression(max_iter=2000, C=10))
    tfidf.fit(texts_train, y_train)
    tfidf_pred = tfidf.predict(texts_test)

    classes = np.unique(y_train)
    centroids = np.stack([X_train[y_train == c].mean(axis=0) for c in classes])
    centroids /= np.linalg.norm(centroids, axis=1, keepdims=True)
    centroid_pred = classes[np.argmax(X_test @ centroids.T, axis=1)]

    # --- Main model: logistic regression on embeddings, C tuned by CV -------------------------
    search = GridSearchCV(
        LogisticRegression(max_iter=5000),
        {"C": [0.5, 1, 2, 4, 8, 16, 32]},
        cv=cv,
        scoring="f1_macro",
    )
    search.fit(X_train, y_train)
    best_c = search.best_params_["C"]
    model = search.best_estimator_
    y_pred = model.predict(X_test)
    print(f"best C = {best_c} (CV macro-F1 {search.best_score_:.3f})")

    comparison = {
        "TF-IDF + logistic regression (words only)": (accuracy_score(y_test, tfidf_pred), f1_score(y_test, tfidf_pred, average="macro")),
        "Nearest centroid on embeddings (no training)": (accuracy_score(y_test, centroid_pred), f1_score(y_test, centroid_pred, average="macro")),
        f"Embeddings + logistic regression (C={best_c})": (accuracy_score(y_test, y_pred), f1_score(y_test, y_pred, average="macro")),
    }
    for name, (acc, f1) in comparison.items():
        print(f"  {name:48s} accuracy {acc:.3f}  macro-F1 {f1:.3f}")

    report = classification_report(y_test, y_pred, digits=3, zero_division=0)
    labels_order = list(model.classes_)
    cm = confusion_matrix(y_test, y_pred, labels=labels_order)
    fig, ax = plt.subplots(figsize=(10, 9))
    ConfusionMatrixDisplay(cm, display_labels=labels_order).plot(ax=ax, cmap="Purples", colorbar=False, xticks_rotation=45)
    ax.set_title("Hive classifier: confusion matrix (held-out test set)")
    fig.tight_layout()
    fig.savefig(REPORTS / "confusion_matrix.png", dpi=130)
    plt.close(fig)

    mistakes = [(texts_test[i], y_test[i], y_pred[i]) for i in range(len(y_test)) if y_test[i] != y_pred[i]]

    # --- Off-topic threshold: chosen on out-of-fold train probabilities -----------------------
    hobbies = [c for c in labels_order if c != OFF_TOPIC]
    oof = cross_val_predict(LogisticRegression(max_iter=5000, C=best_c), X_train, y_train, cv=cv, method="predict_proba")
    # Vague posts: half calibrate the rule, half are held out for the test report
    vague = load_vague_posts()
    rng.shuffle(vague)
    vague_cal, vague_test = vague[: len(vague) // 2], vague[len(vague) // 2 :]
    vague_cal_probs = model.predict_proba(embed(vague_cal))
    vague_test_probs = model.predict_proba(embed(vague_test))

    train_scen = placement_scenarios(y_train, hobbies, rng)
    vc_scen = vague_scenarios(len(vague_cal), hobbies, rng)
    tr_hive, tr_alt = placement_scores(
        np.vstack([oof[[i for i, _, _ in train_scen]], vague_cal_probs]),
        labels_order,
        [h for _, h, _ in train_scen] + [h for h, _ in vc_scen],
    )
    tr_truth = np.array([f for _, _, f in train_scen] + [f for _, f in vc_scen])
    tr_vague = np.array([False] * len(train_scen) + [True] * len(vc_scen))
    rule, train_flag = choose_rule(tr_hive, tr_alt, tr_truth, tr_vague)

    test_scen = placement_scenarios(y_test, hobbies, rng)
    vt_scen = vague_scenarios(len(vague_test), hobbies, rng)
    test_probs = model.predict_proba(X_test)
    te_hive, te_alt = placement_scores(
        np.vstack([test_probs[[i for i, _, _ in test_scen]], vague_test_probs]),
        labels_order,
        [h for _, h, _ in test_scen] + [h for h, _ in vt_scen],
    )
    te_truth = np.array([f for _, _, f in test_scen] + [f for _, f in vt_scen])
    te_vague = np.array([False] * len(test_scen) + [True] * len(vt_scen))
    test_flag = flag_metrics(te_hive, te_alt, te_truth, rule, te_vague)
    vt_hive, vt_alt = te_hive[-len(vt_scen):], te_alt[-len(vt_scen):]
    vague_false_alarms = int(sum(should_flag(h, a, rule) for h, a in zip(vt_hive, vt_alt)))
    print(f"held-out vague posts wrongly flagged: {vague_false_alarms}/{len(vague_test)}")
    print(
        f"off-topic rule: hive < {rule.max_hive_score:.2f} AND alternative >= {rule.min_alternative_score:.2f} "
        f"-> test recall {test_flag['recall']:.3f}, precision {test_flag['precision']:.3f}, "
        f"false alarms {test_flag['false_alarm_rate']:.1%} (vague {test_flag['vague_false_alarm_rate']:.1%})"
    )

    # --- Real HobbyHive posts ----------------------------------------------------------------
    real_texts, real_hives = load_real_posts()
    real = None
    if real_texts:
        real_probs = model.predict_proba(embed(real_texts))
        hobby_idx = [labels_order.index(h) for h in hobbies]
        suggested = [hobbies[int(np.argmax(row[hobby_idx]))] for row in real_probs]
        real_hive, real_alt = placement_scores(real_probs, labels_order, real_hives)
        real_flags = [should_flag(h, a, rule) for h, a in zip(real_hive, real_alt)]
        real = {
            "posts": len(real_texts),
            "suggested_hive_accuracy": float(np.mean([s == h for s, h in zip(suggested, real_hives)])),
            # every real post is on-topic, so any flag here is a false alarm
            "false_alarm_rate": float(np.mean(real_flags)),
            "flagged_off_topic": int(sum(real_flags)),
            "flagged_examples": [
                {"text": t, "hive": h, "hive_score": round(float(s), 3), "suggested": sg}
                for t, h, s, sg, fl in zip(real_texts, real_hives, real_hive, suggested, real_flags)
                if fl
            ],
        }
        print(f"real posts: {real['posts']}, suggested-hive accuracy {real['suggested_hive_accuracy']:.3f}, flagged {real['flagged_off_topic']}")

    # --- Final model: refit on everything, save with a model card -----------------------------
    final = LogisticRegression(max_iter=5000, C=best_c).fit(X, labels)
    # Serving needs only the weights (numpy softmax, see classifier.LinearSoftmax) — no scikit-learn at runtime
    np.savez(MODELS / "classifier.npz", coef=final.coef_, intercept=final.intercept_, classes=final.classes_.astype(str))
    served = LinearSoftmax(final.coef_, final.intercept_, final.classes_)
    assert np.allclose(served.predict_proba(X[:50]), final.predict_proba(X[:50]), atol=1e-6), "numpy export mismatch"
    card = {
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "embedding_model": MODEL_NAME,
        "classifier": "LogisticRegression (multinomial)",
        "C": best_c,
        "labels": labels_order,
        "off_topic_rule": {"max_hive_score": rule.max_hive_score, "min_alternative_score": rule.min_alternative_score},
        "dataset": {"file": "data/hobby_posts.csv", "rows": len(texts), "sha256_12": data_hash, "synthetic": True},
        "test_metrics": {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "macro_f1": round(float(f1_score(y_test, y_pred, average="macro")), 4),
            "off_topic_flagging": {k: round(v, 4) if isinstance(v, float) else v for k, v in test_flag.items()},
            "vague_posts_wrongly_flagged": f"{vague_false_alarms}/{len(vague_test)}",
        },
        "real_posts": {k: v for k, v in (real or {}).items() if k != "flagged_examples"} or None,
    }
    (MODELS / "model_card.json").write_text(json.dumps(card, indent=2))

    # --- Human-readable report ----------------------------------------------------------------
    lines = [
        "# Hive classifier — evaluation",
        "",
        f"{len(texts)} synthetic posts, {len(set(labels))} classes, 80/20 stratified split (seed {SEED}), data `{data_hash}`.",
        "",
        "| Model | Accuracy | Macro-F1 |",
        "|---|---|---|",
        *[f"| {name} | {acc:.3f} | {f1:.3f} |" for name, (acc, f1) in comparison.items()],
        "",
        "```",
        report.rstrip(),
        "```",
        "",
        "![Confusion matrix](confusion_matrix.png)",
        "",
        "## Off-topic flag",
        "",
        f"Flag when P(own hive) < {rule.max_hive_score:.2f} and another label ≥ {rule.min_alternative_score:.2f}. "
        f"Tuned on out-of-fold probabilities for ≤ {MAX_FALSE_ALARM_RATE:.0%} false alarms "
        f"(≤ {MAX_VAGUE_FALSE_ALARM_RATE:.0%} on vague posts).",
        "",
        "| | Recall | False alarms | False alarms (vague) | Precision |",
        "|---|---|---|---|---|",
        f"| Calibration | {train_flag['recall']:.1%} | {train_flag['false_alarm_rate']:.1%} | {train_flag['vague_false_alarm_rate']:.1%} | {train_flag['precision']:.1%} |",
        f"| Test | {test_flag['recall']:.1%} | {test_flag['false_alarm_rate']:.1%} | {test_flag['vague_false_alarm_rate']:.1%} | {test_flag['precision']:.1%} |",
        "",
        "## Misclassified test posts",
        "",
        *([f"- \"{t}\": {a} → {p}" for t, a, p in mistakes] or ["None."]),
    ]
    if real:
        lines += [
            "",
            "## Real posts",
            "",
            f"{real['posts']} posts: suggested hive correct {real['suggested_hive_accuracy']:.1%}, "
            f"flagged {real['flagged_off_topic']} ({real['false_alarm_rate']:.1%}, all on-topic).",
            "",
            *[f"- \"{e['text']}\" ({e['hive']} → {e['suggested']})" for e in real["flagged_examples"]],
        ]
    (REPORTS / "metrics.md").write_text("\n".join(lines) + "\n")
    print("saved models/classifier.npz, models/model_card.json, reports/metrics.md, reports/confusion_matrix.png")


if __name__ == "__main__":
    main()
