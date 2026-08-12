import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./db/prisma.js";

let io: Server | null = null;

export const userRoom = (userId: string) => `user:${userId}`;
export const hobbyRoom = (hobbyId: string) => `hobby:${hobbyId}`;

const roomMessageSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
};

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

    // Hobby-specific live rooms: real-time group chat scoped to a hobby community
    socket.on("hobby:join", (hobbyId: unknown) => {
      if (typeof hobbyId === "string") socket.join(hobbyRoom(hobbyId));
    });

    socket.on("hobby:leave", (hobbyId: unknown) => {
      if (typeof hobbyId === "string") socket.leave(hobbyRoom(hobbyId));
    });

    socket.on(
      "hobby:message",
      async (payload: { hobbyId?: unknown; content?: unknown }, ack?: (res: { error?: string }) => void) => {
        try {
          const hobbyId = payload?.hobbyId;
          const content = payload?.content;

          if (typeof hobbyId !== "string" || typeof content !== "string" || !content.trim()) {
            return ack?.({ error: "Invalid message" });
          }

          const hobby = await prisma.hobby.findUnique({ where: { id: hobbyId }, select: { id: true } });
          if (!hobby) {
            return ack?.({ error: "Hobby not found" });
          }

          const message = await prisma.hobbyRoomMessage.create({
            data: { hobbyId, authorId: socket.data.userId, content: content.trim() },
            select: roomMessageSelect,
          });

          io?.to(hobbyRoom(hobbyId)).emit("hobby:message", { hobbyId, message });
          ack?.({});
        } catch {
          ack?.({ error: "Failed to send message" });
        }
      }
    );
  });

  return io;
};

export const getIO = () => io;
