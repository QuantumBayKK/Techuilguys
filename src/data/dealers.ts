export type DealerId = "kailosh" | "kenny";

export type Dealer = {
  id: DealerId;
  name: string;
  /** Court-card rank, for the framed portrait treatment. */
  rank: string;
  tagline: string;
  portrait: string;
  accent: string; // css var name driving the neon rim
};

/**
 * NOTE: photo→dealer assignment is a guess from the supplied images and is
 * fully swappable — just swap the `portrait` paths if Kailosh/Kenny are
 * reversed. Content is data-driven; nothing else needs to change.
 */
export const DEALERS: Dealer[] = [
  {
    id: "kailosh",
    name: "Kailosh",
    rank: "The King of Spades",
    tagline: "Systems, computer vision, security & distributed builds.",
    portrait: "/portraits/dealer-kailosh.jpeg",
    accent: "--color-neon-amber",
  },
  {
    id: "kenny",
    name: "Kenny",
    rank: "The King of Clubs",
    tagline: "Post-quantum crypto, blockchain, zero-knowledge & quant.",
    portrait: "/portraits/dealer-kenny.jpeg",
    accent: "--color-brass-bright",
  },
];

export const dealerById = (id: DealerId) =>
  DEALERS.find((d) => d.id === id)!;
