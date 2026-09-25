import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock } from "./testUtils.js";
import * as ml from "../src/services/ml.service.js";
import { resetAskRateLimit } from "../src/controllers/ask.controller.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const rawPost = (id: string, content: string) => ({
  id,
  content,
  imageUrl: null,
  images: [],
  createdAt: new Date(),
  pinnedAt: null,
  challenge: null,
  progressLog: null,
  hobby: { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" },
  author: { id: "user_2", name: "Priya Sharma", username: "priya_dances", avatarUrl: null },
  _count: { likes: 0, comments: 0 },
});

beforeEach(() => {
  resetAskRateLimit();
  vi.mocked(ml.askBea).mockReset().mockResolvedValue(null);
});

describe("POST /api/v1/ask", () => {
  it("rejects empty questions", async () => {
    const token = mockAuthenticatedUser();
    const res = await request(app).post("/api/v1/ask").set(auth(token)).send({ question: "  " });
    expect(res.status).toBe(400);
  });

  it("says Bea is unavailable (rather than erroring) when the ML service is down", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app).post("/api/v1/ask").set(auth(token)).send({ question: "Any tips?" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ available: false, assistant: "Bea" });
  });

  it("returns Bea's answer with each piece of evidence attached to its post", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    vi.mocked(ml.askBea).mockResolvedValueOnce({
      mode: "extractive",
      answer: [
        { text: "Diego has shared something about this. ", evidence: [] },
        { text: "Diego replied: “Count the 8s out loud at first.”", evidence: [0] },
      ],
      evidence: [
        { chunk_id: "c1:0", kind: "comment", post_id: "p1", comment_id: "c1", author_name: "Diego Alvarez", author_username: "diego_runs", text: "Count the 8s out loud at first.", created_at: "" },
      ],
      trace: { generator: "ready" },
    });
    prismaMock.post.findMany.mockResolvedValueOnce([rawPost("p1", "Anyone have tips for staying on beat?")] as never);
    prismaMock.like.findMany.mockResolvedValueOnce([]);
    prismaMock.savedPost.findMany.mockResolvedValueOnce([]);
    prismaMock.userHobby.findMany.mockResolvedValueOnce([]);

    const res = await request(app).post("/api/v1/ask").set(auth(token)).send({ question: "staying on beat?", hobbySlug: "dance" });

    expect(ml.askBea).toHaveBeenCalledWith("staying on beat?", "dance");
    expect(res.body.data.mode).toBe("extractive");
    expect(res.body.data.evidence[0]).toMatchObject({ kind: "comment", post: { id: "p1" } });
    expect(res.body.data.trace).toEqual({ generator: "ready" });
  });

  it("404s for an unknown hive", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).post("/api/v1/ask").set(auth(token)).send({ question: "Any tips?", hobbySlug: "nope" });
    expect(res.status).toBe(404);
  });

  it("rate-limits each user to 20 questions an hour", async () => {
    const token = mockAuthenticatedUser();
    for (let i = 0; i < 20; i++) {
      await request(app).post("/api/v1/ask").set(auth(token)).send({ question: "Any tips?" });
    }
    const res = await request(app).post("/api/v1/ask").set(auth(token)).send({ question: "One more?" });
    expect(res.status).toBe(429);
  });
});
