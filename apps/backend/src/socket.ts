import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./db/prisma.js";

let io: Server | null = null;

export const userRoom = (userId: string) => `user:${userId}`;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { id: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true } });

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.join(userRoom(socket.data.userId));
  });

  return io;
};

export const getIO = () => io;
