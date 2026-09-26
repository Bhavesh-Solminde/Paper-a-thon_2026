"use client";

import { useEffect } from "react";
import cursors from "@/lib/cursors.json";

const INTERACTIVE =
  'a, button, [role="button"], label, select, summary, .cursor-pointer, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="file"]';
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea, [contenteditable="true"]';

/**
 * Turns the paper-plane cursor toward the direction the mouse is travelling.
 *
 * - The cursor is a native OS cursor (drawn by the system), so its position never lags the mouse.
 * - 72 pre-rendered headings (every 5°, see scripts/gen-cursors.mjs); turns are animated through the
 *   in-between headings so a reversal is a quick smooth U-turn rather than a jump.
 * - The heading is applied as an inline `cursor` on the element under the pointer only: restyling the
 *   whole page costs ~10ms per swap, a single element ~0.2ms, so turning never janks the page.
 */
export function PlaneDirection() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { step, rest, hotspots } = cursors as { step: number; rest: number; hotspots: [number, number][] };
    const count = hotspots.length;
    const hiDpi = window.devicePixelRatio > 1;

    // Warm the cache so turning never flashes the fallback arrow while an image loads.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
    idle(() => {
      for (let i = 0; i < count; i++) for (const v of ["plane", "hover"]) new Image().src = `/cursors/${v}-${i}${hiDpi ? "@2x" : ""}.png`;
    });

    // Prefer image-set (sharp @2x on HiDPI); fall back to a plain PNG where cursor doesn't accept it.
    const probe = document.createElement("div");
    probe.style.cursor = `-webkit-image-set(url("/cursors/plane-0.png") 1x, url("/cursors/plane-0@2x.png") 2x) 1 1, auto`;
    const imageSet = probe.style.cursor !== "";
    const value = (variant: "plane" | "hover", i: number) => {
      const [x, y] = hotspots[i];
      const fallback = variant === "plane" ? "auto" : "pointer";
      const u1 = `url("/cursors/${variant}-${i}.png")`;
      return imageSet ? `-webkit-image-set(${u1} 1x, url("/cursors/${variant}-${i}@2x.png") 2x) ${x} ${y}, ${fallback}` : `${u1} ${x} ${y}, ${fallback}`;
    };

    let shown = rest; // heading currently displayed
    let target = rest; // heading we're turning toward
    let el: HTMLElement | null = null; // element carrying the inline cursor
    let variant: "plane" | "hover" = "plane";
    let raf = 0;

    const paint = () => {
      if (el) el.style.cursor = value(variant, shown);
    };

    const release = () => {
      if (el) el.style.removeProperty("cursor");
      el = null;
    };

    // Ease the displayed heading toward the target along the shortest arc, a few steps per frame.
    const turn = () => {
      raf = 0;
      let diff = (target - shown) % count;
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      if (diff === 0) return;
      const move = Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) * 0.35));
      shown = (shown + move + count) % count;
      paint();
      raf = requestAnimationFrame(turn);
    };

    let vx = 0;
    let vy = 0;
    let lastX: number | null = null;
    let lastY = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;

      // Keep the inline cursor on whatever element is under the pointer.
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t !== el) {
        release();
        if (t && !t.closest(TEXT_ENTRY)) {
          el = t;
          variant = t.closest(INTERACTIVE) && !(t.closest(INTERACTIVE) as HTMLButtonElement).disabled ? "hover" : "plane";
          paint();
        }
      }

      if (lastX === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      // Smooth the velocity vector (not the angle) so jitter doesn't wobble the plane.
      vx = vx * 0.55 + (e.clientX - lastX) * 0.45;
      vy = vy * 0.55 + (e.clientY - lastY) * 0.45;
      lastX = e.clientX;
      lastY = e.clientY;
      if (vx * vx + vy * vy < 4) return; // barely moving: keep the current heading

      const heading = (Math.atan2(vy, vx) * 180) / Math.PI; // -180..180
      const next = ((Math.round((heading + 180) / step) % count) + count) % count;
      if (next !== target) {
        target = next;
        if (!raf) raf = requestAnimationFrame(turn);
      }
    };

    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) release();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      release();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return null;
}
