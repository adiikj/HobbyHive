import Skeleton from "@/components/ui/Skeleton";
import { CardRowsSkeleton, ComposerSkeleton, HiveHeaderSkeleton, PostListSkeleton } from "@/components/ui/Skeletons";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1080px] gap-8 lg:px-8">
        <div className="mx-auto w-full min-w-0 max-w-[640px] xl:mx-0 xl:flex-1">
          <div className="flex gap-3 overflow-hidden px-4 pb-3 pt-3 sm:px-0 lg:pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5 py-1">
                <Skeleton className="h-12 w-12 rounded-2xl bg-line" />
                <Skeleton className="h-2 w-10 rounded-full bg-line" />
              </div>
            ))}
          </div>
          <div className="space-y-4 px-4 sm:px-0">
            <HiveHeaderSkeleton />
            <ComposerSkeleton />
            <PostListSkeleton />
          </div>
        </div>
        <div className="hidden w-[320px] shrink-0 space-y-4 pt-6 xl:block">
          <Skeleton className="h-11 w-full rounded-full bg-line" />
          <CardRowsSkeleton rows={2} />
          <CardRowsSkeleton />
        </div>
      </div>
    </div>
  );
}
