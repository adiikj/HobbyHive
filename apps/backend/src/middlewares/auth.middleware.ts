import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../db/prisma.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        username: string;
        email: string;
      };
    }
  }
}

export const verifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: { id: true, name: true, username: true, email: true },
    });

    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid Access Token");
  }
});
