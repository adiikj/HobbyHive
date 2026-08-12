"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listConversations, type ConversationSummary } from "@/api/api";
import { getSocket } from "@/lib/socket";

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MessagesList() {
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
    <div className="min-h-screen bg-gradient-to-r from-somig to-beige p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-full bg-white shadow hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bnt text-3xl text-chblack">Messages</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center bg-white rounded-xl shadow-md p-8">
            <p className="font-semibold text-lg">No conversations yet.</p>
            <p className="text-gray-600 mt-1">Message someone from their profile to start one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md divide-y divide-gray-100">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/messages/${c.id}`)}
                className="flex items-center gap-3 w-full text-left p-4 hover:bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.otherUser?.avatarUrl || "/images/5.png"}
                  alt={c.otherUser?.name ?? "User"}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-pop font-semibold text-chblack truncate">
                      {c.otherUser?.name ?? "Unknown user"}
                    </p>
                    {c.lastMessage && (
                      <span className="font-pop text-xs text-chblack/40 shrink-0">
                        {formatTime(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="font-pop text-sm text-chblack/60 truncate">
                    {c.lastMessage?.content ?? "No messages yet"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="bg-pink-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0">
                    {c.unreadCount > 9 ? "9+" : c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesList;
