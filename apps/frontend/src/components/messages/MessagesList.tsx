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
    <div className="flex flex-col h-full bg-canvas font-pop">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4 shrink-0 lg:pt-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-1 -ml-1 rounded-full hover:bg-surface lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bnt text-5xl leading-[0.9] text-chblack">MESSAGES</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-12 h-12 rounded-full bg-line shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 rounded-full bg-line w-2/5" />
                  <Skeleton className="h-3 rounded-full bg-line/60 w-4/5" />
                </div>
              </div>
            ))}
          </>
        ) : conversations.length === 0 ? (
          <div className="mx-2 mt-2 rounded-2xl border border-dashed border-chblack/15 text-center px-6 py-10">
            <p className="font-bnt text-3xl text-chblack">NO CHATS YET</p>
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
                className={`flex items-center gap-3 w-full text-left rounded-2xl px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isActive ? "bg-surface shadow-sm ring-1 ring-line" : "hover:bg-surface/70"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.otherUser?.avatarUrl || "/images/5.png"}
                  alt={c.otherUser?.name ?? "User"}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
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
                  <span className="bg-brand text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shrink-0">
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
