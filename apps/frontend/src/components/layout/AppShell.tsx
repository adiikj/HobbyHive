"use client";

import { Suspense, type ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import PracticeDock from "@/components/practice/PracticeDock";
import { useAppTheme } from "@/lib/theme";

function AppShell({ children }: { children: ReactNode }) {
  useAppTheme();
  return (
    <Suspense>
      <AppSidebar />
      <div className="lg:pl-60 pb-20 lg:pb-0">{children}</div>
      <MobileNav />
      <PracticeDock />
    </Suspense>
  );
}

export default AppShell;
