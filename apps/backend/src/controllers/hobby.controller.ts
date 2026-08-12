import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

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
