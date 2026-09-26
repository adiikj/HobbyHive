"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getHobbyColor, hobbyTintStrength } from "./hobbyTheme";

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

function clearRoot() {
  const root = document.documentElement;
  root.style.removeProperty("--hive");
  root.style.removeProperty("--hive-strength");
  delete root.dataset.hive;
}

/**
 * Marks the page as "inside" a hive: sets --hive on <html> so the canvas, dividers and `hive`-coloured
 * accents take the hobby's colour (globals.css), and shows the hive in the sidebar and background.
 * The brand frame (logo, nav, Post) stays pink.
 * Pass `undefined` while the hive is still loading (keeps any tint the boot script applied before
 * paint, lib/themeScript) and `null` when the page is definitely not in a hive (Following) — that
 * drops the tint so everything falls back to brand pink.
 */
export function useHiveScope(hive: ScopedHive | null | undefined) {
  const name = hive?.name;
  const slug = hive?.slug;
  const outside = hive === null;

  useEffect(() => {
    if (outside) {
      // Only the boot script's guess can be left here — a real scope cleans up after itself
      if (!current) clearRoot();
      return;
    }
    if (!name || !slug) return;
    const root = document.documentElement;
    const color = getHobbyColor(name);
    const scoped = { name, slug };
    root.style.setProperty("--hive", color);
    root.style.setProperty("--hive-strength", hobbyTintStrength(color).toFixed(2));
    root.dataset.hive = name;
    setCurrent(scoped);

    // Mobile browser chrome matches the hive
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);

    return () => {
      clearRoot();
      if (current === scoped) setCurrent(null);
      meta.remove();
    };
  }, [name, slug, outside]);
}

/**
 * For the app shell: after a client-side navigation, drops a tint no page has claimed — e.g. the boot
 * script's guess when you leave Home before its hives load. Skips the first render so the boot tint
 * survives while the landing page is still loading its hive.
 */
export function useHiveScopeReset() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Runs after the new page's effects, so a page that already knows its hive has set `current`
    if (!current) clearRoot();
  }, [pathname]);
}
