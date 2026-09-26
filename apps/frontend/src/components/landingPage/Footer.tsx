import Link from "next/link";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { ArrowUpRight, Mail } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { HOBBY_COLORS } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#bea", label: "Ask Bea" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Hives",
    links: ["Dance", "Anime", "Gaming", "Singing", "Art", "Fitness"].map((name) => ({ href: "/signup", label: name, hive: name })),
  },
  {
    heading: "Legal",
    links: [
      { href: "/community-guidelines", label: "Community Guidelines" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];

const SOCIALS = [
  { href: "https://facebook.com", label: "Facebook", icon: <FaFacebook size="1rem" /> },
  { href: "https://twitter.com", label: "X", icon: <FaXTwitter size="1rem" /> },
  { href: "https://instagram.com", label: "Instagram", icon: <FaInstagram size="1rem" /> },
  { href: "https://linkedin.com", label: "LinkedIn", icon: <FaLinkedin size="1rem" /> },
];

function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#17161c] font-quick text-white">
      {/* A strip of every hive's colour along the top edge */}
      <div className="flex h-1 w-full" aria-hidden="true">
        {Object.values(HOBBY_COLORS).map((c) => (
          <span key={c} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="pointer-events-none absolute -top-32 left-1/4 h-64 w-[36rem] rounded-full bg-pink-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pt-14 sm:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex w-fit items-center gap-2">
              <Logo size={30} className="shrink-0" />
              <span className="font-bnt text-3xl text-pink-500">HOBBYHIVE</span>
            </Link>
            <p className="mt-4 max-w-xs font-pop text-sm leading-relaxed text-white/60">
              A home for every hobby. Pick your hives, post your progress, and keep showing up.
            </p>
            <a
              href="mailto:contactus@hobbyhive.com"
              className="mt-5 inline-flex items-center gap-2 font-pop text-sm text-white/75 transition-colors hover:text-white"
            >
              <Mail size={15} /> contactus@hobbyhive.com
            </a>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/70 ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:bg-pink-600 hover:text-white hover:ring-pink-600"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">{col.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="group inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
                      {"hive" in l && <HobbyIcon name={l.hive} size={15} style={{ color: HOBBY_COLORS[l.hive] }} />}
                      {l.label}
                      <ArrowUpRight size={13} className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-2 border-t border-white/10 py-6 text-sm text-white/45 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} HobbyHive. All rights reserved.</p>
          <p>
            Designed and developed by{" "}
            <a
              href="https://adiikj.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/80 transition-colors hover:text-pink-400"
            >
              Aditya
            </a>
          </p>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the bottom edge */}
      <p
        className="pointer-events-none relative -mb-[0.28em] select-none text-center font-bnt text-[22vw] leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.08)] lg:text-[16rem]"
        aria-hidden="true"
      >
        HOBBYHIVE
      </p>
    </footer>
  );
}

export default Footer;
