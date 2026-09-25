import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";
import { PageHeaderSkeleton, PostListSkeleton } from "@/components/ui/Skeletons";

export default function SavedLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <div className="mb-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[150px] w-40 shrink-0 rounded-2xl bg-line" />
        ))}
      </div>
      <Skeleton className="mb-4 h-8 w-40 rounded-lg bg-line" />
      <PostListSkeleton count={2} />
    </PageContainer>
  );
}
