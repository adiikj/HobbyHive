import type { Metadata } from "next";
import HobbyPage from "@/components/hobbies/HobbyPage";

// Slugs are the lowercased hive name ("dance"), so the title can come from the URL without fetching the hive
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: `${name} hive` };
}

export default async function HobbyRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <HobbyPage slug={slug} />;
}
