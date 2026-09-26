import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const hobby = { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" };

describe("GET /api/v1/hobbies/:slug/skills", () => {
  it("returns the skill map with your status, practice time and how many members got there", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce(hobby as never);
    prismaMock.skill.findMany.mockResolvedValueOnce([
      { id: "sk_rhythm", slug: "rhythm", name: "Rhythm", description: "", tier: 1, position: 0, parentId: null },
      { id: "sk_spot", slug: "spotting", name: "Spotting", description: "", tier: 2, position: 0, parentId: "sk_rhythm" },
    ] as never);
    prismaMock.userSkill.findMany.mockResolvedValueOnce([{ skillId: "sk_rhythm", status: "DONE", startedAt: new Date(), completedAt: new Date() }] as never);
    prismaMock.userSkill.groupBy
      .mockResolvedValueOnce([{ skillId: "sk_rhythm", _count: { _all: 12 } }] as never)
      .mockResolvedValueOnce([{ skillId: "sk_spot", _count: { _all: 4 } }] as never);
    prismaMock.practiceSession.groupBy.mockResolvedValueOnce([{ skillId: "sk_spot", _sum: { durationMin: 45 }, _count: { _all: 2 } }] as never);
    prismaMock.goal.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/v1/hobbies/dance/skills").set(auth(token));

    expect(res.status).toBe(200);
    const [rhythm, spotting] = res.body.data.skills;
    expect(rhythm).toMatchObject({ membersDone: 12, my: { status: "DONE", minutes: 0 } });
    // Practised but never marked: status null, practice still counted
    expect(spotting).toMatchObject({ membersLearning: 4, my: { status: null, minutes: 45, sessions: 2 } });
  });
});

describe("PUT /api/v1/skills/:id/status", () => {
  it("marks a skill done and achieves goals aimed at it", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.skill.findUnique.mockResolvedValueOnce({ id: "sk_spot", hobbyId: hobby.id, name: "Spotting" } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.userSkill.upsert.mockResolvedValueOnce({ skillId: "sk_spot", status: "DONE" } as never);
    prismaMock.goal.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await request(app).put("/api/v1/skills/sk_spot/status").set(auth(token)).send({ status: "DONE" });

    expect(res.status).toBe(200);
    expect(res.body.data.achievedGoals).toBe(1);
    expect(prismaMock.goal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: testUser.id, skillId: "sk_spot", status: "ACTIVE" } })
    );
  });

  it("won't track skills in a hive you haven't joined", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.skill.findUnique.mockResolvedValueOnce({ id: "sk_spot", hobbyId: hobby.id } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).put("/api/v1/skills/sk_spot/status").set(auth(token)).send({ status: "LEARNING" });

    expect(res.status).toBe(403);
  });

  it("rejects unknown statuses", async () => {
    const token = mockAuthenticatedUser();
    const res = await request(app).put("/api/v1/skills/sk_spot/status").set(auth(token)).send({ status: "MASTERED" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/goals", () => {
  const future = () => new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();

  it("names a skill goal after the skill and starts learning it", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.skill.findFirst.mockResolvedValueOnce({ id: "sk_double", name: "Double pirouette" } as never);
    prismaMock.goal.count.mockResolvedValueOnce(0);
    prismaMock.goal.create.mockResolvedValueOnce({ id: "g1", title: "Double pirouette" } as never);

    const res = await request(app).post("/api/v1/goals").set(auth(token)).send({ hobbyId: hobby.id, skillId: "sk_double", targetDate: future() });

    expect(res.status).toBe(201);
    expect(prismaMock.goal.create.mock.calls[0][0].data).toMatchObject({ title: "Double pirouette", skillId: "sk_double" });
    expect(prismaMock.userSkill.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }));
  });

  it("caps active goals at 3 per hive", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.goal.count.mockResolvedValueOnce(3);

    const res = await request(app).post("/api/v1/goals").set(auth(token)).send({ hobbyId: hobby.id, title: "Perform at open mic" });

    expect(res.status).toBe(409);
    expect(prismaMock.goal.create).not.toHaveBeenCalled();
  });

  it("rejects a target date in the past", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);

    const res = await request(app).post("/api/v1/goals").set(auth(token)).send({ hobbyId: hobby.id, title: "x", targetDate: "2020-01-01" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/practice with a skill", () => {
  it("only accepts skills from the same hive", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.skill.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/v1/practice")
      .set(auth(token))
      .send({ hobbyId: hobby.id, durationMin: 20, focus: "turns", skillId: "sk_other_hive" });

    expect(res.status).toBe(400);
    expect(prismaMock.practiceSession.create).not.toHaveBeenCalled();
  });

  it("tags the session and marks the skill as learning", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "uh_1" } as never);
    prismaMock.skill.findFirst.mockResolvedValueOnce({ id: "sk_spot" } as never);
    prismaMock.practiceSession.create.mockResolvedValueOnce({ id: "ps_1" } as never);

    const res = await request(app).post("/api/v1/practice").set(auth(token)).send({ hobbyId: hobby.id, durationMin: 20, focus: "spotting", skillId: "sk_spot" });

    expect(res.status).toBe(201);
    expect(prismaMock.practiceSession.create.mock.calls[0][0].data).toMatchObject({ skillId: "sk_spot" });
    expect(prismaMock.userSkill.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ status: "LEARNING" }) }));
  });
});
