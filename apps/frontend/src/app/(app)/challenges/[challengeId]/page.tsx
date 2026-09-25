import ChallengeDetail from "@/components/challenges/ChallengeDetail";

export default async function ChallengePage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  return <ChallengeDetail challengeId={challengeId} />;
}
