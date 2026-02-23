import { useState, useEffect, useCallback } from "react";

/**
 * Persists the current pagination page in sessionStorage.
 * On remount (e.g. navigating back to the page), the last visited page is restored.
 *
 * @param key - A unique key per table/page (e.g. "products", "orders")
 * @param defaultPage - Fallback page when nothing is stored (default: 1)
 */
export function useSessionStoragePage(key: string, defaultPage = 1): [number, (page: number) => void] {
  const storageKey = `pagination_page_${key}`;

  const [page, setPageState] = useState<number>(() => {
    if (typeof window === "undefined") return defaultPage;
    const stored = sessionStorage.getItem(storageKey);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
    return defaultPage;
  });

  // Sync to sessionStorage whenever page changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, String(page));
    }
  }, [page, storageKey]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  return [page, setPage];
}
