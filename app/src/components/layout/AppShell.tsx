"use client";

import { useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { AppSidebar } from "../sidebar/app-sidebar";
import { sidebarConfig } from "../sidebar/sidebar.config";
import { ScrollToTop } from "../common/ScrollToTop";
import { useLoading } from "../../providers/loading-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login/");
  const mainRef = useRef<HTMLElement>(null);
  const { showOverlay } = useLoading();

  // Global ESC key → navigate back (skip when typing in inputs or a dialog is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((document.activeElement as HTMLElement | null)?.isContentEditable) return;
      if (document.querySelector('[role="dialog"]')) return;
      router.back();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

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
