import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// What users see when something breaks on our side. Details go to the server log, never to the client.
export const SERVER_ERROR_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

/** Turn known library errors into a status and a message a person can act on; null = unexpected. */
function describe(err: unknown): { status: number; message: string } | null {
  if (err instanceof ApiError) return { status: err.statusCode, message: err.message };

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return { status: 413, message: "That image is too large. Please choose one under 5 MB." };
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return { status: 400, message: "Too many images. Please remove a few and try again." };
    }
    return { status: 400, message: "That upload didn't work. Please try a different image." };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return { status: 404, message: "We couldn't find that. It may have been deleted." };
    if (err.code === "P2002") return { status: 409, message: "That already exists." };
    if (err.code === "P2003") return { status: 400, message: "That refers to something that no longer exists." };
    return null;
  }

  // express.json(): malformed or oversized request bodies
  const type = (err as { type?: string })?.type;
  if (type === "entity.parse.failed") return { status: 400, message: "That request wasn't formatted correctly. Please try again." };
  if (type === "entity.too.large") return { status: 413, message: "That's too much to send at once. Please shorten it and try again." };

  return null;
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const known = describe(err);
  const status = known?.status ?? 500;

  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err);

  return res.status(status).json({
    success: false,
    // Our own ApiError messages are written for people; anything unexpected could leak internals, so it gets the generic one
    message: known ? known.message : SERVER_ERROR_MESSAGE,
    errors: err instanceof ApiError ? err.errors : [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/** Unknown API routes: a JSON 404 instead of Express's HTML "Cannot GET". */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, "That page or action doesn't exist."));
};
