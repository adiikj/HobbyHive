import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { notifyNewPost } from "../services/notification.service.js";
import { analyzePostInBackground } from "../services/ml.service.js";
import { weekStart, weeklyStreaks } from "./journey.controller.js";
import { getViewerState, postSelect, toPostResponse } from "./post.controller.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 5000;
const MAX_CAPTION = 300;

type HobbyRef = { id: string; name: string; slug: string; icon: string | null };

export type PersonalBest =
  | { kind: "week_minutes"; value: number; previous: number }
  | { kind: "longest_session"; value: number; previous: number; focus: string }
  | { kind: "streak"; value: number; previous: number };

export interface HiveWeek {
  hobby: HobbyRef;
  sessions: number;
  minutes: number;
  /** What they practised most in this hive this week. */
  topFocus: string | null;
  skillsDone: string[];
  goalsAchieved: string[];
}

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Personal bests set in the week starting `start`, compared with every week before it. Only counts as a best if
 * there's a history to beat (a first-ever week isn't a "best", it's a start).
 */
export const findPersonalBests = (
  sessions: { startedAt: Date; durationMin: number; focus: string }[],
  start: number,
  streak: { current: number; best: number; bestBefore: number }
): PersonalBest[] => {
  const bests: PersonalBest[] = [];
  const before = sessions.filter((s) => s.startedAt.getTime() < start);
  const during = sessions.filter((s) => s.startedAt.getTime() >= start && s.startedAt.getTime() < start + WEEK_MS);
  if (!during.length || !before.length) return bests;

  const perWeek = new Map<number, number>();
  for (const s of before) perWeek.set(weekStart(s.startedAt), (perWeek.get(weekStart(s.startedAt)) ?? 0) + s.durationMin);
  const bestWeekBefore = Math.max(0, ...perWeek.values());
  const thisWeek = during.reduce((sum, s) => sum + s.durationMin, 0);
  if (thisWeek > bestWeekBefore) bests.push({ kind: "week_minutes", value: thisWeek, previous: bestWeekBefore });

  const longestBefore = Math.max(...before.map((s) => s.durationMin));
  const longest = during.reduce((a, b) => (b.durationMin > a.durationMin ? b : a));
  if (longest.durationMin > longestBefore) {
    bests.push({ kind: "longest_session", value: longest.durationMin, previous: longestBefore, focus: longest.focus });
  }

  if (streak.current > 1 && streak.current > streak.bestBefore) bests.push({ kind: "streak", value: streak.current, previous: streak.bestBefore });
  return bests;
};

/** The one-post summary of a week in one hive, for sharing. Numbers only, nothing private. */
export const describeHiveWeek = (week: HiveWeek, bests: PersonalBest[]) => {
  const lines = [`My week in ${week.hobby.name}: ${week.sessions} ${week.sessions === 1 ? "session" : "sessions"}, ${formatMinutes(week.minutes)} of practice.`];
  if (week.topFocus) lines.push(`Mostly working on ${week.topFocus}.`);
  if (week.skillsDone.length) lines.push(`Finished: ${week.skillsDone.join(", ")} ✅`);
  if (week.goalsAchieved.length) lines.push(`Goal reached: ${week.goalsAchieved.join(", ")} 🎯`);
  const best = bests.find((b) => b.kind === "week_minutes");
  if (best) lines.push("New personal best for practice in a week 🎉");
  return lines.join("\n");
};

/** `?week=<any date in it>` → that week's Monday (UTC); defaults to this week. */
const parseWeek = (raw: unknown, now = new Date()) => {
  if (raw === undefined || raw === null || raw === "") return weekStart(now);
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "Invalid week");
  if (date.getTime() > now.getTime()) throw new ApiError(400, "That week hasn't happened yet");
  return weekStart(date);
};

