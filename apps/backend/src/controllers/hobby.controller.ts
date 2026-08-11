import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

// List the full hobby taxonomy
export const listHobbies = asyncHandler(async (_req: Request, res: Response) => {
  const hobbies = await prisma.hobby.findMany({ orderBy: { name: "asc" } });
  res.status(200).json(new ApiResponse(200, hobbies));
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
