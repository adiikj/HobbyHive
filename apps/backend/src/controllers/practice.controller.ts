import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { notifyNewPost } from "../services/notification.service.js";
import { analyzePostInBackground } from "../services/ml.service.js";
import { MAX_POST_IMAGES, getViewerState, postSelect, toPostResponse } from "./post.controller.js";

const MAX_MINUTES = 600;
const MAX_FOCUS = 60;
const MAX_NOTE = 500;
const MAX_CAPTION = 500;
const MAX_BACKDATE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
export const FEELS = ["rough", "okay", "great"] as const;

const sessionSelect = {
  id: true,
  startedAt: true,
  durationMin: true,
  focus: true,
  note: true,
  feel: true,
  postId: true,
  createdAt: true,
  hobby: { select: { id: true, name: true, slug: true, icon: true } },
  skill: { select: { id: true, name: true } },
} satisfies Prisma.PracticeSessionSelect;

const parseMinutes = (raw: unknown) => {
  const minutes = Number(raw);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_MINUTES) {
    throw new ApiError(400, `Practice time must be between 1 and ${MAX_MINUTES} minutes`);
  }
  return minutes;
};

const parseFocus = (raw: unknown) => {
  const focus = typeof raw === "string" ? raw.trim() : "";
  if (!focus) throw new ApiError(400, "Say what you worked on");
  if (focus.length > MAX_FOCUS) throw new ApiError(400, `Keep it under ${MAX_FOCUS} characters`);
  return focus;
};

const parseNote = (raw: unknown) => {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") throw new ApiError(400, "Invalid note");
  const note = raw.trim();
  if (note.length > MAX_NOTE) throw new ApiError(400, `Notes can be at most ${MAX_NOTE} characters`);
  return note || null;
};

const parseFeel = (raw: unknown) => {
  if (raw === undefined || raw === null || raw === "") return null;
  if (!FEELS.includes(raw as (typeof FEELS)[number])) throw new ApiError(400, "Feel must be rough, okay or great");
  return raw as string;
};

/** When the session started: given, or "just now minus its length". Can't be in the future or too far back. */
const parseStartedAt = (raw: unknown, minutes: number, now = new Date()) => {
  if (raw === undefined || raw === null || raw === "") return new Date(now.getTime() - minutes * 60_000);
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "Invalid start time");
  if (date.getTime() > now.getTime() + 60_000) throw new ApiError(400, "A practice session can't start in the future");
  if (now.getTime() - date.getTime() > MAX_BACKDATE_DAYS * DAY_MS) {
    throw new ApiError(400, `You can log sessions from the last ${MAX_BACKDATE_DAYS} days`);
  }
  return date;
};

const findOwnSession = async (userId: string, sessionId: string) => {
  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, hobbyId: true, focus: true, durationMin: true, feel: true, postId: true },
  });
  if (!session || session.userId !== userId) throw new ApiError(404, "Practice session not found");
  return session;
};

// Log a practice session in one of your hives
export const logPractice = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { hobbyId } = req.body;
  if (!hobbyId || typeof hobbyId !== "string") throw new ApiError(400, "Pick a hive for this session");

  const durationMin = parseMinutes(req.body.durationMin);
  const data = {
    userId,
    hobbyId,
    durationMin,
    focus: parseFocus(req.body.focus),
    note: parseNote(req.body.note),
    feel: parseFeel(req.body.feel),
    startedAt: parseStartedAt(req.body.startedAt, durationMin),
  };

  const membership = await prisma.userHobby.findFirst({ where: { userId, hobbyId }, select: { id: true } });
  if (!membership) throw new ApiError(403, "Join this hive to log practice in it");

  let skillId: string | null = null;
  if (req.body.skillId !== undefined && req.body.skillId !== null && req.body.skillId !== "") {
    const skill = await prisma.skill.findFirst({ where: { id: String(req.body.skillId), hobbyId }, select: { id: true } });
    if (!skill) throw new ApiError(400, "That skill isn't part of this hive");
    skillId = skill.id;
  }

  const session = await prisma.practiceSession.create({ data: { ...data, skillId }, select: sessionSelect });

  // Practising a skill means you're learning it (never downgrades one you've already done)
  if (skillId) {
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      update: {},
      create: { userId, skillId, status: "LEARNING" },
    });
  }
  res.status(201).json(new ApiResponse(201, session, "Practice logged"));
});

// Your own sessions, newest first; `?hobby=<slug>` for one hive. Notes are private, so this is only ever yours.
export const listMyPractice = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const slug = typeof req.query.hobby === "string" && req.query.hobby ? req.query.hobby : null;
  const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 200);

  const sessions = await prisma.practiceSession.findMany({
    where: { userId, ...(slug ? { hobby: { slug } } : {}) },
    orderBy: { startedAt: "desc" },
    take: limit,
    select: sessionSelect,
  });

  // What you usually work on, most recent first, for one-tap suggestions in the log form
  const recentFocus = [...new Set(sessions.map((s) => s.focus))].slice(0, 6);

  res.status(200).json(new ApiResponse(200, { sessions, recentFocus }));
});

export const deletePractice = asyncHandler(async (req: Request, res: Response) => {
  const session = await findOwnSession(req.user!.id, String(req.params.sessionId));
  await prisma.practiceSession.delete({ where: { id: session.id } });
  res.status(200).json(new ApiResponse(200, { id: session.id }, "Practice session deleted"));
});

/** "Practised turns for 25 min · felt great", used when someone shares a session without a caption. */
export const describeSession = ({ focus, durationMin, feel }: { focus: string; durationMin: number; feel: string | null }) => {
  const length = durationMin >= 60 ? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ""}` : `${durationMin} min`;
  return `Practised ${focus} for ${length}${feel ? ` · felt ${feel}` : ""}`;
};

// Share a session to its hive as a post (optional caption and photos). The note stays private.
export const sharePractice = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const session = await findOwnSession(userId, String(req.params.sessionId));
  if (session.postId) throw new ApiError(409, "This session is already shared");

  const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
  if (caption.length > MAX_CAPTION) throw new ApiError(400, `Captions can be at most ${MAX_CAPTION} characters`);
  const images: unknown = req.body.images ?? [];
  if (!Array.isArray(images) || images.length > MAX_POST_IMAGES || images.some((url) => typeof url !== "string" || !url)) {
    throw new ApiError(400, `A post can have up to ${MAX_POST_IMAGES} photos`);
  }

  const summary = describeSession(session);
  const content = caption ? `${caption}\n\n${summary}` : summary;

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: { content, hobbyId: session.hobbyId, authorId: userId, images, imageUrl: images[0] ?? null },
      select: postSelect,
    });
    await tx.practiceSession.update({ where: { id: session.id }, data: { postId: created.id } });
    return created;
  });

  await notifyNewPost(session.hobbyId, userId, post.id);
  analyzePostInBackground({ id: post.id, content: post.content, hobbySlug: post.hobby.slug });

  const viewer = await getViewerState(userId, [post]);
  res.status(201).json(new ApiResponse(201, toPostResponse(post, viewer), "Shared to your hive"));
});
