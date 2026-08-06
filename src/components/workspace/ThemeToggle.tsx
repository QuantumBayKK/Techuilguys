"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Dark-first with a real light mode. The `beforeInteractive` script in the root
 * layout normally sets the attribute before paint; this flips and remembers it.
 *
 * The attribute is not trusted blindly — if that script was blocked, or
 * localStorage threw in private mode, it will be missing, and reading storage
 * again here recovers the right answer one frame late rather than silently
 * resetting the person to dark every visit.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = document.documentElement;
    let current = root.dataset.wsTheme;

    if (current !== "light" && current !== "dark") {
      try {
        current = localStorage.getItem("ws-theme") === "light" ? "light" : "dark";
      } catch {
        current = "dark";
      }
      root.dataset.wsTheme = current;
    }

    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function flip() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.wsTheme = next;
    try {
      localStorage.setItem("ws-theme", next);
    } catch {
      // Private mode — the toggle still works for this session.
    }
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="rounded-lg p-2 text-[var(--ws-muted)] transition-colors hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
