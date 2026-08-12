import { io, type Socket } from "socket.io-client";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL as string).replace(/\/api\/v1\/users$/, "");

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: true });
  }

  return socket;
}
