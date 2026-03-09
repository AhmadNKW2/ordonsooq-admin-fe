import { useState, useEffect, useCallback } from "react";
import { PAGINATION } from "../lib/constants";

/**
 * Persists the current pagination page and limit in sessionStorage.
 * On remount (e.g. navigating back to the page), the last visited page and limit is restored.
 * We use a single shared key for limit to easily share limits across tables globally for consistency.
 *
 * @param key - A unique key per table/page (e.g. "products", "orders")
 * @param defaultPage - Fallback page when nothing is stored (default: 1)
 */
export function useSessionStoragePage(
  key: string,
  defaultPage = 1
): {
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
} {
  const pageStorageKey = `pagination_page_${key}`;
  const limitStorageKey = "global_table_limit";

  const [page, setPageState] = useState<number>(() => {
    if (typeof window === "undefined") return defaultPage;
    const stored = sessionStorage.getItem(pageStorageKey);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
    return defaultPage;
  });

  const [limit, setLimitState] = useState<number>(() => {
    if (typeof window === "undefined") return PAGINATION.defaultPageSize;
    const stored = sessionStorage.getItem(limitStorageKey);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return PAGINATION.defaultPageSize;
  });

  // Sync to sessionStorage whenever page changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(pageStorageKey, String(page));
    }
  }, [page, pageStorageKey]);

  // Sync to sessionStorage whenever limit changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(limitStorageKey, String(limit));
    }
  }, [limit, limitStorageKey]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
  }, []);

  return { page, setPage, limit, setLimit };
}
