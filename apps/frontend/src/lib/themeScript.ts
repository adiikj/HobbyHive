/** Server-safe pieces of the theme system (no React), importable from the root layout. */

import { HOBBY_COLORS, hobbyTintStrength } from "./hobbyTheme";

export const THEME_STORAGE_KEY = "hobbyhive:theme";
/** The hive Home opens on (written by the dashboard and hive pages). */
export const LAST_HIVE_KEY = "hobbyhive:lastHive";

// slug → [colour, tint strength, name]; hive slugs are the lowercased names (prisma/seed.ts)
const HIVES = Object.fromEntries(
  Object.entries(HOBBY_COLORS).map(([name, color]) => [name.toLowerCase(), [color, hobbyTintStrength(color).toFixed(2), name]]),
);

/**
 * Inline <head> script (see app/layout.tsx): applies the saved theme before first paint so in-app
 * pages don't flash light. Kept dependency-free; mirrors resolveDark in lib/theme.ts, and the route list must match the in-app (AppShell) routes.
 * Also applies the hive tint on a hive page, or on Home's remembered hive, so a reload doesn't flash
 * untinted before lib/hiveScope takes over (it mirrors what useHiveScope sets).
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var p=location.pathname;
if(!/^\\/(dashboard|explore|hobbies|messages|profile|settings|saved|posts|challenges|progress)(\\/|$)/.test(p))return;
var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";
if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");
var H=${JSON.stringify(HIVES)},s=null,m=p.match(/^\\/hobbies\\/([^/]+)/);
if(m)s=m[1];
else if(p==="/dashboard"){var q=new URLSearchParams(location.search);if(q.get("feed")!=="following")s=q.get("hive")||localStorage.getItem("${LAST_HIVE_KEY}");}
var h=s&&H[s];
if(h){var r=document.documentElement;r.style.setProperty("--hive",h[0]);r.style.setProperty("--hive-strength",h[1]);r.dataset.hive=h[2];}
}catch(e){}})();`;
