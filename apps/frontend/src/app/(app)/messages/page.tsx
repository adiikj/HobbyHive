import { MessageCircle } from "lucide-react";
import { HexIcon } from "@/components/ui/Page";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3 bg-canvas font-pop">
      <HexIcon fill="rgb(var(--c-surface))" icon={<MessageCircle size={28} className="text-brand" />} size={72} className="drop-shadow-sm" />
      <p className="font-bnt text-4xl leading-none text-chblack">YOUR MESSAGES</p>
      <p className="font-pop text-sm text-chblack/50 max-w-xs">
        Pick a conversation from the list, or message someone from their profile to start one.
      </p>
    </div>
  );
}
