import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { buildFeedPage, parsePagination } from "./post.controller.js";

// List the full hobby taxonomy, with real member/post counts
export const listHobbies = asyncHandler(async (_req: Request, res: Response) => {
  const hobbies = await prisma.hobby.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      _count: { select: { users: true, posts: true } },
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      hobbies.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        icon: h.icon,
        membersCount: h._count.users,
        postsCount: h._count.posts,
      }))
    )
  );
});

// Trending hobbies, ranked by post activity in the last 7 days — never a static list
export const getTrendingHobbies = asyncHandler(async (_req: Request, res: Response) => {
  const trending = await prisma.$queryRaw<
    { id: string; name: string; slug: string; icon: string | null; postCount: bigint }[]
  >`
    SELECT h.id, h.name, h.slug, h.icon, COUNT(p.id) AS "postCount"
    FROM "Hobby" h
    LEFT JOIN "Post" p ON p."hobbyId" = h.id AND p."createdAt" >= NOW() - INTERVAL '7 days'
    GROUP BY h.id
    ORDER BY "postCount" DESC, h.name ASC
    LIMIT 10
  `;

  res.status(200).json(
    new ApiResponse(
      200,
      trending.map((h) => ({ id: h.id, name: h.name, slug: h.slug, icon: h.icon, postCount: Number(h.postCount) }))
    )
  );
});

// A hobby's public community page: counts + whether the caller has joined
export const getHobbyBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);

  const hobby = await prisma.hobby.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      _count: { select: { users: true, posts: true } },
    },
  });

  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }

  const membership = await prisma.userHobby.findUnique({
    where: { userId_hobbyId: { userId: req.user!.id, hobbyId: hobby.id } },
  });

  res.status(200).json(
    new ApiResponse(200, {
      id: hobby.id,
      name: hobby.name,
      slug: hobby.slug,
      icon: hobby.icon,
      membersCount: hobby._count.users,
      postsCount: hobby._count.posts,
      isMember: Boolean(membership),
    })
  );
});

// Posts belonging to a hobby's community page — same shape as the personal feed
export const getHobbyPosts = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);

  const hobby = await prisma.hobby.findUnique({ where: { slug }, select: { id: true } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }

  const { cursor, limit } = parsePagination(req);
  const result = await buildFeedPage({ hobbyId: hobby.id }, cursor, limit, req.user!.id);

  res.status(200).json(new ApiResponse(200, result));
});

// Join a single hobby without disturbing the rest of the caller's selection
export const addMyHobby = asyncHandler(async (req: Request, res: Response) => {
  const hobbyId = String(req.params.hobbyId);

  const hobby = await prisma.hobby.findUnique({ where: { id: hobbyId } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }

  await prisma.userHobby.upsert({
    where: { userId_hobbyId: { userId: req.user!.id, hobbyId } },
    create: { userId: req.user!.id, hobbyId },
    update: {},
  });

  res.status(200).json(new ApiResponse(200, hobby, "Hobby added"));
});

// Leave a single hobby — blocked if it would leave the caller with zero hobbies
export const removeMyHobby = asyncHandler(async (req: Request, res: Response) => {
  const hobbyId = String(req.params.hobbyId);
  const userId = req.user!.id;

  const membership = await prisma.userHobby.findUnique({
    where: { userId_hobbyId: { userId, hobbyId } },
  });

  if (!membership) {
    return res.status(200).json(new ApiResponse(200, { removed: false }, "Not a member of this hobby"));
  }

  const memberCount = await prisma.userHobby.count({ where: { userId } });
  if (memberCount <= 1) {
    throw new ApiError(400, "You must have at least one hobby selected");
  }

  await prisma.userHobby.delete({ where: { userId_hobbyId: { userId, hobbyId } } });

  res.status(200).json(new ApiResponse(200, { removed: true }, "Hobby removed"));
});

// Get the current user's selected hobbies
export const getMyHobbies = asyncHandler(async (req: Request, res: Response) => {
  const userHobbies = await prisma.userHobby.findMany({
    where: { userId: req.user!.id },
    include: { hobby: true },
    orderBy: { hobby: { name: "asc" } },
  });

  res.status(200).json(new ApiResponse(200, userHobbies.map((uh) => uh.hobby)));
});

// Replace the current user's selected hobbies
export const setMyHobbies = asyncHandler(async (req: Request, res: Response) => {
  const { hobbyIds } = req.body;

  if (!Array.isArray(hobbyIds) || hobbyIds.length === 0) {
    throw new ApiError(400, "At least one hobby must be selected");
  }

  if (!hobbyIds.every((id) => typeof id === "string")) {
    throw new ApiError(400, "hobbyIds must be an array of strings");
  }

  const uniqueHobbyIds = [...new Set(hobbyIds)];

  const existingHobbies = await prisma.hobby.findMany({
    where: { id: { in: uniqueHobbyIds } },
    select: { id: true },
  });

  if (existingHobbies.length !== uniqueHobbyIds.length) {
    throw new ApiError(400, "One or more hobbies are invalid");
  }

  const userId = req.user!.id;

  await prisma.$transaction([
    prisma.userHobby.deleteMany({ where: { userId } }),
    prisma.userHobby.createMany({
      data: uniqueHobbyIds.map((hobbyId) => ({ userId, hobbyId })),
    }),
  ]);

  const userHobbies = await prisma.userHobby.findMany({
    where: { userId },
    include: { hobby: true },
    orderBy: { hobby: { name: "asc" } },
  });

  res
    .status(200)
    .json(new ApiResponse(200, userHobbies.map((uh) => uh.hobby), "Hobbies updated successfully"));
});
