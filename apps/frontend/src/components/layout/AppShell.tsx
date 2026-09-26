"use client";

import { Suspense, type ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import PracticeDock from "@/components/practice/PracticeDock";
import HivePattern from "./HivePattern";
import { useAppTheme } from "@/lib/theme";
import { useHiveScopeReset } from "@/lib/hiveScope";

function AppShell({ children }: { children: ReactNode }) {
  useAppTheme();
  useHiveScopeReset();
  return (
    <Suspense>
      <HivePattern />
      <AppSidebar />
      <div className="lg:pl-60 pb-20 lg:pb-0">{children}</div>
      <MobileNav />
      <PracticeDock />
    </Suspense>
  );
}

export default AppShell;
