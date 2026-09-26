import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";
import { matchSkill } from "../src/controllers/guide.controller.js";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const hive = { id: "h1", name: "Dance", slug: "dance" };
const skills = [
  { id: "sk_single", name: "Single pirouette", tier: 3 },
  { id: "sk_double", name: "Double pirouette", tier: 4 },
  { id: "sk_spot", name: "Spotting", tier: 2 },
];

describe("matchSkill", () => {
  it("matches whole skill names, case-insensitively", () => {
    expect(matchSkill("Is my SPOTTING late?", skills)?.id).toBe("sk_spot");
    expect(matchSkill("Finally a clean double pirouette!", skills)?.id).toBe("sk_double");
    expect(matchSkill("spot the difference", skills)).toBeNull();
  });
});

describe("POST /api/v1/hobbies/:slug/guide", () => {
  it("lets a mentor (3+ helpful answers) add a post under a skill", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: hive.id } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null); // not a moderator…
    prismaMock.feedback.count.mockResolvedValueOnce(3); // …but a mentor
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "p1", hobbyId: hive.id } as never);
    prismaMock.skill.findFirst.mockResolvedValueOnce({ id: "sk_spot" } as never);
    prismaMock.guideEntry.findUnique.mockResolvedValueOnce(null);
    prismaMock.guideEntry.create.mockResolvedValueOnce({ id: "g1" } as never);

    const res = await request(app).post("/api/v1/hobbies/dance/guide").set(auth(token)).send({ postId: "p1", skillId: "sk_spot", note: " Best drill for this " });

    expect(res.status).toBe(201);
    expect(prismaMock.guideEntry.create.mock.calls[0][0].data).toEqual({
      hobbyId: hive.id,
      postId: "p1",
      skillId: "sk_spot",
      note: "Best drill for this",
      addedById: testUser.id,
    });
  });

  it("won't let a regular member curate", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: hive.id } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);
    prismaMock.feedback.count.mockResolvedValueOnce(2);

    const res = await request(app).post("/api/v1/hobbies/dance/guide").set(auth(token)).send({ postId: "p1" });

    expect(res.status).toBe(403);
    expect(prismaMock.guideEntry.create).not.toHaveBeenCalled();
  });

  it("only takes posts from the same hive", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce({ id: hive.id } as never);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce({ id: "mod" } as never);
    prismaMock.feedback.count.mockResolvedValueOnce(0);
    prismaMock.post.findUnique.mockResolvedValueOnce({ id: "p1", hobbyId: "h_other" } as never);

    const res = await request(app).post("/api/v1/hobbies/dance/guide").set(auth(token)).send({ postId: "p1" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/hobbies/:slug/guide", () => {
  it("files helpful feedback under the skill it's about, in skill-map order", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findUnique.mockResolvedValueOnce(hive as never);
    prismaMock.skill.findMany.mockResolvedValueOnce(skills as never);
    prismaMock.guideEntry.findMany.mockResolvedValueOnce([]);
    const fb = (id: string, ask: string | null, skillId: string | null = null) => ({
      id,
      working: "w",
      tryNext: "t",
      at: null,
      helpfulAt: new Date(),
      author: { id: "u3", name: "Jonah", username: "jonah", avatarUrl: null },
      post: { id: `p_${id}`, content: "clip", feedbackAsk: ask, author: { name: "Mira", username: "mira" }, practiceSession: skillId ? { skillId } : null },
    });
    prismaMock.feedback.findMany.mockResolvedValueOnce([
      fb("a", "Is my spotting late?"),
      fb("b", "Any tips?", "sk_double"), // tagged via its practice session
      fb("c", "How's my posture?"),
    ] as never);
    prismaMock.post.findMany.mockResolvedValueOnce([]);
    prismaMock.userHobby.findFirst.mockResolvedValueOnce(null);
    prismaMock.feedback.count.mockResolvedValueOnce(0);
    prismaMock.feedback.groupBy.mockResolvedValueOnce([{ authorId: "u3", _count: { _all: 3 } }] as never);

    const res = await request(app).get("/api/v1/hobbies/dance/guide").set(auth(token));

    expect(res.status).toBe(200);
    const sections = res.body.data.sections.map((s: { skill: { id: string } | null; helpful: unknown[] }) => [s.skill?.id ?? "general", s.helpful.length]);
    expect(sections).toEqual([
      ["sk_double", 1],
      ["sk_spot", 1],
      ["general", 1],
    ]);
    expect(res.body.data.sections[0].helpful[0].mentorLevel).toBe("Mentor");
    expect(res.body.data.canCurate).toBe(false);
  });
});
