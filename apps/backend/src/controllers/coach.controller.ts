import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { askBea } from "../services/ml.service.js";
import { ASSISTANT_NAME, withinAskRateLimit } from "./ask.controller.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 28;
const NEGLECTED_DAYS = 14;
const MAX_FOCUS = 2;
const TIPS_PER_SKILL = 2;
// Ask Bea's own cut-off (0.54) is tuned to answer questions; a coaching tip should clearly be about the skill.
// On the demo hive, on-topic tips score 0.60+ and share words with the skill; unrelated ones cluster ~0.55.
export const MIN_TIP_SCORE = 0.6;

export interface CoachSkill {
  id: string;
  name: string;
  description: string;
  tier: number;
  parentId: string | null;
  membersDone: number;
  status: "LEARNING" | "DONE" | null;
  startedAt: Date | null;
}

export interface CoachSession {
  startedAt: Date;
  durationMin: number;
  feel: string | null;
  skillId: string | null;
}

export interface CoachGoal {
  title: string;
  skillId: string | null;
  targetDate: Date | null;
}

export type FocusKind = "goal" | "neglected" | "rough" | "learning" | "next";

export interface Focus {
  skill: Pick<CoachSkill, "id" | "name" | "description" | "tier">;
  kind: FocusKind;
  reason: string;
  /** Your practice on this skill over the last 4 weeks. */
  minutes: number;
}

export interface WeekPlan {
  sessions: number;
  minutesEach: number;
  basis: string;
}

const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);
const days = (ms: number) => Math.round(ms / DAY_MS);
const formatMinutes = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** How much to practise this week: a little more than your recent average, split into a few sessions. */
export const planTime = (sessions: CoachSession[], now: Date): WeekPlan => {
  const recent = sessions.filter((s) => now.getTime() - s.startedAt.getTime() <= LOOKBACK_DAYS * DAY_MS);
  if (!recent.length) {
    return { sessions: 2, minutesEach: 20, basis: "A gentle start: two short sessions is enough to build the habit." };
  }
  const weeklyMinutes = recent.reduce((sum, s) => sum + s.durationMin, 0) / (LOOKBACK_DAYS / 7);
  const weeklySessions = recent.length / (LOOKBACK_DAYS / 7);
  const sessionCount = Math.min(5, Math.max(2, Math.round(weeklySessions) || 2));
  const target = Math.min(600, Math.max(30, weeklyMinutes * 1.1));
  return {
    sessions: sessionCount,
    minutesEach: roundTo(target / sessionCount, 5),
    basis: `You've averaged ${formatMinutes(Math.round(weeklyMinutes))} a week lately, so this nudges it up a little.`,
  };
};

/**
 * What to work on this week, in priority order: goals (soonest deadline first), skills you've let slide,
 * skills whose last session felt rough, other skills you're learning, then what's unlocked next in the tree.
 * Every reason is built from your own data, never invented.
 */
export const pickFocus = (skills: CoachSkill[], sessions: CoachSession[], goals: CoachGoal[], now: Date): Focus[] => {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const recent = sessions.filter((s) => now.getTime() - s.startedAt.getTime() <= LOOKBACK_DAYS * DAY_MS);
  const minutesOn = (id: string) => recent.filter((s) => s.skillId === id).reduce((sum, s) => sum + s.durationMin, 0);
  const lastOn = (id: string) =>
    sessions.filter((s) => s.skillId === id).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0] ?? null;

  const picked: Focus[] = [];
  const add = (skill: CoachSkill, kind: FocusKind, reason: string) => {
    if (picked.length >= MAX_FOCUS || picked.some((p) => p.skill.id === skill.id) || skill.status === "DONE") return;
    const { id, name, description, tier } = skill;
    picked.push({ skill: { id, name, description, tier }, kind, reason, minutes: minutesOn(id) });
  };

  const goalSkills = goals
    .filter((g) => g.skillId && byId.has(g.skillId))
    .sort((a, b) => (a.targetDate?.getTime() ?? Infinity) - (b.targetDate?.getTime() ?? Infinity));
  for (const g of goalSkills) {
    const skill = byId.get(g.skillId!)!;
    const practised = minutesOn(skill.id);
    const soFar = practised ? `${formatMinutes(practised)} on it in the last 4 weeks.` : "You haven't logged practice on it yet.";
    if (g.targetDate) {
      const left = days(g.targetDate.getTime() - now.getTime());
      const when =
        left < 0
          ? `Your goal date (${shortDate(g.targetDate)}) has passed; worth a push or a new date.`
          : `Your goal is ${shortDate(g.targetDate)}, ${left} ${left === 1 ? "day" : "days"} away.`;
      add(skill, "goal", `${when} ${soFar}`);
    } else {
      add(skill, "goal", `It's one of your goals. ${soFar}`);
    }
  }

  const learning = skills.filter((s) => s.status === "LEARNING");
  for (const skill of learning) {
    const last = lastOn(skill.id);
    const since = now.getTime() - (last?.startedAt ?? skill.startedAt ?? now).getTime();
    if (since >= NEGLECTED_DAYS * DAY_MS) {
      const reason = last
        ? `You last practised it ${days(since)} days ago. A short session gets it moving again.`
        : `You started learning it ${days(since)} days ago but haven't logged practice on it yet.`;
      add(skill, "neglected", reason);
    }
  }
  for (const skill of learning) {
    if (lastOn(skill.id)?.feel === "rough") add(skill, "rough", "Your last session on it felt rough. That's normal mid-learning; another go usually helps.");
  }
  for (const skill of learning) add(skill, "learning", `You're learning it${minutesOn(skill.id) ? `, ${formatMinutes(minutesOn(skill.id))} in the last 4 weeks` : ""}.`);

  // Next up: not started, and either a first step or built on something you've done
  const next = skills
    .filter((s) => !s.status && (!s.parentId || byId.get(s.parentId)?.status === "DONE"))
    .sort((a, b) => a.tier - b.tier || b.membersDone - a.membersDone);
  for (const skill of next) {
    const parent = skill.parentId ? byId.get(skill.parentId) : null;
    const others = skill.membersDone ? ` ${skill.membersDone} ${skill.membersDone === 1 ? "member has" : "members have"} learned it.` : "";
    add(skill, "next", `${parent ? `Next up after ${parent.name}.` : "A good first step."}${others}`);
  }
  return picked;
};

