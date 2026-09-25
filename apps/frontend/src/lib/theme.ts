"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "./themeScript";

export type ThemePreference = "light" | "dark" | "system";

export { THEME_STORAGE_KEY };

const listeners = new Set<(pref: ThemePreference) => void>();

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function resolveDark(pref: ThemePreference) {
  return pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function applyTheme(pref: ThemePreference = readThemePreference()) {
  document.documentElement.classList.toggle("dark", resolveDark(pref));
}

export function setThemePreference(pref: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // storage blocked — the choice still applies for this page view
  }
  applyTheme(pref);
  listeners.forEach((listener) => listener(pref));
}

export function useThemePreference() {
  const [pref, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    setPref(readThemePreference());
    listeners.add(setPref);
    return () => {
      listeners.delete(setPref);
    };
  }, []);

  return [pref, setThemePreference] as const;
}

/**
 * Applies the theme while the in-app shell is mounted, follows OS changes when set to "system",
 * and drops dark mode on unmount so marketing/auth pages (designed light-only) stay light.
 */
export function useAppTheme() {
  useEffect(() => {
    applyTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => readThemePreference() === "system" && applyTheme("system");
    media.addEventListener("change", onSystemChange);
    return () => {
      media.removeEventListener("change", onSystemChange);
      document.documentElement.classList.remove("dark");
    };
  }, []);
}
