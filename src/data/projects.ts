import type { DealerId } from "./dealers";

export type Suit = "spades" | "hearts" | "clubs" | "diamonds";

/** Which embedded animated demo plays inside the card showcase. */
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
  blurb: string; // what it does (the one-liner)
  role: string;
  outcomes: string;
  skills: { group: string; items: string[] }[]; // tech stack chips
  /** Public source repository, if any. Renders a "Code ↗" action. */
  repo?: string;
  /** Live/deployed preview URL, if any. Renders a "Live ↗" action. */
  live?: string;
  /**
   * Optional AI-generated hero art (or real screenshot) for the deck.
   * Generate in Gemini, drop the file into `public/projects/`, then set the
   * path here (e.g. `/projects/bifrost.webp`). When present it replaces the
   * live SVG demo in the showcase; when absent the demo plays as a fallback.
   * See `public/projects/README.md` for the exact filenames + Gemini prompts.
   */
  image?: string;
  /** Alt text / caption used when `image` is set. */
  imageAlt?: string;
};

/**
 * The real hands. Kailosh (♠) = systems / CV / security / distributed / mobile-AI.
 * Keni (♣, GitHub @KenidoesCode) = post-quantum crypto / web3 / ZK / AI / quant.
 */
export const PROJECTS: Project[] = [
  // ---- Kailosh's hand (Spades) ----
  {
    id: "k1",
    dealer: "kailosh",
    rank: "A",
    suit: "spades",
    demo: "mesh",
    image: "/projects/bifrost.png",
    imageAlt: "Bifrost — zero-config LAN mesh discovery",
    title: "Bifrost",
    subtitle: "Zero-Config LAN Mesh",
    blurb:
      "Two machines on the same Wi-Fi find each other in ~5 seconds and share messages, files and voice — no servers, no setup, no internet.",
    role: "Systems · P2P · Cross-platform",
    outcomes: "One Rust core → TUI · Android · iOS, four concurrent services",
    skills: [
      { group: "Core", items: ["Rust", "Tokio"] },
      { group: "Networking", items: ["UDP", "TCP", "Wire protocol", "Zero-config discovery"] },
      { group: "Clients", items: ["ratatui", "Flutter", "SwiftUI"] },
    ],
    repo: "https://github.com/Sk1zmo/Bifrost",
  },
  {
    id: "k2",
    dealer: "kailosh",
    rank: "K",
    suit: "spades",
    demo: "vision",
    image: "/projects/atlas.png",
    imageAlt: "ATLAS — tactical surveillance suite tracking a face across cameras",
    title: "ATLAS",
    subtitle: "Tactical Surveillance Suite",
    blurb:
      "Find one face across a city of cameras — detected on stride frames, tracked through the gaps, confirmed against hours of footage.",
    role: "Computer Vision · Full-stack",
    outcomes: "Metro-scale CCTV · live + offline pipelines · Windows build",
    skills: [
      { group: "Vision", items: ["YOLOv8", "OpenCV", "Face embeddings", "IoU tracking"] },
      { group: "Backend", items: ["Python", "FastAPI", "SQLite", "MJPEG"] },
      { group: "Ship", items: ["PyInstaller"] },
    ],
    repo: "https://github.com/Sk1zmo/ATLAS",
  },
  {
    id: "k4",
    dealer: "kailosh",
    rank: "J",
    suit: "spades",
    demo: "geo",
    image: "/projects/anemoi.png",
    imageAlt: "Anemoi — geospatial memory system reconstructing a journey",
    title: "Anemoi",
    subtitle: "Geospatial Memory System",
    blurb:
      "Every journey captured, reconstructed and remembered — then queried by meaning and by graph across everywhere you've been.",
    role: "Distributed · Geospatial",
    outcomes: "Event-driven monorepo · capture → reconstruct → vector + graph",
    skills: [
      { group: "Backend", items: ["TypeScript", "Fastify", "Apache Kafka"] },
      { group: "Data", items: ["PostGIS", "pgvector", "Graph queries"] },
      { group: "App", items: ["Expo", "React Native", "Docker Compose"] },
    ],
    repo: "https://github.com/Sk1zmo/Anemoi",
  },

  // ---- Keni's hand (Clubs) ----
  {
    id: "n1",
    dealer: "keni",
    rank: "A",
    suit: "clubs",
    demo: "handshake",
    image: "/projects/ipsec-pqc.png",
    imageAlt: "ipsec-pqc-ikev2 — post-quantum key exchange handshake",
    title: "ipsec-pqc-ikev2",
    subtitle: "Post-Quantum VPN Key Exchange",
    blurb:
      "Post-quantum key establishment for IPsec VPNs using ML-KEM (Kyber) — tunnels hardened against harvest-now-decrypt-later attacks.",
    role: "Security Research · Cryptography",
    outcomes: "ML-KEM inside the IKEv2 handshake · strongSwan integration",
    skills: [
      { group: "Crypto", items: ["ML-KEM", "Kyber", "Post-quantum"] },
      { group: "Systems", items: ["C", "IPsec", "IKEv2", "strongSwan"] },
    ],
    repo: "https://github.com/KenidoesCode/ipsec-pqc-ikev2",
  },
  {
    id: "n3",
    dealer: "keni",
    rank: "Q",
    suit: "clubs",
    demo: "zk",
    image: "/projects/zk-airec.png",
    imageAlt: "zk-airec — zero-knowledge proven recommendations",
    title: "zk-airec",
    subtitle: "Zero-Knowledge Recommendations",
    blurb:
      "Personalized recommendations that prove they're correct without ever exposing your data — via zero-knowledge proofs.",
    role: "Applied Cryptography · ML",
    outcomes: "ZK-proven results · privacy-preserving by construction",
    skills: [
      { group: "Crypto", items: ["Zero-knowledge proofs", "Applied cryptography"] },
      { group: "ML", items: ["Recommender systems", "Privacy-preserving ML"] },
      { group: "Core", items: ["JavaScript"] },
    ],
    repo: "https://github.com/KenidoesCode/zk-airec",
  },
  {
    id: "n4",
    dealer: "keni",
    rank: "J",
    suit: "clubs",
    demo: "founder",
    image: "/projects/founderos.png",
    imageAlt: "founderos — an AI cofounder spanning idea, strategy and execution",
    title: "founderos",
    subtitle: "AI Cofounder",
    blurb:
      "Your AI cofounder — a startup engine and founder-intelligence system spanning idea, strategy and execution.",
    role: "AI Product · Full-stack",
    outcomes: "Flagship studio product · most product-shaped of the deck",
    skills: [
      { group: "Product", items: ["TypeScript", "Full-stack", "Systems thinking"] },
      { group: "AI", items: ["LLM apps", "Founder intelligence"] },
    ],
    repo: "https://github.com/KenidoesCode/founderos",
  },
];

export const handFor = (dealer: DealerId) =>
  PROJECTS.filter((p) => p.dealer === dealer);
