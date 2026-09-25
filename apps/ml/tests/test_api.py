"""API tests against the trained model in models/ (run train.py first)."""

import numpy as np
import pytest
from fastapi.testclient import TestClient

from hobbyhive_ml.api import MAX_BATCH, app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # runs the lifespan warm-up
        yield c


def classify(client, text, hive=None):
    res = client.post("/classify", json={"items": [{"text": text, "hive": hive}]})
    assert res.status_code == 200
    return res.json()["results"][0]


def test_health_reports_the_model(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert "dance" in body["labels"] and "off_topic" in body["labels"]


def test_embeddings_are_unit_length_384d(client):
    res = client.post("/embed", json={"texts": ["kickflip", "sourdough"]}).json()
    vectors = np.array(res["embeddings"])
    assert vectors.shape == (2, 384)
    assert np.allclose(np.linalg.norm(vectors, axis=1), 1, atol=1e-3)


def test_suggests_the_obvious_hive(client):
    assert classify(client, "Finally beat the final boss on hard mode after 40 attempts")["suggested_hive"] == "gaming"
    assert classify(client, "My sourdough starter doubled overnight, baking tomorrow")["suggested_hive"] == "cooking"


def test_on_topic_post_is_not_flagged(client):
    assert classify(client, "Nailed the new choreography in rehearsal tonight", hive="dance")["is_off_topic_for_hive"] is False


def test_clearly_misplaced_post_is_flagged(client):
    result = classify(client, "Crypto presale ending soon, 100x guaranteed, DM me", hive="art")
    assert result["is_off_topic_for_hive"] is True
    assert result["is_spam_like"] is True


def test_vague_post_is_not_flagged(client):
    assert classify(client, "Small win today, feeling proud!", hive="photography")["is_off_topic_for_hive"] is False


def test_unknown_hive_is_ignored_rather_than_erroring(client):
    result = classify(client, "Practiced scales on the piano", hive="not-a-hive")
    assert result["hive_score"] is None and result["is_off_topic_for_hive"] is False


def test_rejects_oversized_batches(client):
    res = client.post("/embed", json={"texts": ["x"] * (MAX_BATCH + 1)})
    assert res.status_code == 422


def test_query_returns_vector_hive_beliefs_and_ranking_settings(client):
    body = client.post("/query", json={"text": "homemade bread"}).json()
    assert len(body["embedding"]) == 384
    assert "off_topic" not in body["hive_probabilities"]
    assert max(body["hive_probabilities"], key=body["hive_probabilities"].get) == "cooking"
    assert 0 < body["hive_boost"] <= 0.3 and 0 < body["min_score"] < 1.5
