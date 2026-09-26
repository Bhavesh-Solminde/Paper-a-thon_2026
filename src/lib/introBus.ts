"use client";

// Tiny event bus so the hero can wait for the entry animation to finish tearing away.
declare global {
  interface Window {
    __patIntroDone?: boolean;
    __lenis?: { stop(): void; start(): void };
  }
}

const EVENT = "pat:intro-done";

export function onIntroDone(cb: () => void) {
  if (window.__patIntroDone) {
    cb();
    return () => {};
  }
  const h = () => cb();
  window.addEventListener(EVENT, h, { once: true });
  return () => window.removeEventListener(EVENT, h);
}

export function markIntroDone() {
  if (window.__patIntroDone) return;
  window.__patIntroDone = true;
  window.dispatchEvent(new Event(EVENT));
}
