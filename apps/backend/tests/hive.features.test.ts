import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";
import { extractMentions } from "../src/services/notification.service.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("moderation: pin / delete", () => {
  it("won't let a regular member pin", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", hobbyId: "hobby_dance", pinnedAt: null } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null); // not a moderator

    const res = await request(app).post("/api/v1/posts/post_1/pin").set(auth(token));

    expect(res.status).toBe(403);
    expect(prismaMock.post.update).not.toHaveBeenCalled();
  });

  it("caps pinned posts at 3 per hive", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", hobbyId: "hobby_dance", pinnedAt: null } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.post.count.mockResolvedValueOnce(3);

    const res = await request(app).post("/api/v1/posts/post_1/pin").set(auth(token));

    expect(res.status).toBe(409);
    expect(prismaMock.post.update).not.toHaveBeenCalled();
  });

  it("lets a moderator pin", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", hobbyId: "hobby_dance", pinnedAt: null } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.post.count.mockResolvedValueOnce(1);

    const res = await request(app).post("/api/v1/posts/post_1/pin").set(auth(token));

    expect(res.status).toBe(200);
    expect(prismaMock.post.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "post_1" } }));
  });

  it("won't let a stranger delete someone else's post", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", authorId: "user_2", hobbyId: "hobby_dance" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).delete("/api/v1/posts/post_1").set(auth(token));

    expect(res.status).toBe(403);
    expect(prismaMock.post.delete).not.toHaveBeenCalled();
  });

  it("lets the author delete their own post without a moderator check", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", authorId: testUser.id, hobbyId: "hobby_dance" } as never);

    const res = await request(app).delete("/api/v1/posts/post_1").set(auth(token));

    expect(res.status).toBe(200);
    expect(prismaMock.post.delete).toHaveBeenCalledWith({ where: { id: "post_1" } });
    expect(prismaMock.userHobby.findFirst).not.toHaveBeenCalled();
  });
});

describe("posting into challenges and progress logs", () => {
  it("rejects an entry for a challenge from a different hive", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    prismaMock.challenge.findUnique.mockResolvedValueOnce({
      id: "ch_1",
      hobbyId: "hobby_art",
      startsAt: new Date(Date.now() - 1000),
      endsAt: new Date(Date.now() + 1000),
    } as never);

    const res = await request(app)
      .post("/api/v1/posts")
      .set(auth(token))
      .send({ content: "my entry", hobbyId: "hobby_dance", challengeId: "ch_1" });

    expect(res.status).toBe(400);
    expect(prismaMock.post.create).not.toHaveBeenCalled();
  });

  it("rejects an entry once the challenge has ended", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    prismaMock.challenge.findUnique.mockResolvedValueOnce({
      id: "ch_1",
      hobbyId: "hobby_dance",
      startsAt: new Date(Date.now() - 10_000),
      endsAt: new Date(Date.now() - 1000),
    } as never);

    const res = await request(app)
      .post("/api/v1/posts")
      .set(auth(token))
      .send({ content: "late entry", hobbyId: "hobby_dance", challengeId: "ch_1" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ended/);
  });

  it("won't add a post to someone else's progress log", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    prismaMock.progressLog.findUnique.mockResolvedValueOnce({ id: "log_1", userId: "user_2", hobbyId: "hobby_dance" } as never);

    const res = await request(app)
      .post("/api/v1/posts")
      .set(auth(token))
      .send({ content: "week 3", hobbyId: "hobby_dance", progressLogId: "log_1" });

    expect(res.status).toBe(404);
    expect(prismaMock.post.create).not.toHaveBeenCalled();
  });

  it("caps photos at 4", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);

    const res = await request(app)
      .post("/api/v1/posts")
      .set(auth(token))
      .send({ content: "too many", hobbyId: "hobby_dance", images: ["a", "b", "c", "d", "e"] });

    expect(res.status).toBe(400);
  });
});

describe("challenges", () => {
  it("only moderators can start one", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/v1/hobbies/dance/challenges")
      .set(auth(token))
      .send({ title: "Freestyle Friday", prompt: "30 seconds, any style" });

    expect(res.status).toBe(403);
    expect(prismaMock.challenge.create).not.toHaveBeenCalled();
  });

  it("refuses a second challenge while one is running", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.challenge.findFirst.mockResolvedValueOnce({ id: "ch_running" } as never);

    const res = await request(app)
      .post("/api/v1/hobbies/dance/challenges")
      .set(auth(token))
      .send({ title: "Another one", prompt: "..." });

    expect(res.status).toBe(409);
  });
});

describe("progress logs", () => {
  it("won't let you delete someone else's log", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.progressLog.findUnique.mockResolvedValueOnce({ id: "log_1", userId: "user_2" } as never);

    const res = await request(app).delete("/api/v1/progress/log_1").set(auth(token));

    expect(res.status).toBe(404);
    expect(prismaMock.progressLog.delete).not.toHaveBeenCalled();
  });
});

describe("comments: replies and mentions", () => {
  const post = { id: "post_1", authorId: "user_author" };

  it("attaches a reply-to-a-reply to the top-level comment and notifies its author, not a duplicate 'commented'", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(post as never);
    prismaMock.comment.findUnique.mockResolvedValueOnce({
      id: "c_reply",
      postId: "post_1",
      parentId: "c_top",
      userId: "user_author",
    } as never);
    prismaMock.comment.create.mockResolvedValueOnce({ id: "c_new", content: "agreed", parentId: "c_top" } as never);

    const res = await request(app)
      .post("/api/v1/posts/post_1/comments")
      .set(auth(token))
      .send({ content: "agreed", parentId: "c_reply" });

    expect(res.status).toBe(201);
    expect(prismaMock.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ parentId: "c_top" }) })
    );
    // The post author wrote the parent comment: they get REPLY, and no second COMMENT notification
    const types = prismaMock.notification.create.mock.calls.map((c) => c[0].data.type);
    expect(types).toEqual(["REPLY"]);
  });

  it("rejects replying to a comment from another post", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(post as never);
    prismaMock.comment.findUnique.mockResolvedValueOnce({ id: "c_x", postId: "other", parentId: null, userId: "u" } as never);

    const res = await request(app)
      .post("/api/v1/posts/post_1/comments")
      .set(auth(token))
      .send({ content: "hi", parentId: "c_x" });

    expect(res.status).toBe(400);
  });

  it("extracts @mentions, ignoring emails and trailing punctuation", () => {
    expect(extractMentions("great work @priya_dances and @leo.sings. cc me@example.com @priya_dances")).toEqual([
      "priya_dances",
      "leo.sings",
    ]);
  });
});

describe("saving your hobbies keeps moderator roles", () => {
  it("only removes dropped hobbies instead of recreating every membership", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findMany.mockResolvedValueOnce([{ id: "hobby_dance" }, { id: "hobby_art" }] as never);
    prismaMock.$transaction.mockResolvedValueOnce([] as never);
    prismaMock.userHobby.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .post("/api/v1/users/me/hobbies")
      .set(auth(token))
      .send({ hobbyIds: ["hobby_dance", "hobby_art"] });

    expect(res.status).toBe(200);
    expect(prismaMock.userHobby.deleteMany).toHaveBeenCalledWith({
      where: { userId: testUser.id, hobbyId: { notIn: ["hobby_dance", "hobby_art"] } },
    });
    expect(prismaMock.userHobby.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
  });
});
