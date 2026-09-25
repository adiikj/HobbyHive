import Cookies from "js-cookie";
import { logoutUser } from "@/api/api";
import { clearCurrentUser } from "@/lib/currentUser";

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
