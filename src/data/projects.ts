import type { DealerId } from "./dealers";

export type Suit = "spades" | "hearts" | "clubs" | "diamonds";

/** Which embedded animated demo plays inside the card showcase (legacy fallback). */
export type DemoKind =
  | "mesh"
  | "vision"
  | "terminal"
  | "geo"
  | "voice"
  | "handshake"
  | "chain"
  | "zk"
  | "founder"
  | "quant";

export type Project = {
  id: string;
  dealer: DealerId;
  /** Playing-card identity for the face. */
  rank: string;
  suit: Suit;
  demo: DemoKind;
  title: string; // front of card
  subtitle: string; // front of card, under the title
  blurb: string; // the clear 2-line brief of what we built
  role: string;
  outcomes: string;
  skills: { group: string; items: string[] }[]; // what we used to build it
  /** Public source repository, if any. */
  repo?: string;
  /** Live/deployed site. Clicking the card opens this; drives the hover preview. */
  live?: string;
  /**
   * Whether `live` allows being embedded in an <iframe> (no X-Frame-Options /
   * frame-ancestors block). When true the deck shows the REAL running site;
   * when false it falls back to a live screenshot. Verified per-site.
   */
  embed?: boolean;
  /** Hero art. Auto-falls back to a live screenshot of `live` when present. */
  image?: string;
  imageAlt?: string;
};

/**
 * A live screenshot of a site — the deck shows the real frontend. Uses
 * Microlink with `waitUntil=networkidle2` so single-page apps finish booting
 * before the shot (thum.io fired too early and caught WisdomJR's splash loader).
 */
export const siteShot = (url?: string) =>
  url
    ? `https://api.microlink.io/?url=${encodeURIComponent(
        url
      )}&screenshot=true&embed=screenshot.url&meta=false&waitUntil=networkidle2`
    : undefined;

/**
 * The work — four SaaS products we designed and shipped, dealt as a four-card
 * hand. This is a client-facing portfolio, not a CV: it leads with what we
 * built and how fast, and the deck shows the REAL live site for each one.
 *
 * `embed` = the site allows <iframe> embedding (verified via response headers);
 * those cards reveal the running site live. The two that send
 * X-Frame-Options: DENY (smartguta, wisdomjr) fall back to a live screenshot.
 */
export const PROJECTS: Project[] = [
  {
    id: "wisdomjr",
    dealer: "kailosh",
    rank: "A",
    suit: "spades",
    demo: "founder",
    title: "WisdomJR",
    subtitle: "EdTech platform · built in 28 days",
    blurb:
      "An entire EdTech platform for kids aged 8–14 — lessons, parent dashboards and payments — built from scratch in 28 days.",
    role: "Web App · Product Design · Full-stack",
    outcomes: "Idea → live product in 28 days",
    skills: [
      { group: "Build", items: ["Web App Dev", "Full-stack", "Product Design"] },
      { group: "Growth", items: ["Paywall & Payments", "Dashboards"] },
    ],
    live: "https://wisdomjr-web.vercel.app/",
    embed: false, // X-Frame-Options: DENY → live screenshot
  },
  {
    id: "smartguta",
    dealer: "kailosh",
    rank: "K",
    suit: "hearts",
    demo: "vision",
    title: "SmartGuta",
    subtitle: "SaaS product · design + build",
    blurb:
      "A focused SaaS product we designed and built end-to-end — clean UX, real workflows, shipped fast.",
    role: "Web/App · Product Design",
    outcomes: "Designed + shipped end-to-end",
    skills: [
      { group: "Build", items: ["Web & App Dev", "Product Design"] },
      { group: "Glue", items: ["API Integrations", "Automation"] },
    ],
    live: "https://smartguta.vercel.app/",
    embed: false, // X-Frame-Options: DENY → live screenshot
  },
  {
    id: "quantumbay",
    dealer: "keni",
    rank: "Q",
    suit: "diamonds",
    demo: "mesh",
    title: "QuantumBay",
    subtitle: "Our studio platform",
    blurb:
      "Our own studio platform — the home base for everything Techuila designs and ships.",
    role: "Full-stack · Design · Internal Tools",
    outcomes: "Our own product, dogfooded",
    skills: [
      { group: "Build", items: ["Full-stack", "Product Design", "Internal Tools"] },
      { group: "Trust", items: ["Cybersecurity"] },
    ],
    live: "https://quantumbay.vercel.app/",
    embed: true, // embeddable → real live iframe
  },
  {
    id: "freelanceros",
    dealer: "kailosh",
    rank: "J",
    suit: "spades",
    demo: "geo",
    title: "FreelancerOS",
    subtitle: "An OS for freelancers",
    blurb:
      "An operating system for freelancers — clients, contracts, invoicing and pipeline in one calm dashboard.",
    role: "Web App · Product Design",
    outcomes: "Clients → invoices in one place",
    skills: [
      { group: "Build", items: ["Web App Dev", "Dashboards"] },
      { group: "Money", items: ["Paywall & Payments", "Automation"] },
    ],
    live: "https://freelanceros-z7hp.vercel.app/",
    embed: true, // embeddable → real live iframe
  },
].map((p) => ({
  ...(p as Project),
  image: siteShot((p as Project).live),
  imageAlt: `${p.title} — ${p.subtitle}`,
}));

export const handFor = (dealer: DealerId) =>
  PROJECTS.filter((p) => p.dealer === dealer);
