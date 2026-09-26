"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Trophy } from "lucide-react";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";

interface Hive {
  name: string;
  tagline: string;
  image: string;
  online: number;
  challenge: string;
  className: string;
}

// Placement on the 4-column bento: Dance is the 2×2 hero tile, Gaming runs tall, Fitness fills the
// last mobile row
const HIVES: Hive[] = [
  { name: "Dance", tagline: "Turns, combos, recital clips.", image: "/images/hobbies/dance-3.png", online: 23, challenge: "Mirror, mirror", className: "col-span-2 row-span-2" },
  { name: "Anime", tagline: "Season takes, fan art, watch parties.", image: "/images/hobbies/anime-3.png", online: 57, challenge: "Redraw a panel", className: "" },
  { name: "Gaming", tagline: "Clips, raids, patch-note arguments.", image: "/images/hobbies/gaming-3.png", online: 88, challenge: "No-HUD run", className: "lg:row-span-2" },
  { name: "Singing", tagline: "Covers, open mics, vocal runs.", image: "/images/hobbies/singing-3.png", online: 12, challenge: "One-take cover", className: "" },
  { name: "Art", tagline: "Sketchbooks, WIPs, critique threads.", image: "/images/hobbies/art-3.png", online: 31, challenge: "One colour only", className: "" },
  { name: "Fitness", tagline: "PRs, form checks, recovery days.", image: "/images/hobbies/fitness-3.png", online: 45, challenge: "100 reps, any way", className: "col-span-2 lg:col-span-1" },
];

const MORE_HOBBIES = ["Photography", "Music", "Writing", "Cooking", "Travel", "Coding"];

function HiveCard({ hive, index }: { hive: Hive; index: number }) {
  const color = getHobbyColor(hive.name);
  const big = index === 0;

  return (
    <motion.div
      className={hive.className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
    >
      <Link
        href="/signup"
        className="group relative block h-full overflow-hidden rounded-3xl shadow-md outline-none ring-offset-2 transition-shadow duration-300 hover:shadow-2xl focus-visible:ring-4"
        style={{ ["--tw-ring-color" as string]: withAlpha(color, 0.6) }}
      >
        <Image
          src={hive.image}
          alt={`${hive.name} hive`}
          fill
          sizes={big ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Hive-coloured wash from the bottom, deepens on hover */}
        <div
          className="absolute inset-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `linear-gradient(to top, ${withAlpha(color, 0.85)} 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 70%)` }}
        />

        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {hive.online} online
        </div>

        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-chblack opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 -translate-y-1 group-hover:translate-y-0">
          <ArrowUpRight size={16} />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3 className={`flex items-center gap-2 font-bnt text-white leading-none ${big ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>
            <HobbyIcon name={hive.name} size={big ? 34 : 22} />
            {hive.name}
          </h3>
          <p className={`mt-1 font-pop text-white/85 ${big ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>{hive.tagline}</p>
          {/* This week's challenge: always shown on the big tile, slides up on hover for the rest */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              big ? "mt-3 max-h-10" : "max-h-0 group-hover:mt-2 group-hover:max-h-10 group-focus-visible:mt-2 group-focus-visible:max-h-10"
            }`}
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold" style={{ color }}>
              <Trophy size={11} /> This week: {hive.challenge}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Featured() {
  return (
    <section className="w-full bg-gradient-to-r from-somig to-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-14 text-center">
          <p className="font-quick text-xs font-bold uppercase tracking-[0.18em] text-pink-600">12 hives and counting</p>
          <h2 className="mt-2 font-bnt text-chblack text-4xl sm:text-5xl">Find your hive</h2>
          <p className="font-pop mt-3 text-chblack/70 max-w-xl mx-auto">
            Each with its own colour, feed, live room and weekly challenge. Join one or all of them.
          </p>
        </div>

        <div className="grid grid-cols-2 auto-rows-[170px] gap-3 sm:auto-rows-[210px] sm:gap-4 lg:grid-cols-4 lg:grid-flow-dense">
          {HIVES.map((hive, i) => (
            <HiveCard key={hive.name} hive={hive} index={i} />
          ))}

          <motion.div
            className="col-span-2 flex flex-col justify-between rounded-3xl bg-white p-5 shadow-md sm:p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: HIVES.length * 0.06, ease: "easeOut" }}
          >
            <div>
              <h3 className="font-bnt text-3xl leading-none text-chblack">Also buzzing</h3>
              <p className="mt-1 font-pop text-sm text-chblack/60">Six more hives, same setup.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {MORE_HOBBIES.map((name) => {
                const color = getHobbyColor(name);
                return (
                  <Link
                    key={name}
                    href="/signup"
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-quick text-sm font-semibold text-chblack/75 transition-all hover:-translate-y-0.5 hover:bg-[var(--hive)] hover:text-white"
                    style={{ borderColor: withAlpha(color, 0.35), ["--hive" as string]: color }}
                  >
                    <HobbyIcon name={name} size={16} style={{ color }} />
                    {name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Featured;
