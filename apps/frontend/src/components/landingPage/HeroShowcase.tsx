"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flame, Heart, MessageCircle, Trophy } from "lucide-react";
import BeaAvatar from "@/components/bea/BeaAvatar";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { roundedHexagonPath } from "@/lib/hexagon";
import HobbyIcon from "@/components/brand/HobbyIcon";

interface Slide {
  hobby: string;
  image: string;
  user: string;
  avatar: string;
  caption: string;
  likes: number;
  comments: number;
  challenge: string;
  entries: number;
  streak: number;
  online: number;
  bea: string;
  liker: string;
}

const SLIDES: Slide[] = [
  {
    hobby: "Dance",
    image: "/images/hobbies/dance-2.png",
    user: "Mira K.",
    avatar: "/images/3.png",
    caption: "Whole crew finally hit this 8-count clean and in sync.",
    likes: 42,
    comments: 9,
    challenge: "Mirror, mirror",
    entries: 27,
    streak: 6,
    online: 23,
    bea: "Most people here fixed dizzy turns by drilling spots first.",
    liker: "Jonah",
  },
  {
    hobby: "Anime",
    image: "/images/hobbies/anime-2.png",
    user: "Devraj S.",
    avatar: "/images/1.png",
    caption: "Rearranged the whole shelf tonight, the desk lamp finally does it justice.",
    likes: 128,
    comments: 31,
    challenge: "Redraw a panel",
    entries: 41,
    streak: 9,
    online: 57,
    bea: "The hive's top pick for a first watch this season is a tie.",
    liker: "Aiko",
  },
  {
    hobby: "Singing",
    image: "/images/hobbies/singing-2.png",
    user: "Priya R.",
    avatar: "/images/4.png",
    caption: "Recorded a quiet acoustic session at home tonight, string lights and all.",
    likes: 76,
    comments: 14,
    challenge: "One-take cover",
    entries: 19,
    streak: 4,
    online: 12,
    bea: "Humming warm-ups came up in 5 posts about hitting high notes.",
    liker: "Sam",
  },
  {
    hobby: "Gaming",
    image: "/images/hobbies/gaming-2.png",
    user: "Alt+F4",
    avatar: "/images/2.png",
    caption: "Full squad on the couch tonight, snacks out, controllers in hand.",
    likes: 210,
    comments: 47,
    challenge: "No-HUD run",
    entries: 63,
    streak: 11,
    online: 88,
    bea: "People here say VOD reviews helped more than grinding games.",
    liker: "Noor",
  },
  {
    hobby: "Art",
    image: "/images/hobbies/art-2.png",
    user: "Noor A.",
    avatar: "/images/5.png",
    caption: "Finally getting the light right on this mountain landscape.",
    likes: 58,
    comments: 12,
    challenge: "One colour only",
    entries: 38,
    streak: 7,
    online: 31,
    bea: "Three members swear by value studies before any colour.",
    liker: "Kabir",
  },
  {
    hobby: "Fitness",
    image: "/images/hobbies/fitness-2.png",
    user: "Kabir M.",
    avatar: "/images/1.png",
    caption: "Added another rep to today's curls, arms are done.",
    likes: 91,
    comments: 18,
    challenge: "100 reps, any way",
    entries: 52,
    streak: 13,
    online: 45,
    bea: "Rest days show up in almost every PR story shared here.",
    liker: "Mira",
  },
];

const BACK_HEX = roundedHexagonPath(50, 50, 46, 9);
const SMALL_HEX = roundedHexagonPath(50, 50, 44, 8);
const CYCLE_MS = 4200;

