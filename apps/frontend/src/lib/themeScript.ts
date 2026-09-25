/** Server-safe pieces of the theme system (no React), importable from the root layout. */

export const THEME_STORAGE_KEY = "hobbyhive:theme";

/**
 * Inline <head> script (see app/layout.tsx): applies the saved theme before first paint so in-app
 * pages don't flash light. Kept dependency-free; mirrors resolveDark in lib/theme.ts, and the route list must match the in-app (AppShell) routes.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var p=location.pathname;
if(!/^\\/(dashboard|explore|hobbies|messages|profile|settings|saved|posts|challenges|progress)(\\/|$)/.test(p))return;
var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";
if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");
}catch(e){}})();`;