const buildRecap = async (userId: string, start: number) => {
  const end = start + WEEK_MS;
  const inWeek = { gte: new Date(start), lt: new Date(end) };
  const hobbySelect = { select: { id: true, name: true, slug: true, icon: true } } as const;

  const [sessions, posts, skillsDone, goalsAchieved, feedbackGiven, feedbackHelpful] = await Promise.all([
    prisma.practiceSession.findMany({
      where: { userId, startedAt: { lt: new Date(end) } },
      orderBy: { startedAt: "asc" },
      take: MAX_SESSIONS,
      select: { startedAt: true, durationMin: true, focus: true, hobby: hobbySelect },
    }),
    prisma.post.findMany({ where: { authorId: userId, createdAt: { lt: new Date(end) } }, select: { createdAt: true, hobbyId: true } }),
    prisma.userSkill.findMany({
      where: { userId, status: "DONE", completedAt: inWeek },
      select: { skill: { select: { name: true, hobbyId: true } } },
    }),
    prisma.goal.findMany({ where: { userId, status: "ACHIEVED", achievedAt: inWeek }, select: { title: true, hobbyId: true } }),
    prisma.feedback.count({ where: { authorId: userId, createdAt: inWeek } }),
    prisma.feedback.count({ where: { authorId: userId, helpfulAt: inWeek } }),
  ]);

  const during = sessions.filter((s) => s.startedAt.getTime() >= start);
  const postsDuring = posts.filter((p) => p.createdAt.getTime() >= start);

  // Per hive: practice, most-practised focus, skills finished and goals reached
  const hives = new Map<string, HiveWeek & { focusMinutes: Map<string, number> }>();
  const hiveFor = (hobby: HobbyRef) => {
    let h = hives.get(hobby.id);
    if (!h) {
      h = { hobby, sessions: 0, minutes: 0, topFocus: null, skillsDone: [], goalsAchieved: [], focusMinutes: new Map() };
      hives.set(hobby.id, h);
    }
    return h;
  };
  for (const s of during) {
    const h = hiveFor(s.hobby);
    h.sessions++;
    h.minutes += s.durationMin;
    h.focusMinutes.set(s.focus, (h.focusMinutes.get(s.focus) ?? 0) + s.durationMin);
  }
  const hobbiesById = new Map(sessions.map((s) => [s.hobby.id, s.hobby]));
  const missing = [...skillsDone.map((s) => s.skill.hobbyId), ...goalsAchieved.map((g) => g.hobbyId)].filter((id) => !hobbiesById.has(id));
  if (missing.length) {
    for (const h of await prisma.hobby.findMany({ where: { id: { in: missing } }, ...hobbySelect })) hobbiesById.set(h.id, h);
  }
  for (const s of skillsDone) {
    const hobby = hobbiesById.get(s.skill.hobbyId);
    if (hobby) hiveFor(hobby).skillsDone.push(s.skill.name);
  }
  for (const g of goalsAchieved) {
    const hobby = hobbiesById.get(g.hobbyId);
    if (hobby) hiveFor(hobby).goalsAchieved.push(g.title);
  }

  const perHive: HiveWeek[] = [...hives.values()]
    .map(({ focusMinutes, ...h }) => ({
      ...h,
      topFocus: [...focusMinutes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  // Streak as of the end of this week, and the best one before it
  const practice = sessions.map((s) => ({ date: s.startedAt, minutes: s.durationMin }));
  const postDates = posts.map((p) => p.createdAt);
  const asOf = new Date(end - 1);
  const streakNow = weeklyStreaks(postDates, asOf, practice);
  const streakBefore = weeklyStreaks(
    postDates.filter((d) => d.getTime() < start),
    new Date(start - 1),
    practice.filter((p) => p.date.getTime() < start)
  );

  const minutes = during.reduce((sum, s) => sum + s.durationMin, 0);
  const previousMinutes = sessions
    .filter((s) => s.startedAt.getTime() >= start - WEEK_MS && s.startedAt.getTime() < start)
    .reduce((sum, s) => sum + s.durationMin, 0);
  const personalBests = findPersonalBests(sessions, start, { current: streakNow.current, best: streakNow.best, bestBefore: streakBefore.best });

  return {
    weekStart: new Date(start),
    weekEnd: new Date(end),
    isCurrentWeek: start === weekStart(new Date()),
    totals: {
      sessions: during.length,
      minutes,
      activeDays: new Set(during.map((s) => s.startedAt.toISOString().slice(0, 10))).size,
      posts: postsDuring.length,
    },
    previousMinutes,
    perHive,
    feedback: { given: feedbackGiven, markedHelpful: feedbackHelpful },
    streak: streakNow.current,
    personalBests,
    hasActivity: during.length > 0 || postsDuring.length > 0 || skillsDone.length > 0 || goalsAchieved.length > 0 || feedbackGiven > 0,
  };
};

// Your week in review: practice, skills, goals, feedback and personal bests (`?week=<date>`, default this week)
export const getRecap = asyncHandler(async (req: Request, res: Response) => {
  const recap = await buildRecap(req.user!.id, parseWeek(req.query.week));
  res.status(200).json(new ApiResponse(200, recap));
});

// Share one hive's part of a recap to that hive, as a post (keeps hives on-topic)
export const shareRecap = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { hobbyId } = req.body;
  if (!hobbyId || typeof hobbyId !== "string") throw new ApiError(400, "Pick a hive to share to");
  const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
  if (caption.length > MAX_CAPTION) throw new ApiError(400, `Captions can be at most ${MAX_CAPTION} characters`);

  const recap = await buildRecap(userId, parseWeek(req.body.week));
  const week = recap.perHive.find((h) => h.hobby.id === hobbyId);
  if (!week || week.sessions === 0) throw new ApiError(400, "No practice in that hive this week to share");
  const membership = await prisma.userHobby.findFirst({ where: { userId, hobbyId }, select: { id: true } });
  if (!membership) throw new ApiError(403, "Join this hive to post in it");

  const summary = describeHiveWeek(week, recap.personalBests);
  const post = await prisma.post.create({
    data: { content: caption ? `${caption}\n\n${summary}` : summary, hobbyId, authorId: userId },
    select: postSelect,
  });
  await notifyNewPost(hobbyId, userId, post.id);
  analyzePostInBackground({ id: post.id, content: post.content, hobbySlug: post.hobby.slug });

  const viewer = await getViewerState(userId, [post]);
  res.status(201).json(new ApiResponse(201, toPostResponse(post, viewer), "Shared to your hive"));
});
