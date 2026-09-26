/** Club badge — a shield in the poster's style (not an official logo). */
export function Shield({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden>
      <path d="M32 2 60 12v22c0 18-12 30-28 36C16 64 4 52 4 34V12Z" fill="#0c1a3a" stroke="#1f6bff" strokeWidth="3" />
      <path d="M8 30h48v10H8z" fill="#1f6bff" />
      <text x="32" y="38" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff" fontFamily="Arial" letterSpacing=".5">
        MLSC
      </text>
      <path d="m26 48 6 6 6-6M32 54v6M26 60l6-6 6 6" stroke="#4a90ff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
