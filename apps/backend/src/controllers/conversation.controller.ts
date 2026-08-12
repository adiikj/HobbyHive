import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { getIO, userRoom } from "../socket.js";

const participantSelect = { id: true, name: true, username: true, avatarUrl: true };

const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  sender: { select: participantSelect },
};

// Find or start a 1:1 conversation with another user
export const getOrCreateConversation = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username || typeof username !== "string") {
    throw new ApiError(400, "username is required");
  }

  if (username === req.user!.username) {
    throw new ApiError(400, "You cannot message yourself");
  }

  const other = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!other) {
    throw new ApiError(404, "User not found");
  }

  const myId = req.user!.id;

  let conversation = await prisma.conversation.findFirst({
    where: {
      participants: { some: { userId: myId } },
      AND: { participants: { some: { userId: other.id } } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { participants: { create: [{ userId: myId }, { userId: other.id }] } },
    });
  }

  res.status(200).json(new ApiResponse(200, { id: conversation.id }));
});

// The caller's conversations, most recently active first
export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: participantSelect } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: messageSelect },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  const conversations = await Promise.all(
    participations.map(async (p) => {
      const otherParticipant = p.conversation.participants.find((cp) => cp.userId !== userId);
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          createdAt: { gt: p.lastReadAt ?? new Date(0) },
        },
      });

      return {
        id: p.conversation.id,
        otherUser: otherParticipant?.user ?? null,
        lastMessage: p.conversation.messages[0] ?? null,
        unreadCount,
        updatedAt: p.conversation.updatedAt,
      };
    })
  );

  res.status(200).json(new ApiResponse(200, conversations));
});

const assertParticipant = async (conversationId: string, userId: string) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) {
    throw new ApiError(403, "You are not part of this conversation");
  }
  return participant;
};

// Message history for a conversation, oldest-first cursor pagination
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = String(req.params.conversationId);
  await assertParticipant(conversationId, req.user!.id);

  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limitParam = Number(req.query.limit);
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 50 ? limitParam : 30;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: messageSelect,
  });

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  res.status(200).json(new ApiResponse(200, { messages: page.reverse(), nextCursor }));
});

// Send a message, and push it in real time to the other participant(s)
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = String(req.params.conversationId);
  const { content } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Message content is required");
  }

  await assertParticipant(conversationId, req.user!.id);

  const message = await prisma.message.create({
    data: { conversationId, senderId: req.user!.id, content: content.trim() },
    select: messageSelect,
  });

  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: req.user!.id } },
      data: { lastReadAt: new Date() },
    }),
  ]);

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: req.user!.id } },
    select: { userId: true },
  });

  const io = getIO();
  if (io) {
    for (const p of otherParticipants) {
      io.to(userRoom(p.userId)).emit("message:new", { conversationId, message });
    }
  }

  res.status(201).json(new ApiResponse(201, message, "Message sent"));
});

// Mark a conversation as read up to now
export const markConversationRead = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = String(req.params.conversationId);
  await assertParticipant(conversationId, req.user!.id);

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: req.user!.id } },
    data: { lastReadAt: new Date() },
  });

  res.status(200).json(new ApiResponse(200, {}, "Marked as read"));
});
