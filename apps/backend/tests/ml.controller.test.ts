import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock } from "./testUtils.js";
import * as ml from "../src/services/ml.service.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const classification = (overrides: Partial<ml.Classification> = {}): ml.Classification => ({
  suggested_hive: "dance",
  suggested_confidence: 0.8,
  is_spam_like: false,
  hive_score: 0.8,
  alternative: "fitness",
  alternative_score: 0.1,
  is_off_topic_for_hive: false,
  top: [],
  ...overrides,
});

describe("POST /api/v1/ml/suggest-hive", () => {
  const draft = { text: "Finally beat the last boss on hard mode after 40 tries", hobbyId: "hobby_dance" };

  it("doesn't judge very short drafts", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ slug: "dance" } as never);

    const res = await request(app).post("/api/v1/ml/suggest-hive").set(auth(token)).send({ text: "hi", hobbyId: "hobby_dance" });

    expect(res.body.data.verdict).toBe("too_short");
    expect(ml.classify).not.toHaveBeenCalled();
  });

  it("degrades gracefully when the ML service is down", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ slug: "dance" } as never);

    const res = await request(app).post("/api/v1/ml/suggest-hive").set(auth(token)).send(draft);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ available: false, suggestion: null });
  });

  it("suggests the hive the draft confidently belongs in", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique
      .mockResolvedValueOnce({ slug: "dance" } as never)
      .mockResolvedValueOnce({ id: "hobby_gaming", name: "Gaming", slug: "gaming", icon: "🎮" } as never);
    vi.mocked(ml.classify).mockResolvedValueOnce({
      model_version: "v1",
      results: [classification({ hive_score: 0.02, alternative: "gaming", alternative_score: 0.66, is_off_topic_for_hive: true })],
    });

    const res = await request(app).post("/api/v1/ml/suggest-hive").set(auth(token)).send(draft);

    expect(ml.classify).toHaveBeenCalledWith([{ text: draft.text, hive: "dance" }]);
    expect(res.body.data).toMatchObject({ verdict: "other_hive", suggestion: { slug: "gaming", confidence: 0.66 } });
  });

  it("says 'no hive' for spam rather than suggesting one", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ slug: "dance" } as never);
    vi.mocked(ml.classify).mockResolvedValueOnce({
      model_version: "v1",
      results: [classification({ is_spam_like: true, hive_score: 0.01, alternative: "off_topic", alternative_score: 0.9, is_off_topic_for_hive: true })],
    });

    const res = await request(app).post("/api/v1/ml/suggest-hive").set(auth(token)).send(draft);

    expect(res.body.data).toMatchObject({ verdict: "no_hive", suggestion: null });
  });
});

describe("GET /api/v1/search/semantic", () => {
  it("reports unavailable (instead of erroring) when the ML service is down", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app).get("/api/v1/search/semantic?q=homemade%20bread").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ available: false, posts: [] });
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });
});

describe("moderator review queue", () => {
  it("is moderators-only", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/v1/hobbies/dance/flagged").set(auth(token));

    expect(res.status).toBe(403);
    expect(prismaMock.post.findMany).not.toHaveBeenCalled();
  });

  it("dismissing a flag records the review so the post is never re-flagged", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", hobbyId: "hobby_dance" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);

    const res = await request(app).post("/api/v1/posts/post_1/flag/dismiss").set(auth(token));

    expect(res.status).toBe(200);
    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: "post_1" },
      data: { flaggedAt: null, flagReviewedAt: expect.any(Date) },
    });
  });
});
