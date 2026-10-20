import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { CtaPanel, FitSection, PageHero, ProcessSection } from "@/components/site/Sections";
import { ALSO, EXCLUSIONS, SERVICES } from "@/content/site-copy";
import { workBySlug } from "@/content/work";

export const metadata: Metadata = {
  title: "Services",
  description:
    "SaaS and web products, mobile apps and PWAs, AI, automation and payments — designed and built end to end by Techuila Guys.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Three things we build,"
        accent="end to end."
        lede="Design and engineering in the same two pairs of hands, from the first sketch to a product people can use."
      />

      <section className="wrap space-y-6 py-20 md:py-28">
        {SERVICES.map((s, i) => (
          <article
            key={s.id}
            id={s.id}
            className="grid scroll-mt-28 gap-8 rounded-[28px] border border-black/5 bg-card p-6 md:grid-cols-2 md:p-8"
          >
            <div className={`flex flex-col ${i % 2 ? "md:order-2" : ""}`}>
              <span className="figure text-sm text-accent-deep">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="t-1 mt-3">{s.name}</h2>
              <p className="mt-4 text-muted">{s.summary}</p>
              <h3 className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">Deliverables</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {s.deliverables.map((d) => (
                  <li key={d} className="rounded-full border border-rule px-3 py-1.5 text-sm">
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-muted md:mt-auto md:pt-8">
                See it in{" "}
                {s.proof.map((slug, j) => {
                  const w = workBySlug(slug);
                  if (!w) return null;
                  return (
                    <span key={slug}>
                      {j > 0 && " and "}
                      <Link href={`/work/${slug}`} className="link-u link text-ink">
                        {w.name}
                      </Link>
                    </span>
                  );
                })}
                .
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-night">
              <Image src={s.image} alt="" fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover object-top" />
            </div>
          </article>
        ))}

        <div className="grid gap-6 pt-6 md:grid-cols-2">
          <div className="tile-soft rounded-[24px] p-7">
            <h2 className="t-3">Also on request</h2>
            <ul className="mt-5 space-y-2.5">
              {ALSO.map((a) => (
                <li key={a} className="flex gap-3 text-[0.95rem]">
                  <Check size={17} aria-hidden className="mt-1 shrink-0 text-accent-deep" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] border border-black/5 bg-card p-7">
            <h2 className="t-3">What we don&apos;t do</h2>
            <ul className="mt-5 space-y-2.5">
              {EXCLUSIONS.map((e) => (
                <li key={e} className="flex gap-3 text-[0.95rem] text-muted">
                  <X size={17} aria-hidden className="mt-1 shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ProcessSection />
      <FitSection />
      <CtaPanel />
    </>
  );
}
