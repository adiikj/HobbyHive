import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { getViewerState, postSelect, toPostResponse } from "./post.controller.js";

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 280;
const MAX_TIMELINE_ENTRIES = 200;

const logSelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  hobby: { select: { id: true, name: true, slug: true, icon: true } },
  user: { select: { id: true, name: true, username: true, avatarUrl: true } },
  _count: { select: { entries: true } },
  // Newest entry, for "last updated"
  entries: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
} satisfies Prisma.ProgressLogSelect;

type RawLog = Prisma.ProgressLogGetPayload<{ select: typeof logSelect }>;

const toLogSummary = ({ _count, entries, ...log }: RawLog, coverImageUrl: string | null = null) => ({
  ...log,
  entryCount: _count.entries,
  lastEntryAt: entries[0]?.createdAt ?? null,
  coverImageUrl,
});

const parseTitle = (raw: unknown) => {
  const title = typeof raw === "string" ? raw.trim() : "";
  if (!title) throw new ApiError(400, "Give your progress log a title");
  if (title.length > MAX_TITLE) throw new ApiError(400, `Titles can be at most ${MAX_TITLE} characters`);
  return title;
};

const parseDescription = (raw: unknown) => {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") throw new ApiError(400, "Invalid description");
  const description = raw.trim();
  if (description.length > MAX_DESCRIPTION) throw new ApiError(400, `Descriptions can be at most ${MAX_DESCRIPTION} characters`);
  return description || null;
};

const findOwnLog = async (userId: string, logId: string) => {
  const log = await prisma.progressLog.findUnique({ where: { id: logId }, select: { id: true, userId: true } });
  if (!log || log.userId !== userId) {
    throw new ApiError(404, "Progress log not found");
  }
  return log;
};

// A user's progress logs, newest activity first; `?hobby=<id>` narrows to one hive (for the composer)
export const listUserProgressLogs = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { username: String(req.params.username) }, select: { id: true } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const logs = await prisma.progressLog.findMany({
    where: { userId: user.id, ...(typeof req.query.hobby === "string" && req.query.hobby ? { hobbyId: req.query.hobby } : {}) },
    orderBy: { createdAt: "desc" },
    select: logSelect,
  });

  const covers = await Promise.all(
    logs.map((log) =>
      prisma.post.findFirst({
        where: { progressLogId: log.id, imageUrl: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { imageUrl: true },
      })
    )
  );

  const summaries = logs.map((log, i) => toLogSummary(log, covers[i]?.imageUrl ?? null));
  summaries.sort((a, b) => (b.lastEntryAt?.getTime() ?? b.createdAt.getTime()) - (a.lastEntryAt?.getTime() ?? a.createdAt.getTime()));

  res.status(200).json(new ApiResponse(200, summaries));
});

export const createProgressLog = asyncHandler(async (req: Request, res: Response) => {
  const title = parseTitle(req.body?.title);
  const description = parseDescription(req.body?.description);
  const hobbyId = typeof req.body?.hobbyId === "string" ? req.body.hobbyId : "";

  const hobby = await prisma.hobby.findUnique({ where: { id: hobbyId }, select: { id: true } });
  if (!hobby) {
    throw new ApiError(400, "Pick which hive this progress log is for");
  }

  const log = await prisma.progressLog.create({
    data: { userId: req.user!.id, hobbyId: hobby.id, title, description },
    select: logSelect,
  });
  res.status(201).json(new ApiResponse(201, toLogSummary(log), "Progress log created"));
});

// One log as a timeline: every entry oldest → newest
export const getProgressLog = asyncHandler(async (req: Request, res: Response) => {
  const log = await prisma.progressLog.findUnique({ where: { id: String(req.params.logId) }, select: logSelect });
  if (!log) {
    throw new ApiError(404, "Progress log not found");
  }

  const entries = await prisma.post.findMany({
    where: { progressLogId: log.id },
    orderBy: { createdAt: "asc" },
    take: MAX_TIMELINE_ENTRIES,
    select: postSelect,
  });
  const viewer = await getViewerState(req.user!.id, entries);

  res.status(200).json(
    new ApiResponse(200, {
      ...toLogSummary(log),
      entries: entries.map((p) => toPostResponse(p, viewer)),
    })
  );
});

export const updateProgressLog = asyncHandler(async (req: Request, res: Response) => {
  const log = await findOwnLog(req.user!.id, String(req.params.logId));
  const data: { title?: string; description?: string | null } = {};
  if (req.body?.title !== undefined) data.title = parseTitle(req.body.title);
  if (req.body?.description !== undefined) data.description = parseDescription(req.body.description);

  const updated = await prisma.progressLog.update({ where: { id: log.id }, data, select: logSelect });
  res.status(200).json(new ApiResponse(200, toLogSummary(updated), "Progress log updated"));
});

// Deleting a log keeps its posts — they just stop being part of a series
export const deleteProgressLog = asyncHandler(async (req: Request, res: Response) => {
  const log = await findOwnLog(req.user!.id, String(req.params.logId));
  await prisma.progressLog.delete({ where: { id: log.id } });
  res.status(200).json(new ApiResponse(200, {}, "Progress log deleted"));
});
