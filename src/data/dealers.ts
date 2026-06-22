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
    tagline: "Systems, computer vision, security & distributed builds.",
    portrait: "/portraits/dealer-kailosh.jpeg",
    accent: "--color-neon-amber",
    bio: "Kailosh builds the hard parts. A zero-config Rust mesh that finds peers in five seconds, a metro-scale surveillance pipeline, a one-command recon suite — he lives where systems, computer vision and security meet, and ships all the way down to native TUI, Android and iOS.",
    focus: ["Systems", "Computer Vision", "Security", "Distributed", "Mobile AI"],
    github: "https://github.com/Sk1zmo",
  },
  {
    id: "keni",
    name: "Keni",
    rank: "King of Clubs",
    suit: "♣",
    tagline: "Post-quantum crypto, blockchain, zero-knowledge & quant.",
    portrait: "/portraits/dealer-kenny.jpeg",
    accent: "--color-brass-bright",
    bio: "Keni works at the frontier of trust. Post-quantum key exchange for VPNs, quantum-resistant multi-chain middleware, zero-knowledge recommendations, an AI cofounder and a statistical-arbitrage engine — cryptography and AI turned into products people can actually use.",
    focus: ["Post-Quantum Crypto", "Zero-Knowledge", "Web3", "AI Products", "Quant"],
    github: "https://github.com/KenidoesCode",
  },
];

export const dealerById = (id: DealerId) => DEALERS.find((d) => d.id === id)!;
