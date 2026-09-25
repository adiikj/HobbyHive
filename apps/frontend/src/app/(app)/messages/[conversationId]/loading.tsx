import Skeleton from "@/components/ui/Skeleton";

export default function ConversationLoading() {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 lg:py-4">
        <Skeleton className="h-10 w-10 rounded-full bg-line" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28 rounded-full bg-line" />
          <Skeleton className="h-2.5 w-16 rounded-full bg-canvas" />
        </div>
      </div>
      <div className="flex-1 space-y-3 bg-canvas px-4 py-4 sm:px-6">
        {["w-40 justify-start", "w-52 justify-end", "w-28 justify-start", "w-44 justify-end"].map((c, i) => (
          <div key={i} className={`flex ${c.split(" ")[1]}`}>
            <Skeleton className={`h-9 ${c.split(" ")[0]} rounded-[20px] bg-line`} />
          </div>
        ))}
      </div>
    </div>
  );
}
