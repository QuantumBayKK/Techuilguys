import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Techuila Guys — the reborn cut",
  description:
    "A cinematic-editorial cut of the Techuila Guys studio: shader hero, a riffling deck of work, and Ace the LinkedIn-translating house cat.",
  openGraph: {
    title: "Techuila Guys — the reborn cut",
    description:
      "Cinematic-editorial portfolio: shader hero, riffling deck, and a cat who speaks fluent LinkedIn.",
  },
};

export default function RebornLayout({ children }: { children: React.ReactNode }) {
  return children;
}
