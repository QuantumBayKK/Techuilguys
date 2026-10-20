/**
 * Every word the marketing site says, in one place. Components only lay this
 * out — edit copy here, not in JSX. Case studies live in `work.ts`, founders in
 * `team.ts`.
 *
 * Rule for this file: no claim we can't back up. No invented metrics, client
 * logos, testimonials, fixed prices or guaranteed timelines.
 */

export const SITE = {
  name: "Techuila Guys",
  title: "Techuila Guys — We design and build SaaS products that ship",
  url: "https://www.techuilaguys.com",
  description:
    "Techuila Guys is an independent product studio. We design and build SaaS products, web and mobile apps, AI features, automations and payment flows — from idea to a live, usable product.",
  location: "India",
  /** Both founders read every enquiry. */
  emails: [
    { name: "Kailosh", address: "kailoshkalimuthu@northwindcipher.com" },
    { name: "Keni", address: "pranauvshrinaath@northwindcipher.com" },
  ],
  /** Straight to the 30-minute slot picker — the profile page is one click too many. */
  bookCall: "https://cal.com/pranauvshrinaath/30min",
  /** Same event, rendered inline on /contact via Cal's embed script. */
  calLink: "pranauvshrinaath/30min",
  github: "https://github.com/QuantumBayKK",
};

export const NAV = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

export const HERO = {
  /** The logo's tagline. */
  eyebrow: "Ideas · Products · Impact",
  /** Rendered as two lines; the second fades in word by word. */
  lineOne: "We design and build",
  lineTwo: "SaaS products that ship.",
  promptPlaceholder: "What are you trying to build?",
  promptHelp: "Describe it in a line — we'll pick it up on the next page.",
};

export type Service = {
  id: string;
  name: string;
  summary: string;
  deliverables: string[];
  /** Real product screenshot used on the card. */
  image: string;
  /** Case-study slugs that show this service in practice. */
  proof: string[];
};

/** The three headline services, shown as cards on the home page. */
export const SERVICES: Service[] = [
  {
    id: "saas-web",
    name: "SaaS and web products",
    summary:
      "Marketplaces, dashboards and customer-facing web apps — designed, built and launched by the same two people.",
    deliverables: ["Product and UX design", "Full-stack build", "Admin and dashboards", "APIs and integrations"],
    image: "/work/smartguta.webp",
    proof: ["smartguta", "northwind-quest"],
  },
  {
    id: "mobile",
    name: "Mobile apps and PWAs",
    summary:
      "Installable apps for iOS, Android and the web from one codebase, with role-based flows and offline-friendly screens.",
    deliverables: ["Progressive web apps", "Android and iOS builds", "Role-based apps", "Device-ready UI"],
    image: "/work/dikkiconnect.webp",
    proof: ["dikkiconnect"],
  },
  {
    id: "ai-automation",
    name: "AI, automation and payments",
    summary:
      "Auto-replies, follow-ups and lead tracking that take repetitive work off your team, plus the payment flows that make a product earn.",
    deliverables: ["WhatsApp and email automation", "Lead capture and tracking", "Payment follow-ups", "Subscriptions and escrow"],
    image: "/work/quantumbay.webp",
    proof: ["quantumbay", "freelanceros"],
  },
];

/** Everything else we take on, listed on /services. */
export const ALSO = [
  "Internal tools",
  "API integrations",
  "Payment and subscription flows",
  "Product rescues of half-finished MVPs",
  "Blockchain integrations, where they fit",
];

/** What we don't do — so the wrong projects don't book a call. */
export const EXCLUSIONS = [
  "Pure marketing sites with no product behind them",
  "Ongoing ad, SEO or social-media management",
  "Projects that need a large team on day one",
];

