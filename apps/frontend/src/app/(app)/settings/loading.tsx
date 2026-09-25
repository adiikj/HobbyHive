import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";
import { PageHeaderSkeleton } from "@/components/ui/Skeletons";

export default function SettingsLoading() {
  return (
    <PageContainer width="narrow">
      <PageHeaderSkeleton />
      <Skeleton className="mb-5 h-11 w-full rounded-full bg-line" />
      <div className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <Skeleton className="h-20 w-20 rounded-full bg-line" />
        <Skeleton className="h-11 w-full rounded-xl bg-canvas" />
        <Skeleton className="h-24 w-full rounded-xl bg-canvas" />
      </div>
    </PageContainer>
  );
}
