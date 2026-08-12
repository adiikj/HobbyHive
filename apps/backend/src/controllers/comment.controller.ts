import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
};

// List comments on a post, oldest first
export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });

  res.status(200).json(new ApiResponse(200, comments));
});

// Add a comment to a post
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);
  const { content } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const comment = await prisma.comment.create({
    data: { postId, userId: req.user!.id, content: content.trim() },
    select: commentSelect,
  });

  res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
});
