import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Constellation from "@/components/site/Constellation";
import HeroPrompt from "@/components/site/HeroPrompt";
import Ticker from "@/components/site/Ticker";
import {
  CtaPanel,
  FaqSection,
  HeroTeasers,
  InHouseSection,
  ProcessSection,
  SectionHead,
  ServiceCards,
  WorkingSection,
  WorkList,
} from "@/components/site/Sections";
import { HERO, SITE } from "@/content/site-copy";

export default function Home() {
  return (
    <>
      {/* Hero — a dark panel with the drifting network, the line, the prompt, the two ways in. */}
      <div className="pt-2 md:pt-4">
        <section className="panel dark min-h-[min(100svh,960px)]">
          <Constellation />
          <div className="glow pointer-events-none absolute inset-0" />
          <div className="wrap relative flex min-h-[min(100svh,960px)] flex-col items-center justify-center pb-40 pt-32 text-center md:pb-44">
            <p className="eyebrow fade-up" style={{ ["--d" as string]: "100ms" }}>
              {HERO.eyebrow}
            </p>
            <h1 className="t-hero mt-6 max-w-4xl">
              <span className="block">{HERO.lineOne}</span>
              <span className="type-in block">
                {HERO.lineTwo.split(" ").map((word, i) => (
                  <span key={`${word}-${i}`} style={{ ["--i" as string]: i }}>
                    {word}{" "}
                  </span>
                ))}
              </span>
            </h1>
            <div className="fade-up mt-12 flex w-full justify-center" style={{ ["--d" as string]: "700ms" }}>
              <HeroPrompt />
            </div>
            <div className="fade-up mt-8 flex flex-wrap justify-center gap-3" style={{ ["--d" as string]: "850ms" }}>
              <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-accent btn-lg">
                Book a call <ArrowRight size={16} aria-hidden />
              </a>
              <Link href="/work" className="btn btn-ghost btn-lg">
                See the work
              </Link>
            </div>
          </div>
        </section>
      </div>

      <HeroTeasers />

      <Ticker />

      <section className="bg-band">
        <div className="wrap pb-24 pt-20 md:pb-32 md:pt-28">
          <SectionHead
            eyebrow="What we build"
            title="Three things we build,"
            accent="end to end."
            action={{ href: "/services", label: "All services" }}
          />
          <div className="mt-14 md:mt-20">
            <ServiceCards />
          </div>
        </div>
      </section>

      <WorkingSection />

      <section className="wrap py-24 md:py-32">
        <SectionHead
          eyebrow="Selected work"
          title="Products we designed,"
          accent="built and shipped."
          intro="Real products, with honest status. Where we don't have a measured outcome, we show what was built instead of inventing a number."
          action={{ href: "/work", label: "All case studies" }}
        />
        <div className="mt-14">
          <WorkList />
        </div>
      </section>

      <InHouseSection />

      <ProcessSection />

      <FaqSection />

      <CtaPanel />
    </>
  );
}
