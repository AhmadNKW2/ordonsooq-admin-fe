"use client";

/**
 * Loading Provider - Manages global loading state with NProgress
 * Automatically tracks navigation and provides manual control for API calls
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress
NProgress.configure({
  showSpinner: false, // We'll use our own overlay
  minimum: 0.1,
  speed: 400,
  trickleSpeed: 200,
});

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Full-screen loading overlay with spinner and progress bar
 */
const LoadingOverlay: React.FC<{ show: boolean }> = ({ show }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (show) {
      setShouldRender(true);
      setProgress(0);

      // Ensure at least one paint happens with the "hidden" classes applied
      setIsVisible(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });

      // Simulate progress
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Slow down as we get closer to 90
          const remaining = 90 - prev;
          const add = Math.random() * (remaining / 5); 
          return prev + Math.max(0.5, add);
        });
      }, 200);
    } else {
      setIsVisible(false);
      setProgress(100);
      const timeout = window.setTimeout(() => setShouldRender(false), 300);
      return () => window.clearTimeout(timeout);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ease-out " +
        (isVisible ? "opacity-100 backdrop-blur-md bg-white/30 dark:bg-black/30" : "opacity-0 backdrop-blur-none bg-transparent")
      }
      aria-busy="true"
      aria-live="polite"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={
          "absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-multiply animate-blob transition-opacity duration-500 " +
          (isVisible ? "opacity-100" : "opacity-0")
        }></div>
        <div className={
          "absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000 transition-opacity duration-500 " +
          (isVisible ? "opacity-100" : "opacity-0")
        }></div>
        <div className={
          "absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000 transition-opacity duration-500 " +
          (isVisible ? "opacity-100" : "opacity-0")
        }></div>
      </div>

      <div
        className={
          "relative flex flex-col items-center justify-center p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 min-w-[280px] transform transition-all duration-300 " +
          (isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4")
        }
      >
        {/* Logo or Icon Area */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full blur-lg opacity-40 animate-pulse"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg">
             {/* Custom Spinner */}
            <svg className="w-12 h-12 text-primary animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Loading</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we prepare everything...</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-purple-500 to-secondary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] skew-x-12"></div>
          </div>
        </div>
        
        {/* Percentage (Optional) */}
        <div className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500 w-full text-right">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

/**
 * Navigation tracker component - uses useSearchParams which requires Suspense
 */
const NavigationTracker: React.FC<{
  onNavigationComplete: () => void;
}> = ({ onNavigationComplete }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track navigation changes - complete loading when route changes
  useEffect(() => {
    onNavigationComplete();
  }, [pathname, searchParams, onNavigationComplete]);

  return null;
};

/**
 * Inner provider that manages loading state
 */
const LoadingProviderInner: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const pathname = usePathname();
  const apiPendingCountRef = useRef(0);
  const navigationPendingRef = useRef(false);
  const overlayActiveRef = useRef(false);
  const overlayStartedAtRef = useRef<number | null>(null);
  const overlayHideTimerRef = useRef<number | null>(null);
  const OVERLAY_MIN_VISIBLE_MS = 250;

  const clearOverlayHideTimer = useCallback(() => {
    if (overlayHideTimerRef.current !== null) {
      window.clearTimeout(overlayHideTimerRef.current);
      overlayHideTimerRef.current = null;
    }
  }, []);

  const hideOverlayWithMinDuration = useCallback(() => {
    const startedAt = overlayStartedAtRef.current;
    const elapsed = startedAt ? Date.now() - startedAt : OVERLAY_MIN_VISIBLE_MS;
    const remaining = Math.max(0, OVERLAY_MIN_VISIBLE_MS - elapsed);

    clearOverlayHideTimer();
    if (remaining > 0) {
      overlayHideTimerRef.current = window.setTimeout(() => {
        setShowOverlay(false);
        overlayHideTimerRef.current = null;
      }, remaining);
    } else {
      setShowOverlay(false);
    }
  }, [clearOverlayHideTimer]);

  const beginOverlay = useCallback(() => {
    clearOverlayHideTimer();
    overlayStartedAtRef.current = Date.now();
    setIsLoading(true);
    setShowOverlay(true);
    NProgress.start();
    overlayActiveRef.current = true;
  }, [clearOverlayHideTimer]);

  const endOverlayIfIdle = useCallback(() => {
    if (navigationPendingRef.current || apiPendingCountRef.current > 0) {
      return;
    }
    setIsLoading(false);
    NProgress.done();
    hideOverlayWithMinDuration();
    overlayActiveRef.current = false;
  }, [hideOverlayWithMinDuration]);

  // Start loading indicator (navigation/manual)
  const startLoading = useCallback(() => {
    navigationPendingRef.current = true;
    if (overlayActiveRef.current) return;
    beginOverlay();
  }, [beginOverlay]);

  // Stop loading indicator
  const stopLoading = useCallback(() => {
    navigationPendingRef.current = false;
    endOverlayIfIdle();
  }, [endOverlayIfIdle]);

  const startApiLoading = useCallback(() => {
    apiPendingCountRef.current += 1;
    if (overlayActiveRef.current) return;
    beginOverlay();
  }, [beginOverlay]);

  const stopApiLoading = useCallback(() => {
    apiPendingCountRef.current = Math.max(0, apiPendingCountRef.current - 1);
    endOverlayIfIdle();
  }, [endOverlayIfIdle]);

  // Handle navigation complete - called by NavigationTracker
  const handleNavigationComplete = useCallback(() => {
    stopLoading();
  }, [stopLoading]);

  // Track all API requests globally (GET + mutations)
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ delta?: number }>;
      const delta = customEvent?.detail?.delta;
      if (delta === 1) startApiLoading();
      if (delta === -1) stopApiLoading();
    };

    window.addEventListener("os:api-loading", handler as EventListener);
    return () => window.removeEventListener("os:api-loading", handler as EventListener);
  }, [startApiLoading, stopApiLoading]);

  // Intercept link clicks to start loading BEFORE navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (!anchor) return;
      
      const href = anchor.getAttribute("href");
      
      // Skip if no href, external link, hash link, or special links
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Skip if same page (just a hash change or same path)
      const currentPath = pathname;
      const linkPath = href.split("?")[0].split("#")[0];
      
      if (linkPath === currentPath || linkPath === "") {
        return;
      }

      // Start loading for internal navigation
      startLoading();
    };

    // Add click listener to capture all link clicks
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname, startLoading]);

  // Handle browser back/forward buttons and programmatic navigation
  useEffect(() => {
    // Patch history.pushState to detect programmatic navigation
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    const handleStateChange = (url: string | URL | null | undefined) => {
      // In practice, Next.js may call pushState/replaceState with `url` as null/undefined.
      // Treat any state change as a navigation start signal, and let NavigationTracker
      // complete it. This also ensures the overlay is visible even for very fast route changes.
      if (url) {
        const newPath =
          typeof url === "string" ? url.split("?")[0].split("#")[0] : url.pathname;
        const currentPath = window.location.pathname;
        // Skip hash-only changes or no-op navigations
        if (newPath === currentPath || newPath === "") {
          return;
        }
      }

      startLoading();
    };

    history.pushState = function (data, unused, url) {
      handleStateChange(url);
      return originalPushState(data, unused, url);
    };

    history.replaceState = function (data, unused, url) {
      handleStateChange(url);
      return originalReplaceState(data, unused, url);
    };

    // Handle popstate (back/forward buttons)
    const handlePopState = () => {
      startLoading();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, startLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearOverlayHideTimer();
      NProgress.done();
    };
  }, [clearOverlayHideTimer]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        startLoading,
        stopLoading,
        showOverlay,
        setShowOverlay,
      }}
    >
      {/* Wrap NavigationTracker in Suspense as required by useSearchParams */}
      <Suspense fallback={null}>
        <NavigationTracker onNavigationComplete={handleNavigationComplete} />
      </Suspense>
      {children}
      <LoadingOverlay show={showOverlay} />
    </LoadingContext.Provider>
  );
};

/**
 * Main LoadingProvider export - wraps the inner provider
 */
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <LoadingProviderInner>{children}</LoadingProviderInner>;
};

/**
 * Hook to access loading context
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};

/**
 * Helper function for wrapping async operations with loading state
 * Usage: await withLoading(async () => { ... }, { showOverlay: true });
 */
export const createLoadingWrapper = (
  startLoading: () => void,
  stopLoading: () => void,
  setShowOverlay: (show: boolean) => void
) => {
  return async <T,>(
    asyncFn: () => Promise<T>,
    options?: { showOverlay?: boolean }
  ): Promise<T> => {
    try {
      startLoading();
      if (options?.showOverlay) {
        setShowOverlay(true);
      }
      return await asyncFn();
    } finally {
      stopLoading();
    }
  };
};

/**
 * Hook that provides a wrapped loading function for API calls
 */
export const useLoadingWrapper = () => {
  const { startLoading, stopLoading, setShowOverlay } = useLoading();
  
  const withLoading = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options?: { showOverlay?: boolean }
    ): Promise<T> => {
      try {
        startLoading();
        if (options?.showOverlay) {
          setShowOverlay(true);
        }
        return await asyncFn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading, setShowOverlay]
  );

  return { withLoading };
};
