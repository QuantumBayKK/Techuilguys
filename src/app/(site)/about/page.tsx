import type { Metadata } from "next";
import { CtaBand, FoundersSection, PageHeader } from "@/components/site/Sections";
import { WORK } from "@/content/work";

export const metadata: Metadata = {
  title: "About",
  description:
    "Techuila Guys is a founder-led product studio. Meet Kailosh and Keni, the two engineers who design and build every product we ship.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    title: "Ship, then refine",
    body: "A working product in front of real users teaches more than any spec. We get there fast and improve from evidence.",
  },
  {
    title: "Build it to be handed over",
    body: "Clean code, documentation and accounts in your name. You should be able to grow an in-house team on top of what we leave.",
  },
  {
    title: "Stay close to the problem",
    body: "We join your standups, talk to your users and stay through launch. Forward-deployed, not fire-and-forget.",
  },
  {
    title: "Use the boring tool when it's the right one",
    body: "We reach for AI, blockchain or anything new only when it makes the product better for the people using it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="A founder-led studio that builds like it's our own product."
        lede={`Techuila Guys is Kailosh and Keni — two engineers who design and build every product we ship. ${WORK.length} products live and counting, for clients and for ourselves.`}
      />

      <section className="wrap pb-24 md:pb-32">
        <FoundersSection />
      </section>

      <section className="bg-paper-2">
        <div className="wrap grid gap-12 py-24 md:grid-cols-12 md:py-32">
          <h2 className="t-1 md:col-span-4">How we work</h2>
          <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 md:col-span-8">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="border-t border-ink pt-5">
                <h3 className="t-3">{p.title}</h3>
                <p className="mt-3 text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand title="Let's see if we're the right team for it." />
    </>
  );
}
