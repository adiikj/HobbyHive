import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const postSelect = {
  id: true,
  content: true,
  imageUrl: true,
  createdAt: true,
  hobby: { select: { id: true, name: true, slug: true, icon: true } },
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
};

// Create a post tagged to exactly one hobby
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { content, hobbyId, imageUrl } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Post content is required");
  }

  if (!hobbyId || typeof hobbyId !== "string") {
    throw new ApiError(400, "A hobby must be selected for this post");
  }

  const hobby = await prisma.hobby.findUnique({ where: { id: hobbyId } });
  if (!hobby) {
    throw new ApiError(400, "Selected hobby does not exist");
  }

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      hobbyId,
      authorId: req.user!.id,
      imageUrl: imageUrl || null,
    },
    select: postSelect,
  });

  res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

// Hobby-scoped feed: only posts tagged with hobbies the caller has selected
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limitParam = Number(req.query.limit);
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 50 ? limitParam : 10;

  const userHobbies = await prisma.userHobby.findMany({
    where: { userId: req.user!.id },
    select: { hobbyId: true },
  });
  const hobbyIds = userHobbies.map((uh) => uh.hobbyId);

  if (hobbyIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, { posts: [], nextCursor: null }));
  }

  const posts = await prisma.post.findMany({
    where: { hobbyId: { in: hobbyIds } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: postSelect,
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  res.status(200).json(new ApiResponse(200, { posts: page, nextCursor }));
});
