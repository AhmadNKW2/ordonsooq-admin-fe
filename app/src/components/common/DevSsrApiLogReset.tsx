"use client";

import { useEffect } from "react";

const RESET_ENDPOINT = "/api/dev-ssr-logs/reset";

function sendReset(reason: string) {
  const payload = JSON.stringify({
    reason,
    at: new Date().toISOString(),
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon(
      RESET_ENDPOINT,
      new Blob([payload], { type: "application/json" })
    );

    if (sent) {
      return;
    }
  }

  void fetch(RESET_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: payload,
    cache: "no-store",
    keepalive: true,
  }).catch(() => undefined);
}

export function DevSsrApiLogReset() {
  useEffect(() => {
    let lastResetAt = 0;

    const resetLogs = (reason: string) => {
      const now = Date.now();
      if (now - lastResetAt < 100) {
        return;
      }

      lastResetAt = now;
      sendReset(reason);
    };

    const handleClick = () => {
      resetLogs("document-click");
    };

    const handlePageHide = () => {
      resetLogs("page-refresh");
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return null;
}