import type { Metadata } from "next";
import ChallengeDetail from "@/components/challenges/ChallengeDetail";

export const metadata: Metadata = { title: "Challenge" };

export default async function ChallengePage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  return <ChallengeDetail challengeId={challengeId} />;
}
