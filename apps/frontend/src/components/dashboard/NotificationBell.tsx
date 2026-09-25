"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AtSign, Bell, CornerDownRight, Heart, MessageCircle, Sparkles, UserPlus, type LucideIcon } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  getFollowStatus,
  acceptFollowRequest,
  rejectFollowRequest,
  type Notification,
} from "@/api/api";
import { getHobbyColor } from "@/lib/hobbyTheme";
import { timeAgo } from "@/lib/time";
import Skeleton from "@/components/ui/Skeleton";

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
    case "MENTION":
      return `${actorName} mentioned you`;
    case "REPLY":
      return `${actorName} replied to your comment`;
    default:
      return "New notification";
  }
}

/** Where a notification goes: the post it's about, or the person for follow requests. */
function notificationHref(n: Notification): string | null {
  if (n.post) return `/posts/${n.post.id}`;
  if (n.actor) return `/profile/${n.actor.username}`;
  return null;
}

const TYPE_BADGE: Record<Notification["type"], { icon: LucideIcon; className: string }> = {
  LIKE: { icon: Heart, className: "bg-rose-500" },
  COMMENT: { icon: MessageCircle, className: "bg-sky-500" },
  FOLLOW: { icon: UserPlus, className: "bg-brand" },
  NEW_POST: { icon: Sparkles, className: "bg-amber-500" },
  MENTION: { icon: AtSign, className: "bg-violet-500" },
  REPLY: { icon: CornerDownRight, className: "bg-sky-500" },
};

type RequestState = "pending" | "accepted" | "declined" | "busy";

interface NotificationBellProps {
  size?: number;
  iconClassName?: string;
  /** "above" opens the dropdown upward — required when the trigger sits in a bottom nav bar, otherwise the panel renders off-screen. "side" opens it to the right, for the sidebar. */
  dropdownAlign?: "below" | "above" | "side";
  /** When set, renders as a labelled nav row (sidebar) instead of a bare icon button. */
  label?: string;
  triggerClassName?: string;
}

function NotificationBell({
  size = 22,
  iconClassName = "text-chblack hover:text-chblack/60",
  dropdownAlign = "below",
  label,
  triggerClassName = "relative rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
}: NotificationBellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Follow requests still awaiting an answer, keyed by requester username — only those get inline Accept/Decline
  const [requests, setRequests] = useState<Record<string, RequestState>>({});

  useEffect(() => {
    const poll = () => getUnreadNotificationCount().then(setUnreadCount).catch(() => undefined);
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

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

  const toggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) return;

    setIsLoading(true);
    try {
      const page = await getNotifications();
      setNotifications(page.notifications);

      const requesters = [
        ...new Set(page.notifications.filter((n) => n.type === "FOLLOW" && n.actor).map((n) => n.actor!.username)),
      ].slice(0, 10);
      Promise.all(
        requesters.map((username) =>
          getFollowStatus(username)
            .then((rel) => [username, rel] as const)
            .catch(() => [username, null] as const)
        )
      ).then((pairs) => {
        const pending: Record<string, RequestState> = {};
        for (const [username, rel] of pairs) if (rel === "INCOMING_REQUEST") pending[username] = "pending";
        setRequests(pending);
      });

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

  const answerRequest = async (username: string, accept: boolean) => {
    setRequests((prev) => ({ ...prev, [username]: "busy" }));
    try {
      await (accept ? acceptFollowRequest(username) : rejectFollowRequest(username));
      setRequests((prev) => ({ ...prev, [username]: accept ? "accepted" : "declined" }));
    } catch {
      setRequests((prev) => ({ ...prev, [username]: "pending" }));
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button className={triggerClassName} onClick={toggleOpen} aria-label="Notifications" aria-expanded={isOpen}>
        <span className="relative inline-flex">
          <Bell size={size} className={`transition ${iconClassName}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-brand text-[10px] font-bold px-1 py-px rounded-full text-white min-w-[16px] text-center leading-tight ring-2 ring-surface">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
        {label}
      </button>

      {isOpen && (
        <motion.div
          className={`absolute bg-surface p-3 rounded-2xl shadow-xl shadow-black/5 w-[calc(100vw-2rem)] max-w-sm border border-line z-50 ${
            dropdownAlign === "side"
              ? "left-full top-0 ml-3"
              : dropdownAlign === "above"
              ? "right-0 bottom-full mb-2"
              : "right-0 top-full mt-2"
          }`}
          initial={{ opacity: 0, y: dropdownAlign === "above" ? 10 : dropdownAlign === "side" ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <p className="px-1 font-bnt text-2xl leading-none text-chblack">NOTIFICATIONS</p>
          {isLoading ? (
            <div className="mt-3 space-y-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-2.5 p-2">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-line" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <Skeleton className="h-2.5 w-4/5 rounded-full bg-line" />
                    <Skeleton className="h-2 w-1/4 rounded-full bg-canvas" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <p className="mt-3 px-1 pb-2 text-sm text-chblack/50">You&apos;re all caught up.</p>
          ) : (
            <ul className="mt-2 max-h-[26rem] space-y-0.5 overflow-y-auto text-sm">
              {notifications.map((n) => {
                const href = notificationHref(n);
                const badge = TYPE_BADGE[n.type];
                const requestState = n.type === "FOLLOW" && n.actor ? requests[n.actor.username] : undefined;
                return (
                  <li
                    key={n.id}
                    className={`relative flex items-start gap-2.5 rounded-xl p-2 transition-colors hover:bg-canvas ${n.isRead ? "" : "bg-brand/5"}`}
                  >
                    <Link
                      href={n.actor ? `/profile/${n.actor.username}` : href ?? "#"}
                      onClick={() => setIsOpen(false)}
                      className="relative z-10 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      aria-label={n.actor ? `${n.actor.name}'s profile` : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.actor?.avatarUrl || "/images/5.png"} alt="" className="h-10 w-10 rounded-full object-cover" />
                      {badge && (
                        <span className={`absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-white ring-2 ring-surface ${badge.className}`}>
                          <badge.icon size={10} strokeWidth={3} fill={n.type === "LIKE" ? "currentColor" : "none"} />
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      {/* The whole row is one link target; the avatar and buttons sit above it (z-10) */}
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className="block leading-snug text-chblack after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand"
                        >
                          {notificationMessage(n)}
                        </Link>
                      ) : (
                        <p className="leading-snug text-chblack">{notificationMessage(n)}</p>
                      )}
                      {n.post && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-chblack/55">
                          <span className="h-3 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: getHobbyColor(n.post.hobby.name) }} />
                          <span className="truncate">{n.post.content}</span>
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-chblack/40">{timeAgo(n.createdAt)}</p>

                      {requestState && n.actor && (
                        <div className="relative z-10 mt-2 flex gap-1.5">
                          {requestState === "accepted" ? (
                            <span className="text-xs font-quick font-bold text-emerald-600">Request accepted</span>
                          ) : requestState === "declined" ? (
                            <span className="text-xs font-quick font-bold text-chblack/45">Request declined</span>
                          ) : (
                            <>
                              <button
                                onClick={() => answerRequest(n.actor!.username, true)}
                                disabled={requestState === "busy"}
                                className="rounded-full bg-brand px-3.5 py-1 text-xs font-quick font-bold text-white hover:bg-pink-700 disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => answerRequest(n.actor!.username, false)}
                                disabled={requestState === "busy"}
                                className="rounded-full border border-line px-3.5 py-1 text-xs font-quick font-bold text-chblack/70 hover:bg-canvas disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default NotificationBell;
