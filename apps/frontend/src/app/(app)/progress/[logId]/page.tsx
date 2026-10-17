import type { Metadata } from "next";
import ProgressLogView from "@/components/progress/ProgressLogView";

export const metadata: Metadata = { title: "Progress log" };

export default async function ProgressLogPage({ params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params;
  return <ProgressLogView logId={logId} />;
}
