"use client";

import { MotionConfig, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import HeroShowcase from "./HeroShowcase";
import Comparison from "./Comparison";
import FeatureGrid from "./FeatureGrid";
import BeaSpotlight from "./BeaSpotlight";
import Featured from "./Featured";
import HowItWorks from "./HowItWorks";
import FAQ from "./FAQ";
import FinalCTA from "./FinalCTA";

const HIGHLIGHTS = ["Weekly challenges", "Streaks & progress logs", "Live rooms", "Events", "Ask Bea"];

function Hero() {
  return (
    // "user": framer skips transform animations for people who prefer reduced motion
    <MotionConfig reducedMotion="user">
      <div className="w-full bg-gradient-to-r from-somig to-beige">
        <section className="relative w-full px-6 sm:px-10 md:px-16 lg:px-20 pt-14 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
          <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 font-quick text-xs font-bold text-chblack/70 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-pink-600" /> 12 hobby hives, one for each thing you love
              </p>
              <h1 className="mt-5 font-bnt font-bold text-chblack leading-[1.02] text-5xl sm:text-6xl md:text-7xl">
                Your hobby. <span className="text-pink-600">Your hive.</span>
              </h1>
              <p className="font-pop mt-6 text-base sm:text-lg text-chblack/70 max-w-lg mx-auto lg:mx-0">
                Pick dance, anime, gaming, art, or whatever you&apos;re into. HobbyHive gives it its
                own hive: a feed of only that, weekly challenges, a streak that tracks your progress,
                and people who get it.
              </p>

              <ul className="mt-6 flex flex-wrap justify-center lg:justify-start gap-2 max-w-lg mx-auto lg:mx-0">
                {HIGHLIGHTS.map((h) => (
                  <li key={h} className="rounded-full border border-chblack/10 bg-white/60 px-3 py-1 font-quick text-xs font-semibold text-chblack/70">
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="font-quick font-semibold px-8 py-3 rounded-full bg-black text-white shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Join HobbyHive
                </Link>
                <a
                  href="#how-it-works"
                  className="group font-quick font-semibold px-6 py-3 rounded-full border-2 border-chblack/15 text-chblack flex items-center gap-1.5 hover:border-pink-500 hover:text-pink-600 transition-colors"
                >
                  See how it works
                  <ChevronDown size={18} className="transition-transform group-hover:translate-y-0.5" />
                </a>
              </div>

              <div className="mt-6 flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-2.5">
                  {["/images/1.png", "/images/2.png", "/images/3.png", "/images/4.png"].map((src) => (
                    <div key={src} className="relative w-8 h-8 rounded-full border-2 border-beige overflow-hidden">
                      <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                    </div>
                  ))}
                </div>
                <p className="font-pop text-sm text-chblack/60">Real hobbyists, already posting</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <HeroShowcase />
            </motion.div>
          </div>
        </section>

        <Comparison />

        <div id="features" className="scroll-mt-16">
          <FeatureGrid />
        </div>

        <div id="bea" className="scroll-mt-16">
          <BeaSpotlight />
        </div>

        <div id="hives" className="scroll-mt-16">
          <Featured />
        </div>

        <div id="how-it-works" className="scroll-mt-16">
          <HowItWorks />
        </div>

        <div id="faq" className="scroll-mt-16">
          <FAQ />
        </div>
        <FinalCTA />
      </div>
    </MotionConfig>
  );
}

export default Hero;
