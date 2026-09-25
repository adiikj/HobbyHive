import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";
import { SERVER_ERROR_MESSAGE } from "../src/middlewares/error.middleware.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("error responses", () => {
  it("answers unknown API routes with a friendly JSON 404", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, message: "That page or action doesn't exist." });
  });

  it("never shows internals for unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const token = mockAuthenticatedUser();
    prismaMock.user.findUnique.mockResolvedValueOnce(testUser as never);
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error("Invalid `prisma.user.findUnique()` invocation: connection refused"));

    const res = await request(app).get("/api/v1/users/aditya/journey").set(auth(token));

    expect(res.status).toBe(500);
    expect(res.body.message).toBe(SERVER_ERROR_MESSAGE);
    expect(JSON.stringify(res.body)).not.toContain("connection refused");
  });

  it("turns a missing record into a 404", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.user.findUnique.mockResolvedValueOnce(testUser as never);
    prismaMock.user.findUnique.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "6" })
    );

    const res = await request(app).get("/api/v1/users/aditya/journey").set(auth(token));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("We couldn't find that. It may have been deleted.");
  });

  it("explains malformed request bodies", async () => {
    const res = await request(app).post("/api/v1/users/login").set("Content-Type", "application/json").send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("That request wasn't formatted correctly. Please try again.");
  });
});
