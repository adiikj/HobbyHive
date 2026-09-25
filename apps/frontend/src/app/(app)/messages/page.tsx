import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3 bg-gradient-to-r from-somig to-beige">
      <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center">
        <MessageCircle size={28} className="text-pink-600" />
      </div>
      <p className="font-bnt text-xl text-chblack">Your messages</p>
      <p className="font-pop text-sm text-chblack/50 max-w-xs">
        Pick a conversation from the list, or message someone from their profile to start one.
      </p>
    </div>
  );
}
