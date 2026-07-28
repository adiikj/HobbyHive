"use client";

import { motion, useReducedMotion } from "framer-motion";

interface StepProps {
  visual: React.ReactNode;
  title: string;
  description: string;
  showArrow?: boolean;
  index?: number;
}

function Step({ visual, title, description, showArrow = false, index = 0 }: StepProps) {
  const reduceMotion = useReducedMotion();
  const delay = index * 0.15;

  return (
    <motion.div
      className="relative flex flex-col items-center text-center"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <div className="h-20 flex items-center justify-center mb-5">{visual}</div>
      <h3 className="font-quick font-bold text-xl text-chblack mb-2">{title}</h3>
      <p className="font-pop text-chblack/70 text-sm sm:text-base max-w-[220px]">{description}</p>

      {showArrow && (
        <motion.span
          className="hidden sm:block absolute top-8 -right-4 lg:-right-5 text-chblack/20 text-2xl"
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: delay + 0.3 }}
        >
          →
        </motion.span>
      )}
    </motion.div>
  );
}

export default Step;
