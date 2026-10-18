import type { Metadata, Viewport } from "next";
import { Zilla_Slab, Inter, JetBrains_Mono, Schibsted_Grotesk, Instrument_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/content/site";

// Marketing site: Schibsted Grotesk for headings, Instrument Sans for text.
const heading = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--nf-heading",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--nf-sans",
  display: "swap",
});

// Workspace faces — /workspace headings, body and numerics.
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

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const TITLE = SITE.title;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE,
    template: "%s",
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f3ef",
};

/**
 * Root layout is deliberately bare: fonts, tokens, analytics. The marketing
 * chrome (nav, footer, page transitions) lives in `(site)/layout.tsx` — the
 * workspace under `(workspace)` is a different product and inherits none of it.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${heading.variable} ${sans.variable} ${display.variable} ${body.variable} ${mono.variable}`}
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
