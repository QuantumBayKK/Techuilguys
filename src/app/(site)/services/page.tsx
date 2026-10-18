import type { Metadata } from "next";
import { CtaBand, EngagementsSection, PageHeader, ProcessSection, ServicesList } from "@/components/site/Sections";
import { ALSO } from "@/content/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Product design, web applications, mobile and PWA, AI and automation, payments and billing, and security — designed and built by one senior team.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="Design, engineering and launch, under one roof."
        lede="We cover the whole path from first sketch to a product customers pay for. Bring us the full build or the one piece you're missing."
      />
      <section className="wrap pb-20">
        <ServicesList detailed />
        <div className="mt-10 grid gap-4 md:grid-cols-12">
          <h2 className="t-3 md:col-span-4">Also on request</h2>
          <p className="text-muted md:col-span-8">{ALSO.join(", ")}.</p>
        </div>
      </section>
      <ProcessSection />
      <EngagementsSection />
      <CtaBand />
    </>
  );
}
