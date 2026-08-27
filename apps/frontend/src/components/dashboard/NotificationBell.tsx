"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  type Notification,
} from "@/api/api";
import { timeAgo } from "@/lib/time";

const POLL_INTERVAL_MS = 30000;

function notificationMessage(n: Notification): string {
  const actorName = n.actor?.name ?? "Someone";
  switch (n.type) {
    case "LIKE":
      return `${actorName} liked your post`;
    case "COMMENT":
      return `${actorName} commented on your post`;
    case "FOLLOW":
      return `${actorName} wants to follow you`;
    case "NEW_POST":
      return `${actorName} posted in ${n.post?.hobby.name ?? "a hobby you follow"}`;
    default:
      return "New notification";
  }
}

interface NotificationBellProps {
  size?: number;
  iconClassName?: string;
  /** "above" opens the dropdown upward — required when the trigger sits in a bottom nav bar, otherwise the panel renders off-screen. */
  dropdownAlign?: "below" | "above";
}

function NotificationBell({
  size = 22,
  iconClassName = "text-chblack hover:text-chblack/60",
  dropdownAlign = "below",
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const poll = () => getUnreadNotificationCount().then(setUnreadCount).catch(() => undefined);
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const toggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) return;

    setIsLoading(true);
    try {
      const page = await getNotifications();
      setNotifications(page.notifications);
      if (unreadCount > 0) {
        await markAllNotificationsRead();
        setUnreadCount(0);
      }
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={size} className={`transition ${iconClassName}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-1.5 py-0.5 rounded-full text-white min-w-[18px] text-center leading-tight">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <motion.div
          className={`absolute right-0 bg-white p-3.5 rounded-2xl shadow-lg w-[calc(100vw-2rem)] max-w-xs border border-chgrey/10 z-50 ${
            dropdownAlign === "above" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          initial={{ opacity: 0, y: dropdownAlign === "above" ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <p className="font-quick text-sm font-semibold text-chblack">Notifications</p>
          {isLoading ? (
            <div className="flex justify-center py-5">
              <div className="w-4 h-4 border-t-2 border-pink-600 rounded-full animate-spin" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <p className="mt-2.5 text-xs text-chblack/50">Nothing yet.</p>
          ) : (
            <ul className="mt-2.5 space-y-1 text-xs max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => n.actor && router.push(`/profile/${n.actor.username}`)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                      n.isRead ? "bg-beige hover:bg-beige/70" : "bg-pink-50 hover:bg-pink-100"
                    }`}
                  >
                    <p className="text-chblack">{notificationMessage(n)}</p>
                    <p className="text-[11px] text-chblack/40 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default NotificationBell;
