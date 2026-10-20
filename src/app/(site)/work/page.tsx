import type { Metadata } from "next";
import { CtaPanel, InHouseSection, PageHero, WorkList } from "@/components/site/Sections";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies from Techuila Guys: a PropTech marketplace, an EdTech app, a logistics app, a fintech tool and our own sales-automation product.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="Selected work"
        title="Products we designed,"
        accent="built and shipped."
        lede="Each case study says what the problem was, what we did, what shipped and where the product stands today."
      />
      <section className="wrap py-20 md:py-28">
        <WorkList />
      </section>
      <InHouseSection />
      <CtaPanel title="Want your product" accent="on this page?" />
    </>
  );
}
