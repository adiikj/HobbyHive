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

// user.controller.ts talks to real Google/Gmail APIs to send OTP emails — never let tests hit the network
vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(function MockOAuth2() {
        return {
          setCredentials: vi.fn(),
          getAccessToken: vi.fn().mockResolvedValue({ token: "mock-access-token" }),
        };
      }),
    },
  },
}));

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
