"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Shield } from "@/components/ui/Shield";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#journey", label: "Journey" },
  { href: "/#flow", label: "Event Flow" },
  { href: "/shortlisted", label: "Shortlisted" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav({ loggedIn = false }: { loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Lock page scroll while the mobile menu is open (Lenis ignores overflow:hidden, so stop it too).
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          open ? "bg-ink" : scrolled ? "border-b border-line/70 bg-ink/[0.92]" : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <Shield className="h-11 w-10" />
            <span className="font-display text-sm font-black leading-none tracking-wide">
              PAPER-A-THON
              <span className="block text-[0.6rem] font-bold tracking-[0.3em] text-blue-bright">MLSC · 2026</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="group relative font-display text-xs font-bold uppercase tracking-[0.18em] text-paper/80 transition hover:text-paper"
                >
                  {l.label}
                  <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 bg-blue transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Link href={loggedIn ? "/dashboard" : "/login"} className="btn btn-primary px-4 py-2.5 text-xs sm:px-5">
              {loggedIn ? "Dashboard" : "Team Login"}
            </Link>
            <button
              className="relative grid h-10 w-10 place-items-center rounded-full border border-line md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <span className={`absolute h-0.5 w-4 bg-paper transition ${open ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-0.5 w-4 bg-paper transition ${open ? "-rotate-45" : "translate-y-1"}`} />
            </button>
          </div>
        </nav>
      </header>

      {/* Rendered outside <header>: the header's backdrop-filter would otherwise become the containing
          block for this fixed overlay and squash it into the 64px bar once the page is scrolled. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-ink px-6 pt-10 pb-10 md:hidden"
          >
            <ul className="space-y-2">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="brush block py-2 text-5xl text-paper"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <p className="hand mt-10 text-3xl">Learn · Build · Grow · Together</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
