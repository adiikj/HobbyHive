import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import type { User } from "@prisma/client";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const getTransporter = async () => {
  const { token } = await oAuth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_GMAIL_ID,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: token ?? undefined,
    },
  });
};

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

const generateAccessAndRefreshTokens = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.user.update({ where: { id: userId }, data: { refreshToken } });

  return { accessToken, refreshToken };
};

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

  const isPasswordValid = await bcrypt.compare(password.trim(), user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  const loggedInUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, username: true, email: true, createdAt: true, updatedAt: true },
  });

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "none" as const,
    path: "/",
    expires: new Date(Date.now() + 3600000),
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: 200,
      data: { user: loggedInUser, accessToken, refreshToken },
      message: "User logged in successfully",
    });
});

// User Logout
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const generateOTP = async (email: string) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await sendOTP(email, otp);

  return { otp, otpExpiry };
};

const sendOTP = async (email: string, otp: string) => {
  if (!email) {
    throw new ApiError(400, "Email is required for OTP method 'email'");
  }

  const mailOptions = {
    from: process.env.GOOGLE_GMAIL_ID,
    to: email,
    subject: "Welcome to HobbyHive",
    html: `<h3>Your OTP Code for HobbyHive Registration is <b>${otp}</b>. It is valid for 10 minutes.</h3>`,
    text: `Your OTP Code for HobbyHive Registration is ${otp}. It is valid for 10 minutes.`,
  };

  try {
    const transporter = await getTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP via email:", error);
    throw new ApiError(500, "Error sending OTP via email");
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

  const { otp, otpExpiry } = await generateOTP(email);
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.pendingUser.upsert({
    where: { email },
    create: { name, username, email, password: hashedPassword, otp, otpExpiry },
    update: { name, username, password: hashedPassword, otp, otpExpiry, otpVerified: false },
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

  if (pendingUser.otp !== otp) {
    throw new ApiError(400, "Invalid OTP.");
  }

  if (Date.now() > pendingUser.otpExpiry.getTime()) {
    throw new ApiError(400, "OTP has expired.");
  }

  const user = await prisma.user.create({
    data: {
      name: pendingUser.name,
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password,
      otp: pendingUser.otp,
      otpVerified: true,
    },
  });

  await prisma.pendingUser.delete({ where: { id: pendingUser.id } });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "none" as const,
    path: "/",
    expires: new Date(Date.now() + 3600000),
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      message: "User verified and confirmed successfully. You can now log in.",
      data: { accessToken, refreshToken },
    });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { name: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ status: 200, data: { name: user.name } });
});
