"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Dark-first with a real light mode. The pre-paint script in the workspace
 * layout has already set the attribute; this just flips and remembers it.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.wsTheme === "light" ? "light" : "dark");
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
