"use client";

import { useEffect, useRef } from "react";

type CalFn = ((...args: unknown[]) => void) & { q?: unknown[]; ns?: Record<string, CalFn>; loaded?: boolean };
declare global {
  interface Window {
    Cal?: CalFn;
  }
}

const NS = "tg-30min";

/**
 * Cal.com's official inline embed. A bare <iframe> of the /embed URL stays blank:
 * Cal keeps that page hidden until embed.js on the parent completes a handshake.
 * This is Cal's documented loader snippet, written out readably.
 */
export default function CalEmbed({ calLink, fallbackHref }: { calLink: string; fallbackHref: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window;
    if (!w.Cal) {
      const queue = (target: CalFn, args: unknown[]) => {
        target.q = target.q ?? [];
        target.q.push(args);
      };
      const cal = function (...args: unknown[]) {
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q ?? [];
          const s = document.createElement("script");
          s.src = "https://app.cal.com/embed/embed.js";
          s.async = true;
          document.head.appendChild(s);
          cal.loaded = true;
        }
        if (args[0] === "init") {
          const ns = args[1] as string;
          const api = function (...a: unknown[]) {
            queue(api, a);
          } as CalFn;
          api.q = api.q ?? [];
          if (typeof ns === "string") {
            cal.ns![ns] = cal.ns![ns] ?? api;
            queue(cal.ns![ns], args);
            queue(cal, ["initNamespace", ns]);
          } else queue(cal, args);
          return;
        }
        queue(cal, args);
      } as CalFn;
      w.Cal = cal;
    }

    const Cal = w.Cal!;
    Cal("init", NS, { origin: "https://app.cal.com" });
    Cal.ns![NS]("inline", {
      elementOrSelector: el.current,
      calLink,
      config: { layout: "month_view", theme: "light" },
    });
    Cal.ns![NS]("ui", {
      theme: "light",
      cssVarsPerTheme: { light: { "cal-brand": "#103b2d" } },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  }, [calLink]);

  return (
    <div ref={el} className="min-h-[640px] w-full">
      <noscript>
        <a href={fallbackHref}>Open the booking page</a>
      </noscript>
    </div>
  );
}
