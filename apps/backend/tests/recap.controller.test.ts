import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock } from "./testUtils.js";
import { describeHiveWeek, findPersonalBests } from "../src/controllers/recap.controller.js";
import { weekStart } from "../src/controllers/journey.controller.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const day = (iso: string) => new Date(`${iso}T12:00:00Z`);
const dance = { id: "hobby_dance", name: "Dance", slug: "dance", icon: null };
const s = (date: string, durationMin: number, focus = "turns") => ({ startedAt: day(date), durationMin, focus, hobby: dance });

describe("personal bests", () => {
  const start = weekStart(day("2026-09-23"));

  it("spots a best week and a longest session against earlier weeks", () => {
    const sessions = [s("2026-09-08", 30), s("2026-09-10", 20), s("2026-09-22", 45, "spotting"), s("2026-09-24", 25)];
    const bests = findPersonalBests(sessions, start, { current: 1, best: 1, bestBefore: 1 });
    expect(bests).toEqual([
      { kind: "week_minutes", value: 70, previous: 50 },
      { kind: "longest_session", value: 45, previous: 30, focus: "spotting" },
    ]);
  });

  it("doesn't call a first-ever week a personal best", () => {
    expect(findPersonalBests([s("2026-09-22", 45)], start, { current: 1, best: 1, bestBefore: 0 })).toEqual([]);
  });

  it("counts a streak that beats the old best", () => {
    const bests = findPersonalBests([s("2026-09-15", 10), s("2026-09-22", 10)], start, { current: 4, best: 4, bestBefore: 3 });
    expect(bests).toContainEqual({ kind: "streak", value: 4, previous: 3 });
  });
});

describe("recap share text", () => {
  it("summarises one hive's week without anything private", () => {
    const text = describeHiveWeek(
      { hobby: dance, sessions: 3, minutes: 100, topFocus: "turns", skillsDone: ["Spotting"], goalsAchieved: [] },
      [{ kind: "week_minutes", value: 100, previous: 60 }]
    );
    expect(text).toBe(
      "My week in Dance: 3 sessions, 1h 40m of practice.\nMostly working on turns.\nFinished: Spotting ✅\nNew personal best for practice in a week 🎉"
    );
  });
});

describe("GET /api/v1/practice/recap", () => {
  it("adds up the week per hive and compares with the week before", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.practiceSession.findMany.mockResolvedValueOnce([s("2026-09-15", 30), s("2026-09-22", 40), s("2026-09-23", 20, "spotting")] as never);
    prismaMock.post.findMany.mockResolvedValueOnce([]);
    prismaMock.userSkill.findMany.mockResolvedValueOnce([]);
    prismaMock.goal.findMany.mockResolvedValueOnce([]);
    prismaMock.feedback.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const res = await request(app).get("/api/v1/practice/recap?week=2026-09-24").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({ sessions: 2, minutes: 60, activeDays: 2, posts: 0 });
    expect(res.body.data.previousMinutes).toBe(30);
    expect(res.body.data.perHive[0]).toMatchObject({ sessions: 2, minutes: 60, topFocus: "turns" });
    expect(res.body.data.feedback).toEqual({ given: 2, markedHelpful: 1 });
    expect(res.body.data.personalBests.map((b: { kind: string }) => b.kind)).toEqual(["week_minutes", "longest_session", "streak"]);
  });

  it("refuses future weeks", async () => {
    const token = mockAuthenticatedUser();
    const res = await request(app).get("/api/v1/practice/recap?week=2999-01-01").set(auth(token));
    expect(res.status).toBe(400);
  });
});
