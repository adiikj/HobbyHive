"use client";

import { motion } from "framer-motion";
import { ChevronDown, CircleHelp, Quote, Search } from "lucide-react";
import BeaAvatar from "@/components/bea/BeaAvatar";

const POINTS = [
  {
    icon: <Search size={16} />,
    title: "Only what your hive shared",
    body: "Bea reads the posts and comments in your hive, not the whole internet.",
  },
  {
    icon: <Quote size={16} />,
    title: "Every answer has sources",
    body: "Each claim links to the post it came from, so you can read the original.",
  },
  {
    icon: <CircleHelp size={16} />,
    title: "Honest when she doesn't know",
    body: "If nobody has talked about it yet, she says so instead of making something up.",
  },
];

const SOURCES = [
  { n: 1, who: "Mira K.", text: "Drilling spots on a wall for 10 min before turns fixed my dizziness…" },
  { n: 2, who: "Jonah P.", text: "Half-turns first, then full. Rushing to doubles set me back weeks." },
];

function Cite({ n }: { n: number }) {
  return (
    <sup className="mx-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/25 text-[9px] font-bold text-amber-700 align-middle">
      {n}
    </sup>
  );
}

function BeaSpotlight() {
  return (
    <section className="relative w-full overflow-hidden bg-[#17161c] py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-[32rem] rounded-full bg-gradient-to-r from-warber to-pink-500 opacity-20 blur-3xl" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <p className="font-quick text-xs font-bold uppercase tracking-[0.18em] text-warber">Meet Bea</p>
          <h2 className="mt-2 font-bnt text-white text-4xl sm:text-5xl leading-[1.02]">
            Ask your hive anything
          </h2>
          <p className="font-pop mt-4 text-white/70 max-w-md">
            Bea is HobbyHive&apos;s resident bee. She&apos;s read everything your hive has posted, so
            you can ask what&apos;s actually worked for people like you.
          </p>

          <ul className="mt-8 space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-warber">{p.icon}</span>
                <div>
                  <p className="font-quick font-bold text-white">{p.title}</p>
                  <p className="font-pop text-sm text-white/60">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 border-b border-chblack/10 pb-3">
            <BeaAvatar size={40} />
            <div className="min-w-0">
              <p className="font-semibold text-chblack">Bea</p>
              <p className="truncate text-xs text-chblack/50">Answers only from what the Dance hive has shared.</p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-pink-600 px-4 py-2.5 font-pop text-sm text-white">
              How do I stop getting dizzy on pirouettes?
            </p>
          </div>

          <div className="mt-3 flex items-start gap-2.5">
            <BeaAvatar size={28} />
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-beige px-4 py-3 font-pop text-sm text-chblack">
              <p>
                Two things come up again and again here. Practise spotting against a wall before you
                turn at all
                <Cite n={1} />, and build up from half-turns instead of jumping to doubles
                <Cite n={2} />.
              </p>

              <div className="mt-3 space-y-2">
                {SOURCES.map((s) => (
                  <div key={s.n} className="flex gap-2 rounded-xl border border-chblack/10 bg-white p-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-600/15 text-[11px] font-bold text-pink-600">
                      {s.n}
                    </span>
                    <span className="min-w-0 text-xs">
                      <span className="block text-chblack/50">
                        <span className="font-semibold text-chblack/80">{s.who}</span> in a post
                      </span>
                      <span className="line-clamp-1 text-chblack/80">{s.text}</span>
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-3 flex items-center gap-1 border-t border-chblack/10 pt-2 font-quick text-xs font-bold text-chblack/50">
                <ChevronDown size={14} /> Why this answer?
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default BeaSpotlight;
