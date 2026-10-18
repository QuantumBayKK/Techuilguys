export type CaseStudy = {
  slug: string;
  name: string;
  sector: string;
  platform: string;
  /** One line on the result — the thing a buyer remembers. */
  headline: string;
  summary: string;
  /** What the product is, in plain terms. */
  product: string;
  built: string[];
  services: string[];
  live: string;
  image: string;
  /** Extra line shown under the name, e.g. a former name. */
  note?: string;
};

/** Real products, live today. Order = order on the site. */
export const WORK: CaseStudy[] = [
  {
    slug: "smartguta",
    name: "SmartGuta",
    sector: "PropTech marketplace",
    platform: "Web platform",
    headline: "A marketplace for climate-ready housing plans across Africa.",
    summary:
      "A marketplace where African architects sell compliance-checked housing plans — drawings, schedules and bills of quantities — with escrow-protected payments.",
    product:
      "Buyers browse and compare plans designed for their climate and council rules. Architects open a studio, list their work and enter design competitions. Payments sit in escrow until the files are delivered.",
    built: [
      "Plan marketplace with search and side-by-side comparison",
      "Architect studios and design competitions",
      "Escrow-protected checkout",
      "Editorial design system with a print-drawing feel",
    ],
    services: ["Product design", "Web applications", "Payments and billing"],
    live: "https://smartguta.vercel.app/",
    image: "/work/smartguta.webp",
  },
  {
    slug: "northwind-quest",
    name: "Northwind Quest",
    note: "Built as WisdomJR",
    sector: "EdTech",
    platform: "Web app",
    headline: "A full learning platform, from idea to live in 28 days.",
    summary:
      "A free, game-like way for kids aged 8 to 15 to learn how money works — five minutes a day, one real decision at a time.",
    product:
      "Kids travel through six worlds guided by Paisa, a friendly coin character, making small money decisions that add up to real financial skills. Parents get a weekly digest instead of another dashboard to babysit.",
    built: [
      "Lesson engine and progress tracking for kids",
      "Parent accounts with weekly email digests",
      "Payments and a paywall for premium content",
      "Character-led interface, built mobile first",
    ],
    services: ["Product design", "Web applications", "Payments and billing"],
    live: "https://wisdomjr-web-alpha.vercel.app/",
    image: "/work/wisdomjr.webp",
  },
  {
    slug: "dikkiconnect",
    name: "DikkiConnect",
    sector: "Logistics",
    platform: "Progressive web app",
    headline: "Four apps in one: senders, travellers, hubs and passengers.",
    summary:
      "Intercity parcel delivery that rides in the empty boot space of cars already making the trip, with verified identities and a tamper-evident custody chain.",
    product:
      "Senders book a delivery, travellers already driving the route carry it, and hubs handle hand-offs. Every party is verified, and each hand-off is confirmed with a one-time code so the parcel's chain of custody is never in doubt.",
    built: [
      "Four role-based apps in a single installable PWA",
      "Aadhaar e-KYC identity verification",
      "OTP-confirmed custody chain for every hand-off",
      "Wallets, payouts and weekly settlement",
    ],
    services: ["Mobile and PWA", "Security and identity", "Payments and billing"],
    live: "https://dikkiconnect.vercel.app/",
    image: "/work/dikkiconnect.webp",
  },
  {
    slug: "freelanceros",
    name: "FreelancerOS",
    sector: "Fintech SaaS",
    platform: "Web app",
    headline: "Freelancers get paid without sending a single reminder.",
    summary:
      "A calm workspace for freelancers that sends professional follow-ups on unpaid invoices automatically, until the payment lands.",
    product:
      "Freelancers keep clients, contracts, invoices and their pipeline in one place. When an invoice goes overdue, FreelancerOS follows up on their behalf — politely, on a schedule — so they never have to write the awkward email.",
    built: [
      "Client, contract and invoice management",
      "Automated payment follow-up sequences",
      "Pipeline dashboard",
      "Free onboarding to the first client",
    ],
    services: ["Web applications", "AI and automation", "Payments and billing"],
    live: "https://freelanceros-z7hp.vercel.app/",
    image: "/work/freelanceros.webp",
  },
  {
    slug: "quantumbay",
    name: "QuantumBay",
    sector: "Sales automation",
    platform: "Web platform",
    headline: "Lead capture and follow-up that answers enquiries in minutes.",
    summary:
      "Our own sales and lead automation product: one system that captures enquiries from every channel, follows up automatically and tracks each lead to close.",
    product:
      "Businesses lose deals by replying late. QuantumBay pulls leads from web forms, chat and messaging into one place, sends the first response instantly with lightweight AI, and keeps the follow-up going until a person takes over.",
    built: [
      "Unified lead inbox across channels",
      "AI-assisted first response and follow-up",
      "Lead tracking and pipeline reporting",
      "Built and run by us, used with our own clients",
    ],
    services: ["AI and automation", "Web applications"],
    live: "https://quantumbay.vercel.app/",
    image: "/work/quantumbay.webp",
  },
];

export const workBySlug = (slug: string) => WORK.find((w) => w.slug === slug);

/** Bare hostname for the browser-frame address bar. */
export const hostOf = (url: string) => new URL(url).host;
