"use client";

import { useSyncExternalStore } from "react";

/**
 * The running practice timer. It lives in localStorage so it keeps going across pages, reloads and tabs;
 * only one session can run at a time.
 */
export interface RunningPractice {
  startedAt: number;
  hobby: { id: string; name: string; slug: string };
  /** Set when started from a skill ("Practise this"), so the log form pre-selects it. */
  skill?: { id: string; name: string } | null;
}

const KEY = "hh:practice-timer";
const EVENT = "hh:practice-timer";
/** Fired after a session is saved, so journey cards and the practice page can refresh. */
export const PRACTICE_LOGGED_EVENT = "hh:practice-logged";

let cachedRaw: string | null = null;
let cached: RunningPractice | null = null;

function read(): RunningPractice | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  // Same string → same object, so useSyncExternalStore doesn't loop
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    cached = raw ? (JSON.parse(raw) as RunningPractice) : null;
  } catch {
    cached = null;
  }
  return cached;
}

function write(value: RunningPractice | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode etc.: the timer just won't survive a reload
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function usePracticeTimer() {
  return useSyncExternalStore(subscribe, read, () => null);
}

export const startPractice = (hobby: RunningPractice["hobby"], skill: RunningPractice["skill"] = null) =>
  write({ startedAt: Date.now(), hobby, skill });
export const clearPractice = () => write(null);

/** Whole minutes since `startedAt`, at least 1. */
export const elapsedMinutes = (startedAt: number, now = Date.now()) => Math.max(1, Math.round((now - startedAt) / 60_000));

export const formatElapsed = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export { formatMinutes } from "./time";

export const announcePracticeLogged = () => window.dispatchEvent(new Event(PRACTICE_LOGGED_EVENT));
