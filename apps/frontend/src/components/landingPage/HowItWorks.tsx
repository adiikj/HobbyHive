"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Check, Flame, TrendingUp, Trophy } from "lucide-react";
import { getHobbyColor, withAlpha, getHobbyText, BRAND_COLOR } from "@/lib/hobbyTheme";
import { useLoop } from "./useLoop";
import HobbyIcon from "@/components/brand/HobbyIcon";

const PINK = BRAND_COLOR;

/* ---------- 1. Pick: hives light up one by one ---------- */

const PICKS = ["Dance", "Gaming", "Art", "Singing", "Anime", "Fitness"];
const CHOSEN = ["Dance", "Art", "Gaming"]; // joined in this order

function PickVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, CHOSEN.length + 3, 900);
  const joined = CHOSEN.slice(0, Math.min(step, CHOSEN.length));

  return (
    <div ref={ref}>
      <div className="grid grid-cols-3 gap-2">
        {PICKS.map((name) => {
          const color = getHobbyColor(name);
          const on = joined.includes(name);
          return (
            <motion.div
              key={name}
              className="relative flex items-center justify-center gap-1 rounded-xl border px-2 py-2 font-quick text-xs font-bold"
              animate={
                on
                  ? { backgroundColor: color, borderColor: color, color: "#fff", scale: [1, 1.08, 1] }
                  : { backgroundColor: "#ffffff", borderColor: "rgba(33,37,41,0.1)", color: "rgba(33,37,41,0.55)", scale: 1 }
              }
              transition={{ duration: 0.3 }}
            >
              {on ? <Check size={11} /> : <HobbyIcon name={name} size={13} style={{ color: getHobbyText(color) }} />}
              {name}
            </motion.div>
          );
        })}
      </div>
      <p className="mt-3 text-center font-quick text-xs font-bold text-chblack/50">
        <span className="tabular-nums text-chblack">{joined.length}</span> {joined.length === 1 ? "hive" : "hives"} joined
      </p>
    </div>
  );
}

/* ---------- 2. Share: a post gets written, tagged, and published ---------- */

const DRAFT = "Week 3 of learning turns, finally spotting properly";

function PostVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, 7, 800);
  const text = step === 0 ? "" : step === 1 ? DRAFT.slice(0, 22) : DRAFT;
  const challenge = step >= 3;
  const log = step >= 4;
  const posted = step >= 5;

  return (
    <div ref={ref} className="rounded-2xl border border-chblack/10 bg-white p-3">
      <p className="min-h-[2.5rem] font-pop text-xs leading-relaxed text-chblack">
        {text}
        {!posted && <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-chblack/60" />}
      </p>
      <div className="mt-2 flex min-h-[22px] flex-wrap gap-1.5">
        <AnimatePresence>
          {challenge && (
            <motion.span
              key="c"
              className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Trophy size={10} /> Challenge entry
            </motion.span>
          )}
          {log && (
            <motion.span
              key="l"
              className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <TrendingUp size={10} /> Progress log: Turns
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-chblack/5 pt-2.5">
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: PINK }}>
          <HobbyIcon name="Dance" size={12} /> Dance hive
        </span>
        <motion.span
          className="flex items-center gap-1 rounded-full px-3 py-1 font-quick text-[11px] font-bold text-white"
          animate={{ backgroundColor: posted ? "#059669" : PINK, scale: step === 5 ? [1, 0.9, 1] : 1 }}
          transition={{ duration: 0.25 }}
        >
          {posted ? (
            <>
              <Check size={11} /> Posted
            </>
          ) : (
            "Post"
          )}
        </motion.span>
      </div>
    </div>
  );
}

/* ---------- 3. Improve: weekly bars grow, streak climbs ---------- */

const BARS = [1, 2, 1, 2, 3, 2, 3, 4];

function StreakVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, BARS.length + 3, 450);
  const grown = Math.min(step, BARS.length);

  return (
    <div ref={ref} className="rounded-2xl border border-chblack/10 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-quick text-sm font-bold text-chblack">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(PINK, 0.15) }}>
            <Flame size={15} style={{ color: PINK }} />
          </span>
          <span>
            <span className="tabular-nums">{grown}</span>-week streak
          </span>
        </span>
        <span className="hidden font-quick text-[10px] font-bold uppercase tracking-wider text-chblack/35 sm:inline">Posts / week</span>
      </div>
      <div className="mt-3 flex h-20 items-end gap-1.5" aria-hidden="true">
        {BARS.map((h, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-t-md"
            style={{ backgroundColor: withAlpha(PINK, 0.35 + h * 0.16) }}
            initial={false}
            animate={{ height: i < grown ? `${h * 25}%` : "6%" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { title: "Pick your hives", body: "Join one hobby or a few. Each gets its own feed, and you switch in a tap.", visual: <PickVisual /> },
  { title: "Share and join in", body: "Post progress, enter the weekly challenge, drop into the live room.", visual: <PostVisual /> },
  { title: "Watch yourself improve", body: "Keep a weekly streak and look back on how far you've come.", visual: <StreakVisual /> },
];

function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  // The connecting line fills as the steps scroll through the viewport
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 0.85", "end 0.6"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section className="relative w-full bg-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 sm:mb-16 text-center">
          <p className="font-quick text-xs font-bold uppercase tracking-[0.18em] text-pink-600">Get started in a minute</p>
          <h2 className="mt-2 font-bnt text-chblack text-4xl sm:text-5xl">How it works</h2>
        </div>

        <div ref={sectionRef} className="relative">
          {/* Track + fill: horizontal on desktop, vertical on mobile */}
          <div className="absolute left-[calc(16.66%)] right-[calc(16.66%)] top-6 hidden h-[3px] rounded-full bg-chblack/10 md:block" aria-hidden="true">
            <motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-pink-600 to-warber" style={{ scaleX: progress }} />
          </div>
          <div className="absolute bottom-6 left-6 top-6 w-[3px] rounded-full bg-chblack/10 md:hidden" aria-hidden="true">
            <motion.div className="h-full w-full origin-top rounded-full bg-gradient-to-b from-pink-600 to-warber" style={{ scaleY: progress }} />
          </div>

          <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                className="relative pl-16 md:pl-0"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              >
                <span className="absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-beige bg-chblack font-bnt text-xl text-white shadow-lg md:relative md:mx-auto">
                  0{i + 1}
                </span>
                <div className="mt-0 flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm transition-shadow hover:shadow-xl md:mt-5 sm:p-6">
                  <h3 className="font-quick text-lg font-bold text-chblack">{s.title}</h3>
                  <p className="mt-1 font-pop text-sm text-chblack/65">{s.body}</p>
                  <div className="mt-5 flex flex-1 flex-col justify-center rounded-2xl bg-beige p-3">{s.visual}</div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
