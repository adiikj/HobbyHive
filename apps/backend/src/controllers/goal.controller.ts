import type { Request, Response } from "express";
import { GoalStatus, SkillStatus, type Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const MAX_TITLE = 80;
const MAX_ACTIVE_PER_HIVE = 3;
const MAX_TARGET_DAYS = 2 * 365;
const DAY_MS = 24 * 60 * 60 * 1000;

const goalSelect = {
  id: true,
  title: true,
  targetDate: true,
  status: true,
  createdAt: true,
  achievedAt: true,
  hobby: { select: { id: true, name: true, slug: true, icon: true } },
  skill: { select: { id: true, name: true } },
} satisfies Prisma.GoalSelect;

type RawGoal = Prisma.GoalGetPayload<{ select: typeof goalSelect }>;

const parseTitle = (raw: unknown, fallback?: string) => {
  const title = typeof raw === "string" ? raw.trim() : "";
  if (!title && fallback) return fallback;
  if (!title) throw new ApiError(400, "Give your goal a name");
  if (title.length > MAX_TITLE) throw new ApiError(400, `Keep it under ${MAX_TITLE} characters`);
  return title;
};

/** A goal's target date: optional, must be in the future and within two years. */
const parseTargetDate = (raw: unknown, now = new Date()) => {
  if (raw === undefined || raw === null || raw === "") return null;
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "Invalid target date");
  if (date.getTime() < now.getTime() - DAY_MS) throw new ApiError(400, "Pick a date in the future");
  if (date.getTime() - now.getTime() > MAX_TARGET_DAYS * DAY_MS) throw new ApiError(400, "Pick a date within the next two years");
  return date;
};

/** How much you've practised towards a goal: sessions on its skill logged since you set it. (Not `startedAt`:
 * a session logged right after setting a goal starts before it, since it's backdated by its length.) */
const withProgress = async (userId: string, goals: RawGoal[]) =>
  Promise.all(
    goals.map(async (goal) => {
      if (!goal.skill) return { ...goal, progress: null };
      const agg = await prisma.practiceSession.aggregate({
        where: { userId, skillId: goal.skill.id, createdAt: { gte: goal.createdAt } },
        _sum: { durationMin: true },
        _count: { _all: true },
      });
      return { ...goal, progress: { minutes: agg._sum.durationMin ?? 0, sessions: agg._count._all } };
    })
  );

const findOwnGoal = async (userId: string, goalId: string) => {
  const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { id: true, userId: true, status: true } });
  if (!goal || goal.userId !== userId) throw new ApiError(404, "Goal not found");
  return goal;
};

// Set a goal in one of your hives, usually "learn this skill by then"
export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { hobbyId, skillId } = req.body;
  if (!hobbyId || typeof hobbyId !== "string") throw new ApiError(400, "Pick a hive for this goal");

  const membership = await prisma.userHobby.findFirst({ where: { userId, hobbyId }, select: { id: true } });
  if (!membership) throw new ApiError(403, "Join this hive to set goals in it");

  let skill: { id: string; name: string } | null = null;
  if (skillId !== undefined && skillId !== null && skillId !== "") {
    skill = await prisma.skill.findFirst({ where: { id: String(skillId), hobbyId }, select: { id: true, name: true } });
    if (!skill) throw new ApiError(400, "That skill isn't part of this hive");
  }

  const title = parseTitle(req.body.title, skill?.name);
  const targetDate = parseTargetDate(req.body.targetDate);

  const active = await prisma.goal.count({ where: { userId, hobbyId, status: GoalStatus.ACTIVE } });
  if (active >= MAX_ACTIVE_PER_HIVE) {
    throw new ApiError(409, `You can have ${MAX_ACTIVE_PER_HIVE} active goals per hive. Finish or drop one first.`);
  }

  const goal = await prisma.goal.create({ data: { userId, hobbyId, skillId: skill?.id ?? null, title, targetDate }, select: goalSelect });

  // Aiming at a skill means you're learning it (never downgrades one you've already done)
  if (skill) {
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      update: {},
      create: { userId, skillId: skill.id, status: SkillStatus.LEARNING },
    });
  }

  res.status(201).json(new ApiResponse(201, { ...goal, progress: skill ? { minutes: 0, sessions: 0 } : null }, "Goal set"));
});

// Your goals, active first; `?hobby=<slug>` for one hive, `?status=ACTIVE|ACHIEVED|DROPPED` to filter
export const listMyGoals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const slug = typeof req.query.hobby === "string" && req.query.hobby ? req.query.hobby : null;
  const status = typeof req.query.status === "string" ? req.query.status : null;
  if (status && !Object.values(GoalStatus).includes(status as GoalStatus)) throw new ApiError(400, "Invalid status");

  const goals = await prisma.goal.findMany({
    where: { userId, ...(slug ? { hobby: { slug } } : {}), ...(status ? { status: status as GoalStatus } : {}) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50,
    select: goalSelect,
  });

  res.status(200).json(new ApiResponse(200, await withProgress(userId, goals)));
});

// Rename, move the date, achieve or drop a goal
export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const goal = await findOwnGoal(userId, String(req.params.goalId));
  const data: Prisma.GoalUpdateInput = {};

  if (req.body.title !== undefined) data.title = parseTitle(req.body.title);
  if (req.body.targetDate !== undefined) data.targetDate = parseTargetDate(req.body.targetDate);
  if (req.body.status !== undefined) {
    const status = req.body.status as GoalStatus;
    if (!Object.values(GoalStatus).includes(status)) throw new ApiError(400, "Invalid status");
    data.status = status;
    data.achievedAt = status === GoalStatus.ACHIEVED ? new Date() : null;
  }
  if (!Object.keys(data).length) throw new ApiError(400, "Nothing to update");

  const updated = await prisma.goal.update({ where: { id: goal.id }, data, select: goalSelect });
  const [withP] = await withProgress(userId, [updated]);
  res.status(200).json(new ApiResponse(200, withP));
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await findOwnGoal(req.user!.id, String(req.params.goalId));
  await prisma.goal.delete({ where: { id: goal.id } });
  res.status(200).json(new ApiResponse(200, { id: goal.id }, "Goal deleted"));
});
