import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const notificationSelect = {
  id: true,
  type: true,
  isRead: true,
  createdAt: true,
  actor: { select: { id: true, name: true, username: true, avatarUrl: true } },
  post: {
    select: { id: true, content: true, hobby: { select: { id: true, name: true, slug: true, icon: true } } },
  },
};

// Recent notifications, newest first, cursor-paginated
export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limitParam = Number(req.query.limit);
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 50 ? limitParam : 20;

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: notificationSelect,
  });

  const hasMore = notifications.length > limit;
  const page = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  res.status(200).json(new ApiResponse(200, { notifications: page, nextCursor }));
});

// For the bell badge — meant to be polled
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
  res.status(200).json(new ApiResponse(200, { count }));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.user!.id) {
    throw new ApiError(404, "Notification not found");
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });

  res.status(200).json(new ApiResponse(200, { id, isRead: true }));
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});
