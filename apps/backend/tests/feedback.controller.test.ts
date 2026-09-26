import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";
import { mentorLevel } from "../src/controllers/feedback.controller.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const askingPost = { id: "post_1", authorId: "user_2", hobbyId: "hobby_dance", feedbackAsk: "Is my spotting late?" };
const body = { working: "Your arms are relaxed now", tryNext: "Whip your head a beat earlier", at: "0:12" };

describe("mentor levels", () => {
  it("come only from helpful feedback", () => {
    expect([0, 1, 2, 3, 9, 10].map(mentorLevel)).toEqual([null, "Helper", "Helper", "Mentor", "Mentor", "Guide"]);
  });
});

describe("POST /api/v1/posts/:id/feedback", () => {
  it("sends structured feedback and notifies the person who asked", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(askingPost as never);
    prismaMock.feedback.findUnique.mockResolvedValueOnce(null);
    prismaMock.feedback.create.mockResolvedValueOnce({ id: "fb_1" } as never);

    const res = await request(app).post("/api/v1/posts/post_1/feedback").set(auth(token)).send(body);

    expect(res.status).toBe(201);
    expect(prismaMock.feedback.create.mock.calls[0][0].data).toMatchObject({ authorId: testUser.id, ...body });
    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: { userId: "user_2", actorId: testUser.id, type: "FEEDBACK", postId: "post_1" },
    });
  });

  it("only works on posts that asked for feedback", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ ...askingPost, feedbackAsk: null } as never);
    const res = await request(app).post("/api/v1/posts/post_1/feedback").set(auth(token)).send(body);
    expect(res.status).toBe(400);
  });

  it("won't let you review your own post", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ ...askingPost, authorId: testUser.id } as never);
    const res = await request(app).post("/api/v1/posts/post_1/feedback").set(auth(token)).send(body);
    expect(res.status).toBe(400);
  });

  it("is one per person per post", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(askingPost as never);
    prismaMock.feedback.findUnique.mockResolvedValueOnce({ id: "fb_old" } as never);
    const res = await request(app).post("/api/v1/posts/post_1/feedback").set(auth(token)).send(body);
    expect(res.status).toBe(409);
  });

  it("needs both parts of the structure", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(askingPost as never);
    const res = await request(app).post("/api/v1/posts/post_1/feedback").set(auth(token)).send({ working: "Nice!" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("One thing to try");
  });
});

describe("PUT /api/v1/feedback/:id/helpful", () => {
  it("lets the asker mark feedback helpful, once-notifying the giver", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.feedback.findUnique.mockResolvedValueOnce({
      id: "fb_1",
      authorId: "user_3",
      helpfulAt: null,
      post: { id: "post_1", authorId: testUser.id },
    } as never);
    prismaMock.feedback.update.mockResolvedValueOnce({ id: "fb_1", helpfulAt: new Date() } as never);

    const res = await request(app).put("/api/v1/feedback/fb_1/helpful").set(auth(token)).send({ helpful: true });

    expect(res.status).toBe(200);
    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: { userId: "user_3", actorId: testUser.id, type: "FEEDBACK_HELPFUL", postId: "post_1" },
    });
  });

  it("won't let anyone else mark it", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.feedback.findUnique.mockResolvedValueOnce({
      id: "fb_1",
      authorId: "user_3",
      helpfulAt: null,
      post: { id: "post_1", authorId: "user_2" },
    } as never);

    const res = await request(app).put("/api/v1/feedback/fb_1/helpful").set(auth(token)).send({ helpful: true });

    expect(res.status).toBe(403);
    expect(prismaMock.feedback.update).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/posts with a feedback ask", () => {
  it("rejects an overly long question", async () => {
    const token = mockAuthenticatedUser();
    const res = await request(app)
      .post("/api/v1/posts")
      .set(auth(token))
      .send({ content: "clip", hobbyId: "hobby_dance", feedbackAsk: "x".repeat(141) });
    expect(res.status).toBe(400);
  });
});
