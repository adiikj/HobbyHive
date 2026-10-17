import type { Metadata } from "next";
import Choice from "@/components/choice/Choice";

export const metadata: Metadata = { title: "Pick your hives" };

export default function ChoicePage() {
  return <Choice />;
}
