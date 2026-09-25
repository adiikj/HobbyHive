import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";

const fakePost = {
  id: "post_1",
  content: "Saved for later",
  imageUrl: null,
  createdAt: new Date(),
  hobby: { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" },
  author: { id: "user_2", name: "Priya", username: "priya", avatarUrl: null },
  _count: { likes: 2, comments: 1 },
  images: [] as string[],
  pinnedAt: null,
  challenge: null,
  progressLog: null,
};

describe("PUT/DELETE /api/v1/posts/:postId/save", () => {
  it("saves a post without a collection", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1" } as never);
    prismaMock.savedPost.upsert.mockResolvedValueOnce({ collectionId: null } as never);

    const res = await request(app).put("/api/v1/posts/post_1/save").set("Authorization", `Bearer ${token}`).send({});

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ isSaved: true, collectionId: null });
    expect(prismaMock.savedPost.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { userId: testUser.id, postId: "post_1", collectionId: null } })
    );
  });

  it("refuses to file a post into someone else's collection", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "post_1" } as never);
    prismaMock.collection.findFirst.mockResolvedValueOnce(null); // not owned by the caller

    const res = await request(app)
      .put("/api/v1/posts/post_1/save")
      .set("Authorization", `Bearer ${token}`)
      .send({ collectionId: "someone_elses" });

    expect(res.status).toBe(404);
    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "someone_elses", userId: testUser.id } })
    );
    expect(prismaMock.savedPost.upsert).not.toHaveBeenCalled();
  });

  it("404s when saving a post that doesn't exist", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).put("/api/v1/posts/nope/save").set("Authorization", `Bearer ${token}`).send({});

    expect(res.status).toBe(404);
  });

  it("unsaves idempotently, scoped to the caller", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.savedPost.deleteMany.mockResolvedValueOnce({ count: 0 });

    const res = await request(app).delete("/api/v1/posts/post_1/save").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isSaved).toBe(false);
    expect(prismaMock.savedPost.deleteMany).toHaveBeenCalledWith({ where: { userId: testUser.id, postId: "post_1" } });
  });
});

describe("GET /api/v1/saved", () => {
  it("returns the caller's saves as posts, all marked saved", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.savedPost.findMany
      .mockResolvedValueOnce([{ id: "save_1", post: fakePost }] as never) // the page of saves
      .mockResolvedValueOnce([{ postId: "post_1" }] as never); // getViewerState's saved lookup
    prismaMock.like.findMany.mockResolvedValueOnce([]);
    prismaMock.userHobby.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/saved").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.posts).toHaveLength(1);
    expect(res.body.data.posts[0]).toMatchObject({ id: "post_1", isSaved: true, likesCount: 2 });
    expect(prismaMock.savedPost.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { userId: testUser.id } }));
  });
});

describe("/api/v1/saved/collections", () => {
  it("rejects a blank collection name", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app).post("/api/v1/saved/collections").set("Authorization", `Bearer ${token}`).send({ name: "   " });

    expect(res.status).toBe(400);
    expect(prismaMock.collection.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate name", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.collection.findUnique.mockResolvedValueOnce({ id: "col_1" } as never);

    const res = await request(app)
      .post("/api/v1/saved/collections")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Tutorials" });

    expect(res.status).toBe(409);
  });

  it("creates a collection with a trimmed name", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.collection.findUnique.mockResolvedValueOnce(null);
    prismaMock.collection.create.mockResolvedValueOnce({ id: "col_1", name: "Tutorials", createdAt: new Date() } as never);

    const res = await request(app)
      .post("/api/v1/saved/collections")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "  Tutorials " });

    expect(res.status).toBe(201);
    expect(prismaMock.collection.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: testUser.id, name: "Tutorials" } })
    );
  });

  it("won't delete someone else's collection", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.collection.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).delete("/api/v1/saved/collections/col_x").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(prismaMock.collection.delete).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/posts/:postId", () => {
  it("returns the post with the viewer's like/save state", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(fakePost as never);
    prismaMock.like.findMany.mockResolvedValueOnce([{ postId: "post_1" }] as never);
    prismaMock.savedPost.findMany.mockResolvedValueOnce([]);
    prismaMock.userHobby.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/posts/post_1").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "post_1", isLiked: true, isSaved: false });
  });

  it("404s for a missing post", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.post.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/v1/posts/gone").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/users/:username/posts", () => {
  it("lists only that user's posts, optionally just photos", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.user.findUnique.mockResolvedValueOnce(testUser as never); // verifyJWT
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user_2" } as never); // the profile owner
    prismaMock.post.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/users/priya/posts?media=1").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorId: "user_2", imageUrl: { not: null } } })
    );
  });
});
