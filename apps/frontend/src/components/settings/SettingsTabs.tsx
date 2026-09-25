"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, UserRound } from "lucide-react";

const TABS = [
  { href: "/settings/profile", label: "Profile", icon: UserRound },
  { href: "/settings/hobbies", label: "Hives", icon: Sparkles },
];

/** Switches between the settings pages; each page renders it under its header. */
function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="mb-5 flex gap-1 rounded-full border border-line bg-surface p-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-quick font-bold transition-colors ${
              isActive ? "bg-chblack text-canvas" : "text-chblack/55 hover:text-chblack"
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default SettingsTabs;
