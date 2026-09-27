import { io, type Socket } from "socket.io-client";

// Relative API base (the default) → connect to this page's own origin, which proxies /socket.io to the backend
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL as string).replace(/\/api\/v1\/users$/, "") || undefined;

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  if (!socket) {
    // Read the token on every (re)connect, so a reconnect after a session refresh uses the new one
    socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: localStorage.getItem("authToken") }),
      autoConnect: true,
      addTrailingSlash: false,
    });
  }

  return socket;
}
