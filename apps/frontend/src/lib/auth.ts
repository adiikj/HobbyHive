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
 * Ends the session on both sides. The backend's session cookies are httpOnly (and the one above can't overwrite
 * them), so scripts can't read or remove them: always call /logout, which clears them and revokes the refresh
 * token, rather than only when a readable cookie exists. Best-effort: a failed call must not block signing out locally.
 */
export async function signOut() {
  await logoutUser(localStorage.getItem("authToken")).catch(() => undefined);
  localStorage.removeItem("authToken");
  Cookies.remove("accessToken");
  clearCurrentUser();
}
