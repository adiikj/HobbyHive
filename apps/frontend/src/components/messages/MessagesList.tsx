"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listConversations, type ConversationSummary } from "@/api/api";
import { getSocket } from "@/lib/socket";
import Skeleton from "@/components/ui/Skeleton";

interface MessagesListProps {
  activeConversationId?: string | null;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MessagesList({ activeConversationId = null }: MessagesListProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listConversations()
      .then(setConversations)
      .finally(() => setIsLoading(false));

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      listConversations().then(setConversations).catch(() => undefined);
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-r from-somig to-beige">
      <div className="flex items-center gap-2 px-4 py-4 shrink-0">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-1 -ml-1 rounded-full hover:bg-white/40 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bnt text-2xl text-chblack">Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-14 h-14 rounded-full bg-white/50 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 rounded-full bg-white/50 w-2/5" />
                  <Skeleton className="h-3 rounded-full bg-white/30 w-4/5" />
                </div>
              </div>
            ))}
          </>
        ) : conversations.length === 0 ? (
          <div className="text-center px-6 py-10">
            <p className="font-quick font-semibold text-chblack">No conversations yet</p>
            <p className="font-pop text-sm text-chblack/50 mt-1">
              Message someone from their profile to start one.
            </p>
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/messages/${c.id}`)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 transition-colors focus-visible:outline-none focus-visible:bg-white/50 ${
                  isActive ? "bg-white/60" : "hover:bg-white/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.otherUser?.avatarUrl || "/images/5.png"}
                  alt={c.otherUser?.name ?? "User"}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`font-pop truncate ${
                        c.unreadCount > 0 ? "font-semibold text-chblack" : "font-medium text-chblack/90"
                      }`}
                    >
                      {c.otherUser?.name ?? "Unknown user"}
                    </p>
                    {c.lastMessage && (
                      <span className="font-pop text-[11px] text-chblack/40 shrink-0">
                        {formatTime(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-pop text-sm truncate ${
                      c.unreadCount > 0 ? "text-chblack/80 font-medium" : "text-chblack/50"
                    }`}
                  >
                    {c.lastMessage?.content ?? "No messages yet"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="bg-pink-600 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shrink-0">
                    {c.unreadCount > 9 ? "9+" : c.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MessagesList;
