"use client";

import { useEffect, useState } from "react";
import { getUserProfile, type Profile } from "@/api/api";

/**
 * AppSidebar and MobileNav are both always mounted (breakpoint visibility is CSS-only), and
 * several pages independently need "who am I" too — without this cache each of those fired its
 * own getUserProfile() call, turning one profile fetch into 2-4 identical redundant round trips
 * per page load.
 */
let cache: Profile | null = null;
let inFlight: Promise<Profile> | null = null;
const listeners = new Set<(user: Profile | null) => void>();

function notify() {
  listeners.forEach((listener) => listener(cache));
}

export function setCurrentUser(user: Profile | null) {
  cache = user;
  notify();
}

export function clearCurrentUser() {
  cache = null;
  inFlight = null;
  notify();
}

function fetchOnce(): Promise<Profile> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = getUserProfile()
      .then((user) => {
        cache = user;
        notify();
        return user;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useCurrentUser() {
  const [user, setUser] = useState<Profile | null>(cache);
  const [isLoading, setIsLoading] = useState(cache === null);

  useEffect(() => {
    const listener = (u: Profile | null) => setUser(u);
    listeners.add(listener);

    if (cache) {
      setUser(cache);
      setIsLoading(false);
    } else {
      fetchOnce()
        .catch(() => undefined)
        .finally(() => setIsLoading(false));
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { user, isLoading };
}
