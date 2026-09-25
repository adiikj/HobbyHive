import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS_SHOWN = 12;
const POST_MILESTONES = [10, 25, 50, 100, 250];
const MAX_POSTS = 1000;
const MAX_MILESTONES = 60;

type HobbyRef = { id: string; name: string; slug: string; icon: string | null };
type PostRef = { id: string; excerpt: string; image: string | null };

export type Milestone =
  | { type: "joined"; date: Date; hobby: HobbyRef }
  | { type: "first_post" | "first_photo"; date: Date; hobby: HobbyRef; post: PostRef }
  | { type: "challenge_entry"; date: Date; hobby: HobbyRef; post: PostRef; challengeTitle: string }
  | { type: "log_started"; date: Date; hobby: HobbyRef; logId: string; logTitle: string }
  | { type: "post_count"; date: Date; hobby: HobbyRef; post: PostRef; count: number };

/** Monday 00:00 UTC of the week `date` falls in. */
export const weekStart = (date: Date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.getTime();
};

/**
 * Weekly streaks: a week counts when it has at least one post. The current streak stays alive through
 * this week until it ends, so a streak doesn't read 0 on a Monday morning.
 */
export const weeklyStreaks = (postDates: Date[], now = new Date()) => {
  const active = new Set(postDates.map(weekStart));
  const thisWeek = weekStart(now);
  const activeThisWeek = active.has(thisWeek);

  let current = 0;
  for (let w = activeThisWeek ? thisWeek : thisWeek - WEEK_MS; active.has(w); w -= WEEK_MS) current++;

  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const w of [...active].sort((a, b) => a - b)) {
    run = previous !== null && w - previous === WEEK_MS ? run + 1 : 1;
    best = Math.max(best, run);
    previous = w;
  }

  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const start = thisWeek - (WEEKS_SHOWN - 1 - i) * WEEK_MS;
    return { start: new Date(start), posts: postDates.filter((d) => weekStart(d) === start).length };
  });

  return { current, best, activeThisWeek, weeks };
};

const excerpt = (text: string) => (text.length > 90 ? `${text.slice(0, 87).trimEnd()}…` : text);

// A user's journey — in one hive (`?hobby=<slug>`, for the dashboard) or across all of them (profile timeline)
export const getJourney = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { username: String(req.params.username) },
    select: { id: true, name: true, username: true, avatarUrl: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const slug = typeof req.query.hobby === "string" && req.query.hobby ? req.query.hobby : null;
  const hobby = slug ? await prisma.hobby.findUnique({ where: { slug }, select: { id: true, name: true, slug: true, icon: true } }) : null;
  if (slug && !hobby) throw new ApiError(404, "Hobby not found");
  const inHobby = hobby ? { hobbyId: hobby.id } : {};
  const hobbySelect = { select: { id: true, name: true, slug: true, icon: true } } as const;

  const [posts, memberships, logs, challenge] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: user.id, ...inHobby },
      orderBy: { createdAt: "asc" },
      take: MAX_POSTS,
      select: {
        id: true,
        content: true,
        createdAt: true,
        images: true,
        imageUrl: true,
        challengeId: true,
        challenge: { select: { title: true } },
        hobby: hobbySelect,
      },
    }),
    prisma.userHobby.findMany({ where: { userId: user.id, ...inHobby }, select: { createdAt: true, hobby: hobbySelect } }),
    prisma.progressLog.findMany({
      where: { userId: user.id, ...inHobby },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        hobby: hobbySelect,
        _count: { select: { entries: true } },
        entries: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
    }),
    hobby
      ? prisma.challenge.findFirst({
          where: { hobbyId: hobby.id, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
          orderBy: { endsAt: "asc" },
          select: { id: true, title: true, prompt: true, endsAt: true },
        })
      : null,
  ]);

  const photoOf = (p: (typeof posts)[number]) => p.images[0] ?? p.imageUrl ?? null;
  const ref = (p: (typeof posts)[number]): PostRef => ({ id: p.id, excerpt: excerpt(p.content), image: photoOf(p) });

  // Milestones, per hive
  const milestones: Milestone[] = memberships.map((m) => ({ type: "joined", date: m.createdAt, hobby: m.hobby }));
  const perHobby = new Map<string, { count: number; photo: boolean }>();
  for (const p of posts) {
    const seen = perHobby.get(p.hobby.id) ?? { count: 0, photo: false };
    seen.count++;
    if (seen.count === 1) milestones.push({ type: "first_post", date: p.createdAt, hobby: p.hobby, post: ref(p) });
    if (!seen.photo && photoOf(p)) {
      seen.photo = true;
      // A first post with a photo is already the "first post" milestone (it shows the photo)
      if (seen.count > 1) milestones.push({ type: "first_photo", date: p.createdAt, hobby: p.hobby, post: ref(p) });
    }
    if (POST_MILESTONES.includes(seen.count)) {
      milestones.push({ type: "post_count", date: p.createdAt, hobby: p.hobby, post: ref(p), count: seen.count });
    }
    if (p.challenge) {
      milestones.push({ type: "challenge_entry", date: p.createdAt, hobby: p.hobby, post: ref(p), challengeTitle: p.challenge.title });
    }
    perHobby.set(p.hobby.id, seen);
  }
  for (const log of logs) {
    milestones.push({ type: "log_started", date: log.createdAt, hobby: log.hobby, logId: log.id, logTitle: log.title });
  }
  milestones.sort((a, b) => b.date.getTime() - a.date.getTime());

  const photos = posts.filter(photoOf);
  const first = photos[0];
  const latest = photos[photos.length - 1];

  res.status(200).json(
    new ApiResponse(200, {
      user,
      hobby,
      joinedAt: hobby ? (memberships[0]?.createdAt ?? null) : null,
      stats: {
        posts: posts.length,
        photos: photos.length,
        challengesEntered: new Set(posts.map((p) => p.challengeId).filter(Boolean)).size,
        logs: logs.length,
      },
      streak: weeklyStreaks(posts.map((p) => p.createdAt)),
      currentChallenge: challenge ? { ...challenge, entered: posts.some((p) => p.challengeId === challenge.id) } : null,
      logs: logs.slice(0, 3).map(({ _count, entries, ...log }) => ({
        ...log,
        entryCount: _count.entries,
        lastEntryAt: entries[0]?.createdAt ?? null,
      })),
      thenNow:
        first && latest && first.id !== latest.id
          ? {
              first: { postId: first.id, image: photoOf(first), date: first.createdAt },
              latest: { postId: latest.id, image: photoOf(latest), date: latest.createdAt },
            }
          : null,
      milestones: milestones.slice(0, MAX_MILESTONES),
    })
  );
});
