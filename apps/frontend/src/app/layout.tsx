import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./Providers";
import { fontVariables } from "./fonts";
import { THEME_BOOT_SCRIPT } from "@/lib/themeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "HobbyHive",
  description: "Unleash your passion and connect with hobby communities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the boot script may add "dark" to <html> before React hydrates
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
