import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { notifyFeedback, notifyFeedbackHelpful } from "../services/notification.service.js";
import { getViewerState, parseFeedbackAsk, postSelect, toPostResponse } from "./post.controller.js";

const MIN_TEXT = 3;
const MAX_TEXT = 400;
const MAX_AT = 30;
const MENTORS_SHOWN = 5;
const REQUESTS_SHOWN = 30;

const authorSelect = { select: { id: true, name: true, username: true, avatarUrl: true } } as const;

export type MentorLevel = "Helper" | "Mentor" | "Guide";

/** Reputation in a hive comes only from feedback the asker marked helpful. */
export const mentorLevel = (helpful: number): MentorLevel | null =>
  helpful >= 10 ? "Guide" : helpful >= 3 ? "Mentor" : helpful >= 1 ? "Helper" : null;

/** Helpful-feedback counts per user in one hive. */
const helpfulCounts = async (hobbyId: string, userIds: string[]) => {
  if (!userIds.length) return new Map<string, number>();
  const rows = await prisma.feedback.groupBy({
    by: ["authorId"],
    where: { authorId: { in: userIds }, helpfulAt: { not: null }, post: { hobbyId } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.authorId, r._count._all]));
};

const parseText = (raw: unknown, label: string) => {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (text.length < MIN_TEXT) throw new ApiError(400, `Add a few words for "${label}"`);
  if (text.length > MAX_TEXT) throw new ApiError(400, `Keep "${label}" under ${MAX_TEXT} characters`);
  return text;
};

const parseAt = (raw: unknown) => {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") throw new ApiError(400, "Invalid timestamp");
  const at = raw.trim();
  if (at.length > MAX_AT) throw new ApiError(400, `Keep "where to look" under ${MAX_AT} characters`);
  return at || null;
};

// All feedback on a post, helpful first, with each giver's mentor level in the post's hive
export const listFeedback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const post = await prisma.post.findUnique({
    where: { id: String(req.params.postId) },
    select: { id: true, authorId: true, hobbyId: true, feedbackAsk: true },
  });
  if (!post) throw new ApiError(404, "Post not found");

  const feedback = await prisma.feedback.findMany({
    where: { postId: post.id },
    orderBy: [{ helpfulAt: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
    select: { id: true, working: true, tryNext: true, at: true, helpfulAt: true, createdAt: true, author: authorSelect },
  });
  const counts = await helpfulCounts(post.hobbyId, [...new Set(feedback.map((f) => f.author.id))]);

  res.status(200).json(
    new ApiResponse(200, {
      ask: post.feedbackAsk,
      canGive: Boolean(post.feedbackAsk) && post.authorId !== userId && !feedback.some((f) => f.author.id === userId),
      canMarkHelpful: post.authorId === userId,
      feedback: feedback.map((f) => ({
        ...f,
        isOwn: f.author.id === userId,
        mentorLevel: mentorLevel(counts.get(f.author.id) ?? 0),
      })),
    })
  );
});

// Give structured feedback on a post that asked for it (once per person)
export const giveFeedback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const post = await prisma.post.findUnique({
    where: { id: String(req.params.postId) },
    select: { id: true, authorId: true, feedbackAsk: true },
  });
  if (!post) throw new ApiError(404, "Post not found");
  if (!post.feedbackAsk) throw new ApiError(400, "This post isn't asking for feedback");
  if (post.authorId === userId) throw new ApiError(400, "You can't give feedback on your own post");

  const data = {
    postId: post.id,
    authorId: userId,
    working: parseText(req.body.working, "What's working"),
    tryNext: parseText(req.body.tryNext, "One thing to try"),
    at: parseAt(req.body.at),
  };

  const existing = await prisma.feedback.findUnique({ where: { postId_authorId: { postId: post.id, authorId: userId } }, select: { id: true } });
  if (existing) throw new ApiError(409, "You've already given feedback on this post");

  const feedback = await prisma.feedback.create({
    data,
    select: { id: true, working: true, tryNext: true, at: true, helpfulAt: true, createdAt: true, author: authorSelect },
  });
  await notifyFeedback(post.authorId, userId, post.id);

  res.status(201).json(new ApiResponse(201, { ...feedback, isOwn: true, mentorLevel: null }, "Feedback sent"));
});

