"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/lib/currentUser";
import { hasSeenTour, isNewAccount, markTourSeen } from "@/lib/tour";
import ProductTour, { type TourStep } from "./ProductTour";

const STEPS: TourStep[] = [
  {
    title: "Welcome to HobbyHive!",
    body: "I'm Bea. Every hobby here gets its own hive: one hobby, one feed, no algorithm guessing. Let me show you around. It takes under a minute.",
  },
  {
    targets: ["hives"],
    title: "Your hives",
    body: "Switch between your hobbies here. Each one has its own feed. Tap + to join more.",
  },
  {
    targets: ["journey"],
    title: "Your journey",
    body: "Your weekly streak and the last 12 weeks at a glance. Post or log practice at least once a week to keep the streak going.",
    fallbackBody: "Once you join a hive, your weekly streak and activity show up on your home.",
  },
  {
    targets: ["challenge"],
    title: "Weekly challenges",
    body: "Each hive runs a challenge every week. Enter with a post and see what everyone else made.",
    fallbackBody: "Hives run a challenge every week. When one is on, it shows up right here on your home.",
  },
  {
    targets: ["composer"],
    title: "Share something",
    body: "Post progress, photos or questions. Add a post to a progress log to see how you improve, and type @ to tag friends.",
    fallbackBody: "Use the pink + button to share progress, photos or questions with your hive.",
  },
  {
    targets: ["nav-ask-bea"],
    title: "Ask me anything",
    body: "I answer from what your hive has actually shared, and I show you exactly which posts each answer came from.",
    fallbackBody: "Open any hive and pick the ✨ Ask Bea tab. I answer from what the hive has actually shared, and show you where each answer came from.",
  },
  {
    targets: ["nav-explore"],
    title: "Explore",
    body: "Find new hives, trending posts and people who share your hobbies.",
  },
  {
    targets: ["nav-profile"],
    title: "Your profile",
    body: "Your posts, photos and Journey timeline: every milestone from your first post onwards.",
  },
  {
    targets: ["account"],
    title: "You're all set!",
    body: "You can replay this tour anytime from this menu: “Take the tour”. Happy hobbying!",
  },
];

/**
 * Runs the welcome tour on the dashboard: automatically for new accounts that haven't seen it,
 * or on demand via ?tour=1 (the account menu's "Take the tour").
 */
function WelcomeTour({ ready }: { ready: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: me } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const requested = searchParams.get("tour") === "1";

  useEffect(() => {
    if (!ready || !me || open) return;
    if (requested) {
      setOpen(true);
      // Drop ?tour=1 so a refresh doesn't restart it (keeps any other params, like ?hive=)
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tour");
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    } else if (isNewAccount(me.createdAt) && !hasSeenTour(me.id)) {
      setOpen(true);
    }
  }, [ready, me, open, requested, searchParams, pathname, router]);

  const close = useCallback(() => {
    if (me) markTourSeen(me.id);
    setOpen(false);
  }, [me]);

  return open ? <ProductTour steps={STEPS} onClose={close} /> : null;
}

export default WelcomeTour;
