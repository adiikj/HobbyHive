import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { askBea } from "../services/ml.service.js";
import { getViewerState, postSelect, toPostResponse } from "./post.controller.js";

export const ASSISTANT_NAME = "Bea";
const MIN_QUESTION = 3;
const MAX_QUESTION = 500;
const RATE_LIMIT = 20; // questions per user…
const RATE_WINDOW_MS = 60 * 60 * 1000; // …per hour — answers run a local model on the server's CPU

const recentAsks = new Map<string, number[]>();

function withinRateLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (recentAsks.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  const allowed = recent.length < RATE_LIMIT;
  if (allowed) recent.push(now);
  recentAsks.set(userId, recent);
  return allowed;
}

/** Shared with the practice coach, which runs the same local retrieval. */
export const withinAskRateLimit = withinRateLimit;

/** Test hook: forget rate-limit history. */
export const resetAskRateLimit = () => recentAsks.clear();

// Ask Bea: local retrieval-augmented answers from the hive's posts and comments (apps/ml /ask)
export const ask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (question.length < MIN_QUESTION || question.length > MAX_QUESTION) {
    throw new ApiError(400, `Ask a question between ${MIN_QUESTION} and ${MAX_QUESTION} characters`);
  }

  const slug = typeof req.body?.hobbySlug === "string" && req.body.hobbySlug ? req.body.hobbySlug : null;
  const hobby = slug ? await prisma.hobby.findUnique({ where: { slug }, select: { id: true } }) : null;
  if (slug && !hobby) {
    throw new ApiError(404, "Hobby not found");
  }
  if (!withinRateLimit(userId)) {
    throw new ApiError(429, `${ASSISTANT_NAME} needs a breather. You've asked a lot this hour, so try again a bit later.`);
  }

  const result = await askBea(question, slug);
  if (!result) {
    return res.status(200).json(new ApiResponse(200, { available: false, assistant: ASSISTANT_NAME }));
  }

  // Keep the answer so it can be rated (👍/👎) and answer quality tracked over time
  const candidates = (result.trace as { candidates?: { meaning_score?: number }[] }).candidates ?? [];
  const saved = await prisma.beaAnswer.create({
    data: {
      userId,
      hobbyId: hobby?.id ?? null,
      question,
      mode: result.mode,
      evidenceCount: result.evidence.length,
      topScore: typeof candidates[0]?.meaning_score === "number" ? candidates[0].meaning_score : null,
    },
    select: { id: true },
  });

  // Attach the full post to each piece of evidence (for source cards: likes, hive, link)
  const postIds = [...new Set(result.evidence.map((e) => e.post_id))];
  const posts = postIds.length ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: postSelect }) : [];
  const viewer = await getViewerState(userId, posts);
  const postById = new Map(posts.map((p) => [p.id, toPostResponse(p, viewer)]));

  res.status(200).json(
    new ApiResponse(200, {
      available: true,
      assistant: ASSISTANT_NAME,
      answerId: saved.id,
      mode: result.mode,
      answer: result.answer,
      evidence: result.evidence.map((e) => ({ ...e, post: postById.get(e.post_id) ?? null })),
      trace: result.trace,
    })
  );
});

// Rate one of your own Bea answers: { helpful: true | false }. Rating again replaces the earlier rating.
export const rateAnswer = asyncHandler(async (req: Request, res: Response) => {
  const helpful = req.body?.helpful;
  if (typeof helpful !== "boolean") throw new ApiError(400, "Send helpful: true or false");

  const answer = await prisma.beaAnswer.findUnique({ where: { id: String(req.params.answerId) }, select: { userId: true } });
  if (!answer || answer.userId !== req.user!.id) throw new ApiError(404, "Answer not found");

  const updated = await prisma.beaAnswer.update({
    where: { id: String(req.params.answerId) },
    data: { helpful, ratedAt: new Date() },
    select: { id: true, helpful: true },
  });
  res.status(200).json(new ApiResponse(200, updated, "Thanks for the feedback"));
});

// How Bea is doing: answers given, how often she declined, and the share rated helpful
export const answerStats = asyncHandler(async (_req: Request, res: Response) => {
  const [total, declined, helpful, unhelpful] = await Promise.all([
    prisma.beaAnswer.count(),
    prisma.beaAnswer.count({ where: { mode: "none" } }),
    prisma.beaAnswer.count({ where: { helpful: true } }),
    prisma.beaAnswer.count({ where: { helpful: false } }),
  ]);
  const rated = helpful + unhelpful;
  res.status(200).json(
    new ApiResponse(200, {
      answers: total,
      declined,
      rated,
      helpful,
      helpfulRate: rated ? Math.round((helpful / rated) * 1000) / 10 : null,
    })
  );
});
