import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { notifyLike, notifyNewPost } from "../services/notification.service.js";

export const postSelect = {
  id: true,
  content: true,
  imageUrl: true,
  createdAt: true,
  hobby: { select: { id: true, name: true, slug: true, icon: true } },
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostSelect;

export type RawPost = Prisma.PostGetPayload<{ select: typeof postSelect }>;

export const toPostResponse = (post: RawPost, isLiked: boolean) => ({
  id: post.id,
  content: post.content,
  imageUrl: post.imageUrl,
  createdAt: post.createdAt,
  hobby: post.hobby,
  author: post.author,
  likesCount: post._count.likes,
  commentsCount: post._count.comments,
  isLiked,
});

const parsePagination = (req: Request) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limitParam = Number(req.query.limit);
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 50 ? limitParam : 10;
  return { cursor, limit };
};

const buildFeedPage = async (
  where: Prisma.PostWhereInput,
  cursor: string | undefined,
  limit: number,
  userId: string
) => {
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: postSelect,
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const userLikes = page.length
    ? await prisma.like.findMany({
        where: { userId, postId: { in: page.map((p) => p.id) } },
        select: { postId: true },
      })
    : [];
  const likedPostIds = new Set(userLikes.map((l) => l.postId));

  return {
    posts: page.map((post) => toPostResponse(post, likedPostIds.has(post.id))),
    nextCursor,
  };
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

  await notifyNewPost(hobbyId, req.user!.id, post.id);

  res.status(201).json(new ApiResponse(201, toPostResponse(post, false), "Post created successfully"));
});

// Hobby-scoped feed: only posts tagged with hobbies the caller has selected
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const { cursor, limit } = parsePagination(req);

  const userHobbies = await prisma.userHobby.findMany({
    where: { userId: req.user!.id },
    select: { hobbyId: true },
  });
  const hobbyIds = userHobbies.map((uh) => uh.hobbyId);

  if (hobbyIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, { posts: [], nextCursor: null }));
  }

  const result = await buildFeedPage({ hobbyId: { in: hobbyIds } }, cursor, limit, req.user!.id);
  res.status(200).json(new ApiResponse(200, result));
});

// Following feed: posts by users the caller follows, any hobby — kept separate from the hobby feed
export const getFollowingFeed = asyncHandler(async (req: Request, res: Response) => {
  const { cursor, limit } = parsePagination(req);

  const follows = await prisma.follow.findMany({
    where: { followerId: req.user!.id, status: "ACCEPTED" },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, { posts: [], nextCursor: null }));
  }

  const result = await buildFeedPage({ authorId: { in: followingIds } }, cursor, limit, req.user!.id);
  res.status(200).json(new ApiResponse(200, result));
});

// Like a post (idempotent)
export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId: req.user!.id, postId } },
  });

  if (!existingLike) {
    await prisma.like.create({ data: { userId: req.user!.id, postId } });
    await notifyLike(post.authorId, req.user!.id, postId);
  }

  const likesCount = await prisma.like.count({ where: { postId } });

  res.status(200).json(new ApiResponse(200, { isLiked: true, likesCount }));
});

// Unlike a post (idempotent)
export const unlikePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = String(req.params.postId);

  await prisma.like.deleteMany({ where: { userId: req.user!.id, postId } });

  const likesCount = await prisma.like.count({ where: { postId } });

  res.status(200).json(new ApiResponse(200, { isLiked: false, likesCount }));
});
