import type { Metadata } from "next";
import EditProfile from "@/components/profile/EditProfile";

export const metadata: Metadata = { title: "Edit profile" };

export default function EditProfilePage() {
  return <EditProfile />;
}
