import { io, type Socket } from "socket.io-client";

// Relative API base (the default) → connect to this page's own origin, which proxies /socket.io to the backend
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL as string).replace(/\/api\/v1\/users$/, "") || undefined;

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: true, addTrailingSlash: false });
  }

  return socket;
}
