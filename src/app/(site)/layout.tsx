import type { Metadata } from "next";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import MotionRoot from "@/components/site/MotionRoot";
import CursorRing from "@/components/site/CursorRing";
import { SITE } from "@/content/site-copy";

export const metadata: Metadata = {
  title: { default: SITE.title, template: `%s — ${SITE.name}` },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  email: SITE.emails[0].address,
  areaServed: "Worldwide",
  address: { "@type": "PostalAddress", addressCountry: "IN" },
  sameAs: [SITE.github],
};

/**
 * Marketing-site chrome. Lives one level below the root so `/workspace` never
 * inherits the nav, footer or page transition.
 */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="site flex min-h-svh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Nav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      {/* After the page content so it sees the current route's DOM. */}
      <MotionRoot />
      <CursorRing />
    </div>
  );
}
