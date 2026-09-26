import Skeleton from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/Page";

export default function RecapLoading() {
  return (
    <PageContainer>
      <Skeleton className="mb-4 h-5 w-28 rounded-lg bg-line" />
      <Skeleton className="mb-4 h-14 w-72 rounded-lg bg-line" />
      <Skeleton className="h-56 w-full rounded-3xl bg-line" />
    </PageContainer>
  );
}
