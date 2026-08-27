"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Home, Compass, Users, MessageCircle, User, Settings, LogOut } from "lucide-react";
import { logout } from "@/redux/authSlice";
import { getUserProfile, type Profile } from "@/api/api";
import Logo from "@/components/brand/Logo";

function AppSidebar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<Profile | null>(null);

  useEffect(() => {
    getUserProfile().then(setMe).catch(() => undefined);
  }, []);

  const handleLogout = () => {
    Cookies.remove("accessToken");
    dispatch(logout());
    window.location.href = "/";
  };

  const isFollowingFeed = pathname === "/dashboard" && searchParams.get("feed") === "following";
  const isHome = pathname === "/dashboard" && !isFollowingFeed;
  const isExplore = pathname.startsWith("/explore");
  const isMessages = pathname.startsWith("/messages");
  const isProfile = me ? pathname.startsWith(`/profile/${me.username}`) : false;
  const isSettings = pathname.startsWith("/settings");

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
      active ? "bg-pink-600 text-white font-semibold" : "text-chblack/70 hover:text-pink-600"
    }`;

  return (
    <aside className="hidden lg:flex w-52 p-4 flex-col justify-between bg-white fixed top-0 left-0 h-full z-30">
      <div>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 mb-7 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg"
        >
          <Logo size={22} className="shrink-0" />
          <span className="text-pink-600 font-bnt font-bold text-xl leading-none">HOBBYHIVE</span>
        </button>
        <nav className="space-y-0.5">
          <button className={navLinkClass(isHome)} onClick={() => router.push("/dashboard")}>
            <Home size={18} /> Home
          </button>
          <button className={navLinkClass(isExplore)} onClick={() => router.push("/explore")}>
            <Compass size={18} /> Explore
          </button>
          <button className={navLinkClass(isFollowingFeed)} onClick={() => router.push("/dashboard?feed=following")}>
            <Users size={18} /> Friends
          </button>
          <button className={navLinkClass(isMessages)} onClick={() => router.push("/messages")}>
            <MessageCircle size={18} /> Messages
          </button>
          <button
            className={navLinkClass(isProfile)}
            onClick={() => me && router.push(`/profile/${me.username}`)}
          >
            <User size={18} /> Profile
          </button>
          <button className={navLinkClass(isSettings)} onClick={() => router.push("/settings/hobbies")}>
            <Settings size={18} /> Settings
          </button>
        </nav>
      </div>

      <div className="border-t border-chgrey/10 pt-3">
        <button
          onClick={() => me && router.push(`/profile/${me.username}`)}
          className="flex items-center gap-2.5 px-2.5 py-2 w-full text-left rounded-lg hover:bg-beige transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={me?.avatarUrl || "/images/5.png"} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-chblack truncate">{me?.name ?? "..."}</span>
            <span className="block text-xs text-chblack/40 truncate">@{me?.username ?? ""}</span>
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 mt-0.5 text-chblack/50 hover:text-red-600 w-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
