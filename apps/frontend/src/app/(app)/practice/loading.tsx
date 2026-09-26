import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";
import { PageHeaderSkeleton } from "@/components/ui/Skeletons";

export default function PracticeLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl bg-line" />
        ))}
      </div>
      <Skeleton className="mb-2 h-7 w-40 rounded-lg bg-line" />
      <Skeleton className="h-48 w-full rounded-2xl bg-line" />
    </PageContainer>
  );
}
