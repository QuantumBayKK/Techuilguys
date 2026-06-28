import type { Metadata, Viewport } from "next";
import { Zilla_Slab, Inter, Pinyon_Script, Gochi_Hand } from "next/font/google";
import "./globals.css";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import TopNav from "@/components/ui/TopNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import Ambience from "@/components/Ambience";
import TimeOfDay from "@/components/ui/TimeOfDay";
import IdleTell from "@/components/ui/IdleTell";
import ConsoleEgg from "@/components/ui/ConsoleEgg";
import SvgFilters from "@/components/ui/SvgFilters";
import { Analytics } from "@vercel/analytics/next";

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

// #8 — the hand-drawn ink font for annotations / labels (structure-vs-spontaneity)
const ink = Gochi_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ink",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://techuila-guys.vercel.app"),
  title: {
    default: "Techuila Guys — Pick your dealer",
    template: "%s",
  },
  description:
    "A high-end poker lounge where every project is a card. Pick your dealer, read the hand, meet the cat. Built by Kailosh & Keni.",
  openGraph: {
    title: "Techuila Guys",
    description:
      "A high-end poker lounge where every project is a card. Built by Kailosh & Keni.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Techuila Guys",
    description: "We design & build SaaS products that ship — web, apps, AI, automation & payments.",
  },
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
      className={`${display.variable} ${body.variable} ${script.variable} ${ink.variable}`}
    >
      <body className="film-grain vignette grade">
        <SvgFilters />
        <TimeOfDay />
        <Ambience />
        <Cursor />
        <IdleTell />
        <ConsoleEgg />
        <ScrollProgress />
        <TopNav />
        <SmoothScroll>{children}</SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
