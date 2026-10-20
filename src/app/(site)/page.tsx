import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroShader from "@/components/site/HeroShader";
import HeroIntro from "@/components/site/HeroIntro";
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

/** Each word in its own clipped span so the intro can raise it into place. */
function Words({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i, all) => (
        <Fragment key={`${w}-${i}`}>
          <span className="sw">
            <span data-hero-word className={`sw-i ${className}`}>
              {w}
            </span>
          </span>
          {i < all.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero — WebGL liquid smoke, the animated mark, the line, the prompt, two ways in. */}
      <div className="pt-2 md:pt-4">
        <section className="panel dark min-h-[min(100svh,980px)] bg-[radial-gradient(80%_60%_at_50%_110%,rgba(214,31,44,0.25),transparent),#0a0506]">
          <HeroShader />
          <div className="wrap relative flex min-h-[min(100svh,980px)] flex-col items-center justify-center pb-40 pt-28 text-center md:pb-44">
            <HeroIntro>
              <p data-hero-eyebrow className="eyebrow mt-8">
                {HERO.eyebrow}
              </p>
              <h1 className="t-display mt-5 max-w-5xl" aria-label={`${HERO.lineOne} ${HERO.lineTwo}`}>
                <span aria-hidden className="block">
                  <Words text={HERO.lineOne} />
                </span>
                <span aria-hidden className="block">
                  <Words text={HERO.lineTwo} className="shadow-red" />
                </span>
              </h1>
              <div data-hero-after className="mt-10 flex w-full justify-center">
                <HeroPrompt />
              </div>
              <div data-hero-after className="mt-8 flex flex-wrap justify-center gap-3">
                <a href={SITE.bookCall} target="_blank" rel="noreferrer" data-magnetic className="btn btn-accent btn-lg">
                  Book a call <ArrowRight size={16} aria-hidden />
                </a>
                <Link href="/work" data-magnetic className="btn btn-ghost btn-lg">
                  See the work
                </Link>
              </div>
            </HeroIntro>
          </div>
          <div aria-hidden className="scroll-cue absolute bottom-6 left-1/2 hidden h-10 w-[22px] -translate-x-1/2 rounded-full border border-white/25 md:block">
            <span className="absolute left-1/2 top-2 h-2 w-[3px] -translate-x-1/2 rounded-full bg-accent-deep" />
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
