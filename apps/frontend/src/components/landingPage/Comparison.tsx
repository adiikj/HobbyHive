"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeAlert, Heart, Megaphone, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { getHobbyColor } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";

interface NoisyPost {
  kind: "post" | "ad" | "take";
  label: string;
  icon: React.ReactNode;
  user: string;
  avatar: string;
  text: string;
  image?: string;
}

const NOISY: NoisyPost[] = [
  { kind: "post", label: "Suggested for you", icon: <Sparkles size={10} />, user: "gymbro.daily", avatar: "/images/5.png", text: "Chest day PR, legs still shaking", image: "/images/posts/fitness.webp" },
  { kind: "ad", label: "Sponsored", icon: <Megaphone size={10} />, user: "ShopNow", avatar: "/images/1.png", text: "Summer sale ends tonight. 70% off everything!!" },
  { kind: "take", label: "Trending", icon: <TrendingUp size={10} />, user: "hottakes247", avatar: "/images/2.png", text: "Unpopular opinion: nobody should be allowed to…" },
  { kind: "post", label: "Because you watched", icon: <Sparkles size={10} />, user: "gamerzone", avatar: "/images/4.png", text: "Top 10 clips you missed this week", image: "/images/posts/gaming-3.webp" },
  { kind: "ad", label: "Sponsored", icon: <Megaphone size={10} />, user: "CryptoMax", avatar: "/images/3.png", text: "This one trick is making people rich" },
  { kind: "take", label: "Breaking", icon: <BadgeAlert size={10} />, user: "newsflash", avatar: "/images/1.png", text: "You won't believe what happened next" },
];

const DANCE = getHobbyColor("Dance");

const HIVE = [
  { user: "Mira K.", avatar: "/images/3.png", text: "Whole crew finally hit this 8-count clean 🎉", image: "/images/hobbies/dance-2.png", likes: 42, comments: 9 },
  { user: "Jonah P.", avatar: "/images/2.png", text: "Week 6 of turns. Doubles are finally landing.", image: "/images/hobbies/dance.png", likes: 31, comments: 7 },
  { user: "Priya R.", avatar: "/images/4.png", text: "Recital run-through tonight. Wish us luck!", image: "/images/hobbies/dance-3.png", likes: 58, comments: 14 },
];

function Phone({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[300px] rounded-[2.2rem] bg-chblack p-2 shadow-2xl shadow-black/20">
      <div className="relative h-[460px] overflow-hidden rounded-[1.8rem] bg-beige text-left">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-1.5 px-4 pb-6 pt-4 font-quick text-xs font-bold">
          {label}
        </div>
        {/* Fade the top and bottom so the endless scroll reads as a feed, not a strip */}
        <div className="h-full [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">{children}</div>
      </div>
    </div>
  );
}

function NoisyFeed() {
  return (
    <div className="animate-feed-fast space-y-2.5 px-3 pt-12 motion-reduce:animate-none">
      {[...NOISY, ...NOISY].map((p, i) => (
        <div key={i} className={`rounded-xl p-3 shadow-sm ${p.kind === "ad" ? "bg-yellow-50 ring-1 ring-yellow-300" : "bg-white"}`}>
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-chblack/40">
            {p.icon} {p.label}
          </p>
          <div className="flex items-center gap-2">
            <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
              <Image src={p.avatar} alt="" fill sizes="24px" className="object-cover" />
            </span>
            <p className="truncate text-xs font-semibold text-chblack/70">{p.user}</p>
          </div>
          <p className="mt-1.5 text-xs text-chblack/60">{p.text}</p>
          {p.image && (
            <div className="relative mt-2 aspect-[16/9] overflow-hidden rounded-lg">
              <Image src={p.image} alt="" fill sizes="280px" className="object-cover" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HiveFeed() {
  return (
    <div className="animate-feed-slow space-y-3 px-3 pt-12 motion-reduce:animate-none">
      {[...HIVE, ...HIVE].map((p, i) => (
        <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
              <Image src={p.avatar} alt="" fill sizes="28px" className="object-cover" />
            </span>
            <p className="flex-1 truncate text-xs font-semibold text-chblack">{p.user}</p>
            <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: DANCE }}>
              <HobbyIcon name="Dance" size={12} /> Dance
            </span>
          </div>
          <p className="mt-1.5 text-xs text-chblack/80">{p.text}</p>
          <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-lg">
            <Image src={p.image} alt="" fill sizes="280px" className="object-cover" />
          </div>
          <div className="mt-2 flex gap-3 text-[11px] font-semibold text-chblack/50">
            <span className="flex items-center gap-1">
              <Heart size={12} className="fill-current" style={{ color: DANCE }} /> {p.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} /> {p.comments}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Comparison() {
  return (
    <section className="w-full bg-gradient-to-r from-somig to-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <p className="font-quick text-xs font-bold uppercase tracking-[0.18em] text-pink-600">The difference</p>
          <h2 className="mt-2 font-bnt text-chblack text-4xl sm:text-5xl">Same phone, different feed</h2>
          <p className="font-pop mt-3 text-chblack/70 max-w-lg mx-auto">
            Other apps mix everything together and call it personalised. Your hive only shows the thing
            you came for.
          </p>
        </div>

        <div className="relative mt-12 grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="grayscale-[70%] opacity-80 transition duration-500 hover:grayscale-0 hover:opacity-100">
              <Phone label={<span className="rounded-full bg-white/90 px-2.5 py-1 text-chblack/50 shadow-sm">A typical feed</span>}>
                <NoisyFeed />
              </Phone>
            </div>
            <p className="mt-4 font-pop text-sm text-chblack/55">Ads, hot takes, and whatever&apos;s trending.</p>
          </motion.div>

          <div className="flex items-center justify-center" aria-hidden="true">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white font-bnt text-2xl text-chblack/40 shadow-lg">VS</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-6 rounded-full bg-pink-400/40 blur-3xl" />
              <div className="relative">
                <Phone
                  label={
                    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white shadow-sm" style={{ backgroundColor: DANCE }}>
                      <HobbyIcon name="Dance" size={13} /> Your Dance hive
                    </span>
                  }
                >
                  <HiveFeed />
                </Phone>
              </div>
            </div>
            <p className="mt-4 font-pop text-sm font-semibold text-chblack/75">Just dance. Because that&apos;s what you picked.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Comparison;
