"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Current time, ticking every `intervalMs`. Returns null during SSR/hydration so markup matches. */
export function useNow(intervalMs = 1000) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const id = setInterval(cb, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs],
  );
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
}
