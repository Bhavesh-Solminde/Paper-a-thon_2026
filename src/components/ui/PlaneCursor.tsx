"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  'a, button, [role="button"], label, select, summary, .cursor-pointer, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="file"]';
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea, [contenteditable="true"]';

/** Heading of the drawing itself: the nose (1,1) points up-left along the fold from (16,17). */
const DRAWN_HEADING = -133.2;
const SIZE = 30; // rendered px (drawing is 32×32 units)
const NOSE = (1 * SIZE) / 32; // nose offset in px, so the nose is the exact hotspot

/**
 * Paper-plane cursor for mouse/trackpad users.
 *
 * - Position: written straight from `pointerrawupdate` (the lowest-latency pointer event, falling back
 *   to `pointermove`), with no easing, onto a GPU-composited layer, so moving it never repaints the page.
 * - Rotation: continuous. The heading comes from a time-based smoothed velocity, and the angle follows it
 *   with a critically damped spring (no overshoot, ~150ms), so instant reversals become a quick smooth
 *   turn instead of a jump or a stall. The spring only runs while turning.
 * - Hover: grows and turns blue over links/buttons; squishes on press; hides over text fields (native
 *   I-beam). Touch devices never see it; without JS the static plane PNG cursor is used.
 */
export function PlaneCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const node = ref.current!;
    const html = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let x = -100;
    let y = -100;
    let angle = DRAWN_HEADING; // degrees, currently drawn
    let angVel = 0; // degrees / s
    let target = DRAWN_HEADING;
    let scale = 1;
    let scaleTarget = 1;
    let vx = 0; // smoothed velocity, px / ms
    let vy = 0;
    let lastT = 0;
    let lastX = 0;
    let lastY = 0;
    let tracking = false;
    let visible = false;
    let hot = false;
    let pressed = false;
    let raf = 0;
    let lastFrame = 0;

    const write = () => {
      node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle - DRAWN_HEADING}deg) scale(${scale})`;
    };
    const setVisible = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      node.style.opacity = on ? "1" : "0";
    };

    const W = 36; // spring natural frequency (1/s): critically damped, no overshoot, settles in ~150ms
    const frame = (t: number) => {
      let dt = lastFrame ? Math.min(0.1, (t - lastFrame) / 1000) : 1 / 60;
      lastFrame = t;
      let diff = 0;
      if (reduce) {
        angle = target;
        angVel = 0;
      } else {
        // Integrate in small substeps so a long frame can never make the spring overshoot.
        while (dt > 0) {
          const h = Math.min(dt, 1 / 240);
          diff = ((((target - angle) % 360) + 540) % 360) - 180; // shortest arc
          angVel += (W * W * diff - 2 * W * angVel) * h;
          angle += angVel * h;
          dt -= h;
        }
        angle = ((((angle + 180) % 360) + 360) % 360) - 180;
      }
      diff = ((((target - angle) % 360) + 540) % 360) - 180;
      scale += (scaleTarget - scale) * 0.3;
      write();
      if (Math.abs(diff) < 0.1 && Math.abs(angVel) < 2 && Math.abs(scaleTarget - scale) < 0.001) {
        raf = 0;
        lastFrame = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const animate = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      if (tracking) {
        const dt = Math.max(1, e.timeStamp - lastT);
        const k = 1 - Math.exp(-dt / 30); // ~30ms smoothing, independent of event rate
        vx += ((x - lastX) / dt - vx) * k;
        vy += ((y - lastY) / dt - vy) * k;
        if (vx * vx + vy * vy > 0.03) {
          target = (Math.atan2(vy, vx) * 180) / Math.PI;
          animate();
        }
      }
      tracking = true;
      lastT = e.timeStamp;
      lastX = x;
      lastY = y;
      write();
      if (!visible && !node.dataset.text) setVisible(true);
    };

    const setScale = () => {
      scaleTarget = pressed ? 0.82 : hot ? 1.25 : 1;
      animate();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const t = e.target instanceof Element ? e.target : null;
      const typing = !!t?.closest(TEXT_ENTRY);
      node.dataset.text = typing ? "1" : "";
      setVisible(!typing);
      const interactive = t?.closest(INTERACTIVE) as HTMLButtonElement | null;
      const nextHot = !typing && !!interactive && !interactive.disabled;
      if (nextHot !== hot) {
        hot = nextHot;
        node.classList.toggle("is-hot", hot);
        setScale();
      }
    };
    const onDown = () => {
      pressed = true;
      setScale();
    };
    const onUp = () => {
      pressed = false;
      setScale();
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        setVisible(false);
        tracking = false;
      }
    };

    const moveEvent = "onpointerrawupdate" in window ? "pointerrawupdate" : "pointermove";
    window.addEventListener(moveEvent, onMove as EventListener, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseout", onOut);
    html.classList.add("plane-js");
    write();

    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("plane-js");
      window.removeEventListener(moveEvent, onMove as EventListener);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="plane-cursor">
      <svg viewBox="0 0 32 32" width={SIZE} height={SIZE} style={{ left: -NOSE, top: -NOSE }}>
        <polygon className="pc-belly" points="16,17 8,28 13,22" />
        <polygon className="pc-top" points="1,1 16,17 28,8" />
        <polygon className="pc-left" points="1,1 8,28 16,17" />
      </svg>
    </div>
  );
}
