import type { DealerId } from "./dealers";

export type Suit = "spades" | "hearts" | "clubs" | "diamonds";

export type Project = {
  id: string;
  dealer: DealerId;
  /** Playing-card identity for the face. */
  rank: string;
  suit: Suit;
  title: string; // front of card
  subtitle: string; // front of card, under the title
  blurb: string; // back: what it does (the one-liner)
  role: string; // back
  outcomes: string; // back
  skills: { group: string; items: string[] }[]; // back: tech stack chips
  link?: string;
};

/**
 * The real hands. Kailosh (♠) = systems / CV / security / distributed / mobile-AI.
 * Kenny (♣, GitHub @KenidoesCode) = post-quantum crypto / web3 / ZK / AI / quant.
 */
export const PROJECTS: Project[] = [
  // ---- Kailosh's hand (Spades) ----
  {
    id: "k1",
    dealer: "kailosh",
    rank: "A",
    suit: "spades",
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
  },
  {
    id: "k2",
    dealer: "kailosh",
    rank: "K",
    suit: "spades",
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
  },
  {
    id: "k3",
    dealer: "kailosh",
    rank: "Q",
    suit: "spades",
    title: "sm1ly",
    subtitle: "Offensive-Security Recon",
    blurb:
      "One command unveils an entire attack surface — network, web, OSINT and cloud — and collapses it into a single explainable risk score.",
    role: "Offensive Security · Orchestration",
    outcomes: "Six tools, one interface · weighted risk · JSON report",
    skills: [
      { group: "Recon", items: ["nmap", "rustscan", "httpx", "nuclei", "amass", "trivy"] },
      { group: "Core", items: ["Python", "subprocess", "Risk modelling"] },
      { group: "Env", items: ["PowerShell", "WSL"] },
    ],
  },
  {
    id: "k4",
    dealer: "kailosh",
    rank: "Q",
    suit: "hearts",
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
  },
  {
    id: "k5",
    dealer: "kailosh",
    rank: "10",
    suit: "spades",
    title: "Cheri",
    subtitle: "On-Device Voice AI",
    blurb:
      "You speak; it answers aloud — a private assistant that keeps its mind on your own machine.",
    role: "Mobile AI · Local-first",
    outcomes: "On-device TTS · self-hosted LLM over LAN · privacy-preserving",
    skills: [
      { group: "Android", items: ["Kotlin", "Jetpack Compose", "Material 3"] },
      { group: "Net", items: ["OkHttp", "TextToSpeech"] },
      { group: "Backend", items: ["Node", "Express"] },
    ],
  },

  // ---- Kenny's hand (Clubs) ----
  {
    id: "n1",
    dealer: "kenny",
    rank: "A",
    suit: "clubs",
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
  },
  {
    id: "n2",
    dealer: "kenny",
    rank: "K",
    suit: "clubs",
    title: "qrmf-x",
    subtitle: "Quantum-Resistant Multi-Chain Middleware",
    blurb:
      "A middleware layer that brings quantum-resistant verification to multi-chain blockchain environments.",
    role: "Web3 · Protocol Design",
    outcomes: "PQC verification · multi-chain interoperability",
    skills: [
      { group: "Crypto", items: ["Post-quantum", "Verification systems"] },
      { group: "Web3", items: ["JavaScript", "Node", "Multi-chain", "Middleware"] },
    ],
  },
  {
    id: "n3",
    dealer: "kenny",
    rank: "Q",
    suit: "clubs",
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
  },
  {
    id: "n4",
    dealer: "kenny",
    rank: "J",
    suit: "clubs",
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
  },
  {
    id: "n5",
    dealer: "kenny",
    rank: "10",
    suit: "clubs",
    title: "Pairs-Trading-Quant",
    subtitle: "Statistical-Arbitrage Engine",
    blurb:
      "A pairs-trading strategy with cointegration testing and backtesting — statistical arbitrage on the mean-reverting spread.",
    role: "Quant Finance",
    outcomes: "Cointegrated pairs · mean-reversion · backtested edge",
    skills: [
      { group: "Quant", items: ["Statistical arbitrage", "Cointegration", "Time-series"] },
      { group: "Data", items: ["Python", "pandas", "numpy"] },
    ],
  },
];

export const handFor = (dealer: DealerId) =>
  PROJECTS.filter((p) => p.dealer === dealer);
