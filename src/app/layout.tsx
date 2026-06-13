import type { Metadata } from "next";
import { Zilla_Slab, Inter, Pinyon_Script } from "next/font/google";
import "./globals.css";
import CanvasRoot from "@/components/three/CanvasRoot";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import MuteToggle from "@/components/ui/MuteToggle";

const display = Zilla_Slab({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Techuila Guys — Pick your dealer",
  description:
    "A high-end poker table where every project is a card. Pick a dealer, get dealt a hand, flip the cards. Built by Kailosh & Kenny.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${script.variable}`}
    >
      <body className="film-grain vignette grade">
        <CanvasRoot />
        <Cursor />
        <MuteToggle />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