// The person who asked marks feedback helpful (or un-marks it). This is what builds mentor reputation.
export const markFeedbackHelpful = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const helpful = req.body.helpful !== false;
  const feedback = await prisma.feedback.findUnique({
    where: { id: String(req.params.feedbackId) },
    select: { id: true, authorId: true, helpfulAt: true, post: { select: { id: true, authorId: true } } },
  });
  if (!feedback) throw new ApiError(404, "Feedback not found");
  if (feedback.post.authorId !== userId) throw new ApiError(403, "Only the person who asked can mark feedback helpful");

  const updated = await prisma.feedback.update({
    where: { id: feedback.id },
    data: { helpfulAt: helpful ? (feedback.helpfulAt ?? new Date()) : null },
    select: { id: true, helpfulAt: true },
  });
  if (helpful && !feedback.helpfulAt) await notifyFeedbackHelpful(feedback.authorId, userId, feedback.post.id);

  res.status(200).json(new ApiResponse(200, updated));
});

export const deleteFeedback = asyncHandler(async (req: Request, res: Response) => {
  const feedback = await prisma.feedback.findUnique({ where: { id: String(req.params.feedbackId) }, select: { id: true, authorId: true } });
  if (!feedback || feedback.authorId !== req.user!.id) throw new ApiError(404, "Feedback not found");
  await prisma.feedback.delete({ where: { id: feedback.id } });
  res.status(200).json(new ApiResponse(200, { id: feedback.id }, "Feedback deleted"));
});

// Open or close a post's feedback request (author only)
export const setFeedbackAsk = asyncHandler(async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: String(req.params.postId) }, select: { id: true, authorId: true } });
  if (!post || post.authorId !== req.user!.id) throw new ApiError(404, "Post not found");
  const feedbackAsk = parseFeedbackAsk(req.body.ask);
  const updated = await prisma.post.update({ where: { id: post.id }, data: { feedbackAsk }, select: { id: true, feedbackAsk: true } });
  res.status(200).json(new ApiResponse(200, updated));
});

// A hive's feedback requests, newest first; `?open=1` for ones nobody has answered yet
export const listFeedbackRequests = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true } });
  if (!hobby) throw new ApiError(404, "Hobby not found");
  const onlyOpen = req.query.open === "1" || req.query.open === "true";

  const posts = await prisma.post.findMany({
    where: { hobbyId: hobby.id, feedbackAsk: { not: null }, ...(onlyOpen ? { feedback: { none: {} } } : {}) },
    orderBy: { createdAt: "desc" },
    take: REQUESTS_SHOWN,
    select: postSelect,
  });
  const helpful = await prisma.feedback.groupBy({
    by: ["postId"],
    where: { postId: { in: posts.map((p) => p.id) }, helpfulAt: { not: null } },
    _count: { _all: true },
  });
  const resolved = new Set(helpful.map((h) => h.postId));
  const viewer = await getViewerState(userId, posts);

  res.status(200).json(new ApiResponse(200, posts.map((p) => ({ ...toPostResponse(p, viewer), hasHelpfulFeedback: resolved.has(p.id) }))));
});

// The hive's most helpful members, by feedback marked helpful
export const listHiveMentors = asyncHandler(async (req: Request, res: Response) => {
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true } });
  if (!hobby) throw new ApiError(404, "Hobby not found");

  const rows = await prisma.feedback.groupBy({
    by: ["authorId"],
    where: { helpfulAt: { not: null }, post: { hobbyId: hobby.id } },
    _count: { _all: true },
    orderBy: { _count: { authorId: "desc" } },
    take: MENTORS_SHOWN,
  });
  const users = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.authorId) } }, select: authorSelect.select });
  const byId = new Map(users.map((u) => [u.id, u]));

  res.status(200).json(
    new ApiResponse(
      200,
      rows
        .filter((r) => byId.has(r.authorId))
        .map((r) => ({ user: byId.get(r.authorId)!, helpful: r._count._all, level: mentorLevel(r._count._all) }))
    )
  );
});

// Someone's reputation per hive (public): helpful feedback given and the level it earns
export const getUserReputation = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { username: String(req.params.username) }, select: { id: true } });
  if (!user) throw new ApiError(404, "User not found");

  const helpful = await prisma.feedback.findMany({
    where: { authorId: user.id, helpfulAt: { not: null } },
    select: { post: { select: { hobbyId: true } } },
  });
  const perHive = new Map<string, number>();
  for (const f of helpful) perHive.set(f.post.hobbyId, (perHive.get(f.post.hobbyId) ?? 0) + 1);

  const reputation = [...perHive.entries()].map(([hobbyId, count]) => ({ hobbyId, helpful: count, level: mentorLevel(count) }));
  res.status(200).json(new ApiResponse(200, reputation));
});
