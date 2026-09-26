"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = 'a, button, [role="button"], label, select, summary, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="file"]';
const TEXT_ENTRY = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea, [contenteditable="true"]';
const REST_ANGLE = -135; // pointing up-left like a normal cursor

/**
 * Paper-plane cursor for mouse/trackpad users. The plane's nose sits exactly on the pointer
 * (so clicks stay precise) and it banks toward the direction of travel. Touch devices keep
 * the native behaviour, and text fields get the normal I-beam back.
 */
export function PaperPlaneCursor() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const node = el.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    html.classList.add("plane-cursor");

    let x = -100;
    let y = -100;
    let lastX = x;
    let lastY = y;
    let angle = REST_ANGLE;
    let target = REST_ANGLE;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let raf = 0;

    const render = () => {
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;
      if (!reduce && dx * dx + dy * dy > 9) target = (Math.atan2(dy, dx) * 180) / Math.PI;
      // Ease along the shortest arc so the plane never spins the long way round.
      const diff = ((target - angle + 540) % 360) - 180;
      angle += reduce ? diff : diff * 0.18;
      angle = ((angle + 540) % 360) - 180; // keep in [-180, 180) so it never drifts after many turns
      scale += (targetScale - scale) * 0.25;
      node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scale(${scale})`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const show = (on: boolean) => {
      if (visible === on) return;
      visible = on;
      node.style.opacity = on ? "1" : "0";
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      const t = e.target as Element | null;
      const typing = !!t?.closest?.(TEXT_ENTRY);
      show(!typing);
      const hot = !typing && !!t?.closest?.(INTERACTIVE);
      node.dataset.hot = hot ? "1" : "";
      if (targetScale !== 0.8) targetScale = hot ? 1.35 : 1;
    };
    const onDown = () => (targetScale = 0.8);
    const onUp = () => (targetScale = node.dataset.hot ? 1.35 : 1);
    const onLeave = (e: MouseEvent) => !e.relatedTarget && show(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("plane-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <div ref={el} aria-hidden className="plane-cursor-el pointer-events-none fixed left-0 top-0 z-[200] h-0 w-0 opacity-0 transition-opacity duration-150">
      {/* Drawn pointing right with its nose at (32,16); offset so the nose is the hotspot. */}
      <svg viewBox="0 0 34 32" width="30" height="28" className="absolute -left-[28px] -top-[14px] drop-shadow-[0_2px_6px_rgb(0_0_0/0.5)]">
        <path className="plane-body" d="M2 3 32 16 2 29l6-13Z" strokeWidth="1.6" strokeLinejoin="round" />
        <path className="plane-fold" d="M8 16h24L12 24Z" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M8 16h24" className="plane-crease" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
