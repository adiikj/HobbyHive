import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { detectImageType } from "../src/middlewares/upload.middleware.js";
import { mockAuthenticatedUser, prismaMock } from "./testUtils.js";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const refreshToken = (id = "user_1") =>
  jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "10d" });

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("image uploads are checked by their bytes, not the uploader's claims", () => {
  it("recognises real image signatures and nothing else", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(".jpg");
    expect(detectImageType(PNG)).toBe(".png");
    expect(detectImageType(Buffer.from("GIF89a......"))).toBe(".gif");
    expect(detectImageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toBe(".webp");
    expect(detectImageType(Buffer.from("<html><script>alert(1)</script></html>"))).toBeNull();
  });

  it("rejects an HTML file dressed up as a PNG", async () => {
    const token = mockAuthenticatedUser();
    const res = await request(app)
      .post("/api/v1/posts/upload-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.from("<script>alert(1)</script>"), { filename: "x.html", contentType: "image/png" });
    expect(res.status).toBe(400);
  });

  it("saves a real image with the extension of its actual type", async () => {
    const token = mockAuthenticatedUser();
    const res = await request(app)
      .post("/api/v1/posts/upload-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", PNG, { filename: "photo.html", contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.data.url).toMatch(/^\/uploads\/[\w-]+\.png$/);
  });

  it("never serves non-image files from /uploads, and tells browsers not to sniff", async () => {
    expect((await request(app).get("/uploads/evil.html")).status).toBe(404);
    const token = mockAuthenticatedUser();
    const upload = await request(app)
      .post("/api/v1/posts/upload-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", PNG, { filename: "p.png", contentType: "image/png" });
    const res = await request(app).get(upload.body.data.url);
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("POST /api/v1/users/refresh", () => {
  it("401s without a refresh cookie", async () => {
    expect((await request(app).post("/api/v1/users/refresh")).status).toBe(401);
  });

  it("401s for a token that isn't the current one (signed out, or already rotated)", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user_1", refreshToken: sha256("an older token") } as never);
    const res = await request(app).post("/api/v1/users/refresh").set("Cookie", `refreshToken=${refreshToken()}`);
    expect(res.status).toBe(401);
  });

  it("issues a new access token, rotates the refresh token and stores only its hash", async () => {
    const current = refreshToken();
    const user = { id: "user_1", name: "A", username: "a", email: "a@example.com", refreshToken: sha256(current) };
    prismaMock.user.findUnique.mockResolvedValueOnce(user as never).mockResolvedValueOnce(user as never);
    prismaMock.user.update.mockResolvedValueOnce({} as never);

    const res = await request(app).post("/api/v1/users/refresh").set("Cookie", `refreshToken=${current}`);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeUndefined(); // only ever in the httpOnly cookie
    const cookies = res.headers["set-cookie"] as unknown as string[];
    const newRefresh = cookies.find((c) => c.startsWith("refreshToken="))!;
    expect(newRefresh).toMatch(/HttpOnly/);
    expect(newRefresh).toMatch(/SameSite=Lax/);
    const stored = prismaMock.user.update.mock.calls[0][0].data.refreshToken as string;
    expect(stored).toBe(sha256(newRefresh.split(";")[0].slice("refreshToken=".length)));
  });
});

describe("sign-up codes", () => {
  it("stores a hash of the emailed code, never the code", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.pendingUser.upsert.mockResolvedValueOnce({ id: "pending_1" } as never);

    await request(app)
      .post("/api/v1/users/register")
      .send({ name: "A", username: "a", email: "a@example.com", password: "secret123" });

    const { create, update } = prismaMock.pendingUser.upsert.mock.calls[0][0];
    expect(create.otp).toMatch(/^\$2[aby]\$/);
    expect(update.otpAttempts).toBe(0);
  });

  it("stops accepting guesses after too many wrong ones, even the right code", async () => {
    prismaMock.pendingUser.findUnique.mockResolvedValueOnce({
      id: "pending_1",
      otp: await bcrypt.hash("111111", 4),
      otpExpiry: new Date(Date.now() + 60_000),
      otpAttempts: 5,
    } as never);
    prismaMock.pendingUser.updateMany.mockResolvedValueOnce({ count: 0 }); // limit reached

    const res = await request(app).post("/api/v1/users/verify-otp").send({ email: "a@example.com", otp: "111111" });

    expect(res.status).toBe(429);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("login", () => {
  it("accepts a password with leading/trailing spaces exactly as it was registered", async () => {
    const hashed = await bcrypt.hash("  spaced out  ", 4);
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: "user_1", password: hashed } as never);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: "user_1", name: "A", username: "a", email: "a@example.com" } as never)
      .mockResolvedValueOnce({ id: "user_1", name: "A", username: "a", email: "a@example.com" } as never);
    prismaMock.user.update.mockResolvedValueOnce({} as never);

    const res = await request(app).post("/api/v1/users/login").send({ emailOrUsername: "a", password: "  spaced out  " });

    expect(res.status).toBe(200);
  });
});