// "What should I practise this week?": a plan from your own practice, goals and skills in a hive, plus what
// worked for others there (cited posts from the same retrieval Ask Bea uses)
export const coachWeek = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const slug = typeof req.body?.hobbySlug === "string" ? req.body.hobbySlug : "";
  const hobby = slug ? await prisma.hobby.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } }) : null;
  if (!hobby) throw new ApiError(404, "Hobby not found");
  const membership = await prisma.userHobby.findFirst({ where: { userId, hobbyId: hobby.id }, select: { id: true } });
  if (!membership) throw new ApiError(403, `Join ${hobby.name} and ${ASSISTANT_NAME} can plan your practice`);
  if (!withinAskRateLimit(userId)) {
    throw new ApiError(429, `${ASSISTANT_NAME} needs a breather. You've asked a lot this hour, so try again a bit later.`);
  }

  const now = new Date();
  const [skillRows, mine, doneCounts, sessions, goals] = await Promise.all([
    prisma.skill.findMany({
      where: { hobbyId: hobby.id },
      select: { id: true, name: true, description: true, tier: true, parentId: true },
    }),
    prisma.userSkill.findMany({ where: { userId, skill: { hobbyId: hobby.id } }, select: { skillId: true, status: true, startedAt: true } }),
    prisma.userSkill.groupBy({ by: ["skillId"], where: { status: "DONE", skill: { hobbyId: hobby.id } }, _count: { _all: true } }),
    prisma.practiceSession.findMany({
      where: { userId, hobbyId: hobby.id },
      orderBy: { startedAt: "desc" },
      take: 300,
      select: { startedAt: true, durationMin: true, feel: true, skillId: true, note: true },
    }),
    prisma.goal.findMany({ where: { userId, hobbyId: hobby.id, status: "ACTIVE" }, select: { title: true, skillId: true, targetDate: true } }),
  ]);

  const mineById = new Map(mine.map((m) => [m.skillId, m]));
  const done = new Map(doneCounts.map((d) => [d.skillId, d._count._all]));
  const skills: CoachSkill[] = skillRows.map((s) => ({
    ...s,
    membersDone: done.get(s.id) ?? 0,
    status: mineById.get(s.id)?.status ?? null,
    startedAt: mineById.get(s.id)?.startedAt ?? null,
  }));

  const plan = planTime(sessions, now);
  const focus = pickFocus(skills, sessions, goals, now);

  // For each focus skill: your own last note on it (private, only ever shown to you) and what worked for others
  let mlAvailable = true;
  const detailed = await Promise.all(
    focus.map(async (f) => {
      const lastNote = sessions.find((s) => s.skillId === f.skill.id && s.note)?.note ?? null;
      const result = await askBea(`${f.skill.name}: ${f.skill.description}`, hobby.slug);
      if (!result) mlAvailable = false;
      const candidates = (result?.trace as { candidates?: { text: string; meaning_score: number }[] } | undefined)?.candidates ?? [];
      const scores = new Map(candidates.map((c) => [c.text, c.meaning_score]));
      const relevant = (result?.evidence ?? []).filter((e) => (scores.get(e.text) ?? 0) >= MIN_TIP_SCORE);
      const tips = relevant.slice(0, TIPS_PER_SKILL).map((e) => ({
        postId: e.post_id,
        authorName: e.author_name,
        authorUsername: e.author_username,
        text: e.text,
      }));
      return { ...f, lastNote, tips };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      assistant: ASSISTANT_NAME,
      hive: hobby,
      plan,
      focus: detailed,
      mlAvailable,
      hasSkillMap: skills.length > 0,
    })
  );
});
