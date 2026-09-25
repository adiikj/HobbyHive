import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { buildFeedPage, getViewerState, isModerator, parsePagination, postSelect, toPostResponse } from "./post.controller.js";

const DEFAULT_CHALLENGE_DAYS = 7;
const MAX_CHALLENGE_DAYS = 30;
const TOP_ENTRIES_LIMIT = 20;

const challengeSelect = {
  id: true,
  title: true,
  prompt: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  hobby: { select: { id: true, name: true, slug: true, icon: true } },
  creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
  _count: { select: { entries: true } },
} satisfies Prisma.ChallengeSelect;

type RawChallenge = Prisma.ChallengeGetPayload<{ select: typeof challengeSelect }>;

const toChallengeResponse = ({ _count, ...challenge }: RawChallenge) => {
  const now = new Date();
  return {
    ...challenge,
    entryCount: _count.entries,
    isActive: challenge.startsAt <= now && challenge.endsAt > now,
  };
};

// A hive's challenges: the one running now (if any) plus recent past ones
export const listHobbyChallenges = asyncHandler(async (req: Request, res: Response) => {
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }

  const now = new Date();
  const [active, past] = await Promise.all([
    prisma.challenge.findFirst({
      where: { hobbyId: hobby.id, startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: { startsAt: "desc" },
      select: challengeSelect,
    }),
    prisma.challenge.findMany({
      where: { hobbyId: hobby.id, endsAt: { lte: now } },
      orderBy: { endsAt: "desc" },
      take: 10,
      select: challengeSelect,
    }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      active: active ? toChallengeResponse(active) : null,
      past: past.map(toChallengeResponse),
    })
  );
});

// Start a new challenge in a hive — moderators only, one running at a time
export const createChallenge = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }
  if (!(await isModerator(userId, hobby.id))) {
    throw new ApiError(403, "Only hive moderators can start challenges");
  }

  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!title || !prompt) {
    throw new ApiError(400, "A challenge needs a title and a prompt");
  }
  const days = req.body?.days === undefined ? DEFAULT_CHALLENGE_DAYS : Number(req.body.days);
  if (!Number.isInteger(days) || days < 1 || days > MAX_CHALLENGE_DAYS) {
    throw new ApiError(400, `Challenges run for 1–${MAX_CHALLENGE_DAYS} days`);
  }

  const now = new Date();
  const running = await prisma.challenge.findFirst({
    where: { hobbyId: hobby.id, startsAt: { lte: now }, endsAt: { gt: now } },
    select: { id: true },
  });
  if (running) {
    throw new ApiError(409, "This hive already has a challenge running");
  }

  const challenge = await prisma.challenge.create({
    data: {
      hobbyId: hobby.id,
      creatorId: userId,
      title,
      prompt,
      startsAt: now,
      endsAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
    },
    select: challengeSelect,
  });

  res.status(201).json(new ApiResponse(201, toChallengeResponse(challenge), "Challenge started"));
});

export const getChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challenge = await prisma.challenge.findUnique({ where: { id: String(req.params.challengeId) }, select: challengeSelect });
  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }
  res.status(200).json(new ApiResponse(200, toChallengeResponse(challenge)));
});

// Entries: `?sort=top` is the highlights (most-liked, capped), otherwise newest first with pagination
export const getChallengeEntries = asyncHandler(async (req: Request, res: Response) => {
  const challengeId = String(req.params.challengeId);
  const exists = await prisma.challenge.findUnique({ where: { id: challengeId }, select: { id: true } });
  if (!exists) {
    throw new ApiError(404, "Challenge not found");
  }

  if (req.query.sort === "top") {
    const posts = await prisma.post.findMany({
      where: { challengeId },
      orderBy: [{ likes: { _count: "desc" } }, { createdAt: "asc" }],
      take: TOP_ENTRIES_LIMIT,
      select: postSelect,
    });
    const viewer = await getViewerState(req.user!.id, posts);
    return res.status(200).json(new ApiResponse(200, { posts: posts.map((p) => toPostResponse(p, viewer)), nextCursor: null }));
  }

  const { cursor, limit } = parsePagination(req);
  const result = await buildFeedPage({ challengeId }, cursor, limit, req.user!.id);
  res.status(200).json(new ApiResponse(200, result));
});
