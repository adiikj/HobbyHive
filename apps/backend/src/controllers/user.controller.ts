import crypto from "crypto";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { otpEmail } from "../emails/otpEmail.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import type { User, Prisma } from "@prisma/client";

// Nodemailer's Gmail OAuth2 support fetches and refreshes access tokens itself from the refresh token,
// so the googleapis client (~76 MB resident) isn't needed. One transporter, created on first use and reused.
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () =>
  (transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_GMAIL_ID,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  }));

const generateAccessToken = (user: User) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email, name: user.name },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] }
  );

const generateRefreshToken = (user: User) =>
  jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
  });

/** Only a hash of the refresh token is stored, so a leaked database row can't be replayed as a session. */
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const generateAccessAndRefreshTokens = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.user.update({ where: { id: userId }, data: { refreshToken: hashToken(refreshToken) } });

  return { accessToken, refreshToken };
};

/**
 * Session cookies: httpOnly (scripts can't read them), SameSite=Lax, and alive exactly as long as the token inside.
 * The frontend proxies the API, so they're first-party. Secure only in production: browsers drop Secure cookies
 * over plain http, which is how local dev runs.
 */
const cookieOptions = (expires?: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  ...(expires ? { expires } : {}),
});

const tokenExpiry = (token: string) => new Date(((jwt.decode(token) as { exp: number }).exp ?? 0) * 1000);

const setSessionCookies = (res: Response, accessToken: string, refreshToken: string) =>
  res
    .cookie("accessToken", accessToken, cookieOptions(tokenExpiry(accessToken)))
    .cookie("refreshToken", refreshToken, cookieOptions(tokenExpiry(refreshToken)));

const SESSION_ENDED = "Your session has ended. Please sign in again.";

// User Login
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    throw new ApiError(400, "Email or Username, Password are required");
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Compared exactly as typed: registration hashes the password untrimmed, so trimming here locked out
  // anyone whose password starts or ends with a space
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  const loggedInUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, username: true, email: true, createdAt: true, updatedAt: true },
  });

  setSessionCookies(res.status(200), accessToken, refreshToken).json({
    status: 200,
    data: { user: loggedInUser, accessToken },
    message: "User logged in successfully",
  });
});

// Swap the refresh token (httpOnly cookie) for a new access token. Refresh tokens rotate: each one works once,
// so a stolen token stops working as soon as the real user refreshes.
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incoming: unknown = req.cookies?.refreshToken;
  if (typeof incoming !== "string" || !incoming) {
    throw new ApiError(401, SESSION_ENDED);
  }

  let userId: string;
  try {
    userId = (jwt.verify(incoming, process.env.REFRESH_TOKEN_SECRET as string) as { id: string }).id;
  } catch {
    throw new ApiError(401, SESSION_ENDED);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, refreshToken: true } });
  // No match: signed out, or an older token that has already been swapped for a newer one
  if (!user || user.refreshToken !== hashToken(incoming)) {
    throw new ApiError(401, SESSION_ENDED);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
  setSessionCookies(res.status(200), accessToken, refreshToken).json(new ApiResponse(200, { accessToken }, "Session refreshed"));
});

// User Logout
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { refreshToken: null },
  });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions())
    .clearCookie("refreshToken", cookieOptions())
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const OTP_MINUTES = 10;
/** Wrong guesses allowed per code: 5 out of a million, instead of unlimited tries for 10 minutes. */
const MAX_OTP_ATTEMPTS = 5;

/** Emails a fresh 6-digit code and returns its bcrypt hash (the code itself is never stored). */
const generateOTP = async (email: string, name?: string) => {
  const otp = String(crypto.randomInt(100000, 1000000));
  const otpExpiry = new Date(Date.now() + OTP_MINUTES * 60 * 1000);

  await sendOTP(email, otp, name);

  return { otpHash: await bcrypt.hash(otp, 10), otpExpiry };
};

const sendOTP = async (email: string, otp: string, name?: string) => {
  if (!email) {
    throw new ApiError(400, "Email is required for OTP method 'email'");
  }

  const mailOptions = {
    from: `HobbyHive <${process.env.GOOGLE_GMAIL_ID}>`,
    to: email,
    ...otpEmail({ otp, name, minutes: OTP_MINUTES }),
  };

  try {
    const transporter = await getTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP via email:", error);
    throw new ApiError(503, "We couldn't email your code just now. Please try again in a moment.");
  }
};

