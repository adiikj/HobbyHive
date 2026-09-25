import { PageContainer } from "@/components/ui/Page";
import { PostListSkeleton } from "@/components/ui/Skeletons";

export default function PostLoading() {
  return (
    <PageContainer width="narrow">
      <div className="mb-4 h-7" />
      <PostListSkeleton count={1} />
    </PageContainer>
  );
}
