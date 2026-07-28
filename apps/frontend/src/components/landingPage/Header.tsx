"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import Logo from "@/components/brand/Logo";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleMenuClose = () => setMenuOpen(false);

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="w-full bg-beige/90 backdrop-blur-md shadow-sm flex justify-between items-center px-4 sm:px-8 h-14 sm:h-16">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={28} className="shrink-0" />
          <span className="text-pink-600 font-bnt font-bold text-2xl sm:text-3xl">HOBBYHIVE</span>
        </Link>

        <div className="sm:hidden flex justify-end">
          <button onClick={toggleMenu} aria-label="Toggle menu">
            {menuOpen ? <FaTimes className="text-2xl text-chblack" /> : <FaBars className="text-2xl text-chblack" />}
          </button>
        </div>

        <motion.div
          className={`${
            menuOpen ? "block" : "hidden"
          } fixed top-0 right-0 w-2/3 sm:w-80 h-full bg-white shadow-lg flex flex-col justify-center items-center z-50`}
          initial={{ x: "100%" }}
          animate={{ x: menuOpen ? 0 : "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute top-4 right-4">
            <button onClick={toggleMenu} aria-label="Close menu">
              <FaTimes className="text-2xl text-chblack" />
            </button>
          </div>

          <Link href="/signin">
            <button
              className="font-quick font-semibold w-40 h-10 text-md text-white bg-black rounded-3xl mb-4 shadow-md"
              onClick={handleMenuClose}
            >
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button
              className="font-quick font-semibold w-40 h-10 text-md bg-white border-2 border-chblack/15 rounded-3xl"
              onClick={handleMenuClose}
            >
              Sign Up
            </button>
          </Link>
        </motion.div>

        <div className="hidden sm:flex flex-row gap-4">
          <Link href="/signin">
            <button className="font-quick font-semibold w-24 h-9 text-sm text-white bg-black rounded-3xl shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button className="font-quick font-semibold w-24 h-9 text-sm bg-white border-2 border-chblack/15 rounded-3xl hover:border-pink-500 hover:text-pink-600 transition-colors">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
      <div className="h-[3px] w-full bg-gradient-to-r from-pink-600 to-warber" />
    </div>
  );
}

export default Header;