/** Gentle idle bob for the floating cards. MotionConfig reducedMotion="user" turns it off. */
function Float({ delay = 0, className, children }: { delay?: number; className: string; children: React.ReactNode }) {
  return (
    <motion.div
      className={`absolute z-20 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: [0, -7, 0] }}
      transition={{
        opacity: { duration: 0.5, delay: 0.3 + delay },
        y: { duration: 5 + delay * 2, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Swaps its content with a quick fade/slide whenever `k` changes. */
function Swap({ k, children, className }: { k: string; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={k}
        className={className}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function HeroShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // Decided after mount so server and client render the same markup
  const [autoplay, setAutoplay] = useState(false);
  const reduceMotion = useReducedMotion();
  const slide = SLIDES[active];
  const color = getHobbyColor(slide.hobby);
  const playing = autoplay && !paused;

  useEffect(() => setAutoplay(!reduceMotion), [reduceMotion]);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), CYCLE_MS);
    return () => clearTimeout(timer);
  }, [active, playing]);

  return (
    <div className="w-full" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative mx-auto h-[440px] w-full max-w-[520px] sm:h-[520px]">
        {/* Backdrop: a big soft hexagon in the active hive's colour */}
        <svg viewBox="0 0 100 100" className="absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rotate-6" aria-hidden="true">
          <motion.path d={BACK_HEX} animate={{ fill: withAlpha(color, 0.16) }} transition={{ duration: 0.8 }} />
        </svg>
        <svg viewBox="0 0 100 100" className="absolute -right-2 bottom-6 h-20 w-20 -rotate-12 sm:h-24 sm:w-24" aria-hidden="true">
          <motion.path d={SMALL_HEX} fill="none" strokeWidth={4} animate={{ stroke: withAlpha(color, 0.45) }} transition={{ duration: 0.8 }} />
        </svg>

        {/* Main post card */}
        <div className="absolute inset-x-[9%] top-[5%] bottom-[15%] z-10 overflow-hidden rounded-[28px] bg-chblack shadow-2xl shadow-black/20 sm:inset-x-[13%]">
          <AnimatePresence initial={false}>
            <motion.div
              key={slide.image}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Image src={slide.image} alt={`${slide.hobby} post`} fill priority sizes="(min-width: 640px) 380px, 90vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 font-quick text-xs font-bold text-chblack backdrop-blur">
            <HobbyIcon name={slide.hobby} size={15} style={{ color }} />
            <Swap k={slide.hobby}>{slide.hobby} hive</Swap>
          </div>

          <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur-md">
            <Swap k={slide.hobby}>
              <div className="flex items-center gap-2.5">
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <Image src={slide.avatar} alt="" fill sizes="32px" className="object-cover" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-chblack">{slide.user}</p>
                <span className="flex items-center gap-1 text-xs font-semibold text-chblack/50">
                  <Heart size={13} className="fill-current" style={{ color }} /> {slide.likes}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-chblack/50">
                  <MessageCircle size={13} /> {slide.comments}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-chblack/80">{slide.caption}</p>
            </Swap>
          </div>
        </div>

        {/* Floating cards */}
        <Float className="right-0 top-0 sm:-right-4" delay={0}>
          <div className="w-[170px] rounded-2xl bg-white p-3 shadow-xl shadow-black/10 sm:w-[190px]">
            <p className="flex items-center gap-1 font-quick text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color }}>
              <Trophy size={12} /> This week
            </p>
            <Swap k={slide.challenge}>
              <p className="mt-0.5 font-bnt text-xl leading-none text-chblack">{slide.challenge.toUpperCase()}</p>
              <p className="mt-1 text-[11px] font-semibold text-chblack/50">{slide.entries} entries · 3 days left</p>
            </Swap>
          </div>
        </Float>

        <Float className="left-0 top-[30%] sm:-left-6" delay={0.6}>
          <div className="w-[150px] rounded-2xl bg-white p-3 shadow-xl shadow-black/10 sm:w-[168px]">
            <div className="flex items-center gap-2">
              <motion.span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                animate={{ backgroundColor: withAlpha(color, 0.15), color }}
                transition={{ duration: 0.6 }}
              >
                <Flame size={17} />
              </motion.span>
              <Swap k={`${slide.hobby}-streak`}>
                <p className="font-quick text-sm font-bold leading-tight text-chblack">{slide.streak}-week</p>
                <p className="text-[10px] text-chblack/50">streak</p>
              </Swap>
            </div>
            <div className="mt-2 flex gap-[3px]" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="h-3.5 flex-1 rounded-[3px]"
                  animate={{ backgroundColor: i < 10 - Math.min(slide.streak, 10) ? "rgba(33,37,41,0.08)" : withAlpha(color, 0.35 + (i % 3) * 0.3) }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                />
              ))}
            </div>
          </div>
        </Float>

        <Float className="right-0 top-[48%] sm:-right-8" delay={1.2}>
          <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-2 pr-3.5 shadow-xl shadow-black/10">
            <span className="flex -space-x-2">
              {["/images/2.png", "/images/4.png", "/images/5.png"].map((src) => (
                <span key={src} className="relative h-6 w-6 overflow-hidden rounded-full border-2 border-white">
                  <Image src={src} alt="" fill sizes="24px" className="object-cover" />
                </span>
              ))}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <Swap k={`${slide.hobby}-live`}>
              <span className="whitespace-nowrap font-quick text-xs font-bold text-chblack">{slide.online} in the live room</span>
            </Swap>
          </div>
        </Float>

        <Float className="bottom-0 left-0 hidden sm:block sm:-left-8" delay={1.8}>
          <div className="flex w-[250px] items-start gap-2 rounded-2xl bg-[#17161c] p-3 shadow-xl shadow-black/20">
            <BeaAvatar size={28} />
            <div className="min-w-0">
              <p className="font-quick text-[10px] font-bold uppercase tracking-[0.14em] text-warber">Bea</p>
              <Swap k={`${slide.hobby}-bea`}>
                <p className="text-xs leading-snug text-white/85">
                  {slide.bea}
                  <sup className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warber/25 text-[8px] font-bold text-warber">
                    1
                  </sup>
                </p>
              </Swap>
            </div>
          </div>
        </Float>

        {/* A "someone liked your post" toast that drops in partway through each slide */}
        <div className="pointer-events-none absolute left-[4%] top-[-2%] z-30 hidden sm:block">
          <AnimatePresence>
            <motion.div
              key={slide.hobby}
              className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3 shadow-lg shadow-black/10"
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 1.1, duration: 0.35 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                <Heart size={12} className="fill-white text-white" />
              </span>
              <span className="whitespace-nowrap text-xs text-chblack/70">
                <span className="font-semibold text-chblack">{slide.liker}</span> liked your post
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Hive switcher */}
      <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Preview a hive">
        {SLIDES.map((s, i) => {
          const isActive = i === active;
          const c = getHobbyColor(s.hobby);
          return (
            <button
              key={s.hobby}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(i)}
              className={`relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 font-quick text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 ${
                isActive ? "text-white" : "bg-white/70 text-chblack/60 hover:text-chblack"
              }`}
              style={isActive ? { backgroundColor: c } : undefined}
            >
              <HobbyIcon name={s.hobby} size={14} style={{ color: isActive ? "#fff" : c }} />
              {s.hobby}
              {/* Progress bar for the auto-advance */}
              {isActive && playing && (
                <motion.span
                  key={`bar-${active}`}
                  className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HeroShowcase;
