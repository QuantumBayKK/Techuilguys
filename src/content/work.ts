/**
 * Case studies. Every fact here was checked against the live product or its
 * public repository (October 2026). Where we have no measured outcome we show a
 * concrete artifact — screens built, features live — never an invented metric.
 */

export type Fact = { value: string; label: string };

export type CaseStudy = {
  slug: string;
  name: string;
  /** Mono label above the headline, e.g. "PropTech marketplace". */
  category: string;
  platform: string;
  headline: string;
  summary: string;
  /** The big number on the card and two smaller ones — artifacts, not outcomes. */
  hero: Fact;
  facts: Fact[];
  context: string;
  problem: string;
  role: string;
  decisions: string[];
  shipped: string[];
  evidence: string;
  status: string;
  /** Public link, only when the product is publicly accessible. */
  live?: string;
  liveLabel?: string;
  image: string;
  stack: string[];
  /** True for products we run ourselves rather than built for a client. */
  inHouse?: boolean;
};

export const WORK: CaseStudy[] = [
  {
    slug: "smartguta",
    name: "SmartGuta",
    category: "PropTech marketplace",
    platform: "Web platform",
    headline: "A marketplace for council-ready housing plans",
    summary:
      "Home builders in Zimbabwe buy compliance-checked plans from African architects, with payments held in escrow until the files arrive.",
    hero: { value: "3", label: "Sides of the marketplace: buyers, studios, admins" },
    facts: [
      { value: "Escrow", label: "Checkout, released on delivery" },
      { value: "R1–R3", label: "Zoning filters on every plan" },
    ],
    context:
      "Getting a house plan approved by a local council is slow and uncertain. Buyers rarely know whether a plan meets local by-laws before they pay for it.",
    problem:
      "Buyers needed to find plans that suit their plot and council, and to pay safely. Architects needed one place to list their work and get paid.",
    role: "Product design and full-stack build, end to end.",
    decisions: [
      "Every listing carries a compliance badge, checked against local by-laws and clearly marked as indicative, not formal approval.",
      "Payments sit in escrow and release only once the buyer confirms the files.",
      "An editorial, print-drawing look, so plans read like architects' sheets rather than generic listings.",
    ],
    shipped: [
      "Plan marketplace with zoning filters, city browsing and side-by-side comparison",
      "Compliance check that scores plans against Harare by-laws",
      "Escrow checkout with automatic release and a dispute process",
      "Architect studios with profiles, plan uploads and a dashboard",
      "Design competitions",
    ],
    evidence: "Shown above: the product as built. All features listed were present in the delivered product.",
    status: "Built and delivered. Public access to the client's deployment is currently paused.",
    image: "/work/smartguta.webp",
    stack: ["Next.js", "Vercel"],
  },
  {
    slug: "northwind-quest",
    name: "Northwind Quest",
    category: "EdTech",
    platform: "Web app",
    headline: "Money skills for kids, five minutes a day",
    summary:
      "A free, game-like way for Indian kids aged 8 to 15 to learn how money works, one real decision at a time.",
    hero: { value: "6", label: "Learning worlds, from barter to investing" },
    facts: [
      { value: "8–15", label: "Age range, across six levels" },
      { value: "₹0", label: "To start, no card needed" },
    ],
    context:
      "Most kids learn about money by accident. Parents want them ready for UPI, scams and saving, but courses feel like homework.",
    problem:
      "Make daily money lessons something kids come back to on their own, while keeping parents informed without another dashboard to check.",
    role: "Product design and full-stack build.",
    decisions: [
      "Five-minute daily lessons, each built around one real decision: a price, a trade-off, or a scam to spot.",
      "Game loops kids already know — XP, streaks, hearts and weekly leagues — with gems that can never be bought with real money.",
      "Parents get a weekly digest rather than a dashboard.",
    ],
    shipped: [
      "Six learning worlds with units and modules, guided by Paisa, a coin character",
      "XP, streaks with freezes, daily goals and weekly leagues",
      "Personalised learning path from a six-question onboarding",
      "India-specific topics: UPI safety, GST, SIPs and CIBIL",
      "Parent pages, weekly digest and child-safety information",
    ],
    evidence: "Live today — open it and try a lesson.",
    status: "Live. Built under the working name WisdomJR.",
    live: "https://wisdomjr-web-alpha.vercel.app/",
    liveLabel: "Open Northwind Quest",
    image: "/work/wisdomjr.webp",
    stack: ["Next.js", "Vercel"],
  },
  {
    slug: "dikkiconnect",
    name: "DikkiConnect",
    category: "Logistics",
    platform: "Mobile app and PWA",
    headline: "Intercity parcels in the empty boot of cars already making the trip",
    summary:
      "Parcel delivery and cost-shared carpooling on the same driver network, designed around a Bangalore–Mysore pilot corridor.",
    hero: { value: "59", label: "Screens built across the app" },
    facts: [
      { value: "5", label: "Roles: sender, traveller, hub, passenger, ops" },
      { value: "3", label: "Platforms: web, Android, iOS" },
    ],
    context:
      "Cars travel between cities every day with an empty boot. Parcel senders pay for dedicated couriers that make the same trip.",
    problem:
      "One product had to serve five very different users — senders, travellers, hubs, passengers and an operations team — without becoming five apps to maintain.",
    role: "Product design and front-end build of the complete app, including Android and iOS packaging.",
    decisions: [
      "One codebase with role-based flows, packaged for web, Android and iOS.",
      "Every hand-off is confirmed with a one-time code, so it's always clear who holds a parcel.",
      "Real loading and empty states on every screen, so the product can be demoed and piloted as-is.",
    ],
    shipped: [
      "Sender flow: book a parcel, choose route and hub, pay, track",
      "Traveller flow: create trips, accept jobs, scan, OTP hand-off, identity verification screens",
      "Hub flow: intake, inventory, scanning and receiver pickup",
      "Passenger carpooling: search, book, board with OTP, ride tracking",
      "Wallet, plus a desktop operations console",
    ],
    evidence:
      "The complete front end is built: 59 routes across five roles. The public site is the sign-up entry point.",
    status: "Front-end MVP complete, prepared for a pilot.",
    live: "https://dikkiconnect.vercel.app/",
    liveLabel: "Open DikkiConnect",
    image: "/work/dikkiconnect.webp",
    stack: ["React", "TypeScript", "Vite", "Capacitor"],
  },
  {
    slug: "freelanceros",
    name: "FreelancerOS",
    category: "Fintech SaaS",
    platform: "Web app",
    headline: "Freelancers get paid without chasing clients",
    summary:
      "FreelancerOS sends calm, professional follow-ups on unpaid invoices automatically, and stops as soon as the payment arrives.",
    hero: { value: "0", label: "Reminder emails the freelancer has to write" },
    facts: [
      { value: "Auto", label: "Follow-ups until paid" },
      { value: "Free", label: "To add your first client" },
    ],
    context: "Freelancers lose time — and sometimes clients — writing awkward payment reminders.",
    problem: "Get invoices paid without the freelancer having to send a single follow-up themselves.",
    role: "Product design and full-stack build.",
    decisions: [
      "One job, done well: payment follow-ups, nothing else in the way.",
      "A calm, professional tone in every message, so the client relationship survives the reminder.",
      "Follow-ups stop automatically the moment a payment lands.",
    ],
    shipped: [
      "Account sign-up and client records",
      "Automated follow-up sequence for unpaid invoices",
      "Free start: add the first client at no cost",
    ],
    evidence: "Live today — the sign-up flow is public.",
    status: "Live.",
    live: "https://freelanceros-z7hp.vercel.app/",
    liveLabel: "Open FreelancerOS",
    image: "/work/freelanceros.webp",
    stack: ["Next.js", "Vercel"],
  },
  {
    slug: "quantumbay",
    name: "QuantumBay",
    category: "Sales automation",
    platform: "In-house product",
    headline: "Every enquiry answered instantly and tracked to close",
    summary:
      "Our own lead-automation product for businesses: instant WhatsApp and email replies, follow-ups and a simple CRM across every channel.",
    hero: { value: "4", label: "Channels in one inbox: WhatsApp, email, web, ads" },
    facts: [
      { value: "Instant", label: "Auto-reply to new enquiries" },
      { value: "Daily", label: "And weekly enquiry summaries" },
    ],
    context: "Small businesses lose sales when enquiries arrive across WhatsApp, email, forms and ads, and nobody replies in time.",
    problem: "Make sure every enquiry gets an immediate response and lands in one place, without heavy CRM software.",
    role: "We designed, built and run it ourselves.",
    decisions: [
      "A lightweight automation layer instead of a heavy CRM.",
      "Meet customers where they already talk: WhatsApp and email first.",
      "Minimal maintenance for the business owner.",
    ],
    shipped: [
      "WhatsApp and email auto-replies",
      "Website and form to messaging integration",
      "Lead logging, tagging and status tracking",
      "Missed-enquiry follow-ups and scheduled reminders",
      "Central enquiry dashboard with export and daily or weekly summaries",
    ],
    evidence: "Live today — the product site is public.",
    status: "Live, operated by us.",
    live: "https://quantumbay.vercel.app/",
    liveLabel: "Open QuantumBay",
    image: "/work/quantumbay.webp",
    stack: ["React", "Vite", "Vercel"],
    inHouse: true,
  },
];

export const workBySlug = (slug: string) => WORK.find((w) => w.slug === slug);
export const clientWork = WORK.filter((w) => !w.inHouse);
export const inHouseWork = WORK.filter((w) => w.inHouse);
export const hostOf = (url: string) => new URL(url).host;
