import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";
import { PostListSkeleton } from "@/components/ui/Skeletons";

export default function HobbyLoading() {
  return (
    <PageContainer>
      <Skeleton className="mb-4 h-5 w-16 rounded-full bg-line" />
      <Skeleton className="mb-6 h-48 w-full rounded-3xl bg-line sm:h-52" />
      <Skeleton className="mb-5 h-11 w-full rounded-full bg-line" />
      <PostListSkeleton />
    </PageContainer>
  );
}
