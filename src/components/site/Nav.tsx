"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { NAV, SITE } from "@/content/site-copy";

/**
 * Floating pill navigation. Sits over the top of the hero panel, then gains a
 * blurred dark backing once the page scrolls.
 */
export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="dark pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <a
        href="#main"
        className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <div
        className={`pointer-events-auto mx-auto flex h-14 max-w-[1080px] items-center justify-between gap-4 rounded-full border pl-5 pr-2 transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled || open
            ? "border-white/12 bg-night/85 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            : "border-white/10 bg-white/[0.03] backdrop-blur-sm"
        }`}
      >
        <Logo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-7 text-[0.92rem]">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`link transition-colors ${isActive(item.href) ? "text-white" : "text-white/70 hover:text-white"}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm max-[380px]:!hidden">
          Book a call
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-11 w-11 place-items-center rounded-full text-white md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto mx-auto mt-2 max-w-[1080px] rounded-3xl border border-white/12 bg-night/95 p-3 backdrop-blur-xl md:hidden"
          >
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 font-[family-name:var(--font-heading)] text-xl text-white hover:bg-white/5"
                  >
                    {item.label}
                    <ArrowRight size={18} className="text-white/40" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-accent btn-lg mt-2 w-full">
              Book a call <ArrowRight size={16} aria-hidden />
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
