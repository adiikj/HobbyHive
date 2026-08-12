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

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface NotificationBellProps {
  size?: number;
  iconClassName?: string;
}

function NotificationBell({ size = 28, iconClassName = "text-black hover:text-gray-600" }: NotificationBellProps) {
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
      <button className="relative" onClick={toggleOpen}>
        <Bell size={size} className={`transition ${iconClassName}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1.5 py-0.5 rounded-full text-white min-w-[18px] text-center leading-tight">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <motion.div
          className="absolute top-10 right-0 bg-white p-4 rounded-2xl shadow-lg w-[calc(100vw-2rem)] max-w-xs border border-gray-300 z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold">🔔 Notifications</p>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-t-2 border-pink-600 rounded-full animate-spin" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Nothing yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => n.actor && router.push(`/profile/${n.actor.username}`)}
                  className={`p-3 rounded-lg cursor-pointer ${n.isRead ? "bg-gray-50" : "bg-pink-50"}`}
                >
                  <p>{notificationMessage(n)}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
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
