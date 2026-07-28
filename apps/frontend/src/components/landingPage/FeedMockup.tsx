"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, MessageCircle, Send, Home, Search, Bell, User } from "lucide-react";

interface MockPost {
  hobby: string;
  user: string;
  initials: string;
  caption: string;
  image: string;
  likes: number;
  comments: number;
}

const POSTS: MockPost[] = [
  {
    hobby: "Dance",
    user: "Mira K.",
    initials: "MK",
    caption: "Finally landed the fouetté combo without wobbling. 6 tries, worth it.",
    image: "/images/hobbies/dance-2.png",
    likes: 42,
    comments: 9,
  },
  {
    hobby: "Anime",
    user: "Devraj S.",
    initials: "DS",
    caption: "Ranking every OP this season — Frieren is not #1 and I have a whiteboard to prove it.",
    image: "/images/hobbies/anime-2.png",
    likes: 128,
    comments: 31,
  },
  {
    hobby: "Singing",
    user: "Priya R.",
    initials: "PR",
    caption: "Open mic Tuesday went better than expected. Recorded the whole set.",
    image: "/images/hobbies/singing-2.png",
    likes: 76,
    comments: 14,
  },
  {
    hobby: "Gaming",
    user: "Alt+F4",
    initials: "AF",
    caption: "Cleared the raid on the first pull. Screenshotting this forever.",
    image: "/images/hobbies/gaming-2.png",
    likes: 210,
    comments: 47,
  },
  {
    hobby: "Art",
    user: "Noor A.",
    initials: "NA",
    caption: "Ink wash study, three hours in. Still not happy with the water but keeping it.",
    image: "/images/hobbies/art-2.png",
    likes: 58,
    comments: 12,
  },
  {
    hobby: "Fitness",
    user: "Kabir M.",
    initials: "KM",
    caption: "5k PR by 40 seconds this morning. Legs are done for the week.",
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

  return (
    <div className="w-full max-w-md mx-auto rounded-[1.75rem] border-8 border-white bg-white shadow-xl overflow-hidden">
      {/* App header */}
      <div className="px-5 pt-5">
        <p className="text-pink-600 font-bnt text-2xl">HOBBYHIVE</p>
      </div>

      {/* In-app hobby tab bar — single scrollable row, never wraps */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto no-scrollbar">
        {POSTS.map((p, i) => {
          const isActive = i === active;
          return (
            <button
              key={p.hobby}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={isActive}
              className={`shrink-0 font-quick text-sm px-4 py-2 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 ${
                isActive
                  ? "bg-pink-600 text-white border-pink-600"
                  : "bg-beige text-chblack/60 border-transparent hover:border-pink-300"
              }`}
            >
              {p.hobby}
            </button>
          );
        })}
      </div>

      {/* Feed — current post plus a faded peek of the next, so it reads as a scroll, not a single card */}
      <div className="relative bg-gradient-to-b from-somig/30 to-beige px-5 pb-5 max-h-[420px] overflow-hidden">
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
                <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-semibold text-sm shrink-0">
                  {post.initials}
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
              <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-semibold text-sm shrink-0">
                {nextPost.initials}
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

      {/* Bottom nav bar */}
      <div className="flex items-center justify-around border-t border-chgrey/10 px-5 py-3">
        <Home size={20} className="text-pink-600" />
        <Search size={20} className="text-chblack/30" />
        <Bell size={20} className="text-chblack/30" />
        <User size={20} className="text-chblack/30" />
      </div>
    </div>
  );
}

export default FeedMockup;
