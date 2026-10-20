import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { CtaPanel, FitSection, PageHero, ProcessSection } from "@/components/site/Sections";
import { FOUNDERS } from "@/content/team";
import { WORK } from "@/content/work";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Techuila Guys is a two-founder product studio. Meet Kailosh and Keni — the two builders who design and build every product we ship.",
  alternates: { canonical: "/studio" },
};

const PRINCIPLES = [
  {
    title: "Ship, then refine",
    body: "A working product in front of real users teaches more than any spec. We get there and improve from what we learn.",
  },
  {
    title: "Build it to be handed over",
    body: "Readable code, documentation and accounts in your name, so your own team can take it on.",
  },
  {
    title: "Stay close to the problem",
    body: "We talk to the people who'll use it, and stay through launch rather than handing over a zip file.",
  },
  {
    title: "Use the plain tool when it's the right one",
    body: "AI, blockchain or anything new goes in only when it makes the product better for the people using it.",
  },
];

export default function StudioPage() {
  return (
    <>
      <PageHero
        eyebrow="Studio"
        title="Two builders,"
        accent="one studio."
        lede={`Techuila Guys is Kailosh and Keni. Small on purpose: you talk directly to the people who design and build your product. ${WORK.length} products shipped so far, for clients and for ourselves.`}
      />

      <section className="wrap py-20 md:py-28">
        <div className="grid gap-4 md:grid-cols-2">
          {FOUNDERS.map((f) => (
            <article key={f.id} className="flex flex-col rounded-[28px] border border-black/5 bg-card p-7 md:p-9">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-night font-[family-name:var(--font-heading)] text-xl text-accent">
                {f.name[0]}
              </span>
              <h2 className="t-1 mt-6">{f.name}</h2>
              <p className="mt-1 text-muted">{f.role}</p>
              <p className="mt-6 leading-relaxed">{f.bio}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {f.focus.map((x) => (
                  <li key={x} className="rounded-full border border-rule px-3 py-1 text-sm">
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule pt-6 text-sm md:mt-auto">
                <a href={`mailto:${f.email}`} className="link-u link break-all">
                  {f.email}
                </a>
                <a href={f.github} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-muted hover:text-ink">
                  GitHub <ArrowUpRight size={13} aria-hidden />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dark bg-night text-white">
        <div className="wrap grid gap-12 py-24 md:grid-cols-12 md:py-28">
          <div className="md:col-span-4">
            <p className="eyebrow">Principles</p>
            <h2 className="t-1 mt-4">How we work.</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 md:col-span-8">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="rounded-[22px] border border-white/10 bg-night-2 p-6">
                <h3 className="t-3">{p.title}</h3>
                <p className="mt-3 text-sm text-mist">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProcessSection />
      <FitSection />
      <CtaPanel title="Let's see if we're" accent="the right team for it." />
    </>
  );
}
