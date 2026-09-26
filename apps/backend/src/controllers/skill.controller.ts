import type { Request, Response } from "express";
import { SkillStatus } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const hobbySelect = { select: { id: true, name: true, slug: true, icon: true } } as const;

/** Minutes and session counts per skill for one user, from their tagged practice sessions. */
const practiceBySkill = async (userId: string, skillIds: string[]) => {
  if (!skillIds.length) return new Map<string, { minutes: number; sessions: number }>();
  const rows = await prisma.practiceSession.groupBy({
    by: ["skillId"],
    where: { userId, skillId: { in: skillIds } },
    _sum: { durationMin: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.skillId as string, { minutes: r._sum.durationMin ?? 0, sessions: r._count._all }]));
};

// A hive's skill map, with where you are on each skill and how many members have got there
export const getHobbySkills = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: hobbySelect.select });
  if (!hobby) throw new ApiError(404, "Hobby not found");

  const skills = await prisma.skill.findMany({
    where: { hobbyId: hobby.id },
    orderBy: [{ tier: "asc" }, { position: "asc" }],
    select: { id: true, slug: true, name: true, description: true, tier: true, position: true, parentId: true },
  });
  const skillIds = skills.map((s) => s.id);

  const [mine, doneCounts, learningCounts, practice, goals] = await Promise.all([
    prisma.userSkill.findMany({
      where: { userId, skillId: { in: skillIds } },
      select: { skillId: true, status: true, startedAt: true, completedAt: true },
    }),
    prisma.userSkill.groupBy({ by: ["skillId"], where: { skillId: { in: skillIds }, status: SkillStatus.DONE }, _count: { _all: true } }),
    prisma.userSkill.groupBy({ by: ["skillId"], where: { skillId: { in: skillIds }, status: SkillStatus.LEARNING }, _count: { _all: true } }),
    practiceBySkill(userId, skillIds),
    prisma.goal.findMany({
      where: { userId, hobbyId: hobby.id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, targetDate: true, skillId: true, createdAt: true },
    }),
  ]);

  const mineBySkill = new Map(mine.map((m) => [m.skillId, m]));
  const done = new Map(doneCounts.map((c) => [c.skillId, c._count._all]));
  const learning = new Map(learningCounts.map((c) => [c.skillId, c._count._all]));

  res.status(200).json(
    new ApiResponse(200, {
      hobby,
      skills: skills.map((s) => {
        const my = mineBySkill.get(s.id);
        const p = practice.get(s.id);
        return {
          ...s,
          membersDone: done.get(s.id) ?? 0,
          membersLearning: learning.get(s.id) ?? 0,
          my: my
            ? { status: my.status, startedAt: my.startedAt, completedAt: my.completedAt, minutes: p?.minutes ?? 0, sessions: p?.sessions ?? 0 }
            : p
              ? { status: null, startedAt: null, completedAt: null, minutes: p.minutes, sessions: p.sessions }
              : null,
        };
      }),
      goals,
    })
  );
});

// Set where you are with a skill: LEARNING, DONE, or null to clear it
export const setSkillStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status } = req.body;
  if (status !== null && status !== SkillStatus.LEARNING && status !== SkillStatus.DONE) {
    throw new ApiError(400, "Status must be LEARNING, DONE or null");
  }

  const skill = await prisma.skill.findUnique({ where: { id: String(req.params.skillId) }, select: { id: true, hobbyId: true, name: true } });
  if (!skill) throw new ApiError(404, "Skill not found");
  const membership = await prisma.userHobby.findFirst({ where: { userId, hobbyId: skill.hobbyId }, select: { id: true } });
  if (!membership) throw new ApiError(403, "Join this hive to track its skills");

  if (status === null) {
    await prisma.userSkill.deleteMany({ where: { userId, skillId: skill.id } });
    return res.status(200).json(new ApiResponse(200, { skillId: skill.id, status: null }));
  }

  const completedAt = status === SkillStatus.DONE ? new Date() : null;
  const saved = await prisma.userSkill.upsert({
    where: { userId_skillId: { userId, skillId: skill.id } },
    update: { status, completedAt },
    create: { userId, skillId: skill.id, status, completedAt },
    select: { skillId: true, status: true, startedAt: true, completedAt: true },
  });

  // Finishing a skill achieves any goal that was about it
  let achievedGoals = 0;
  if (status === SkillStatus.DONE) {
    const { count } = await prisma.goal.updateMany({
      where: { userId, skillId: skill.id, status: "ACTIVE" },
      data: { status: "ACHIEVED", achievedAt: new Date() },
    });
    achievedGoals = count;
  }

  res.status(200).json(new ApiResponse(200, { ...saved, achievedGoals }));
});

// Someone's skills across their hives: what they're learning and what they've done (public)
export const getUserSkills = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { username: String(req.params.username) }, select: { id: true } });
  if (!user) throw new ApiError(404, "User not found");

  const rows = await prisma.userSkill.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { startedAt: "desc" }],
    select: {
      status: true,
      startedAt: true,
      completedAt: true,
      skill: { select: { id: true, name: true, tier: true, hobby: hobbySelect } },
    },
  });
  const practice = await practiceBySkill(user.id, rows.map((r) => r.skill.id));

  const byHobby = new Map<string, { hobby: (typeof rows)[number]["skill"]["hobby"]; learning: unknown[]; done: unknown[] }>();
  for (const r of rows) {
    const group = byHobby.get(r.skill.hobby.id) ?? { hobby: r.skill.hobby, learning: [], done: [] };
    const item = {
      id: r.skill.id,
      name: r.skill.name,
      tier: r.skill.tier,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      minutes: practice.get(r.skill.id)?.minutes ?? 0,
    };
    (r.status === SkillStatus.DONE ? group.done : group.learning).push(item);
    byHobby.set(r.skill.hobby.id, group);
  }

  res.status(200).json(new ApiResponse(200, { hives: [...byHobby.values()] }));
});
