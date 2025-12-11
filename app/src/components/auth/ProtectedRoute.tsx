/**
 * Protected Route Wrapper - redirects to login if not authenticated
 * Integrates with session management and shows session expiration warning
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/auth.context";
import { SessionExpirationModal } from "./SessionExpirationModal";
import { sessionManager } from "../../lib/session/session-manager";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    isAuthenticated,
    isLoading,
    sessionWarning,
    extendSession,
    logout,
    dismissSessionWarning,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/login") {
      // Save the current path so we can redirect back after login
      sessionManager.setIntendedUrl(pathname + window.location.search);
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show beautiful loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center">
          {/* Logo/Brand area */}
          <div className="mb-8">
            <div className="relative inline-flex items-center justify-center">
              {/* Outer glow ring */}
              <div className="absolute w-32 h-32 rounded-full bg-linear-to-r from-blue-500/20 to-indigo-500/20 blur-xl animate-pulse" />
              
              {/* Spinning rings container */}
              <div className="relative w-24 h-24">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-blue-400/50 animate-spin" style={{ animationDuration: '1.5s' }} />
                
                {/* Middle spinning ring (opposite direction) */}
                <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-indigo-500 border-l-indigo-400/50 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                
                {/* Inner pulsing circle */}
                <div className="absolute inset-4 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 animate-pulse" />
                
                {/* Center logo icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-white drop-shadow-md" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Loading text */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Verifying your session
            </h2>
            
            {/* Animated dots */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Please wait while we securely authenticate your credentials
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-8 w-64 mx-auto">
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-progress"
                style={{
                  animation: 'progress 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>

        {/* Inline keyframes for progress animation */}
        <style jsx>{`
          @keyframes progress {
            0% {
              width: 0%;
              margin-left: 0%;
            }
            50% {
              width: 60%;
              margin-left: 20%;
            }
            100% {
              width: 0%;
              margin-left: 100%;
            }
          }
        `}</style>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated && pathname !== "/login") {
    return null;
  }

  return (
    <>
      {children}
      
      {/* Session Expiration Modal */}
      {sessionWarning && (
        <SessionExpirationModal
          isOpen={sessionWarning.show}
          expiresAt={sessionWarning.expiresAt}
          timeRemaining={sessionWarning.timeRemaining}
          onExtendSession={extendSession}
          onLogout={logout}
          onDismiss={dismissSessionWarning}
        />
      )}
    </>
  );
};
