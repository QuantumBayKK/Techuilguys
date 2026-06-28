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
  /** Hero art. Auto-falls back to a live screenshot of `live` when present. */
  image?: string;
  imageAlt?: string;
};

/** A live screenshot of a site — the deck shows the real frontend on hover. */
export const siteShot = (url?: string) =>
  url
    ? `https://image.thum.io/get/width/1280/crop/1600/noanimate/viewportwidth/1366/${url}`
    : undefined;

/**
 * The work — SaaS products we designed and shipped for clients. This is a
 * client-facing portfolio, not a CV: it leads with what we built and the speed
 * we built it, not the deep-tech under the hood.
 *
 * NOTE: `live` URLs + briefs for the non-WisdomJR entries are placeholders —
 * fill them with the real values and the hover screenshots auto-generate.
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
      "We built an entire EdTech platform for kids aged 8–14 — lessons, parent dashboards and payments — from scratch in 28 days.",
    role: "Web App · Product Design · Full-stack",
    outcomes: "Idea → live product in 28 days",
    skills: [
      { group: "Build", items: ["Web App Dev", "Full-stack", "Product Design"] },
      { group: "Growth", items: ["Paywall & Payments", "Dashboards"] },
    ],
    live: "", // TODO: real URL → enables the live hover screenshot
  },
  {
    id: "founderos",
    dealer: "keni",
    rank: "K",
    suit: "clubs",
    demo: "founder",
    title: "FounderOS",
    subtitle: "AI cofounder for builders",
    blurb:
      "An AI cofounder that turns a rough idea into a plan and ships the busywork — strategy, ops and momentum in one place. (brief: confirm)",
    role: "AI Product · Full-stack",
    outcomes: "AI-native SaaS, end to end",
    skills: [
      { group: "Build", items: ["AI Systems", "Automation", "Full-stack"] },
      { group: "Ops", items: ["Internal Tools", "API Integrations"] },
    ],
    live: "", // TODO
  },
  {
    id: "smartguta",
    dealer: "kailosh",
    rank: "Q",
    suit: "hearts",
    demo: "vision",
    title: "SmartGuta",
    subtitle: "SaaS product · design + build",
    blurb:
      "A SaaS product we designed and built end-to-end. (brief: tell us the one-liner — what it does, who it's for, how fast we shipped it.)",
    role: "Web/App · Product Design",
    outcomes: "Designed + shipped end-to-end",
    skills: [
      { group: "Build", items: ["Web & App Dev", "Product Design"] },
      { group: "Glue", items: ["API Integrations", "Automation"] },
    ],
    live: "", // TODO
  },
  {
    id: "quantumbay",
    dealer: "keni",
    rank: "J",
    suit: "diamonds",
    demo: "mesh",
    title: "QuantumBay",
    subtitle: "Our studio platform",
    blurb:
      "Our own studio platform — the home base for everything Techuila ships. (brief: confirm the one-liner.)",
    role: "Full-stack · Design · Internal Tools",
    outcomes: "Our own product, dogfooded",
    skills: [
      { group: "Build", items: ["Full-stack", "Product Design", "Internal Tools"] },
      { group: "Trust", items: ["Cybersecurity"] },
    ],
    live: "", // TODO
  },
  {
    id: "freelanceros",
    dealer: "kailosh",
    rank: "10",
    suit: "spades",
    demo: "geo",
    title: "FreelancerOS",
    subtitle: "An OS for freelancers",
    blurb:
      "An operating system for freelancers — clients, contracts, invoicing and pipeline in one calm dashboard. (brief: confirm.)",
    role: "Web App · Product Design",
    outcomes: "Clients → invoices in one place",
    skills: [
      { group: "Build", items: ["Web App Dev", "Dashboards"] },
      { group: "Money", items: ["Paywall & Payments", "Automation"] },
    ],
    live: "", // TODO
  },
].map((p) => ({
  ...(p as Project),
  image: siteShot((p as Project).live),
  imageAlt: `${p.title} — ${p.subtitle}`,
}));

export const handFor = (dealer: DealerId) =>
  PROJECTS.filter((p) => p.dealer === dealer);
