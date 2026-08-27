"use client";

import { Suspense, type ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";

function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <AppSidebar />
      <div className="lg:pl-52 pb-16 lg:pb-0">{children}</div>
      <MobileNav />
    </Suspense>
  );
}

export default AppShell;
