import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";
import { describeSession } from "../src/controllers/practice.controller.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const hobby = { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" };

describe("POST /api/v1/practice", () => {
  it("logs a session in a hive you belong to, starting 'duration ago' by default", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.practiceSession.create.mockResolvedValueOnce({ id: "ps_1", hobby } as never);

    const before = Date.now();
    const res = await request(app)
      .post("/api/v1/practice")
      .set(auth(token))
      .send({ hobbyId: hobby.id, durationMin: 25, focus: "  turns ", feel: "great", note: "spotting better" });

    expect(res.status).toBe(201);
    const data = prismaMock.practiceSession.create.mock.calls[0][0].data as { focus: string; startedAt: Date; userId: string };
    expect(data).toMatchObject({ userId: testUser.id, focus: "turns", durationMin: 25, feel: "great", note: "spotting better" });
    expect(before - data.startedAt.getTime()).toBeGreaterThanOrEqual(25 * 60_000 - 1000);
  });

  it("won't log practice in a hive you haven't joined", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).post("/api/v1/practice").set(auth(token)).send({ hobbyId: hobby.id, durationMin: 25, focus: "turns" });

    expect(res.status).toBe(403);
    expect(prismaMock.practiceSession.create).not.toHaveBeenCalled();
  });

  it.each([
    [{ durationMin: 0, focus: "turns" }, "between 1 and"],
    [{ durationMin: 30, focus: "" }, "what you worked on"],
    [{ durationMin: 30, focus: "turns", feel: "meh" }, "rough, okay or great"],
    [{ durationMin: 30, focus: "turns", startedAt: new Date(Date.now() + 3_600_000).toISOString() }, "future"],
  ])("rejects bad input %j", async (body, message) => {
    const token = mockAuthenticatedUser();
    const res = await request(app).post("/api/v1/practice").set(auth(token)).send({ hobbyId: hobby.id, ...body });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain(message);
  });
});

describe("GET /api/v1/practice", () => {
  it("returns only your sessions, with recent focus areas for quick picks", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.practiceSession.findMany.mockResolvedValueOnce([
      { id: "a", focus: "turns" },
      { id: "b", focus: "isolations" },
      { id: "c", focus: "turns" },
    ] as never);

    const res = await request(app).get("/api/v1/practice?hobby=dance").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.recentFocus).toEqual(["turns", "isolations"]);
    expect(prismaMock.practiceSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: testUser.id, hobby: { slug: "dance" } } })
    );
  });
});

describe("POST /api/v1/practice/:id/share", () => {
  it("won't share someone else's session", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.practiceSession.findUnique.mockResolvedValueOnce({ id: "ps_1", userId: "user_2" } as never);

    const res = await request(app).post("/api/v1/practice/ps_1/share").set(auth(token)).send({});

    expect(res.status).toBe(404);
  });

  it("won't share the same session twice", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.practiceSession.findUnique.mockResolvedValueOnce({ id: "ps_1", userId: testUser.id, postId: "post_9" } as never);

    const res = await request(app).post("/api/v1/practice/ps_1/share").set(auth(token)).send({});

    expect(res.status).toBe(409);
  });

  it("describes a session in one line", () => {
    expect(describeSession({ focus: "turns", durationMin: 25, feel: "great" })).toBe("Practised turns for 25 min · felt great");
    expect(describeSession({ focus: "chord changes", durationMin: 90, feel: null })).toBe("Practised chord changes for 1h 30m");
  });
});

describe("DELETE /api/v1/practice/:id", () => {
  it("deletes your own session", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.practiceSession.findUnique.mockResolvedValueOnce({ id: "ps_1", userId: testUser.id } as never);

    const res = await request(app).delete("/api/v1/practice/ps_1").set(auth(token));

    expect(res.status).toBe(200);
    expect(prismaMock.practiceSession.delete).toHaveBeenCalledWith({ where: { id: "ps_1" } });
  });
});
