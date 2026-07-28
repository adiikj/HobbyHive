"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";

const QUESTIONS = [
  {
    q: "Can I pick more than one hobby?",
    a: "Yes. Pick as many as you're into. Your feed blends just those, nothing else.",
  },
  {
    q: "What if my hobby isn't listed yet?",
    a: "We're launching with six communities and adding more as they grow. Request yours from settings once you're in.",
  },
  {
    q: "Does it cost anything to join?",
    a: "No, signing up is free.",
  },
  {
    q: "Do I need to follow people to see content?",
    a: "No. Your feed is scoped by hobby, not by who you follow. Follow people if you want a curated \"following\" view too, but the hobby feed works from day one.",
  },
  {
    q: "Can I change my hobbies later?",
    a: "Yes, add or drop hobbies anytime from settings. No penalty, your feed just follows.",
  },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

interface FAQItemProps {
  q: string;
  a: string;
  index: number;
  start: boolean;
  reduceMotion: boolean;
}

function FAQItem({ q, a, index, start, reduceMotion }: FAQItemProps) {
  const [phase, setPhase] = useState<"idle" | "question" | "typing" | "done">("idle");
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    if (reduceMotion) {
      setPhase("done");
      return;
    }

    const stagger = index * 1100;
    const questionTimer = setTimeout(() => setPhase("question"), stagger);
    const typingTimer = setTimeout(() => setPhase("typing"), stagger + 350);
    const doneTimer = setTimeout(() => setPhase("done"), stagger + 1100);

    return () => {
      clearTimeout(questionTimer);
      clearTimeout(typingTimer);
      clearTimeout(doneTimer);
    };
  }, [start, reduceMotion, index]);

  const visible = phase !== "idle";
  const showBubble = phase === "typing" || phase === "done";

  return (
    <div>
      {/* Question: incoming message */}
      <motion.div
        className="flex items-end gap-2"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative w-8 h-8 rounded-full shadow-sm shrink-0 overflow-hidden">
          <Image src="/images/4.png" alt="" fill sizes="32px" className="object-cover" />
        </div>
        <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm px-4 py-2.5 max-w-[85%]">
          <p className="font-quick font-semibold text-sm text-chblack">{q}</p>
        </div>
      </motion.div>

      {/* Answer: HobbyHive reply, typing dots then the message types itself out */}
      <div className="flex justify-end mt-2">
        {showBubble && (
          <motion.div
            className="bg-pink-600 text-white rounded-2xl rounded-br-sm shadow-sm max-w-[85%]"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {phase === "typing" ? <TypingDots /> : <p className="font-pop text-sm px-4 py-2.5">{a}</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FAQ() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.2 });
  const reduceMotion = !!useReducedMotion();

  return (
    <section className="w-full bg-gradient-to-r from-somig to-beige py-16 sm:py-24 px-6 sm:px-10 md:px-16 lg:px-20">
      <div className="max-w-xl mx-auto">
        <h2 className="font-bnt text-chblack text-3xl sm:text-4xl text-center mb-10 sm:mb-14">
          Questions people actually ask
        </h2>

        <div ref={containerRef} className="space-y-5">
          {QUESTIONS.map((item, i) => (
            <FAQItem key={item.q} q={item.q} a={item.a} index={i} start={inView} reduceMotion={reduceMotion} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
