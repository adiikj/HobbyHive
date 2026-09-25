import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";
import { PageHeaderSkeleton, PhotoGridSkeleton } from "@/components/ui/Skeletons";

export default function ExploreLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <Skeleton className="mb-8 h-14 w-full rounded-full bg-line" />
      <div className="mb-8 flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-40 shrink-0 rounded-2xl bg-line" />
        ))}
      </div>
      <Skeleton className="mb-4 h-11 w-full rounded-full bg-line" />
      <PhotoGridSkeleton />
    </PageContainer>
  );
}
