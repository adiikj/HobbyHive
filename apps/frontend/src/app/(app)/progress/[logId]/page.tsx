import ProgressLogView from "@/components/progress/ProgressLogView";

export default async function ProgressLogPage({ params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params;
  return <ProgressLogView logId={logId} />;
}
