"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Home, Compass, Users, User, LogOut } from "lucide-react";
import { logout } from "@/redux/authSlice";
import { getUserProfile, type Profile } from "@/api/api";
import NotificationBell from "@/components/dashboard/NotificationBell";

function MobileNav() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Profile | null>(null);

  useEffect(() => {
    getUserProfile().then(setMe).catch(() => undefined);
  }, []);

  const handleLogout = () => {
    Cookies.remove("accessToken");
    dispatch(logout());
    window.location.href = "/";
  };

  const iconClass = (active: boolean) =>
    `rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
      active ? "text-pink-600" : "text-chblack/50 hover:text-pink-600"
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white border-t border-chgrey/10 px-2 py-2.5">
      <button aria-label="Home" className={iconClass(pathname === "/dashboard")} onClick={() => router.push("/dashboard")}>
        <Home size={20} />
      </button>
      <button
        aria-label="Friends"
        className={iconClass(false)}
        onClick={() => router.push("/dashboard?feed=following")}
      >
        <Users size={20} />
      </button>
      <NotificationBell size={20} iconClassName="text-chblack/50 hover:text-pink-600" dropdownAlign="above" />
      <button aria-label="Explore" className={iconClass(pathname.startsWith("/explore"))} onClick={() => router.push("/explore")}>
        <Compass size={20} />
      </button>
      <button
        aria-label="Profile"
        className={iconClass(me ? pathname.startsWith(`/profile/${me.username}`) : false)}
        onClick={() => me && router.push(`/profile/${me.username}`)}
      >
        <User size={20} />
      </button>
      <button aria-label="Logout" className="text-red-600 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" onClick={handleLogout}>
        <LogOut size={20} />
      </button>
    </nav>
  );
}

export default MobileNav;
