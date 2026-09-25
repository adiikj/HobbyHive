"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, LogOut, Monitor, Moon, MoreHorizontal, Settings, Sun, User } from "lucide-react";
import { logout } from "@/redux/authSlice";
import { useCurrentUser } from "@/lib/currentUser";
import { signOut } from "@/lib/auth";
import { useThemePreference, type ThemePreference } from "@/lib/theme";
import Skeleton from "@/components/ui/Skeleton";

interface AccountMenuProps {
  /** "full" = avatar + name row (sidebar); "avatar" = just the avatar (mobile top bar). */
  variant: "full" | "avatar";
}

/** The signed-in user's avatar, opening Profile / Settings / Log out. */
function AccountMenu({ variant }: AccountMenuProps) {
  const dispatch = useDispatch();
  const { user: me } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useThemePreference();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut();
    dispatch(logout());
    window.location.href = "/";
  };

  if (!me) {
    return variant === "full" ? (
      <div className="flex items-center gap-2.5 p-2" aria-hidden="true">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-line" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24 rounded-full bg-line" />
          <Skeleton className="h-2.5 w-16 rounded-full bg-line/70" />
        </div>
      </div>
    ) : (
      <Skeleton className="h-8 w-8 rounded-full bg-line" />
    );
  }

  const avatar = (size: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={me?.avatarUrl || "/images/5.png"} alt="" className={`${size} rounded-full object-cover shrink-0`} />
  );

  const itemBase =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:bg-canvas";
  const itemClass = `${itemBase} text-chblack/80 hover:text-chblack`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
        className={
          variant === "full"
            ? "flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            : "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        }
      >
        {avatar(variant === "full" ? "w-9 h-9" : "w-8 h-8")}
        {variant === "full" && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-chblack">{me?.name ?? "…"}</span>
              <span className="block truncate text-xs text-chblack/45">@{me?.username ?? ""}</span>
            </span>
            <MoreHorizontal size={18} className="shrink-0 text-chblack/40" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: variant === "full" ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={`absolute z-50 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-xl shadow-black/5 ${
              variant === "full" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"
            }`}
          >
            {me && (
              <Link role="menuitem" href={`/profile/${me.username}`} className={itemClass} onClick={() => setIsOpen(false)}>
                <User size={17} /> Your profile
              </Link>
            )}
            <Link role="menuitem" href="/saved" className={itemClass} onClick={() => setIsOpen(false)}>
              <Bookmark size={17} /> Saved
            </Link>
            <Link role="menuitem" href="/settings/profile" className={itemClass} onClick={() => setIsOpen(false)}>
              <Settings size={17} /> Settings
            </Link>
            <div className="my-1 h-px bg-line" />
            <div className="px-3 pb-1 pt-1.5">
              <p className="mb-1.5 text-[11px] font-quick font-bold uppercase tracking-wider text-chblack/40">Appearance</p>
              <div role="radiogroup" aria-label="Appearance" className="flex gap-1 rounded-full bg-canvas p-1">
                {(
                  [
                    ["light", "Light", Sun],
                    ["dark", "Dark", Moon],
                    ["system", "Auto", Monitor],
                  ] as [ThemePreference, string, typeof Sun][]
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={theme === value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-xs font-quick font-bold transition-colors ${
                      theme === value ? "bg-surface text-chblack shadow-sm" : "text-chblack/50 hover:text-chblack"
                    }`}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="my-1 h-px bg-line" />
            <button role="menuitem" type="button" onClick={handleLogout} className={`${itemBase} text-red-600 hover:text-red-700`}>
              <LogOut size={17} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AccountMenu;
