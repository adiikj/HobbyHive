"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, MessageCircle, User, Plus, type LucideIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/currentUser";
import { roundedHexagonPath } from "@/lib/hexagon";
import { BRAND_COLOR } from "@/lib/hobbyTheme";
import { MobileHiveTag } from "./CurrentHiveChip";

const HEX = roundedHexagonPath(50, 50, 46, 12);

function NavLink({ href, label, icon: Icon, active, tour }: { href: string; label: string; icon: LucideIcon; active: boolean; tour?: string }) {
  return (
    <Link
      href={href}
      data-tour={tour}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-quick font-bold transition-colors focus-visible:outline-none focus-visible:text-brand ${
        active ? "text-chblack" : "text-chblack/45 hover:text-chblack"
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} className={active ? "text-brand" : undefined} />
      {label}
    </Link>
  );
}

function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: me } = useCurrentUser();

  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-end border-t border-line bg-surface/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
    >
      <MobileHiveTag />
      <NavLink href="/dashboard" label="Home" icon={Home} active={pathname === "/dashboard"} />
      <NavLink href="/explore" label="Explore" icon={Compass} active={pathname.startsWith("/explore")} tour="nav-explore" />

      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={() => router.push(`/dashboard?compose=${Date.now()}`)}
          aria-label="New post"
          className="relative -mt-5 flex w-14 h-14 items-center justify-center transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-full"
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-md" aria-hidden="true">
            <path d={HEX} fill={BRAND_COLOR} />
          </svg>
          <Plus size={26} strokeWidth={2.6} className="relative text-white" />
        </button>
      </div>

      <NavLink href="/messages" label="Messages" icon={MessageCircle} active={pathname.startsWith("/messages")} />
      <NavLink
        href={me ? `/profile/${me.username}` : "/dashboard"}
        label="Profile"
        tour="nav-profile"
        icon={User}
        active={me ? pathname.startsWith(`/profile/${me.username}`) : false}
      />
    </nav>
  );
}

export default MobileNav;
