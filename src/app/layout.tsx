import type { Metadata, Viewport } from "next";
import { Zilla_Slab, Inter, Pinyon_Script, Gochi_Hand, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
      <head>
        {/*
          Stamps the saved workspace theme onto <html> before first paint, so
          light mode never flashes dark.

          It lives in the ROOT layout, not the workspace one, for two reasons.
          A raw <script> element inside a component gets reconciled on client
          renders — where React never executes it and warns about it — whereas
          `beforeInteractive` is injected into the initial HTML instead of the
          React tree. And it has to run on the FIRST load of any page: the
          marketing nav links into /workspace client-side, which executes no
          new scripts, so a script scoped to the workspace layout would simply
          never fire for anyone arriving that way.

          `beforeInteractive` is only honoured in the root layout, which is
          also the only place it would be correct.
        */}
        <Script id="ws-theme-preload" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("ws-theme");document.documentElement.dataset.wsTheme=t==="light"?"light":"dark"}catch(e){}`}
        </Script>
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
