"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, MessageCircle, Send, Home, Search, Bell, User } from "lucide-react";
import Logo from "@/components/brand/Logo";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import { getHobbyColor } from "@/lib/hobbyTheme";

interface MockPost {
  hobby: string;
  user: string;
  avatar: string;
  caption: string;
  image: string;
  likes: number;
  comments: number;
}

const POSTS: MockPost[] = [
  {
    hobby: "Dance",
    user: "Mira K.",
    avatar: "/images/3.png",
    caption: "Whole crew finally hit this 8-count clean and in sync.",
    image: "/images/hobbies/dance-2.png",
    likes: 42,
    comments: 9,
  },
  {
    hobby: "Anime",
    user: "Devraj S.",
    avatar: "/images/1.png",
    caption: "Rearranged the whole shelf tonight, the desk lamp finally does it justice.",
    image: "/images/hobbies/anime-2.png",
    likes: 128,
    comments: 31,
  },
  {
    hobby: "Singing",
    user: "Priya R.",
    avatar: "/images/4.png",
    caption: "Recorded a quiet acoustic session at home tonight, string lights and all.",
    image: "/images/hobbies/singing-2.png",
    likes: 76,
    comments: 14,
  },
  {
    hobby: "Gaming",
    user: "Alt+F4",
    avatar: "/images/2.png",
    caption: "Full squad on the couch tonight, snacks out, controllers in hand.",
    image: "/images/hobbies/gaming-2.png",
    likes: 210,
    comments: 47,
  },
  {
    hobby: "Art",
    user: "Noor A.",
    avatar: "/images/5.png",
    caption: "Finally getting the light right on this mountain landscape.",
    image: "/images/hobbies/art-2.png",
    likes: 58,
    comments: 12,
  },
  {
    hobby: "Fitness",
    user: "Kabir M.",
    avatar: "/images/1.png",
    caption: "Added another rep to today's curls, arms are done.",
    image: "/images/hobbies/fitness-2.png",
    likes: 91,
    comments: 18,
  },
];

function FeedMockup() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const post = POSTS[active];
  const nextPost = POSTS[(active + 1) % POSTS.length];
  const activeColor = getHobbyColor(post.hobby);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => {
      setActive((prev) => (prev + 1) % POSTS.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [active, reduceMotion]);

  return (
    <div className="w-full max-w-md mx-auto rounded-[1.75rem] border-8 border-white bg-white shadow-xl overflow-hidden">
      {/* App header */}
      <div className="px-5 pt-5 flex items-center gap-2">
        <Logo size={22} className="shrink-0" />
        <p className="text-pink-600 font-bnt text-2xl">HOBBYHIVE</p>
      </div>

      {/* In-app hobby tab bar, single scrollable row, never wraps. Each tab is themed in its own hobby color. */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto no-scrollbar">
        {POSTS.map((p, i) => {
          const isActive = i === active;
          const color = getHobbyColor(p.hobby);
          return (
            <button
              key={p.hobby}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={isActive}
              style={isActive ? { backgroundColor: color, borderColor: color } : undefined}
              className={`shrink-0 flex items-center gap-1.5 font-quick text-sm px-4 py-2 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 ${
                isActive
                  ? "text-white"
                  : "bg-beige text-chblack/60 border-transparent hover:border-pink-300"
              }`}
            >
              {!isActive && <HobbyGlyph color={color} size={10} />}
              {p.hobby}
            </button>
          );
        })}
      </div>

      {/* Feed: current post plus a faded peek of the next, so it reads as a scroll, not a single card */}
      <div className="relative bg-gradient-to-b from-somig/30 to-beige p-5 max-h-[420px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={post.hobby}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image src={post.avatar} alt="" fill sizes="40px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base leading-tight truncate">{post.user}</p>
                  <p className="text-chblack/50 text-sm leading-tight">{post.hobby}</p>
                </div>
              </div>

              <p className="text-base text-chblack/90 leading-snug">{post.caption}</p>

              <div className="relative mt-3 rounded-lg overflow-hidden aspect-[16/10]">
                <Image src={post.image} alt={`${post.hobby} post`} fill sizes="400px" className="object-cover" />
              </div>

              <div className="flex gap-5 mt-3 text-chblack/60">
                <span className="flex items-center gap-1.5 text-sm">
                  <Heart size={16} /> {post.likes}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <MessageCircle size={16} /> {post.comments}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <Send size={16} />
                </span>
              </div>
            </div>

            {/* Peek of the next post in the feed */}
            <div className="bg-white rounded-xl shadow-md p-5 mt-3 flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Image src={nextPost.avatar} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-base leading-tight truncate">{nextPost.user}</p>
                <p className="text-chblack/50 text-sm leading-tight">{nextPost.hobby}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Fade to suggest more below */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-beige to-transparent" />
      </div>

      {/* Bottom nav bar: home icon reflects the active hobby's theme color */}
      <div className="flex items-center justify-around border-t border-chgrey/10 px-5 py-3">
        <Home size={20} style={{ color: activeColor }} />
        <Search size={20} className="text-chblack/30" />
        <Bell size={20} className="text-chblack/30" />
        <User size={20} className="text-chblack/30" />
      </div>
    </div>
  );
}

export default FeedMockup;
