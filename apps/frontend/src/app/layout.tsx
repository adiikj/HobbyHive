import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./Providers";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "HobbyHive",
  description: "Unleash your passion and connect with hobby communities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
