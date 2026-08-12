import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../src/app.js";
import { prismaMock } from "./testUtils.js";

describe("POST /api/v1/users/register", () => {
  it("rejects missing fields", async () => {
    const res = await request(app).post("/api/v1/users/register").send({ name: "A" });
    expect(res.status).toBe(400);
  });

  it("rejects an already-registered email or username", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: "existing" } as never);

    const res = await request(app)
      .post("/api/v1/users/register")
      .send({ name: "A", username: "a", email: "a@example.com", password: "secret123" });

    expect(res.status).toBe(400);
  });

  it("creates a pending user and asks for OTP verification", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.pendingUser.upsert.mockResolvedValueOnce({ id: "pending_1" } as never);

    const res = await request(app)
      .post("/api/v1/users/register")
      .send({ name: "A", username: "a", email: "a@example.com", password: "secret123" });

    expect(res.status).toBe(200);
    expect(prismaMock.pendingUser.upsert).toHaveBeenCalledOnce();
  });
});

describe("POST /api/v1/users/verify-otp", () => {
  it("rejects missing otp/email", async () => {
    const res = await request(app).post("/api/v1/users/verify-otp").send({});
    expect(res.status).toBe(400);
  });

  it("404s when there is no pending user for that email", async () => {
    prismaMock.pendingUser.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/v1/users/verify-otp")
      .send({ email: "a@example.com", otp: "123456" });

    expect(res.status).toBe(404);
  });

  it("rejects a wrong OTP", async () => {
    prismaMock.pendingUser.findUnique.mockResolvedValueOnce({
      id: "pending_1",
      otp: "111111",
      otpExpiry: new Date(Date.now() + 60_000),
    } as never);

    const res = await request(app)
      .post("/api/v1/users/verify-otp")
      .send({ email: "a@example.com", otp: "999999" });

    expect(res.status).toBe(400);
  });

  it("rejects an expired OTP", async () => {
    prismaMock.pendingUser.findUnique.mockResolvedValueOnce({
      id: "pending_1",
      otp: "111111",
      otpExpiry: new Date(Date.now() - 60_000),
    } as never);

    const res = await request(app)
      .post("/api/v1/users/verify-otp")
      .send({ email: "a@example.com", otp: "111111" });

    expect(res.status).toBe(400);
  });

  it("verifies, creates the user, and logs them in (sets cookies)", async () => {
    prismaMock.pendingUser.findUnique.mockResolvedValueOnce({
      id: "pending_1",
      name: "A",
      username: "a",
      email: "a@example.com",
      password: "hashed",
      otp: "111111",
      otpExpiry: new Date(Date.now() + 60_000),
    } as never);
    prismaMock.user.create.mockResolvedValueOnce({
      id: "user_1",
      name: "A",
      username: "a",
      email: "a@example.com",
    } as never);
    prismaMock.pendingUser.delete.mockResolvedValueOnce({} as never);
    // generateAccessAndRefreshTokens looks the user back up, then updates it with a refresh token
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user_1",
      name: "A",
      username: "a",
      email: "a@example.com",
    } as never);
    prismaMock.user.update.mockResolvedValueOnce({} as never);

    const res = await request(app)
      .post("/api/v1/users/verify-otp")
      .send({ email: "a@example.com", otp: "111111" });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    const cookies = res.headers["set-cookie"] as unknown as string[] | undefined;
    expect(cookies?.some((c) => c.startsWith("accessToken="))).toBe(true);
  });
});

describe("POST /api/v1/users/login", () => {
  it("rejects missing fields", async () => {
    const res = await request(app).post("/api/v1/users/login").send({});
    expect(res.status).toBe(400);
  });

  it("404s when no user matches", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ emailOrUsername: "a", password: "secret123" });

    expect(res.status).toBe(404);
  });

  it("rejects an incorrect password", async () => {
    const hashed = await bcrypt.hash("correct-password", 10);
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: "user_1", password: hashed } as never);

    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ emailOrUsername: "a", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("logs in with the correct password", async () => {
    const hashed = await bcrypt.hash("correct-password", 10);
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: "user_1", password: hashed } as never);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "user_1", name: "A", username: "a", email: "a@example.com" } as never)
      .mockResolvedValueOnce({
        id: "user_1",
        name: "A",
        username: "a",
        email: "a@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);
    prismaMock.user.update.mockResolvedValueOnce({} as never);

    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ emailOrUsername: "a", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });
});
