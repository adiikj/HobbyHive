"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import FeedMockup from "./FeedMockup";
import About from "./About";
import Comparison from "./Comparison";
import Banner from "./Banner";
import Featured from "./Featured";
import HowItWorks from "./HowItWorks";
import FAQ from "./FAQ";
import Newsletter from "./Newsletter";

function Hero() {
  return (
    <div className="w-full bg-gradient-to-r from-somig to-beige">
      <section className="relative w-full px-6 sm:px-10 md:px-16 lg:px-20 pt-14 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="font-bnt font-bold text-chblack leading-[1.02] text-5xl sm:text-6xl md:text-7xl">
              One hobby. <span className="text-pink-600">One feed.</span>
            </h1>
            <p className="font-pop mt-6 text-base sm:text-lg text-chblack/70 max-w-lg mx-auto lg:mx-0">
              Pick dance, anime, gaming, art, or whatever you&apos;re into. HobbyHive shows you
              that — and only that. No mixed feed, no algorithm guessing what else you might like.
            </p>
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <FeedMockup />
          </motion.div>
        </div>
      </section>

      <About />
      <Comparison />
      <Banner />
      <Featured />

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <FAQ />
      <Newsletter />
    </div>
  );
}

export default Hero;
