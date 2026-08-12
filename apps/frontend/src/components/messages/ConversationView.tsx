"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getMessages,
  sendMessage,
  markConversationRead,
  listConversations,
  type DirectMessage,
  type FollowUser,
} from "@/api/api";
import { getSocket } from "@/lib/socket";

interface ConversationViewProps {
  conversationId: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ConversationView({ conversationId }: ConversationViewProps) {
  const router = useRouter();
  const [otherUser, setOtherUser] = useState<FollowUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);

    Promise.all([getMessages(conversationId), listConversations()])
      .then(([page, conversations]) => {
        setMessages(page.messages);
        const match = conversations.find((c) => c.id === conversationId);
        setOtherUser(match?.otherUser ?? null);
      })
      .finally(() => setIsLoading(false));

    markConversationRead(conversationId).catch(() => undefined);

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (payload: { conversationId: string; message: DirectMessage }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, payload.message]);
      markConversationRead(conversationId).catch(() => undefined);
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim()) return;

    setIsSending(true);
    try {
      const message = await sendMessage(conversationId, draft);
      setMessages((prev) => [...prev, message]);
      setDraft("");
    } catch {
      // leave the draft in place so the user can retry
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-somig to-beige flex flex-col">
      <div className="p-4 sm:p-6 flex items-center gap-3 bg-white shadow-sm">
        <button onClick={() => router.push("/messages")} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={otherUser?.avatarUrl || "/images/5.png"}
          alt={otherUser?.name ?? "User"}
          className="w-9 h-9 rounded-full object-cover"
        />
        <button
          onClick={() => otherUser && router.push(`/profile/${otherUser.username}`)}
          className="font-pop font-semibold text-chblack hover:underline"
        >
          {otherUser?.name ?? "Conversation"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-w-2xl w-full mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-chblack/50 py-10">Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const isMine = otherUser ? m.sender.id !== otherUser.id : false;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2 ${
                    isMine ? "bg-pink-600 text-white" : "bg-white text-chblack shadow-sm"
                  }`}
                >
                  <p className="font-pop text-sm">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-white/70" : "text-chblack/40"}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex gap-2 max-w-2xl w-full mx-auto">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 min-w-0 p-3 rounded-full outline-none border border-gray-300 font-pop text-sm"
        />
        <button
          onClick={handleSend}
          disabled={isSending || !draft.trim()}
          className="bg-pink-600 text-white px-6 py-2 rounded-full font-quick font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ConversationView;
