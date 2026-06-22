import type { Metadata, Viewport } from "next";
import { Zilla_Slab, Inter, Pinyon_Script } from "next/font/google";
import "./globals.css";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import MuteToggle from "@/components/ui/MuteToggle";
import Header from "@/components/ui/Header";
import ScrollProgress from "@/components/ui/ScrollProgress";
import Ambience from "@/components/Ambience";

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
    "A high-end poker lounge where every project is a card. Pick your dealer, read the hand, meet the cat. Built by Kailosh & Keni.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0907",
  colorScheme: "dark",
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
        <Ambience />
        <Cursor />
        <ScrollProgress />
        <Header />
        <MuteToggle />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
