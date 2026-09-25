// The welcome tour: shown once to new accounts, replayable from the account menu (/dashboard?tour=1)

const NEW_ACCOUNT_DAYS = 14;
const key = (userId: string) => `hobbyhive:tour-seen:${userId}`;

export const TOUR_URL = "/dashboard?tour=1";

export function hasSeenTour(userId: string): boolean {
  try {
    return localStorage.getItem(key(userId)) === "1";
  } catch {
    return true; // storage blocked: don't risk showing it on every visit
  }
}

export function markTourSeen(userId: string) {
  try {
    localStorage.setItem(key(userId), "1");
  } catch {
    // storage blocked: nothing to remember it in
  }
}

/** Only recent sign-ups get the tour automatically, so existing users on a new device aren't interrupted. */
export const isNewAccount = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
