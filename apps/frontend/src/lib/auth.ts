import Cookies from "js-cookie";
import { logoutUser } from "@/api/api";
import { clearCurrentUser } from "@/lib/currentUser";

/**
 * Stores the access token for the Next.js middleware to read. `Secure` only over HTTPS: browsers
 * silently drop Secure cookies on plain http (Safari even on localhost, and every browser on an IP
 * like http://192.168.x.x:3000), which left users "logged in" to the API but bounced back to sign-in.
 */
export function setSessionCookie(accessToken: string) {
  Cookies.set("accessToken", accessToken, { secure: window.location.protocol === "https:", sameSite: "lax" });
}

/**
 * Ends the session on both sides. The backend also sets its own httpOnly `accessToken` cookie at
 * login, which `Cookies.remove` can't touch — only the /logout response can clear it (and revoke
 * the refresh token). Best-effort: a failed/expired logout call must not block signing out locally.
 */
export async function signOut() {
  const token = Cookies.get("accessToken");
  if (token) await logoutUser(token).catch(() => undefined);
  Cookies.remove("accessToken");
  clearCurrentUser();
}
