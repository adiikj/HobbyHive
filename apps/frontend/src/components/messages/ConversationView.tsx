"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import {
  getMessages,
  sendMessage,
  markConversationRead,
  listConversations,
  type DirectMessage,
  type FollowUser,
} from "@/api/api";
import { getSocket } from "@/lib/socket";
import { useCurrentUser } from "@/lib/currentUser";
import Skeleton from "@/components/ui/Skeleton";

interface ConversationViewProps {
  conversationId: string;
}

type LocalMessage = DirectMessage & { status?: "sending" | "sent" | "failed" };

const GROUP_WINDOW_MS = 3 * 60 * 1000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Consecutive messages from the same sender within a few minutes render as one visual group, Instagram-style. */
function isGroupStart(list: LocalMessage[], index: number) {
  const current = list[index];
  const prev = list[index - 1];
  if (!prev) return true;
  if (prev.sender.id !== current.sender.id) return true;
  return new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime() > GROUP_WINDOW_MS;
}

function isGroupEnd(list: LocalMessage[], index: number) {
  const current = list[index];
  const next = list[index + 1];
  if (current.status === "failed" || current.status === "sending") return true;
  if (!next) return true;
  if (next.sender.id !== current.sender.id) return true;
  return new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime() > GROUP_WINDOW_MS;
}

function ConversationView({ conversationId }: ConversationViewProps) {
  const router = useRouter();
  const { user: me } = useCurrentUser();
  const myId = me?.id ?? null;
  const [otherUser, setOtherUser] = useState<FollowUser | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
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

  const sendOptimistic = async (tempId: string, content: string) => {
    try {
      const message = await sendMessage(conversationId, content);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...message, status: "sent" } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)));
    }
  };

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !myId) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content,
        createdAt: new Date().toISOString(),
        sender: { id: myId, name: "", username: "", avatarUrl: null },
        status: "sending",
      },
    ]);
    setDraft("");
    sendOptimistic(tempId, content);
  };

  const handleRetry = (message: LocalMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, status: "sending" } : m)));
    sendOptimistic(message.id, message.content);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => router.push("/messages")}
          className="p-1 -ml-1 rounded-full hover:bg-gray-100 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          aria-label="Back to messages"
        >
          <ArrowLeft size={20} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={otherUser?.avatarUrl || "/images/5.png"}
          alt={otherUser?.name ?? "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <button
          onClick={() => otherUser && router.push(`/profile/${otherUser.username}`)}
          className="font-quick font-semibold text-chblack hover:underline focus-visible:outline-none focus-visible:underline"
        >
          {otherUser?.name ?? "Conversation"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gradient-to-r from-somig to-beige">
        {isLoading ? (
          <div className="space-y-3">
            {[
              ["w-40", "justify-start"],
              ["w-52", "justify-end"],
              ["w-28", "justify-start"],
              ["w-44", "justify-end"],
              ["w-32", "justify-end"],
              ["w-24", "justify-start"],
            ].map(([w, justify], i) => (
              <div key={i} className={`flex ${justify}`}>
                <Skeleton className={`h-9 ${w} rounded-[20px] bg-white/50`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={otherUser?.avatarUrl || "/images/5.png"}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
            <p className="font-quick font-semibold text-chblack">{otherUser?.name ?? "Say hello"}</p>
            <p className="font-pop text-sm text-chblack/50">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMine = myId ? m.sender.id === myId : otherUser ? m.sender.id !== otherUser.id : false;
            const groupStart = isGroupStart(messages, index);
            const groupEnd = isGroupEnd(messages, index);
            const isFailed = m.status === "failed";

            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"} ${groupStart ? "mt-3" : "mt-0.5"}`}
              >
                <div
                  className={`max-w-[75%] sm:max-w-sm rounded-[20px] px-4 py-2 ${
                    isFailed
                      ? "bg-pink-300 text-white cursor-pointer"
                      : isMine
                        ? "bg-pink-600 text-white"
                        : "bg-white text-chblack shadow-sm"
                  }`}
                  onClick={() => isFailed && handleRetry(m)}
                >
                  <p className="font-pop text-sm break-words">{m.content}</p>
                  {groupEnd && (
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? "text-white/70" : "text-chblack/40"}`}>
                      <p className="text-[10px]">{isFailed ? "Failed · tap to retry" : formatTime(m.createdAt)}</p>
                      {isMine && m.status === "sent" && <Check size={11} />}
                      {isMine && m.status === "sending" && (
                        <span className="w-2 h-2 border-t border-white/70 rounded-full animate-spin" />
                      )}
                      {isMine && isFailed && <AlertCircle size={11} />}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message..."
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full outline-none border border-gray-200 bg-gray-50 font-pop text-sm focus:border-pink-300 focus:bg-white transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="font-quick font-semibold text-sm text-pink-600 disabled:text-chblack/25 shrink-0 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ConversationView;
