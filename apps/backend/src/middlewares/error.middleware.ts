import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    const { statusCode, message, errors, stack } = err;

    return res.status(statusCode).json({
      success: false,
      message,
      errors: errors || [],
      stack: process.env.NODE_ENV === "production" ? undefined : stack,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
