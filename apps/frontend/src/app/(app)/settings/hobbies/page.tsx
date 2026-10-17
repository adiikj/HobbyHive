import type { Metadata } from "next";
import EditHobbies from "@/components/hobbies/EditHobbies";

export const metadata: Metadata = { title: "Edit hives" };

export default function EditHobbiesPage() {
  return <EditHobbies />;
}
