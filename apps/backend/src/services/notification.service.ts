import { prisma } from "../db/prisma.js";

export const notifyLike = async (postAuthorId: string, actorId: string, postId: string) => {
  if (postAuthorId === actorId) return;
  await prisma.notification.create({ data: { userId: postAuthorId, actorId, type: "LIKE", postId } });
};

export const notifyComment = async (postAuthorId: string, actorId: string, postId: string) => {
  if (postAuthorId === actorId) return;
  await prisma.notification.create({ data: { userId: postAuthorId, actorId, type: "COMMENT", postId } });
};

export const notifyFollowRequest = async (targetId: string, actorId: string) => {
  if (targetId === actorId) return;
  await prisma.notification.create({ data: { userId: targetId, actorId, type: "FOLLOW" } });
};

export const notifyNewPost = async (hobbyId: string, authorId: string, postId: string) => {
  const members = await prisma.userHobby.findMany({
    where: { hobbyId, userId: { not: authorId } },
    select: { userId: true },
  });

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((m) => ({ userId: m.userId, actorId: authorId, type: "NEW_POST" as const, postId })),
  });
};
