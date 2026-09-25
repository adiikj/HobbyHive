import { vi, beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

process.env.ACCESS_TOKEN_SECRET ??= "test-access-secret";
process.env.REFRESH_TOKEN_SECRET ??= "test-refresh-secret";
process.env.ACCESS_TOKEN_EXPIRY ??= "1d";
process.env.REFRESH_TOKEN_EXPIRY ??= "10d";
process.env.CORS_ORIGIN ??= "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";
process.env.GOOGLE_REDIRECT_URI ??= "http://localhost/oauth2callback";
process.env.GOOGLE_REFRESH_TOKEN ??= "test-refresh-token";
process.env.GOOGLE_GMAIL_ID ??= "test@example.com";

const prismaMock = mockDeep<PrismaClient>();

vi.mock("../src/db/prisma.js", () => ({ prisma: prismaMock }));

// The topic-model service is an HTTP dependency — never call it from tests; ML tests stub these per case
vi.mock("../src/services/ml.service.js", () => ({
  classify: vi.fn().mockResolvedValue(null),
  searchQuery: vi.fn().mockResolvedValue(null),
  askBea: vi.fn().mockResolvedValue(null),
  embed: vi.fn().mockResolvedValue(null),
  analyzePosts: vi.fn().mockResolvedValue(0),
  analyzePostInBackground: vi.fn(),
  toVectorLiteral: (v: number[]) => `[${v.join(",")}]`,
}));

// user.controller.ts sends OTP emails through Gmail — never let tests hit the network
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: "mock" }),
    }),
  },
}));

beforeEach(() => {
  mockReset(prismaMock);
});