// User Registration
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    throw new ApiError(400, "All fields are required.");
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    throw new ApiError(400, "Email, phone number, or username is already registered.");
  }

  const { otpHash, otpExpiry } = await generateOTP(email, name);
  const hashedPassword = await bcrypt.hash(password, 10);

  // A new code resets the wrong-guess count
  await prisma.pendingUser.upsert({
    where: { email },
    create: { name, username, email, password: hashedPassword, otp: otpHash, otpExpiry },
    update: { name, username, password: hashedPassword, otp: otpHash, otpExpiry, otpAttempts: 0, otpVerified: false },
  });

  res.status(200).json({
    message: "User registered successfully. Please verify the OTP.",
  });
});

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!otp) {
    throw new ApiError(400, "OTP are required.");
  }

  if (!email) {
    throw new ApiError(400, "Email is required for OTP.");
  }

  const pendingUser = await prisma.pendingUser.findUnique({ where: { email } });

  if (!pendingUser) {
    throw new ApiError(404, "No pending user found.");
  }

  if (Date.now() > pendingUser.otpExpiry.getTime()) {
    throw new ApiError(400, "OTP has expired.");
  }

  // Use up one attempt before checking the code. The conditional update is atomic, so firing many guesses
  // in parallel can't slip past the limit.
  const { count } = await prisma.pendingUser.updateMany({
    where: { id: pendingUser.id, otpAttempts: { lt: MAX_OTP_ATTEMPTS } },
    data: { otpAttempts: { increment: 1 } },
  });
  if (count === 0) {
    throw new ApiError(429, "Too many wrong codes. Sign up again to get a new one.");
  }

  if (typeof otp !== "string" || !(await bcrypt.compare(otp, pendingUser.otp))) {
    throw new ApiError(400, "Invalid OTP.");
  }

  // Together, so two verifies racing can't both create the account
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: pendingUser.name,
        username: pendingUser.username,
        email: pendingUser.email,
        password: pendingUser.password,
        otp: pendingUser.otp,
        otpVerified: true,
      },
    }),
    prisma.pendingUser.delete({ where: { id: pendingUser.id } }),
  ]);

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  setSessionCookies(res.status(200), accessToken, refreshToken).json({
    message: "User verified and confirmed successfully. You can now log in.",
    data: { accessToken },
  });
});

const publicProfileSelect = {
  id: true,
  name: true,
  username: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
  hobbies: { select: { hobby: { select: { id: true, name: true, slug: true, icon: true } } } },
  _count: {
    select: {
      followers: { where: { status: "ACCEPTED" } },
      following: { where: { status: "ACCEPTED" } },
    },
  },
} satisfies Prisma.UserSelect;

type RawProfile = Prisma.UserGetPayload<{ select: typeof publicProfileSelect }>;

const toProfileResponse = (user: RawProfile) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  hobbies: user.hobbies.map((h) => h.hobby),
  followersCount: user._count.followers,
  followingCount: user._count.following,
});

// The logged-in user's own profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: publicProfileSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, toProfileResponse(user)));
});

// Any user's public profile, by username
export const getPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const username = String(req.params.username);

  const user = await prisma.user.findUnique({
    where: { username },
    select: publicProfileSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, toProfileResponse(user)));
});

// Edit your own profile (name, bio, avatarUrl)
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const username = String(req.params.username);

  if (req.user!.username !== username) {
    throw new ApiError(403, "You can only edit your own profile");
  }

  const { name, bio, avatarUrl } = req.body;

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    throw new ApiError(400, "Name cannot be empty");
  }

  if (bio !== undefined && typeof bio !== "string") {
    throw new ApiError(400, "Bio must be a string");
  }

  if (avatarUrl !== undefined && typeof avatarUrl !== "string") {
    throw new ApiError(400, "Avatar URL must be a string");
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() || null } : {}),
    },
    select: publicProfileSelect,
  });

  res.status(200).json(new ApiResponse(200, toProfileResponse(user), "Profile updated successfully"));
});
