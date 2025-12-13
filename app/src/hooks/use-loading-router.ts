"use client";

import { useCallback, useMemo } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

type NextRouter = ReturnType<typeof useNextRouter>;

/**
 * useLoadingRouter
 * Wraps Next.js App Router navigation methods so any navigation triggered by
 * a button (router.push/replace) behaves the same as a <Link> click: it starts
 * the global loading UI immediately.
 */
export function useLoadingRouter(): NextRouter {
  const router = useNextRouter();
  const { startLoading } = useLoading();

  const push = useCallback<NextRouter["push"]>(
    (...args) => {
      startLoading();
      return router.push(...args);
    },
    [router, startLoading]
  );

  const replace = useCallback<NextRouter["replace"]>(
    (...args) => {
      startLoading();
      return router.replace(...args);
    },
    [router, startLoading]
  );

  const back = useCallback<NextRouter["back"]>(() => {
    startLoading();
    return router.back();
  }, [router, startLoading]);

  const forward = useCallback<NextRouter["forward"]>(() => {
    startLoading();
    return router.forward();
  }, [router, startLoading]);

  const refresh = useCallback<NextRouter["refresh"]>(() => {
    startLoading();
    return router.refresh();
  }, [router, startLoading]);

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
      back,
      forward,
      refresh,
    }),
    [router, push, replace, back, forward, refresh]
  );
}

// Drop-in replacement for `next/navigation`'s `useRouter`.
export const useRouter = useLoadingRouter;
