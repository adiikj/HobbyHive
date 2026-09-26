import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock } from "./testUtils.js";
import { pickFocus, planTime, type CoachSkill } from "../src/controllers/coach.controller.js";
import * as ml from "../src/services/ml.service.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const now = new Date("2026-09-24T12:00:00Z");
const ago = (d: number) => new Date(now.getTime() - d * 86_400_000);
const skill = (id: string, extra: Partial<CoachSkill> = {}): CoachSkill => ({
  id,
  name: id,
  description: `${id} desc`,
  tier: 1,
  parentId: null,
  membersDone: 0,
  status: null,
  startedAt: null,
  ...extra,
});

describe("planTime", () => {
  it("starts gently when there's no recent practice", () => {
    expect(planTime([], now)).toMatchObject({ sessions: 2, minutesEach: 20 });
  });

  it("nudges a little above the recent weekly average", () => {
    // 8 sessions × 30 min over 4 weeks → 60 min/week, 2 sessions/week → 66 → 2 × 35
    const sessions = Array.from({ length: 8 }, (_, i) => ({ startedAt: ago(i * 3 + 1), durationMin: 30, feel: null, skillId: null }));
    expect(planTime(sessions, now)).toMatchObject({ sessions: 2, minutesEach: 35 });
  });
});

describe("pickFocus", () => {
  it("puts the goal with the nearest date first, then a neglected skill", () => {
    const skills = [
      skill("rhythm", { status: "DONE" }),
      skill("spotting", { status: "LEARNING", startedAt: ago(30), parentId: "rhythm", tier: 2 }),
      skill("isolations", { status: "LEARNING", startedAt: ago(40), parentId: "rhythm", tier: 2 }),
      skill("double", { status: "LEARNING", startedAt: ago(5), tier: 4 }),
    ];
    const sessions = [{ startedAt: ago(20), durationMin: 30, feel: "okay", skillId: "isolations" }];
    const goals = [
      { title: "Double", skillId: "double", targetDate: ago(-60) },
      { title: "Spotting", skillId: "spotting", targetDate: ago(-10) },
    ];

    const focus = pickFocus(skills, sessions, goals, now);

    expect(focus.map((f) => [f.skill.id, f.kind])).toEqual([
      ["spotting", "goal"],
      ["double", "goal"],
    ]);
    expect(focus[0].reason).toContain("10 days away");
  });

  it("flags skills you've let slide", () => {
    const skills = [skill("isolations", { status: "LEARNING", startedAt: ago(40) })];
    const focus = pickFocus(skills, [{ startedAt: ago(20), durationMin: 30, feel: null, skillId: "isolations" }], [], now);
    expect(focus[0]).toMatchObject({ kind: "neglected" });
    expect(focus[0].reason).toContain("20 days ago");
  });

  it("suggests what's unlocked next, never something already done", () => {
    const skills = [
      skill("rhythm", { status: "DONE" }),
      skill("spotting", { parentId: "rhythm", tier: 2, membersDone: 4 }),
      skill("footwork", { parentId: "rhythm", tier: 2, membersDone: 9 }),
      skill("double", { parentId: "spotting", tier: 3 }), // locked: spotting isn't done
    ];
    const focus = pickFocus(skills, [], [], now);
    expect(focus.map((f) => f.skill.id)).toEqual(["footwork", "spotting"]);
    expect(focus[0].reason).toBe("Next up after rhythm. 9 members have learned it.");
  });
});

describe("POST /api/v1/ask/coach", () => {
  it("won't coach you in a hive you haven't joined", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "h1", name: "Dance", slug: "dance" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);
    const res = await request(app).post("/api/v1/ask/coach").set(auth(token)).send({ hobbySlug: "dance" });
    expect(res.status).toBe(403);
  });

  it("returns a plan with cited tips, and your own last note", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: "h1", name: "Dance", slug: "dance" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh" } as never);
    prismaMock.skill.findMany.mockResolvedValueOnce([{ id: "sk", name: "Spotting", description: "Eyes on one point", tier: 2, parentId: null }] as never);
    prismaMock.userSkill.findMany.mockResolvedValueOnce([{ skillId: "sk", status: "LEARNING", startedAt: new Date() }] as never);
    prismaMock.userSkill.groupBy.mockResolvedValueOnce([] as never);
    prismaMock.practiceSession.findMany.mockResolvedValueOnce([
      { startedAt: new Date(), durationMin: 30, feel: "rough", skillId: "sk", note: "left side wobbly" },
    ] as never);
    prismaMock.goal.findMany.mockResolvedValueOnce([]);
    const spy = vi.spyOn(ml, "askBea").mockResolvedValueOnce({
      mode: "extractive",
      answer: [],
      trace: {
        candidates: [
          { text: "Drill spots on a wall first", meaning_score: 0.68 },
          { text: "Welcome to the hive!", meaning_score: 0.56 },
        ],
      },
      evidence: [
        { chunk_id: "c", kind: "post", post_id: "p9", comment_id: null, author_name: "Mira K", author_username: "mira", text: "Drill spots on a wall first", created_at: "" },
        // Retrieved but only loosely related: left out of coaching tips
        { chunk_id: "d", kind: "post", post_id: "p1", comment_id: null, author_name: "Adi", author_username: "adi", text: "Welcome to the hive!", created_at: "" },
      ],
    } as never);

    const res = await request(app).post("/api/v1/ask/coach").set(auth(token)).send({ hobbySlug: "dance" });

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith("Spotting: Eyes on one point", "dance");
    expect(res.body.data.focus[0]).toMatchObject({
      kind: "rough",
      lastNote: "left side wobbly",
      tips: [{ postId: "p9", authorName: "Mira K", text: "Drill spots on a wall first" }],
    });
  });
});
