"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import Logo from "@/components/brand/Logo";

const SECTIONS = [
  { href: "/#features", label: "Features" },
  { href: "/#bea", label: "Ask Bea" },
  { href: "/#hives", label: "Hives" },
  { href: "/#faq", label: "FAQ" },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleMenuClose = () => setMenuOpen(false);

  return (
    <>
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

          <nav className="hidden md:flex items-center gap-7" aria-label="Sections">
            {SECTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="font-quick font-semibold text-sm text-chblack/70 hover:text-pink-600 transition-colors">
                {s.label}
              </Link>
            ))}
          </nav>

          <div className="hidden sm:flex flex-row gap-4">
            <Link href="/signin">
              <button className="font-quick font-semibold w-24 h-9 text-sm text-white bg-black rounded-3xl shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <button className="font-quick font-semibold w-24 h-9 text-sm bg-white border-2 border-chblack/15 rounded-3xl hover:border-pink-500 hover:text-pink-600 transition-colors">
                Sign up
              </button>
            </Link>
          </div>
        </div>
        <div className="h-[3px] w-full bg-gradient-to-r from-pink-600 to-warber" />
      </div>

      {/* Rendered outside the backdrop-blur header bar: backdrop-filter creates a new
          containing block for fixed descendants, which was confining this panel to the
          header's height instead of the full viewport. */}
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

        <nav className="flex flex-col items-center gap-5 mb-10" aria-label="Sections">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} onClick={handleMenuClose} className="font-quick font-semibold text-lg text-chblack/80">
              {s.label}
            </Link>
          ))}
        </nav>

        <Link href="/signin">
          <button
            className="font-quick font-semibold w-40 h-10 text-md text-white bg-black rounded-3xl mb-4 shadow-md"
            onClick={handleMenuClose}
          >
            Sign in
          </button>
        </Link>
        <Link href="/signup">
          <button
            className="font-quick font-semibold w-40 h-10 text-md bg-white border-2 border-chblack/15 rounded-3xl"
            onClick={handleMenuClose}
          >
            Sign up
          </button>
        </Link>
      </motion.div>
    </>
  );
}

export default Header;
