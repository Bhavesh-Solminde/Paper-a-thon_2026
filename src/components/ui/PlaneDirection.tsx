"use client";

import { useEffect } from "react";

const STEP = 15; // must match scripts/gen-cursors.mjs
const COUNT = 360 / STEP;

/**
 * Points the paper-plane cursor where the mouse is heading. The cursor stays a native OS cursor
 * (drawn by the system, so it never lags); this only sets html[data-plane] to the heading bucket and
 * app/plane-cursor.css swaps in the matching pre-rotated image.
 */
export function PlaneDirection() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;

    // Warm the cache so the first turn in each direction doesn't flash the fallback arrow.
    const hiDpi = window.devicePixelRatio > 1 ? "@2x" : "";
    const warm = () => {
      for (let i = 0; i < COUNT; i++) for (const v of ["plane", "hover"]) new Image().src = `/cursors/${v}-${i}${hiDpi}.png`;
    };
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
    idle(warm);

    let vx = 0;
    let vy = 0;
    let lastX: number | null = null;
    let lastY = 0;
    let current = "";

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (lastX === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      // Smooth the velocity vector (not the angle), so reversals flip cleanly instead of spinning.
      vx = vx * 0.6 + (e.clientX - lastX) * 0.4;
      vy = vy * 0.6 + (e.clientY - lastY) * 0.4;
      lastX = e.clientX;
      lastY = e.clientY;
      if (vx * vx + vy * vy < 4) return; // barely moving: keep the current heading

      const heading = (Math.atan2(vy, vx) * 180) / Math.PI; // -180..180
      const i = String((Math.round((heading + 180) / STEP) % COUNT + COUNT) % COUNT);
      if (i === current) return;
      current = i;
      html.dataset.plane = i;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      delete html.dataset.plane;
    };
  }, []);

  return null;
}
