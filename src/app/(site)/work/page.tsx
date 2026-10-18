import type { Metadata } from "next";
import { CtaBand, PageHeader, WorkGrid } from "@/components/site/Sections";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies from Techuila Guys: EdTech, PropTech, logistics, fintech and sales automation products we designed, built and launched.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <PageHeader
        title="Products we've designed, built and launched."
        lede="From a kids' money-skills platform to a four-sided logistics marketplace. Every product here is live — open it and try it."
      />
      <section className="wrap pb-24 md:pb-32">
        <WorkGrid />
      </section>
      <CtaBand title="Want your product on this page?" />
    </>
  );
}
