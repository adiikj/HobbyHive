import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";

const otherUser = { id: "user_2", name: "Other", username: "other", email: "other@example.com" };

// verifyJWT and findUserByUsername share prisma.user.findUnique — differentiate by the query shape
function mockUserLookups() {
  prismaMock.user.findUnique.mockImplementation(((args: { where?: { id?: string; username?: string } }) => {
    const where = args?.where;
    if (where?.id === testUser.id) return Promise.resolve(testUser as never);
    if (where?.username === otherUser.username) return Promise.resolve(otherUser as never);
    return Promise.resolve(null as never);
  }) as never);
}

describe("POST /api/v1/users/:username/follow", () => {
  it("blocks following yourself", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app)
      .post(`/api/v1/users/${testUser.username}/follow`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("is idempotent — returns the existing relationship instead of duplicating a request", async () => {
    const token = mockAuthenticatedUser();
    mockUserLookups();
    prismaMock.follow.findUnique.mockResolvedValueOnce({ status: "ACCEPTED" } as never);

    const res = await request(app)
      .post(`/api/v1/users/${otherUser.username}/follow`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ACCEPTED");
    expect(prismaMock.follow.create).not.toHaveBeenCalled();
  });

  it("sends a new PENDING follow request when none exists", async () => {
    const token = mockAuthenticatedUser();
    mockUserLookups();
    prismaMock.follow.findUnique.mockResolvedValueOnce(null);
    prismaMock.follow.create.mockResolvedValueOnce({ status: "PENDING" } as never);

    const res = await request(app)
      .post(`/api/v1/users/${otherUser.username}/follow`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
  });
});
