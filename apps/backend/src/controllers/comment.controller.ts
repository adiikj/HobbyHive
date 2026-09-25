import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { notifyComment, notifyMentions, notifyReply } from "../services/notification.service.js";

const commentSelect = {
  id: true,
  content: true,
  parentId: true,
  createdAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
};

// List comments on a post, oldest first (flat, with parentId — the client nests replies under their parent)
export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });

  res.status(200).json(new ApiResponse(200, comments));
});

// Add a comment to a post, or a reply to one of its comments (`parentId`)
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);
  const { content, parentId } = req.body;
  const userId = req.user!.id;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Threads stay one level deep: a reply to a reply attaches to the top-level comment
  let threadParent: { id: string; userId: string } | null = null;
  if (parentId !== undefined && parentId !== null) {
    const parent = await prisma.comment.findUnique({
      where: { id: String(parentId) },
      select: { id: true, postId: true, parentId: true, userId: true },
    });
    if (!parent || parent.postId !== postId) {
      throw new ApiError(400, "You can only reply to a comment on this post");
    }
    threadParent = { id: parent.parentId ?? parent.id, userId: parent.userId };
  }

  const comment = await prisma.comment.create({
    data: { postId, userId, content: content.trim(), parentId: threadParent?.id ?? null },
    select: commentSelect,
  });

  // One notification per person: a reply beats "commented on your post", and both beat a mention
  const notified: string[] = [];
  if (threadParent && threadParent.userId !== userId) {
    await notifyReply(threadParent.userId, userId, postId);
    notified.push(threadParent.userId);
  }
  if (!notified.includes(post.authorId)) {
    await notifyComment(post.authorId, userId, postId);
    notified.push(post.authorId);
  }
  await notifyMentions(comment.content, userId, postId, notified);

  res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
});
