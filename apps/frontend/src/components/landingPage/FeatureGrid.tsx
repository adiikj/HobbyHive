"use client";

import { useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Bookmark, CalendarDays, Check, Compass, Flame, Heart, MessageCircle, Radio, Trophy, Users } from "lucide-react";
import { withAlpha } from "@/lib/hobbyTheme";
import { useLoop } from "./useLoop";

const PINK = "#DB2777";
const VIOLET = "#8B5CF6";
const TEAL = "#2C7A7B";
const AMBER = "#D97706";
const SKY = "#0EA5E9";

function Tile({
  icon,
  color,
  label,
  title,
  body,
  className = "",
  children,
  index,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  title: string;
  body: string;
  className?: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-chblack/5 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl sm:p-6 ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
    >
      {/* Soft wash of the tile's colour, brighter on hover */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: withAlpha(color, 0.14) }}
      />
      <p className="relative flex items-center gap-1.5 font-quick text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color }}>
        {icon} {label}
      </p>
      <h3 className="relative mt-2 font-quick text-lg font-bold leading-snug text-chblack">{title}</h3>
      <p className="relative mt-1 font-pop text-sm text-chblack/65">{body}</p>
      <div className="relative mt-5 flex flex-1 flex-col justify-end">{children}</div>
    </motion.div>
  );
}

/* ---------- Challenge: entries pop into the grid, the count ticks up ---------- */

const ENTRIES = [
  { src: "/images/hobbies/art.png", who: "Noor", likes: 48 },
  { src: "/images/hobbies/art-3.png", who: "Leo", likes: 31 },
  { src: "/images/hobbies/art-2.png", who: "Ines", likes: 22 },
];

