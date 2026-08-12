import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";

const fakePost = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "post_1",
  content: "Hello hobby world",
  imageUrl: null,
  createdAt: new Date(),
  hobby: { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" },
  author: { id: testUser.id, name: testUser.name, username: testUser.username, avatarUrl: null },
  _count: { likes: 0, comments: 0 },
  authorId: testUser.id,
  ...overrides,
});

describe("POST /api/v1/posts", () => {
  it("rejects missing content", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ hobbyId: "hobby_dance" });

    expect(res.status).toBe(400);
  });

  it("rejects missing hobbyId — every post must be tagged, no free-text hashtags", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "hello" });

    expect(res.status).toBe(400);
  });

  it("rejects a hobbyId that doesn't exist in the taxonomy", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "hello", hobbyId: "hobby_made_up" });

    expect(res.status).toBe(400);
  });

  it("creates the post when content + a valid hobby are given", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "hobby_dance" } as never);
    prismaMock.post.create.mockResolvedValueOnce(fakePost() as never);
    prismaMock.userHobby.findMany.mockResolvedValueOnce([]); // notifyNewPost: nobody else to notify

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "hello", hobbyId: "hobby_dance" });

    expect(res.status).toBe(201);
    expect(res.body.data.isLiked).toBe(false);
    expect(res.body.data.hobby.slug).toBe("dance");
  });
});

describe("GET /api/v1/feed — the core curation guarantee", () => {
  it("never widens the query when the caller has no hobbies selected", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/feed").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.posts).toEqual([]);
    // the empty-hobbies branch must return early — it must never fall through to "show everything"
    expect(prismaMock.post.findMany).not.toHaveBeenCalled();
  });

  it("filters strictly to the caller's selected hobbies — never someone else's hobby's posts", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findMany.mockResolvedValueOnce([
      { hobbyId: "hobby_dance" },
      { hobbyId: "hobby_anime" },
    ] as never);
    prismaMock.post.findMany.mockResolvedValueOnce([fakePost()] as never);
    prismaMock.like.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/feed").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hobbyId: { in: ["hobby_dance", "hobby_anime"] } },
      })
    );
  });
});

describe("POST/DELETE /api/v1/posts/:postId/like — idempotency", () => {
  it("creates a like and notifies the author on the first like", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", authorId: "someone_else" } as never);
    prismaMock.like.findUnique.mockResolvedValueOnce(null);
    prismaMock.like.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .post("/api/v1/posts/post_1/like")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ isLiked: true, likesCount: 1 });
    expect(prismaMock.like.create).toHaveBeenCalledOnce();
    expect(prismaMock.notification.create).toHaveBeenCalledOnce();
  });

  it("does not create a duplicate like or notification if already liked", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1", authorId: "someone_else" } as never);
    prismaMock.like.findUnique.mockResolvedValueOnce({ userId: testUser.id, postId: "post_1" } as never);
    prismaMock.like.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .post("/api/v1/posts/post_1/like")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(prismaMock.like.create).not.toHaveBeenCalled();
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
});
