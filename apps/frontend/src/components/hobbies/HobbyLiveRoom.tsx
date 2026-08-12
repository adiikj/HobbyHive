"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getHobbyRoomMessages, type HobbyRoomMessage } from "@/api/api";
import { getSocket } from "@/lib/socket";

interface HobbyLiveRoomProps {
  hobbyId: string;
  slug: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function HobbyLiveRoom({ hobbyId, slug }: HobbyLiveRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<HobbyRoomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getHobbyRoomMessages(slug)
      .then((page) => setMessages(page.messages))
      .finally(() => setIsLoading(false));

    const socket = getSocket();
    if (!socket) return;

    socket.emit("hobby:join", hobbyId);

    const handleMessage = (payload: { hobbyId: string; message: HobbyRoomMessage }) => {
      if (payload.hobbyId !== hobbyId) return;
      setMessages((prev) => [...prev, payload.message]);
    };

    socket.on("hobby:message", handleMessage);

    return () => {
      socket.off("hobby:message", handleMessage);
      socket.emit("hobby:leave", hobbyId);
    };
  }, [hobbyId, slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;

    const socket = getSocket();
    if (!socket) {
      setError("Not connected. Refresh and try again.");
      return;
    }

    setIsSending(true);
    setError("");
    socket.emit(
      "hobby:message",
      { hobbyId, content: draft },
      (res: { error?: string }) => {
        setIsSending(false);
        if (res?.error) {
          setError(res.error);
        } else {
          setDraft("");
        }
      }
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md flex flex-col h-[28rem]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-t-2 border-pink-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-chblack/50 py-10">No one&apos;s said anything yet. Break the ice.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-2">
              <button onClick={() => router.push(`/profile/${m.author.username}`)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.author.avatarUrl || "/images/5.png"}
                  alt={m.author.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              </button>
              <div>
                <p className="font-pop text-sm">
                  <button
                    onClick={() => router.push(`/profile/${m.author.username}`)}
                    className="font-semibold hover:underline"
                  >
                    {m.author.name}
                  </button>{" "}
                  <span className="text-chblack/40 text-xs">{formatTime(m.createdAt)}</span>
                </p>
                <p className="font-pop text-sm text-chblack/80">{m.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-600 text-xs px-4">{error}</p>}

      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          className="flex-1 min-w-0 p-2 rounded-full outline-none border border-gray-300 font-pop text-sm"
        />
        <button
          onClick={handleSend}
          disabled={isSending || !draft.trim()}
          className="bg-pink-600 text-white px-5 py-2 rounded-full font-quick font-semibold text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default HobbyLiveRoom;
