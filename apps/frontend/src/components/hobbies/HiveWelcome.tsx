"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PenSquare } from "lucide-react";
import { getHobbyColor, getHobbyInk, getHobbyText, getHobbyVoice, withAlpha } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";
import { HivePatternSvg } from "@/components/layout/HivePattern";

/**
 * The moment you join a hive: a full-screen welcome in the hive's colour and pattern that sends you
 * straight to your first post there — posting is how you become part of a hive.
 */
function HiveWelcome({ hobby, slug, onClose }: { hobby: string; slug: string; onClose: () => void }) {
  const color = getHobbyColor(hobby);
  const ink = getHobbyInk(color);
  // Under white text, use the hive's readable (darker) shade so body copy clears 4.5:1; the dialog is
  // pinned to the light scheme so light-dark() picks that shade. The button reuses it, inverted.
  const background = ink === "#FFFFFF" ? getHobbyText(color) : color;
  const reduceMotion = useReducedMotion();
  const primaryRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hive-welcome-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-6 font-pop"
      style={{ backgroundColor: background, color: ink, colorScheme: "light" }}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
        <HivePatternSvg hobby={hobby} id="hive-welcome-pattern" />
      </div>

      <motion.div
        className="relative max-w-md text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
      >
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl" style={{ backgroundColor: withAlpha(ink, 0.14) }}>
          <HobbyIcon name={hobby} size={44} />
        </span>
        <p className="mt-6 font-quick text-xs font-bold uppercase tracking-[0.2em] opacity-75">You joined</p>
        <h2 id="hive-welcome-title" className="mt-1 font-bnt text-6xl leading-[0.9] sm:text-7xl">
          THE {hobby.toUpperCase()} HIVE
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed opacity-85">
          Everything here is {hobby.toLowerCase()}, and everyone here posts. {getHobbyVoice(hobby).prompt}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            ref={primaryRef}
            href={`/dashboard?hive=${slug}&compose=${Date.now()}`}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-quick text-[15px] font-bold shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4"
            style={{ backgroundColor: ink, color: background, ["--tw-ring-color" as string]: withAlpha(ink, 0.35) }}
          >
            <PenSquare size={18} /> Make your first post
          </Link>
          <button type="button" onClick={onClose} className="font-quick text-sm font-bold underline-offset-4 opacity-75 hover:underline hover:opacity-100">
            Look around first
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default HiveWelcome;
