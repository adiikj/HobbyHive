import type { Metadata } from "next";
import SavedPage from "@/components/saved/SavedPage";

export const metadata: Metadata = { title: "Saved" };

export default function SavedRoute() {
  return <SavedPage />;
}
