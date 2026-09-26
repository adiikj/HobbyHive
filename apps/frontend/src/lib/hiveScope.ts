"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getHobbyColor, hobbyChroma } from "./hobbyTheme";

export interface ScopedHive {
  name: string;
  slug: string;
}

// The hive the current page is in, for chrome outside the page (sidebar chip, background pattern)
let current: ScopedHive | null = null;
const listeners = new Set<() => void>();

function setCurrent(hive: ScopedHive | null) {
  current = hive;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCurrentHive(): ScopedHive | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

/** Greys and teals need more tint to read as coloured than violet or fuchsia; 1 ≈ a typical hive. */
function tintStrength(color: string) {
  return Math.min(1.6, Math.max(0.75, (0.16 / hobbyChroma(color)) ** 0.8));
}

/**
 * Marks the page as "inside" a hive: sets --hive on <html> so the canvas, dividers and `hive`-coloured
 * accents take the hobby's colour (globals.css), and shows the hive in the sidebar and background.
 * The brand frame (logo, nav, Post) stays pink.
 * Pass null outside a hive (Following, loading) — everything falls back to brand pink with no tint.
 */
export function useHiveScope(hive: ScopedHive | null | undefined) {
  const name = hive?.name;
  const slug = hive?.slug;

  useEffect(() => {
    if (!name || !slug) return;
    const root = document.documentElement;
    const color = getHobbyColor(name);
    const scoped = { name, slug };
    root.style.setProperty("--hive", color);
    root.style.setProperty("--hive-strength", tintStrength(color).toFixed(2));
    root.dataset.hive = name;
    setCurrent(scoped);

    // Mobile browser chrome matches the hive
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);

    return () => {
      root.style.removeProperty("--hive");
      root.style.removeProperty("--hive-strength");
      delete root.dataset.hive;
      if (current === scoped) setCurrent(null);
      meta.remove();
    };
  }, [name, slug]);
}
