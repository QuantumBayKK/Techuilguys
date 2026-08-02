import type { Metadata, Viewport } from "next";
import { Zilla_Slab, Inter, Pinyon_Script, Gochi_Hand, JetBrains_Mono } from "next/font/google";
import "./globals.css";
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

// Workspace numerics: task ids, commit hashes, durations, byte counts.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://techuila-guys.vercel.app"),
  title: {
    default: "Techuila Guys — SaaS products that ship",
    template: "%s",
  },
  description:
    "We design & build SaaS products that ship — web, apps, AI, automation & payments. Idea to live, in weeks. Built by Kailosh & Keni.",
  openGraph: {
    title: "Techuila Guys",
    description:
      "We design & build SaaS products that ship — web, apps, AI, automation & payments. Idea to live, in weeks.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Techuila Guys",
    description:
      "We design & build SaaS products that ship — web, apps, AI, automation & payments. Idea to live, in weeks.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0907",
};

/**
 * Root layout is deliberately bare: fonts, tokens, analytics. The cinematic
 * chrome (custom cursor, Lenis, grain, poker nav) belongs to the marketing site
 * only and lives in `(site)/layout.tsx` — the workspace under `(workspace)`
 * is a different product and must not inherit any of it.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${script.variable} ${ink.variable} ${mono.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
