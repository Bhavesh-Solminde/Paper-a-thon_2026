import { useId } from "react";

/** Microsoft Learn Students Club badge, redrawn as SVG so it stays crisp at any size. */
export function Shield({ className = "", title = "Microsoft Learn Students Club" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="140 0 1120 1225" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#223b66" />
          <stop offset=".34" stopColor="#1f3761" />
          <stop offset=".4" stopColor="#152a4d" />
          <stop offset=".62" stopColor="#152a4d" />
          <stop offset=".68" stopColor="#1f3761" />
          <stop offset="1" stopColor="#223b66" />
        </linearGradient>
        <linearGradient id={`${id}-banner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#233e6b" />
          <stop offset="1" stopColor="#1c355f" />
        </linearGradient>
        <path id={`${id}-arc`} d="M160 618 Q700 546 1240 618" />
      </defs>
      {/* outer blue shield */}
      <path d="M190 135 Q700 -120 1212 135 L1212 715 C1185 950 960 1120 700 1220 C440 1120 215 950 190 715 Z" fill="#0078d4" />
      {/* inner navy shield */}
      <path d="M266 182 Q700 5 1136 182 L1136 700 C1112 895 910 1060 700 1136 C490 1060 288 895 266 700 Z" fill={`url(#${id}-inner)`} />
      <text x="697" y="262" textAnchor="middle" fill="#fff" fontFamily="'Segoe UI', 'Selawik', Arial, sans-serif" fontWeight="600" fontSize="104" letterSpacing="-2">
        Microsoft
      </text>
      <text x="697" y="380" textAnchor="middle" fill="#fff" fontFamily="'Segoe UI', 'Selawik', Arial, sans-serif" fontWeight="400" fontSize="104" letterSpacing="-1">
        Learn
      </text>
      {/* curved banner */}
      <path d="M152 520 Q700 405 1250 520 L1250 755 Q700 640 152 755 Z" fill={`url(#${id}-banner)`} />
      <path d="M152 520 Q700 405 1250 520" fill="none" stroke="#2a4a7d" strokeWidth="4" opacity=".6" />
      <text fill="#fff" fontFamily="'Segoe UI', Arial, sans-serif" fontWeight="800" fontSize="100" letterSpacing="4">
        <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">
          STUDENTS CLUB
        </textPath>
      </text>
      {/* cyan figure */}
      <g fill="none" stroke="#50e6ff" strokeWidth="21">
        <path d="M630 786 L697 853 L764 786" />
        <path d="M630 946 L697 879 L764 946" />
      </g>
      <circle cx="698" cy="782" r="15" fill="#50e6ff" />
    </svg>
  );
}
