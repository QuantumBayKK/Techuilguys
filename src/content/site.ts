/**
 * Everything the marketing site says, in one place. Components only lay this
 * out — edit copy here, not in JSX.
 */

export const SITE = {
  name: "Techuila Guys",
  title: "Techuila Guys — Product studio for SaaS, apps and AI",
  url: "https://www.techuilaguys.com",
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
  description:
    "Techuila Guys is a product studio that designs and builds SaaS platforms, web and mobile apps, AI features and payment systems — from idea to launch in weeks.",
  location: "India",
  /** Shown on the contact page and in the footer. */
  responseTime: "We reply within one business day.",
};

export const NAV = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export type Service = {
  id: string;
  name: string;
  summary: string;
  includes: string[];
  /** Case-study slugs that show this service in practice. */
  proof: string[];
};

export const SERVICES: Service[] = [
  {
    id: "product-design",
    name: "Product design",
    summary:
      "Research, user flows and interface design for web and mobile, delivered as a clickable prototype and a design system your team can keep building on.",
    includes: ["Product discovery", "UX and UI design", "Design systems", "Clickable prototypes"],
    proof: ["smartguta", "northwind-quest"],
  },
  {
    id: "web-applications",
    name: "Web applications",
    summary:
      "SaaS platforms, marketplaces, dashboards and customer portals, built on a modern TypeScript stack that is fast to change and easy to hand over.",
    includes: ["Multi-tenant SaaS", "Marketplaces", "Admin dashboards", "APIs and integrations"],
    proof: ["smartguta", "freelanceros"],
  },
  {
    id: "mobile",
    name: "Mobile and PWA",
    summary:
      "Installable apps that feel native, keep working on a patchy connection and reach users on iOS, Android and desktop from a single codebase.",
    includes: ["Progressive web apps", "Cross-platform apps", "Offline-first sync", "Push notifications"],
    proof: ["dikkiconnect"],
  },
  {
    id: "ai-automation",
    name: "AI and automation",
    summary:
      "AI features that do real work inside your product, and automations that take repetitive follow-up, data entry and routing off your team's plate.",
    includes: ["AI assistants", "Lead capture and follow-up", "Document and data extraction", "Workflow automation"],
    proof: ["quantumbay", "freelanceros"],
  },
  {
    id: "payments",
    name: "Payments and billing",
    summary:
      "Subscriptions, paywalls, invoicing, wallets and payouts — the flows that turn a product into revenue, built to be reliable and auditable.",
    includes: ["Subscriptions and paywalls", "Invoicing", "Wallets and payouts", "Escrow and marketplace payments"],
    proof: ["northwind-quest", "dikkiconnect", "smartguta"],
  },
  {
    id: "security",
    name: "Security and identity",
    summary:
      "Sign-in, roles and permissions, identity verification and security reviews, so the product is safe to put in front of customers and regulators.",
    includes: ["Authentication and roles", "Identity verification (KYC)", "Security reviews", "Audit trails"],
    proof: ["dikkiconnect"],
  },
];

/** Also available, but not headline services. */
export const ALSO = ["Internal tools", "Data dashboards", "Blockchain integrations", "Product rescues and takeovers"];

export const PROCESS = [
  {
    name: "Scope",
    body: "A 30-minute call to understand the problem, then a written scope with timeline, milestones and a quote you can take to your team.",
  },
  {
    name: "Design",
    body: "We design the key flows as a clickable prototype, so you see and test the product before any code is written.",
  },
  {
    name: "Build",
    body: "Short cycles with a demo every week on a live staging link. You follow progress, approve milestones and share files in your client workspace.",
  },
  {
    name: "Launch and grow",
    body: "We deploy, monitor and hand over the code, accounts and documentation — then stay on to support and extend the product if you want us to.",
  },
];

export const ENGAGEMENTS = [
  {
    name: "Product sprint",
    lead: "From idea to launched MVP in 4 to 8 weeks.",
    body: "For founders validating a new product. Fixed scope and timeline, agreed up front.",
  },
  {
    name: "Product team",
    lead: "Design and engineering capacity, billed monthly.",
    body: "For companies with a roadmap. We work through your backlog, release by release.",
  },
  {
    name: "Forward-deployed",
    lead: "We join your team and ship inside your codebase.",
    body: "For teams that need senior hands now. We attend your standups and work in your tools.",
  },
];

/** What every client gets, regardless of engagement. */
export const COMMITMENTS = [
  "You own the code, repositories and accounts from the first commit.",
  "A demo every week on a live staging link.",
  "A private client workspace for timelines, approvals, files and requests.",
  "Direct access to the founders who build your product.",
];

export const FAQ = [
  {
    q: "Do you work with clients outside India?",
    a: "Yes. We're based in India and work with clients across time zones. We set overlap hours for calls, and weekly demos plus the client workspace keep everyone in sync between them.",
  },
  {
    q: "How long does a project take?",
    a: "A focused MVP usually takes 4 to 8 weeks. Northwind Quest, a full learning platform with parent dashboards and payments, went from idea to live in 28 days. We'll give you a timeline in the written scope before you commit.",
  },
  {
    q: "How do you price projects?",
    a: "After a scoping call we send a written quote. Product sprints are priced per project with a fixed scope; ongoing work is billed monthly. There are no surprise invoices — scope changes are agreed in writing first.",
  },
  {
    q: "Who owns the code?",
    a: "You do, from the first commit. The repositories, hosting and third-party accounts are set up in your name, and we hand over documentation at launch.",
  },
  {
    q: "What technology do you use?",
    a: "Mostly TypeScript, React and Next.js on the front end, Node and Postgres on the back end, deployed to Vercel or your cloud. We pick tools your future team can hire for, not novelties.",
  },
  {
    q: "Can you take over an existing product?",
    a: "Yes. We start with a short code and security review, share what we find, and then agree a plan to stabilise and extend it.",
  },
];
