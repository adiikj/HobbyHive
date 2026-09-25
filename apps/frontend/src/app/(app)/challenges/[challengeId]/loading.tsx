import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";
import { PostListSkeleton } from "@/components/ui/Skeletons";

export default function ChallengeLoading() {
  return (
    <PageContainer width="narrow">
      <div className="mb-4 h-7" />
      <Skeleton className="mb-6 h-52 w-full rounded-3xl bg-line" />
      <Skeleton className="mb-4 h-11 w-full rounded-full bg-line" />
      <PostListSkeleton count={2} />
    </PageContainer>
  );
}
