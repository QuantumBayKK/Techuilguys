"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide motion, driven by data attributes so pages stay server components:
 *
 *   data-split          heading words rise into place when scrolled to
 *   data-reveal         children marked data-reveal-item fade up in a stagger
 *   data-parallax       image drifts against the scroll (wrap it larger than its box)
 *   data-count          a number counts up from 0 when it enters
 *   data-tilt           card tilts toward the cursor, with a moving glare
 *   data-magnetic       button leans toward the cursor
 *   #scroll-progress    thin bar tracking page scroll
 *
 * Content is fully visible without JavaScript. Everything is skipped for
 * reduced motion, and hover effects only run on fine pointers.
 */
export default function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      // Split headings into words.
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        if (!el.dataset.splitDone) {
          splitWords(el);
          el.dataset.splitDone = "true";
        }
        gsap.from(el.querySelectorAll(".sw-i"), {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.045,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      // Staggered reveals.
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((group) => {
        const items = group.querySelectorAll("[data-reveal-item]");
        gsap.from(items.length ? items : group, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 85%", once: true },
        });
      });

      // Parallax images.
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // Count-ups (only plain integers).
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.textContent?.trim());
        if (!Number.isFinite(target) || target === 0) return;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
        });
      });

      // Scroll progress.
      const bar = document.getElementById("scroll-progress");
      if (bar) {
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } },
        );
      }
    });

    if (fine) {
      // Tilt + glare.
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        gsap.set(el, { transformPerspective: 900 });
        const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
        const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
        const max = Number(el.dataset.tilt) || 6;
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          ry((px - 0.5) * max * 2);
          rx((0.5 - py) * max * 2);
          el.style.setProperty("--mx", `${px * 100}%`);
          el.style.setProperty("--my", `${py * 100}%`);
        };
        const leave = () => {
          rx(0);
          ry(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
          gsap.set(el, { clearProps: "transform" });
        });
      });

      // Magnetic buttons.
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          x((e.clientX - (r.left + r.width / 2)) * 0.3);
          y((e.clientY - (r.top + r.height / 2)) * 0.35);
        };
        const leave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
          gsap.set(el, { clearProps: "transform" });
        });
      });
    }

    // Images load late and shift trigger positions.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const t = window.setTimeout(refresh, 600);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("load", refresh);
      cleanups.forEach((c) => c());
      ctx.revert();
    };
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div id="scroll-progress" className="h-full origin-left scale-x-0 bg-accent motion-reduce:hidden" />
    </div>
  );
}

/** Wrap each word in a clipped span so it can rise from below its baseline. */
function splitWords(el: HTMLElement) {
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const outer = document.createElement("span");
        outer.className = "sw";
        const inner = document.createElement("span");
        inner.className = "sw-i";
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.parentNode?.replaceChild(frag, node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).classList.contains("sw")) {
      [...node.childNodes].forEach(walk);
    }
  };
  [...el.childNodes].forEach(walk);
}
