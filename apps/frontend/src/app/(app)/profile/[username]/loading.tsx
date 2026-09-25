import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";

export default function ProfileLoading() {
  return (
    <PageContainer>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <Skeleton className="h-36 w-full bg-line sm:h-44" />
        <div className="px-5 pb-6 sm:px-8">
          <Skeleton className="-mt-12 h-24 w-24 rounded-full bg-canvas ring-4 ring-surface sm:-mt-14 sm:h-28 sm:w-28" />
          <Skeleton className="mt-4 h-10 w-56 rounded-xl bg-line" />
          <Skeleton className="mt-2 h-3 w-40 rounded-full bg-canvas" />
          <Skeleton className="mt-5 h-3 w-3/4 rounded-full bg-canvas" />
          <div className="mt-5 flex gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-16 rounded-lg bg-canvas" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="mb-3 mt-6 h-6 w-20 rounded-lg bg-line" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl bg-line" />
        ))}
      </div>
    </PageContainer>
  );
}
