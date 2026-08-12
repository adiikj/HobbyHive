import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";

describe("verifyJWT (via GET /api/v1/users/profile)", () => {
  it("rejects requests with no token", async () => {
    const res = await request(app).get("/api/v1/users/profile");
    expect(res.status).toBe(401);
  });

  it("rejects requests with a garbage token", async () => {
    const res = await request(app)
      .get("/api/v1/users/profile")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("rejects a validly-signed token whose user no longer exists", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/v1/users/profile").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("accepts a valid token and attaches the user", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app).get("/api/v1/users/profile").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(testUser.username);
  });
});
