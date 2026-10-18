import Link from "next/link";
import HeroShowcase from "@/components/site/HeroShowcase";
import Faq from "@/components/site/Faq";
import {
  CtaBand,
  EngagementsSection,
  FoundersSection,
  ProcessSection,
  SectionHead,
  ServicesList,
  WorkGrid,
} from "@/components/site/Sections";
import { SITE } from "@/content/site";

const HEADLINE = ["We design and build", "software products,", "and ship them in weeks."];

export default function Home() {
  return (
    <>
      {/* Hero — the headline rises line by line, then the live products slide in. */}
      <section className="wrap pb-8 pt-32 md:pb-20 md:pt-40 lg:pb-28">
        <h1 className="t-hero">
          {HEADLINE.map((line, i) => (
            <span key={line} className="rise" style={{ ["--i" as string]: i }}>
              <span>{line}</span>
            </span>
          ))}
        </h1>
        <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4 lg:pt-2">
            <p className="lede fade-in text-muted" style={{ ["--d" as string]: "450ms" }}>
              Techuila Guys is a product studio for founders and companies worldwide. We take SaaS platforms, web and
              mobile apps, AI features and payment systems from idea to launch.
            </p>
            <div className="fade-in mt-9 flex flex-wrap gap-3" style={{ ["--d" as string]: "600ms" }}>
              <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-ink">
                Book a call
              </a>
              <Link href="/work" className="btn btn-line">
                See our work
              </Link>
            </div>
          </div>
          <div className="lg:col-span-8">
            <HeroShowcase />
          </div>
        </div>
      </section>

      <section className="wrap py-24 md:py-32">
        <SectionHead
          title="What we build"
          intro="One senior team across design, engineering and launch, so nothing gets lost in a hand-off."
          action={{ href: "/services", label: "All services" }}
        />
        <div className="mt-14">
          <ServicesList />
        </div>
      </section>

      <section className="bg-paper-2">
        <div className="wrap py-24 md:py-32">
          <SectionHead
            title="Products we've shipped"
            intro="Every one of these is live. Open them, click around, then read how we built them."
            action={{ href: "/work", label: "All case studies" }}
          />
          <div className="mt-14">
            <WorkGrid />
          </div>
        </div>
      </section>

      <ProcessSection />

      <EngagementsSection />

      <section className="border-t border-rule">
        <div className="wrap py-24 md:py-32">
          <SectionHead
            title="You work with the founders"
            intro="No account managers in between. The two people on your call are the two people building your product."
            action={{ href: "/about", label: "About the studio" }}
          />
          <div className="mt-14">
            <FoundersSection withBio={false} />
          </div>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="wrap grid gap-10 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-4">
            <h2 className="t-1">Questions clients ask</h2>
            <p className="mt-5 text-muted">
              Something else on your mind?{" "}
              <Link href="/contact" className="link-u link text-ink">
                Ask us directly
              </Link>
              .
            </p>
          </div>
          <div className="md:col-span-8">
            <Faq />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
