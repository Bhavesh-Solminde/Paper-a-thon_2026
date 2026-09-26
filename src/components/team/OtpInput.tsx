"use client";

import { useRef } from "react";

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function set(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    refs.current[Math.min(clean.length, 5)]?.focus();
    if (clean.length === 6) onComplete(clean);
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={6}
          autoFocus={i === 0}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => {
            e.preventDefault();
            set(e.clipboardData.getData("text"));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) {
              e.preventDefault();
              onChange(value.slice(0, i - 1));
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
            else if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
          }}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, "");
            if (!typed) {
              onChange(value.slice(0, i) + value.slice(i + 1));
              return;
            }
            if (typed.length > 1) return set(value.slice(0, i) + typed);
            set(value.slice(0, i) + typed + value.slice(i + 1));
          }}
          className={`h-14 w-full min-w-0 rounded-xl border bg-ink-2 text-center font-display text-2xl font-black outline-none transition sm:h-16 sm:text-3xl ${
            invalid ? "border-red-500/70" : "border-line focus:border-blue focus:shadow-[0_0_0_4px_rgb(31_107_255/0.2)]"
          }`}
        />
      ))}
    </div>
  );
}