/** "How we work" — a real sequence, so it's numbered. */
export const PROCESS = [
  { name: "Define the problem", body: "A call to understand who it's for, what has to work, and what already exists." },
  { name: "Scope the smallest useful release", body: "We agree in writing what the first version does — and what it doesn't." },
  { name: "Design the workflow", body: "Key screens and flows, clickable, before the build starts." },
  { name: "Build and integrate", body: "Front end, back end, payments and third-party services, shown as it comes together." },
  { name: "Launch", body: "Deployed on your accounts, with the code and documentation handed over." },
  { name: "Iterate", body: "We stay on to fix, extend and improve once real users arrive — if you want us to." },
];

export const PROCESS_NOTE =
  "Timelines and cost depend on scope and complexity. You'll get both in writing after the first call, before anything starts.";

/** Tiles in the dark "what working with us looks like" grid. */
export const WORKING = {
  title: "What working with us",
  titleAccent: "actually looks like.",
  intro: "Two founders, one studio. Who you talk to, what we build on, and what you walk away with.",
  people: "You talk to the people building it",
  peopleBody: "No account managers. The two founders scope, design and build your product themselves.",
  shapes: "Project, embedded or ongoing.",
  shapesBody:
    "Build a first version with a clear scope, have us work inside your team, or keep us on as the product grows.",
  stack: ["TypeScript", "React", "Next.js", "Vite", "Capacitor", "Vercel"],
  stackLabel: "What we build on",
  yours: ["Source code", "Repositories", "Hosting", "Documentation"],
  yoursLabel: "Handed over at launch",
  filmLabel: "Idea → product",
};

/** Who we're the right studio for. */
export const FIT = {
  title: "Is this a fit?",
  bestFor: [
    "Founders with a real product idea who need it designed and built",
    "Teams with a stalled or half-finished MVP that needs shipping",
    "Operators who need an internal tool, automation or integration",
    "Existing products that need a reliable build partner",
  ],
  helps: [
    "Who the product is for and the one job it must do well",
    "Anything that exists already — designs, code, a spreadsheet",
    "Your timeline, and a rough budget range if you have one",
  ],
};

export const FAQ = [
  {
    q: "What does Techuila Guys actually build?",
    a: "Software products: SaaS platforms and marketplaces, web and mobile apps, and the AI features, automations and payment flows inside them. Every project in our work section is something we designed and built ourselves.",
  },
  {
    q: "How does a project start?",
    a: "With a 30-minute call. We ask who the product is for and what it must do, then send a written scope with what the first release includes, a timeline and a quote.",
  },
  {
    q: "How long does it take, and what does it cost?",
    a: "It depends on scope and complexity, so we don't publish fixed packages. After the first call you get a timeline and a quote in writing, before you commit to anything.",
  },
  {
    q: "What happens when the scope changes?",
    a: "We talk about it before doing it. Changes are agreed in writing, with their effect on time and cost, so there are no surprises.",
  },
  {
    q: "Who owns the code?",
    a: "You do. At launch we hand over the source code, repositories, hosting and documentation, so your own team can take it from there.",
  },
  {
    q: "Do you work with clients outside India?",
    a: "Yes. We're based in India and work with clients in other time zones over video calls, shared tools and regular check-ins.",
  },
];

export const CTA = {
  eyebrow: "Next step",
  title: "Tell us what you're building,",
  titleAccent: "and where it's stuck.",
  body: "Book a 30-minute call with the founders. If we're not the right studio for it, we'll tell you.",
  checks: ["30 minutes", "Free, no obligation", "Times shown in your time zone"],
};

export const CONTACT = {
  title: "Tell us what you're building.",
  lede: "Send a short brief and both founders will read it, or book a call below.",
  projectTypes: ["New product or MVP", "Finish or fix an existing product", "Mobile app", "AI or automation", "Payments or integrations", "Something else"],
  budgets: ["Under $10k", "$10k to $25k", "$25k to $50k", "Over $50k", "Not sure yet"],
  timelines: ["As soon as possible", "Within 1 to 3 months", "In 3 to 6 months", "Just exploring"],
  next: [
    "Both founders read your brief.",
    "We reply by email with questions or a time to talk.",
    "After a call, you get a written scope, timeline and quote.",
  ],
};
