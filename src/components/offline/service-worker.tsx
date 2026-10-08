"use client";

import { useEffect } from "react";
import { offlineSupported, saveOfflineBundle } from "./offline-store";

const SYNC_KEY = "mmb:offline-sync";
const SYNC_EVERY_MS = 12 * 60 * 60 * 1000;

/**
 * Registers public/sw.js in production, then quietly keeps every hymn in the browser cache
 * (at most every 12 hours, once the page is idle). No button, no banner: offline just works.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !offlineSupported()) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);

    const last = Number(localStorage.getItem(SYNC_KEY) ?? 0);
    if (!navigator.onLine || Date.now() - last < SYNC_EVERY_MS) return;
    const sync = () =>
      saveOfflineBundle()
        .then(() => localStorage.setItem(SYNC_KEY, String(Date.now())))
        .catch(() => undefined);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 3000));
    const timer = window.setTimeout(() => idle(sync), 3000);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
