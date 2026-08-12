import HobbyPage from "@/components/hobbies/HobbyPage";

export default async function HobbyRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <HobbyPage slug={slug} />;
}
