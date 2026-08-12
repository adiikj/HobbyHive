import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const followUserSelect = { id: true, name: true, username: true, avatarUrl: true };

const findUserByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

// Send a follow request to another user
export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const targetUsername = String(req.params.username);

  if (req.user!.username === targetUsername) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const target = await findUserByUsername(targetUsername);

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user!.id, followingId: target.id } },
  });

  if (existing) {
    return res
      .status(200)
      .json(new ApiResponse(200, { status: existing.status }, "Follow request already exists"));
  }

  const follow = await prisma.follow.create({
    data: { followerId: req.user!.id, followingId: target.id, status: "PENDING" },
  });

  res.status(201).json(new ApiResponse(201, { status: follow.status }, "Follow request sent"));
});

// Unfollow, or cancel your own pending request
export const unfollowUser = asyncHandler(async (req: Request, res: Response) => {
  const targetUsername = String(req.params.username);
  const target = await findUserByUsername(targetUsername);

  await prisma.follow.deleteMany({ where: { followerId: req.user!.id, followingId: target.id } });

  res.status(200).json(new ApiResponse(200, { status: "NONE" }, "Unfollowed"));
});

// Accept an incoming follow request from :username
export const acceptFollowRequest = asyncHandler(async (req: Request, res: Response) => {
  const requesterUsername = String(req.params.username);
  const requester = await findUserByUsername(requesterUsername);

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: requester.id, followingId: req.user!.id } },
  });

  if (!follow || follow.status !== "PENDING") {
    throw new ApiError(404, "No pending follow request from this user");
  }

  const updated = await prisma.follow.update({ where: { id: follow.id }, data: { status: "ACCEPTED" } });

  res.status(200).json(new ApiResponse(200, { status: updated.status }, "Follow request accepted"));
});

// Reject (delete) an incoming follow request from :username
export const rejectFollowRequest = asyncHandler(async (req: Request, res: Response) => {
  const requesterUsername = String(req.params.username);
  const requester = await findUserByUsername(requesterUsername);

  await prisma.follow.deleteMany({
    where: { followerId: requester.id, followingId: req.user!.id, status: "PENDING" },
  });

  res.status(200).json(new ApiResponse(200, { status: "NONE" }, "Follow request rejected"));
});

// The caller's relationship to :username
export const getFollowStatus = asyncHandler(async (req: Request, res: Response) => {
  const targetUsername = String(req.params.username);
  const target = await findUserByUsername(targetUsername);

  if (target.id === req.user!.id) {
    return res.status(200).json(new ApiResponse(200, { status: "SELF" }));
  }

  const outgoing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user!.id, followingId: target.id } },
  });

  if (outgoing) {
    const status = outgoing.status === "ACCEPTED" ? "FOLLOWING" : "REQUESTED";
    return res.status(200).json(new ApiResponse(200, { status }));
  }

  const incoming = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: target.id, followingId: req.user!.id } },
  });

  if (incoming && incoming.status === "PENDING") {
    return res.status(200).json(new ApiResponse(200, { status: "INCOMING_REQUEST" }));
  }

  res.status(200).json(new ApiResponse(200, { status: "NONE" }));
});

// Pending follow requests waiting on the caller
export const getMyFollowRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.follow.findMany({
    where: { followingId: req.user!.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, follower: { select: followUserSelect } },
  });

  res.status(200).json(new ApiResponse(200, requests));
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const user = await findUserByUsername(String(req.params.username));

  const followers = await prisma.follow.findMany({
    where: { followingId: user.id, status: "ACCEPTED" },
    orderBy: { createdAt: "desc" },
    select: { follower: { select: followUserSelect } },
  });

  res.status(200).json(new ApiResponse(200, followers.map((f) => f.follower)));
});

export const getFollowingList = asyncHandler(async (req: Request, res: Response) => {
  const user = await findUserByUsername(String(req.params.username));

  const following = await prisma.follow.findMany({
    where: { followerId: user.id, status: "ACCEPTED" },
    orderBy: { createdAt: "desc" },
    select: { following: { select: followUserSelect } },
  });

  res.status(200).json(new ApiResponse(200, following.map((f) => f.following)));
});
