"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Heart, MessageCircle, Users } from "lucide-react";

const REASONS = [
  {
    heading: "One hobby, zero noise",
    description: "Your feed only ever shows the hobby you picked.",
  },
  {
    heading: "Real communities, not hashtags",
    description: "Every hobby gets its own room to post and chat in.",
  },
  {
    heading: "Made by people who do the thing",
    description: "Built so you go do your hobby, then come back to show it off.",
  },
];

function Badge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-600 text-white text-[11px] font-quick font-bold shrink-0">
      {n}
    </span>
  );
}

function Banner() {
  const reduceMotion = useReducedMotion();

  const listVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: Variants = reduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: { opacity: 0, x: 16 }, visible: { opacity: 1, x: 0 } };

  return (
    <section className="w-full bg-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-bnt text-chblack text-3xl sm:text-4xl mb-10 sm:mb-14 text-center">Why HobbyHive</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Annotated feed card */}
          <motion.div
            className="relative max-w-xs mx-auto"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 16 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="absolute -top-2.5 -left-2.5 z-10">
              <Badge n={1} />
            </span>
            <span className="absolute top-1/2 -translate-y-1/2 -right-2.5 z-10">
              <Badge n={2} />
            </span>
            <span className="absolute -bottom-2.5 left-8 z-10">
              <Badge n={3} />
            </span>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <Image src="/images/3.png" alt="" fill sizes="32px" className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-chblack">Mira K.</p>
                  <span className="inline-block text-[10px] font-quick font-semibold text-white px-2 py-0.5 rounded-full bg-pink-600">
                    Dance
                  </span>
                </div>
              </div>
              <p className="text-sm text-chblack/80 mb-2">Landed the fouetté combo, finally 🎉</p>
              <div className="flex items-center gap-1.5 text-xs text-chblack/60 bg-beige rounded-full px-3 py-1.5 w-fit mb-3">
                <Users size={13} /> Dance Room · 214 members
              </div>
              <div className="flex gap-4 text-chblack/60">
                <span className="flex items-center gap-1.5 text-xs">
                  <Heart size={15} /> 42
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <MessageCircle size={15} /> 9
                </span>
              </div>
            </div>
          </motion.div>

          {/* Callouts */}
          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={listVariants}
          >
            {REASONS.map((reason, i) => (
              <motion.div
                key={reason.heading}
                className="flex gap-3"
                variants={itemVariants}
                transition={{ duration: 0.4 }}
              >
                <div className="pt-0.5">
                  <Badge n={i + 1} />
                </div>
                <div>
                  <h3 className="font-quick font-bold text-chblack">{reason.heading}</h3>
                  <p className="font-pop text-chblack/70 text-sm mt-0.5">{reason.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Banner;
