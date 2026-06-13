"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

export function initGsap() {
  if (registered || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  // The intro is a wall-clock cinematic: on a slow frame we want it to keep
  // real time and skip frames, NOT crawl. Default lagSmoothing stretches
  // timelines on low-fps devices — kill it.
  gsap.ticker.lagSmoothing(0);

  // Signature easings — deliberate, weighty, never linear.
  CustomEase.create("dealer", "M0,0 C0.16,1 0.3,1 1,1"); // heavy settle (expo-ish)
  CustomEase.create("chip", "M0,0 C0.7,0 0.2,1 1,1"); // anticipation + snap
  CustomEase.create("felt", "M0,0 C0.65,0.05 0.36,1 1,1"); // smooth reveal

  registered = true;
  return gsap;
}

export { gsap, ScrollTrigger, CustomEase };
