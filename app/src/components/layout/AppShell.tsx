"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { AppSidebar } from "../sidebar/app-sidebar";
import { sidebarConfig } from "../sidebar/sidebar.config";
import { ScrollToTop } from "../common/ScrollToTop";
import { useLoading } from "../../providers/loading-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login/");
  const mainRef = useRef<HTMLElement>(null);
  const { showOverlay } = useLoading();

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-primary/10">
        <AppSidebar
          groups={sidebarConfig.groups}
          header={sidebarConfig.header}
          footer={sidebarConfig.footer}
        />
        <main ref={mainRef} className="flex-1 overflow-auto relative">
          {children}
          {/* Blocks clicks/edits but stays inside <main> so wheel events bubble up and scroll still works */}
          {showOverlay && (
            <div className="absolute inset-0 z-[9998]" />
          )}
        </main>
        <ScrollToTop scrollContainerRef={mainRef} />
      </div>
    </ProtectedRoute>
  );
}
