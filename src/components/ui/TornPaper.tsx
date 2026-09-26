import type { CSSProperties, ReactNode } from "react";

// Deterministic PRNG so server and client render the same jagged edge.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Builds a clip-path polygon with torn (jagged) edges on all four sides. */
export function tornClip(seed = 7, depth = 2.2, steps = 18) {
  const r = rng(seed);
  const pts: string[] = [];
  const j = () => (r() * depth).toFixed(2);
  for (let i = 0; i <= steps; i++) pts.push(`${((i / steps) * 100).toFixed(2)}% ${j()}%`);
  for (let i = 1; i <= steps / 2; i++) pts.push(`${(100 - +j()).toFixed(2)}% ${((i / (steps / 2)) * 100).toFixed(2)}%`);
  for (let i = steps - 1; i >= 0; i--) pts.push(`${((i / steps) * 100).toFixed(2)}% ${(100 - +j()).toFixed(2)}%`);
  for (let i = steps / 2 - 1; i >= 1; i--) pts.push(`${j()}% ${((i / (steps / 2)) * 100).toFixed(2)}%`);
  return `polygon(${pts.join(",")})`;
}

export function TornPaper({
  children,
  seed = 7,
  depth,
  className = "",
  style,
}: {
  children?: ReactNode;
  seed?: number;
  depth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`paper ${className}`} style={{ clipPath: tornClip(seed, depth), ...style }}>
      {children}
    </div>
  );
}
