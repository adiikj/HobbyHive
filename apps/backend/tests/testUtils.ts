import jwt from "jsonwebtoken";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../src/db/prisma.js";

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// A "fat" user object covering every shape different controllers select —
// real Prisma restricts fields via `select`, the mock doesn't, so extra fields are harmless.
export const testUser = {
  id: "user_1",
  name: "Aditya Kumar",
  username: "aditya",
  email: "aditya@example.com",
  bio: null as string | null,
  avatarUrl: null as string | null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  hobbies: [] as { hobby: { id: string; name: string; slug: string; icon: string | null } }[],
  _count: { followers: 0, following: 0 },
};

export type TestUser = typeof testUser;

export const signAccessToken = (user: TestUser = testUser) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email, name: user.name },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "1d" }
  );

// verifyJWT looks the user back up by id on every request
export const mockAuthenticatedUser = (user: TestUser = testUser) => {
  prismaMock.user.findUnique.mockResolvedValue(user as never);
  return signAccessToken(user);
};
