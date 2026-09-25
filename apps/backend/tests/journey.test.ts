import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";
import { weekStart, weeklyStreaks } from "../src/controllers/journey.controller.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("weekly streaks", () => {
  const now = day("2026-09-24"); // a Thursday

  it("starts weeks on Monday", () => {
    expect(new Date(weekStart(now)).toISOString()).toBe("2026-09-21T00:00:00.000Z");
    expect(weekStart(day("2026-09-21"))).toBe(weekStart(day("2026-09-27")));
  });

  it("counts consecutive active weeks up to this week", () => {
    const s = weeklyStreaks([day("2026-09-08"), day("2026-09-15"), day("2026-09-23")], now);
    expect(s).toMatchObject({ current: 3, best: 3, activeThisWeek: true });
  });

  it("keeps last week's streak alive until this week ends", () => {
    const s = weeklyStreaks([day("2026-09-10"), day("2026-09-16")], now);
    expect(s).toMatchObject({ current: 2, activeThisWeek: false });
  });

  it("breaks on a missed week but remembers the best run", () => {
    const s = weeklyStreaks([day("2026-08-03"), day("2026-08-10"), day("2026-08-17"), day("2026-09-01")], now);
    expect(s).toMatchObject({ current: 0, best: 3 });
  });

  it("returns 12 weeks of activity, oldest first", () => {
    const s = weeklyStreaks([day("2026-09-22"), day("2026-09-23")], now);
    expect(s.weeks).toHaveLength(12);
    expect(s.weeks[11].posts).toBe(2);
    expect(s.weeks[0].posts).toBe(0);
  });
});

describe("GET /api/v1/users/:username/journey", () => {
  it("builds milestones and stats from posts", async () => {
    const token = mockAuthenticatedUser();
    const hobby = { id: "h1", name: "Dance", slug: "dance", icon: "💃" };
    prismaMock.user.findUnique.mockResolvedValueOnce(testUser as never); // auth
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: testUser.id, name: "A", username: "aditya", avatarUrl: null } as never);
    const post = (id: string, date: string, extra: object = {}) => ({
      id, content: `post ${id}`, createdAt: day(date), images: [], imageUrl: null, challengeId: null, challenge: null, hobby, ...extra,
    });
    prismaMock.post.findMany.mockResolvedValueOnce([
      post("p1", "2026-09-01"),
      post("p2", "2026-09-08", { images: ["/uploads/a.jpg"], challengeId: "c1", challenge: { title: "Freestyle Friday" } }),
    ] as never);
    prismaMock.userHobby.findMany.mockResolvedValueOnce([{ createdAt: day("2026-08-30"), hobby }] as never);
    prismaMock.progressLog.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/users/aditya/journey").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual({ posts: 2, photos: 1, challengesEntered: 1, logs: 0 });
    expect(res.body.data.milestones.map((m: { type: string }) => m.type)).toEqual([
      "first_photo",
      "challenge_entry",
      "first_post",
      "joined",
    ]);
  });

  it("404s for an unknown user", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.user.findUnique.mockResolvedValueOnce(testUser as never);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/v1/users/nobody/journey").set(auth(token));
    expect(res.status).toBe(404);
  });
});
