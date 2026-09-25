"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, Compass, MessageCircle, User, Settings, PenSquare, Bookmark, type LucideIcon } from "lucide-react";
import { getMyHobbies } from "@/api/api";
import { useCurrentUser } from "@/lib/currentUser";
import Logo from "@/components/brand/Logo";
import BeaAvatar from "@/components/bea/BeaAvatar";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { readLastHive } from "@/components/dashboard/useDashboardData";
import AccountMenu from "./AccountMenu";

const navItemClass = (active: boolean) =>
  `flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-[15px] font-quick transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
    active
      ? "bg-surface font-bold text-chblack shadow-sm ring-1 ring-line"
      : "font-semibold text-chblack/60 hover:bg-surface/70 hover:text-chblack"
  }`;

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link href={href} className={navItemClass(active)} aria-current={active ? "page" : undefined}>
      <Icon size={21} strokeWidth={active ? 2.4 : 2} className={active ? "text-brand" : undefined} />
      {label}
    </Link>
  );
}

/** Ask Bea in the hive you're looking at, else the last hive you opened, else your first hive. */
function AskBeaNavItem() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHive = pathname.match(/^\/hobbies\/([^/]+)/)?.[1] ?? null;
  const active = Boolean(currentHive) && searchParams.get("tab") === "ask";

  const open = async () => {
    let slug = currentHive ?? readLastHive();
    if (!slug) slug = (await getMyHobbies().catch(() => []))[0]?.slug ?? null;
    router.push(slug ? `/hobbies/${slug}?tab=ask` : "/explore");
  };

  return (
    <button type="button" onClick={open} className={navItemClass(active)} aria-current={active ? "page" : undefined}>
      <BeaAvatar size={22} />
      Ask Bea
    </button>
  );
}

function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: me } = useCurrentUser();

  return (
    <aside className="hidden lg:flex w-60 fixed inset-y-0 left-0 z-30 flex-col justify-between border-r border-line bg-canvas px-3 py-5">
      <div>
        <Link
          href="/dashboard"
          className="mb-7 flex items-center gap-2 rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Logo size={28} className="shrink-0" />
          <span className="font-bnt text-[26px] leading-none tracking-wide text-brand">HOBBYHIVE</span>
        </Link>

        <nav aria-label="Main" className="space-y-1">
          <NavItem href="/dashboard" label="Home" icon={Home} active={pathname === "/dashboard"} />
          <NavItem href="/explore" label="Explore" icon={Compass} active={pathname.startsWith("/explore")} />
          <AskBeaNavItem />
          <NavItem href="/messages" label="Messages" icon={MessageCircle} active={pathname.startsWith("/messages")} />
          <NotificationBell
            size={21}
            label="Notifications"
            iconClassName=""
            dropdownAlign="side"
            triggerClassName={navItemClass(false)}
          />
          <NavItem href="/saved" label="Saved" icon={Bookmark} active={pathname.startsWith("/saved")} />
          <NavItem
            href={me ? `/profile/${me.username}` : "/dashboard"}
            label="Profile"
            icon={User}
            active={me ? pathname.startsWith(`/profile/${me.username}`) : false}
          />
          <NavItem href="/settings/profile" label="Settings" icon={Settings} active={pathname.startsWith("/settings")} />
        </nav>

        <button
          type="button"
          onClick={() => router.push(`/dashboard?compose=${Date.now()}`)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 font-quick text-[15px] font-bold text-white shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <PenSquare size={18} /> New post
        </button>
      </div>

      <AccountMenu variant="full" />
    </aside>
  );
}

export default AppSidebar;
