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

const MENTION_PATTERN = /(?:^|[^\w@])@([a-zA-Z0-9_.]{2,30})/g;

/** Usernames @mentioned in some text (deduplicated, trailing dots from sentence punctuation dropped). */
export const extractMentions = (text: string): string[] => {
  const names = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const name = match[1].replace(/\.+$/, "");
    if (name.length >= 2) names.add(name);
  }
  return [...names];
};

/** Notify everyone @mentioned in a post or comment, except the author and anyone already notified another way. */
export const notifyMentions = async (text: string, actorId: string, postId: string, alreadyNotified: string[] = []) => {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({ where: { username: { in: usernames } }, select: { id: true } });
  const skip = new Set([actorId, ...alreadyNotified]);
  const recipients = users.filter((u) => !skip.has(u.id));
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((u) => ({ userId: u.id, actorId, type: "MENTION" as const, postId })),
  });
};

export const notifyReply = async (commentAuthorId: string, actorId: string, postId: string) => {
  if (commentAuthorId === actorId) return;
  await prisma.notification.create({ data: { userId: commentAuthorId, actorId, type: "REPLY", postId } });
};

export const notifyFeedback = async (postAuthorId: string, actorId: string, postId: string) => {
  if (postAuthorId === actorId) return;
  await prisma.notification.create({ data: { userId: postAuthorId, actorId, type: "FEEDBACK", postId } });
};

export const notifyFeedbackHelpful = async (feedbackAuthorId: string, actorId: string, postId: string) => {
  if (feedbackAuthorId === actorId) return;
  await prisma.notification.create({ data: { userId: feedbackAuthorId, actorId, type: "FEEDBACK_HELPFUL", postId } });
};