function ChallengeVisual() {
  const ref = useRef<HTMLDivElement>(null);
  // 0..3 entries shown, then yours lands, then hold for a few beats before starting over
  const step = useLoop(ref, ENTRIES.length + 5, 900);
  const shown = Math.min(step, ENTRIES.length + 1);

  return (
    <div ref={ref}>
      <div
        className="relative overflow-hidden rounded-2xl border p-4"
        style={{ borderColor: withAlpha("#FFB703", 0.4), background: `linear-gradient(120deg, ${withAlpha("#FFB703", 0.2)}, #fff 75%)` }}
      >
        <Trophy size={72} className="pointer-events-none absolute -bottom-4 -right-2 rotate-12" style={{ color: withAlpha("#FFB703", 0.25) }} />
        <p className="font-quick text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">This week · Art</p>
        <p className="mt-1 font-bnt text-2xl leading-none text-chblack">ONE COLOUR ONLY</p>
        <p className="mt-1 font-pop text-xs text-chblack/60">Make something using a single colour and its shades.</p>
        <p className="mt-2 font-quick text-xs font-bold text-chblack/60">
          <span className="inline-block min-w-[1.5rem] tabular-nums text-amber-600">{32 + shown}</span> entries · 3 days left
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {ENTRIES.map((e, i) => (
          <div key={e.src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-chblack/5">
            <AnimatePresence>
              {i < shown && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Image src={e.src} alt="" fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
                    {e.who} · <Heart size={9} className="fill-white" /> {e.likes}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Your entry: an empty slot, then a one-colour piece lands in it */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-amber-400/60">
          <AnimatePresence mode="wait" initial={false}>
            {shown > ENTRIES.length ? (
              <motion.div
                key="mine"
                className="absolute inset-0 flex items-end p-1.5"
                style={{ background: "radial-gradient(circle at 30% 30%, #fbcfe8, #db2777 55%, #831843)" }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                  <Check size={10} /> Your entry
                </span>
              </motion.div>
            ) : (
              <motion.div key="slot" className="absolute inset-0 flex items-center justify-center" exit={{ opacity: 0 }}>
                <span className="rounded-full bg-amber-500 px-3 py-1 font-quick text-xs font-bold text-white">+ Enter</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- Journey: the activity strip fills week by week, streak bumps ---------- */

const WEEKS = [1, 1, 2, 0, 1, 2, 3, 2, 1, 3, 2, 2];
const shade = (posts: number) => (posts === 0 ? 0 : posts === 1 ? 0.35 : posts === 2 ? 0.65 : 1);

const PROGRESS = [
  { src: "/images/hobbies/dance.png", label: "Week 1" },
  { src: "/images/hobbies/dance-3.png", label: "Week 6" },
  { src: "/images/hobbies/dance-2.png", label: "Now" },
];

function JourneyVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, WEEKS.length + 3, 450);
  const filled = Math.min(step, WEEKS.length);
  const done = filled === WEEKS.length;

  return (
    <div ref={ref} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-chblack/10 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <motion.span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: withAlpha(PINK, 0.15) }}
            animate={done ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Flame size={20} style={{ color: PINK }} />
          </motion.span>
          <div>
            <p className="font-quick text-sm font-bold text-chblack">
              <span className="tabular-nums">{done ? 7 : 6}</span>-week streak
            </p>
            <p className="font-pop text-[11px] text-chblack/50">Dance · day 84</p>
          </div>
          <AnimatePresence>
            {done && (
              <motion.span
                className="ml-auto rounded-full px-2 py-0.5 font-quick text-[10px] font-bold text-white"
                style={{ backgroundColor: PINK }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                +1
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {WEEKS.map((posts, i) => (
            <motion.span
              key={i}
              className={`h-5 flex-1 rounded ${i === WEEKS.length - 1 ? "ring-2 ring-chblack/25 ring-offset-1" : ""}`}
              animate={{ backgroundColor: i < filled && posts ? withAlpha(PINK, shade(posts)) : "rgba(33,37,41,0.08)" }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-quick text-[9px] font-bold uppercase tracking-wider text-chblack/35">
          <span>12 weeks ago</span>
          <span>This week</span>
        </div>
      </div>

      <div className="rounded-2xl border border-chblack/10 bg-white p-4">
        <p className="font-quick text-[10px] font-bold uppercase tracking-wider text-emerald-700">Progress log · Turns</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PROGRESS.map((p, i) => (
            <motion.div key={p.label} animate={{ opacity: filled >= (i + 1) * 4 ? 1 : 0.35 }} transition={{ duration: 0.3 }}>
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={p.src} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <p className="mt-1 text-center font-quick text-[9px] font-bold uppercase text-chblack/45">{p.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Live room: messages keep arriving ---------- */

const CHAT = [
  { who: "Alt+F4", avatar: "/images/2.png", text: "anyone up for ranked tonight?" },
  { who: "Noor", avatar: "/images/5.png", text: "in after dinner 🎮" },
  { who: "Kabir", avatar: "/images/1.png", text: "same, need 2 more wins for gold" },
  { who: "Priya", avatar: "/images/4.png", text: "I'll bring snacks lol" },
  { who: "Mira", avatar: "/images/3.png", text: "save me a spot!!" },
  { who: "Alt+F4", avatar: "/images/2.png", text: "lobby's up at 9 🔥" },
];

function LiveRoomVisual() {
  const ref = useRef<HTMLDivElement>(null);
  // A rolling stream: even steps show "typing…", odd steps land the next message
  const step = useLoop(ref, 1000, 1100);
  const landed = 2 + Math.floor((step + 1) / 2);
  const typing = step % 2 === 0;
  const visible = Array.from({ length: Math.min(landed, 4) }, (_, k) => landed - Math.min(landed, 4) + k);
  const next = CHAT[landed % CHAT.length];

  return (
    <div ref={ref} className="flex h-full min-h-[260px] flex-col rounded-2xl bg-beige p-3">
      <p className="flex items-center gap-1.5 font-quick text-[10px] font-bold uppercase tracking-wider" style={{ color: VIOLET }}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: VIOLET }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: VIOLET }} />
        </span>
        Gaming room · {21 + (landed % 9)} here
      </p>
      <div className="mt-2 flex flex-1 flex-col justify-end gap-2 overflow-hidden">
        <AnimatePresence initial={false}>
          {visible.map((n) => {
            const m = CHAT[n % CHAT.length];
            return (
            <motion.div
              key={n}
              layout
              className="flex items-start gap-2"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="relative mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full">
                <Image src={m.avatar} alt="" fill sizes="24px" className="object-cover" />
              </span>
              <p className="rounded-xl rounded-tl-sm bg-white px-3 py-1.5 font-pop text-xs text-chblack/80 shadow-sm">
                <span className="font-semibold text-chblack">{m.who}</span> {m.text}
              </p>
            </motion.div>
            );
          })}
        </AnimatePresence>
        <div className="h-5">
          {typing && (
            <p className="flex items-center gap-1.5 pl-8 font-pop text-[11px] text-chblack/45">
              {next.who} is typing
              <span className="flex gap-0.5">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1 w-1 animate-bounce rounded-full bg-chblack/40" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Events: someone hits RSVP ---------- */

function EventVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, 3, 1600);
  const going = step >= 1;

  return (
    <div ref={ref} className="rounded-2xl border border-chblack/10 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ backgroundColor: TEAL }}>
          <span className="font-quick text-[9px] font-bold uppercase leading-none">Oct</span>
          <span className="font-bnt text-2xl leading-none">12</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-quick text-sm font-bold text-chblack">Finale watch party</p>
          <p className="font-pop text-[11px] text-chblack/50">Anime hive · 8 PM</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex -space-x-2">
            {["/images/1.png", "/images/3.png", "/images/5.png"].map((src) => (
              <span key={src} className="relative h-6 w-6 overflow-hidden rounded-full border-2 border-white">
                <Image src={src} alt="" fill sizes="24px" className="object-cover" />
              </span>
            ))}
            <AnimatePresence>
              {going && (
                <motion.span
                  className="relative h-6 w-6 overflow-hidden rounded-full border-2 border-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                >
                  <Image src="/images/4.png" alt="" fill sizes="24px" className="object-cover" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="flex items-center gap-1 font-pop text-[11px] text-chblack/50">
            <Users size={11} /> <span className="tabular-nums">{going ? 18 : 17}</span> going
          </span>
        </div>
        <motion.span
          className="flex items-center gap-1 rounded-full px-3 py-1 font-quick text-[11px] font-bold"
          animate={going ? { backgroundColor: withAlpha(TEAL, 0.12), color: TEAL, scale: [1, 0.9, 1] } : { backgroundColor: TEAL, color: "#fff", scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {going ? (
            <>
              <Check size={12} /> Going
            </>
          ) : (
            "RSVP"
          )}
        </motion.span>
      </div>
    </div>
  );
}

/* ---------- Discover: photo mosaic keeps reshuffling ---------- */

const POOL = [
  "/images/posts/dance.webp",
  "/images/posts/gaming.webp",
  "/images/posts/singing.webp",
  "/images/posts/fitness.webp",
  "/images/posts/anime.webp",
  "/images/posts/art-2.webp",
  "/images/posts/dance-2.webp",
  "/images/posts/gaming-3.webp",
];

function DiscoverVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, POOL.length, 1300);
  // Each step swaps one cell (round-robin) to the next image in the pool
  const cells = [0, 1, 2, 3].map((c) => {
    const swaps = Math.floor((step - c + 3) / 4);
    return POOL[(c + swaps * 4) % POOL.length];
  });

  return (
    <div ref={ref} className="grid grid-cols-2 gap-1.5">
      {cells.map((src, i) => (
        <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-chblack/5">
          <AnimatePresence initial={false}>
            <motion.div
              key={src}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image src={src} alt="" fill sizes="(min-width: 1024px) 120px, 40vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ---------- Mentions: type @mi, pick Mira, she gets notified ---------- */

const TYPED = ["", "Nailed it", "Nailed it with @mi", "Nailed it with @mi", "Nailed it with ", "Nailed it with "];

function MentionVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, TYPED.length, 1000);
  const picked = step >= 4;
  const suggesting = step === 2 || step === 3;

  return (
    <div ref={ref} className="relative">
      <div className="rounded-2xl border border-chblack/10 bg-white px-3 py-2.5 font-pop text-sm text-chblack">
        {TYPED[step]}
        {picked && <span className="rounded bg-pink-600/10 px-1 font-semibold text-pink-600">@mira</span>}
        {picked && " 🎉"}
        <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-chblack/60" />
      </div>
      <div className="relative h-14">
        <AnimatePresence>
          {suggesting && (
            <motion.div
              className="absolute left-3 right-3 top-1 flex items-center gap-2 rounded-xl border border-chblack/10 bg-white p-2 shadow-lg"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <span className="relative h-6 w-6 overflow-hidden rounded-full">
                <Image src="/images/3.png" alt="" fill sizes="24px" className="object-cover" />
              </span>
              <span className="text-xs">
                <span className="font-semibold text-chblack">Mira K.</span> <span className="text-chblack/45">@mira</span>
              </span>
              <span className={`ml-auto h-1.5 w-1.5 rounded-full ${step === 3 ? "bg-pink-600" : "bg-transparent"}`} />
            </motion.div>
          )}
          {step === 5 && (
            <motion.p
              className="absolute left-3 top-2 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-quick text-[11px] font-bold text-emerald-700"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Check size={12} /> Mira was notified
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Saved: bookmark a post into a collection ---------- */

function SavedVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(ref, 3, 1400);
  const saved = step >= 1;

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-2xl border border-chblack/10 bg-white p-2.5">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          <Image src="/images/posts/fitness-2.webp" alt="" fill sizes="40px" className="object-cover" />
        </span>
        <p className="min-w-0 flex-1 truncate font-pop text-xs text-chblack/75">Beginner mobility flow, 12 min</p>
        <motion.span animate={saved ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
          <Bookmark size={18} className={saved ? "fill-teal-700 text-teal-700" : "text-chblack/35"} />
        </motion.span>
      </div>
      <motion.div
        className="flex items-center justify-between rounded-2xl px-3 py-2"
        animate={{ backgroundColor: step === 2 ? withAlpha(TEAL, 0.14) : withAlpha(TEAL, 0.06) }}
      >
        <span className="font-quick text-xs font-bold text-teal-800">📁 Try this weekend</span>
        <span className="font-quick text-xs font-bold tabular-nums text-teal-800">{step === 2 ? 13 : 12} saved</span>
      </motion.div>
    </div>
  );
}

function FeatureGrid() {
  return (
    <section className="w-full bg-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-14 text-center">
          <p className="font-quick text-xs font-bold uppercase tracking-[0.18em] text-pink-600">Inside every hive</p>
          <h2 className="mt-2 font-bnt text-chblack text-4xl sm:text-5xl">More than a feed</h2>
          <p className="font-pop mt-3 text-chblack/70 max-w-xl mx-auto">
            Each hobby gets its own hive: a feed, a room to hang out in, things to do this week, and a
            record of how far you&apos;ve come.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-flow-dense lg:grid-cols-4 lg:auto-rows-[minmax(240px,auto)] sm:gap-5">
          <Tile
            index={0}
            icon={<Trophy size={13} />}
            color={AMBER}
            label="Weekly challenges"
            title="Something to make, every week"
            body="Each hive runs a prompt with a deadline. Enter with a post, then see what everyone else made."
            className="md:col-span-2 lg:row-span-2"
          >
            <ChallengeVisual />
          </Tile>
          <Tile
            index={1}
            icon={<Flame size={13} />}
            color={PINK}
            label="Your journey"
            title="Watch yourself get better"
            body="A weekly streak, 12 weeks of activity, and progress logs that line up your posts from first try to latest."
            className="md:col-span-2"
          >
            <JourneyVisual />
          </Tile>
          <Tile
            index={2}
            icon={<Radio size={13} />}
            color={VIOLET}
            label="Live room"
            title="Hang out in real time"
            body="Every hive has an always-on chat room for whoever's around."
            className="lg:row-span-2"
          >
            <LiveRoomVisual />
          </Tile>
          <Tile
            index={3}
            icon={<CalendarDays size={13} />}
            color={TEAL}
            label="Events"
            title="Meet up, online or off"
            body="Plan jams, watch parties and meetups, and see who's going."
          >
            <EventVisual />
          </Tile>
          <Tile
            index={4}
            icon={<Compass size={13} />}
            color={SKY}
            label="Explore"
            title="Find what's next"
            body="Trending photos across hives, and “more like this” on every post."
          >
            <DiscoverVisual />
          </Tile>
          <Tile
            index={5}
            icon={<AtSign size={13} />}
            color={PINK}
            label="Messages"
            title="DMs and @mentions"
            body="Message anyone, tag friends in posts and comments."
          >
            <MentionVisual />
          </Tile>
          <Tile
            index={6}
            icon={<Bookmark size={13} />}
            color={TEAL}
            label="Saved"
            title="Your own collections"
            body="Keep the good stuff in collections so it doesn't get lost."
            className="md:col-span-2 lg:col-span-1"
          >
            <SavedVisual />
          </Tile>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center font-pop text-sm text-chblack/50">
          <MessageCircle size={15} className="shrink-0" /> Plus comments, photo carousels, notifications, and a dark mode for late-night sessions.
        </p>
      </div>
    </section>
  );
}

export default FeatureGrid;
