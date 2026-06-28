export type DealerId = "kailosh" | "keni";

export type Dealer = {
  id: DealerId;
  name: string;
  /** Court-card rank, for the framed portrait treatment. */
  rank: string;
  suit: "♠" | "♣";
  tagline: string;
  portrait: string;
  accent: string; // css var name driving the neon rim
  /** Short founder bio shown in the "ask me about the founders" reveal. */
  bio: string;
  /** Headline focus areas, rendered as chips. */
  focus: string[];
  /** Personal GitHub profile. */
  github: string;
  /** #82 "The Tell" — a quirk/habit, revealed on hover like reading a player. */
  tell: string;
};

/**
 * NOTE: photo→dealer assignment is a guess from the supplied images and is
 * fully swappable — just swap the `portrait` paths if Kailosh/Keni are
 * reversed. Content is data-driven; nothing else needs to change.
 */
export const DEALERS: Dealer[] = [
  {
    id: "kailosh",
    name: "Kailosh",
    rank: "King of Spades",
    suit: "♠",
    tagline: "Websites, apps & AI systems that ship fast.",
    portrait: "/portraits/dealer-kailosh.jpeg",
    accent: "--color-neon-amber",
    bio: "Kailosh ships product. Websites and apps, clean UI, AI features and automations that actually run — he takes a rough idea and gets a real, paying-customer-ready SaaS live in weeks, not quarters, and forward-deploys with the client until it works.",
    focus: ["Web & App Dev", "Product Design", "AI & Automation", "Forward-Deployed", "Cybersecurity"],
    github: "https://github.com/Sk1zmo",
    tell: "Will sit in your stand-ups until it ships — forward-deployed, not fire-and-forget.",
  },
  {
    id: "keni",
    name: "Keni",
    rank: "King of Clubs",
    suit: "♣",
    tagline: "Full-stack, payments, blockchain & internal tools.",
    portrait: "/portraits/dealer-kenny.jpeg",
    accent: "--color-brass-bright",
    bio: "Keni makes products make money. Full-stack builds, paywalls and payment flows that convert, blockchain and web3 when it's actually useful, plus the internal tools and automations that keep a SaaS running — turning AI and the hard stuff into things customers happily pay for.",
    focus: ["Full-stack", "Payments & Paywalls", "Blockchain", "Internal Tools", "AI Products"],
    github: "https://github.com/KenidoesCode",
    tell: "Will find the wedge that turns a side project into recurring revenue.",
  },
];

export const dealerById = (id: DealerId) => DEALERS.find((d) => d.id === id)!;
