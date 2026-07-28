import type { Metadata } from "next";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "HobbyHive",
  description: "Unleash your passion and connect with hobby communities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
