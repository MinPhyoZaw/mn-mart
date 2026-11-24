"use client";

import { useEffect } from "react";

export async function chatRequest(endpoint, { method = "GET", body, signal } = {}) {
  const response = await fetch(endpoint, {
    method,
    signal,
    cache: "no-store",
    ...(body && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to load support chat.");
  return data;
}

export function useChatPolling(enabled, load, interval = 10000) {
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let pending = false;

    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        await load(controller.signal);
      } finally {
        pending = false;
      }
    }

    void refresh();
    const timer = window.setInterval(refresh, interval);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, load, interval]);
}
