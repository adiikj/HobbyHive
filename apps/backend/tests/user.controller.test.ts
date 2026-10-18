import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
      otp: await bcrypt.hash("111111", 4),
      otpExpiry: new Date(Date.now() + 60_000),
    } as never);
    prismaMock.pendingUser.updateMany.mockResolvedValueOnce({ count: 1 });

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
      otp: await bcrypt.hash("111111", 4),
      otpExpiry: new Date(Date.now() + 60_000),
    } as never);
    prismaMock.pendingUser.updateMany.mockResolvedValueOnce({ count: 1 });
    // create User + delete PendingUser run together in one transaction
    prismaMock.$transaction.mockResolvedValueOnce([{ id: "user_1", name: "A", username: "a", email: "a@example.com" }, {}] as never);
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

  it("answers an unknown account exactly like a wrong password (no account enumeration)", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    const unknown = await request(app).post("/api/v1/users/login").send({ emailOrUsername: "nobody", password: "secret123" });

    const hashed = await bcrypt.hash("correct-password", 4);
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: "user_1", password: hashed } as never);
    const wrong = await request(app).post("/api/v1/users/login").send({ emailOrUsername: "a", password: "secret123" });

    expect(unknown.status).toBe(401);
    expect(unknown.body.message).toBe(wrong.body.message);
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

const cookieHeader = (res: request.Response) => ([] as string[]).concat(res.headers["set-cookie"] ?? []).join("; ");

describe("POST /api/v1/users/logout", () => {
  it("clears the session cookies even with no valid token (an expired session must still sign out)", async () => {
    const res = await request(app).post("/api/v1/users/logout").set("Cookie", "accessToken=expired.or.garbage");

    expect(res.status).toBe(200);
    expect(cookieHeader(res)).toMatch(/accessToken=;.*Expires=Thu, 01 Jan 1970/);
    expect(cookieHeader(res)).toMatch(/refreshToken=;/);
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("revokes the refresh token the cookie holds", async () => {
    const refresh = jwt.sign({ id: "user_1" }, process.env.REFRESH_TOKEN_SECRET as string);
    prismaMock.user.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await request(app).post("/api/v1/users/logout").set("Cookie", `refreshToken=${refresh}`);

    expect(res.status).toBe(200);
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "user_1" }), data: { refreshToken: null } })
    );
  });
});

describe("POST /api/v1/users/forgot-password", () => {
  it("emails a code and stores only its hash when the account exists", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: "user_1", name: "Priya", email: "priya@example.com" } as never);
    prismaMock.user.update.mockResolvedValueOnce({} as never);

    const res = await request(app).post("/api/v1/users/forgot-password").send({ email: "Priya@example.com" });

    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(prismaMock.user.update).toHaveBeenCalled());
    const { data } = prismaMock.user.update.mock.calls[0][0];
    expect(data).toMatchObject({ resetOtpAttempts: 0 });
    expect(String(data.resetOtp)).toMatch(/^\$2[aby]\$/);
  });

  it("answers an unknown email exactly like a known one (no account enumeration)", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).post("/api/v1/users/forgot-password").send({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If that email has an account/);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a missing email", async () => {
    expect((await request(app).post("/api/v1/users/forgot-password").send({})).status).toBe(400);
  });
});

describe("POST /api/v1/users/reset-password", () => {
  const withCode = async (overrides: Record<string, unknown> = {}) =>
    ({ id: "user_1", resetOtp: await bcrypt.hash("123456", 10), resetOtpExpiry: new Date(Date.now() + 60_000), ...overrides }) as never;

  it("sets the new password, clears the code and signs out every session", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(await withCode());
    prismaMock.user.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.user.update.mockResolvedValueOnce({} as never);

    const res = await request(app).post("/api/v1/users/reset-password").send({ email: "a1@example.com", otp: "123456", password: "new-password" });

    expect(res.status).toBe(200);
    const { data } = prismaMock.user.update.mock.calls[0][0];
    expect(await bcrypt.compare("new-password", String(data.password))).toBe(true);
    expect(data).toMatchObject({ resetOtp: null, resetOtpExpiry: null, refreshToken: null });
  });

  it("rejects a wrong code without changing the password", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(await withCode());
    prismaMock.user.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await request(app).post("/api/v1/users/reset-password").send({ email: "a2@example.com", otp: "000000", password: "new-password" });

    expect(res.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects an expired code", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(await withCode({ resetOtpExpiry: new Date(Date.now() - 1000) }));

    const res = await request(app).post("/api/v1/users/reset-password").send({ email: "a3@example.com", otp: "123456", password: "new-password" });

    expect(res.status).toBe(400);
  });

  it("stops accepting guesses after too many wrong codes", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(await withCode());
    prismaMock.user.updateMany.mockResolvedValueOnce({ count: 0 });

    const res = await request(app).post("/api/v1/users/reset-password").send({ email: "a4@example.com", otp: "123456", password: "new-password" });

    expect(res.status).toBe(429);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a short new password", async () => {
    const res = await request(app).post("/api/v1/users/reset-password").send({ email: "a5@example.com", otp: "123456", password: "short" });
    expect(res.status).toBe(400);
  });
});
