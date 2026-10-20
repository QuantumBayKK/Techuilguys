import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import HeroFilm from "./HeroFilm";
import Faq from "./Faq";
import { CTA, FIT, PROCESS, PROCESS_NOTE, SERVICES, SITE, WORKING } from "@/content/site-copy";
import { FOUNDERS } from "@/content/team";
import { clientWork, inHouseWork, type CaseStudy } from "@/content/work";

/*
 * Motion is attached by MotionRoot through data attributes:
 * data-split (word reveal), data-reveal / data-reveal-item (stagger),
 * data-tilt (3D tilt + glare), data-parallax, data-count, data-magnetic.
 */

/* ------------------------------------------------------------------ */
/* Section heading: eyebrow, headline with an accent tail, optional    */
/* intro and a pill link on the right.                                 */
/* ------------------------------------------------------------------ */

export function SectionHead({
  eyebrow,
  title,
  accent,
  intro,
  action,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  intro?: string;
  action?: { href: string; label: string };
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 data-split className="t-1 glitch mt-4">
          {title}
          {accent && (
            <>
              {" "}
              <span className="accent">{accent}</span>
            </>
          )}
        </h2>
        {intro && <p className={`mt-5 max-w-xl ${dark ? "text-mist" : "text-muted"}`}>{intro}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          data-magnetic
          className={`btn btn-sm shrink-0 self-start md:self-auto ${dark ? "btn-ghost" : "btn-line"}`}
        >
          {action.label} <ArrowRight size={14} aria-hidden />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero teasers: four cards straddling the bottom edge of the hero.     */
/* ------------------------------------------------------------------ */

export function HeroTeasers() {
  return (
    <div className="wrap relative z-10 -mt-24 md:-mt-28">
      <ul data-reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {clientWork.map((w) => (
          <li key={w.slug} data-reveal-item>
            <Link
              href={`/work/${w.slug}`}
              data-tilt="7"
              data-cursor="View"
              className="tilt group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/8 bg-card p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)] transition-colors duration-300 hover:border-accent/50"
            >
              <span className="eyebrow">{w.category}</span>
              <span className="mt-2 font-[family-name:var(--font-heading)] text-[1.05rem] leading-snug">{w.headline}</span>
              <span className="mt-auto flex items-end justify-between gap-3 border-t border-rule pt-4">
                <span>
                  <span data-count className="figure block text-2xl text-ink">
                    {w.hero.value}
                  </span>
                  <span className="text-xs text-muted">{w.hero.label}</span>
                </span>
                <ArrowUpRight
                  size={18}
                  aria-hidden
                  className="shrink-0 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-deep"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Services: three cards, real screenshots in dark frames, middle raised */
/* ------------------------------------------------------------------ */

export function ServiceCards() {
  return (
    <ul data-reveal className="grid gap-6 md:grid-cols-3 md:gap-5">
      {SERVICES.map((s, i) => (
        <li key={s.id} data-reveal-item className={i === 1 ? "md:-translate-y-8" : ""}>
          <Link href={`/services#${s.id}`} data-tilt="6" data-cursor="Explore" className="tilt group block rounded-[24px]">
            <div className="relative overflow-hidden rounded-[24px] bg-night p-3 pb-20 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(214,31,44,0.35),transparent)] transition-opacity duration-500 group-hover:opacity-100 md:opacity-60" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-night-3">
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 380px, 100vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]"
                />
              </div>
              <div className="dark absolute inset-x-3 bottom-3 rounded-[16px] border border-white/10 bg-night-3/95 p-4 text-white backdrop-blur transition-transform duration-500 group-hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="t-3">{s.name}</h3>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 transition-all duration-300 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                    <ArrowUpRight size={15} aria-hidden />
                  </span>
                </div>
                <p className="mt-2 text-sm text-mist">{s.summary}</p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Dark bento: how working with us looks.                              */
/* ------------------------------------------------------------------ */

export function WorkingSection() {
  return (
    <section className="dark relative overflow-hidden bg-night text-white">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="wrap relative py-24 md:py-32">
        <SectionHead dark eyebrow="How we work" title={WORKING.title} accent={WORKING.titleAccent} intro={WORKING.intro} />

        <div data-reveal className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-[auto_auto_auto]">
          {/* You ↔ the founders */}
          <div data-reveal-item className="tile-soft group rounded-[22px] p-6">
            <div className="flex items-center gap-3">
              {FOUNDERS.map((f, i) => (
                <span
                  key={f.id}
                  className={`grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-night font-[family-name:var(--font-heading)] text-sm text-accent-deep transition-transform duration-500 ${
                    i === 0 ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"
                  }`}
                >
                  {f.name[0]}
                </span>
              ))}
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">You ↔ the founders</span>
            </div>
            <h3 className="t-3 mt-6">{WORKING.people}</h3>
            <p className="mt-2 text-sm text-muted">{WORKING.peopleBody}</p>
          </div>

          {/* The film */}
          <div data-reveal-item className="md:col-span-2 md:row-span-2">
            <HeroFilm label={WORKING.filmLabel} />
          </div>

          {/* Engagement shapes */}
          <div data-reveal-item className="relative overflow-hidden rounded-[22px] border border-white/10 bg-night-2 p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <h3 className="t-2 relative">{WORKING.shapes}</h3>
            <p className="relative mt-3 text-sm text-mist">{WORKING.shapesBody}</p>
            <a href={SITE.bookCall} target="_blank" rel="noreferrer" data-magnetic className="btn btn-white btn-sm relative mt-6">
              Book a call <ArrowRight size={14} aria-hidden />
            </a>
          </div>

          {/* Stack */}
          <div data-reveal-item className="tile-soft overflow-hidden rounded-[22px] p-6 md:col-span-2">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-accent-deep">{WORKING.stackLabel}</p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-[family-name:var(--font-heading)] text-[clamp(1.6rem,3vw,2.4rem)] font-light leading-tight text-ink/80">
              {WORKING.stack.map((t) => (
                <span key={t} className="transition-colors duration-300 hover:text-accent-deep">
                  {t}
                </span>
              ))}
            </p>
          </div>

          {/* Handed over */}
          <div data-reveal-item className="tile-soft rounded-[22px] p-6">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-accent-deep">{WORKING.yoursLabel}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {WORKING.yours.map((y) => (
                <li
                  key={y}
                  className="rounded-full border border-ink/15 bg-white/5 px-3 py-1 font-mono text-xs transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-white"
                >
                  {y}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Selected work: big alternating cards.                               */
/* ------------------------------------------------------------------ */

const CARD_TONES = ["bg-night", "bg-bronze"];

export function WorkCard({ work, index }: { work: CaseStudy; index: number }) {
  return (
    <article
      data-reveal-item
      className={`dark group/card grid gap-8 rounded-[28px] border border-white/8 p-6 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] transition-colors duration-500 hover:border-accent/40 md:grid-cols-2 md:p-8 ${CARD_TONES[index % 2]}`}
    >
      <div className="flex flex-col">
        <span className="figure text-sm text-white/60">{String(index + 1).padStart(2, "0")}</span>
        <p className="eyebrow mt-4">{work.category}</p>
        <h3 className="t-2 mt-2 max-w-md">{work.headline}</h3>
        <p className="mt-4 max-w-md text-[0.95rem] text-white/75">{work.summary}</p>
        <div className="mt-8 flex flex-wrap gap-3 md:mt-auto md:pt-10">
          <Link href={`/work/${work.slug}`} data-magnetic className="btn btn-white btn-sm">
            Read the case study <ArrowRight size={14} aria-hidden />
          </Link>
          {work.live && (
            <a href={work.live} target="_blank" rel="noreferrer" data-magnetic className="btn btn-ghost btn-sm">
              Live product <ArrowUpRight size={14} aria-hidden />
            </a>
          )}
        </div>
      </div>

      <div>
        <Link
          href={`/work/${work.slug}`}
          aria-label={`${work.name} case study`}
          data-tilt="4"
          data-cursor="Open"
          className="tilt relative block aspect-[16/11] overflow-hidden rounded-[18px] border border-white/10 bg-night-3"
        >
          <div data-parallax className="absolute inset-x-0 -top-[8%] h-[116%]">
            <Image
              src={work.image}
              alt={`${work.name} product screen`}
              fill
              sizes="(min-width: 768px) 560px, 100vw"
              className="object-cover object-top transition-transform duration-700 group-hover/card:scale-[1.04]"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-16">
            <p data-count className="figure text-5xl text-white md:text-6xl">
              {work.hero.value}
            </p>
            <p className="mt-1 text-sm text-white/80">{work.hero.label}</p>
          </div>
        </Link>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/12 pt-5">
          {work.facts.map((f) => (
            <div key={f.label}>
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="figure block text-lg">{f.value}</span>
                <span className="text-xs text-white/60">{f.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export function WorkList() {
  return (
    <div data-reveal className="space-y-8 md:space-y-10">
      {clientWork.map((w, i) => (
        <WorkCard key={w.slug} work={w} index={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* In-house: software we run ourselves.                                */
/* ------------------------------------------------------------------ */

export function InHouseSection() {
  return (
    <section className="dark relative overflow-hidden bg-night text-white">
      <div className="glow pointer-events-none absolute inset-0 opacity-70" />
      <div className="wrap relative py-24 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">In-house product</p>
            <h2 data-split className="t-1 glitch mt-4">
              We also run our own <span className="accent">software.</span>
            </h2>
          </div>
          <p className="max-w-sm text-mist">
            Not a client project — a product we built and still operate. The same two people would build yours.
          </p>
        </div>

        {inHouseWork.map((w) => (
          <div key={w.slug} data-reveal className="mt-12 grid gap-4 md:grid-cols-5">
            <div
              data-reveal-item
              data-tilt="4"
              className="tilt relative overflow-hidden rounded-[24px] border border-white/10 bg-night-2 md:col-span-3"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <div data-parallax className="absolute inset-x-0 -top-[8%] h-[116%]">
                  <Image src={w.image} alt={`${w.name} product screen`} fill sizes="(min-width: 768px) 700px, 100vw" className="object-cover object-top" />
                </div>
              </div>
            </div>
            <div data-reveal-item className="flex flex-col rounded-[24px] border border-white/10 bg-night-2 p-6 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="t-2">{w.name}</h3>
                <span className="live-dot rounded-full border border-accent/40 px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.2em] text-accent-deep">
                  LIVE
                </span>
              </div>
              <p className="eyebrow mt-2 !text-white/50">{w.category}</p>
              <p className="mt-4 text-[0.95rem] text-white/80">{w.summary}</p>
              <ul className="mt-5 space-y-2 text-sm text-mist">
                {w.shipped.slice(0, 4).map((s) => (
                  <li key={s} className="flex gap-2">
                    <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-3 pt-8">
                {w.live && (
                  <a href={w.live} target="_blank" rel="noreferrer" data-magnetic className="btn btn-white btn-sm">
                    View product <ArrowUpRight size={14} aria-hidden />
                  </a>
                )}
                <Link href={`/work/${w.slug}`} data-magnetic className="btn btn-ghost btn-sm">
                  How we built it
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Process: six numbered steps (a real sequence).                      */
/* ------------------------------------------------------------------ */

export function ProcessSection() {
  return (
    <section className="bg-band">
      <div className="wrap py-24 md:py-28">
        <SectionHead eyebrow="Delivery" title="From first call" accent="to a live product." intro={PROCESS_NOTE} />
        <ol data-reveal className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map((p, i) => (
            <li
              key={p.name}
              data-reveal-item
              className="step group relative overflow-hidden rounded-[20px] border border-white/8 bg-card p-6 transition-colors duration-300 hover:border-accent/50 hover:bg-night-3"
            >
              <span className="figure inline-block text-sm text-accent-deep transition-transform duration-300 group-hover:translate-x-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="t-3 mt-3">{p.name}</h3>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fit filter.                                                         */
/* ------------------------------------------------------------------ */

export function FitSection() {
  return (
    <section className="wrap py-24 md:py-28">
      <SectionHead eyebrow="Project fit" title={FIT.title} />
      <div data-reveal className="mt-12 grid gap-4 md:grid-cols-2">
        <div data-reveal-item className="rounded-[22px] border border-white/8 bg-card p-7">
          <h3 className="t-3">We're the right studio for</h3>
          <ul className="mt-5 space-y-3">
            {FIT.bestFor.map((x) => (
              <li key={x} className="flex gap-3 text-[0.95rem]">
                <Check size={17} aria-hidden className="mt-1 shrink-0 text-accent-deep" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal-item className="tile-soft rounded-[22px] p-7">
          <h3 className="t-3">What helps us estimate it</h3>
          <ul className="mt-5 space-y-3">
            {FIT.helps.map((x) => (
              <li key={x} className="flex gap-3 text-[0.95rem]">
                <ArrowRight size={17} aria-hidden className="mt-1 shrink-0 text-accent-deep" />
                {x}
              </li>
            ))}
          </ul>
          <Link href="/contact#brief" data-magnetic className="btn btn-ink btn-sm mt-7">
            Send a brief <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ: dark, with a contact card beside the questions.                */
/* ------------------------------------------------------------------ */

export function FaqSection() {
  return (
    <section className="dark bg-night text-white">
      <div className="wrap py-24 md:py-28">
        <p className="eyebrow">Before you ask</p>
        <h2 data-split className="t-1 glitch mt-4">
          The questions that come up first.
        </h2>
        <p className="mt-5 max-w-xl text-mist">What we build, how a project runs, and what you're committing to when you book a call.</p>
        <div data-reveal className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
          <div data-reveal-item className="relative flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-night-2 p-7">
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
            <h3 className="t-2 relative">Still deciding?</h3>
            <p className="relative mt-3 text-sm text-mist">Email both founders directly. You'll hear back from the people who would build it.</p>
            <ul className="relative mt-6 space-y-2 text-sm">
              {SITE.emails.map((e) => (
                <li key={e.address}>
                  <a href={`mailto:${e.address}`} className="link-u link break-all text-white">
                    {e.address}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={SITE.bookCall}
              target="_blank"
              rel="noreferrer"
              data-magnetic
              className="btn btn-accent btn-sm relative mt-8 self-start lg:mt-auto"
            >
              Book a call <ArrowRight size={14} aria-hidden />
            </a>
          </div>
          <div data-reveal-item>
            <Faq />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing CTA panel.                                                  */
/* ------------------------------------------------------------------ */

export function CtaPanel({ title = CTA.title, accent = CTA.titleAccent }: { title?: string; accent?: string }) {
  return (
    <section className="py-16 md:py-24">
      <div className="panel dark mx-2 md:mx-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="blob -right-24 top-[-20%] h-[140%] w-[60%] bg-[radial-gradient(closest-side,rgba(214,31,44,0.75),rgba(110,8,16,0.35),transparent)]" />
          <div className="blob bottom-[-30%] right-[20%] h-[70%] w-[35%] bg-[radial-gradient(closest-side,rgba(214,31,44,0.45),transparent)] [animation-delay:-6s]" />
        </div>
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow">{CTA.eyebrow}</p>
          <h2 data-split className="t-hero mt-5 max-w-3xl">
            {title} <span className="accent">{accent}</span>
          </h2>
          <p className="mt-6 max-w-lg text-white/80">{CTA.body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={SITE.bookCall} target="_blank" rel="noreferrer" data-magnetic className="btn btn-white btn-lg">
              Book a call <ArrowRight size={16} aria-hidden />
            </a>
            <Link href="/work" data-magnetic className="btn btn-ghost btn-lg">
              See the work
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            {CTA.checks.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <Check size={14} aria-hidden className="text-accent" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Inner-page hero: a shorter dark panel.                              */
/* ------------------------------------------------------------------ */

export function PageHero({
  eyebrow,
  title,
  accent,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pt-2 md:pt-4">
      <header className="panel dark">
        <div className="glow pointer-events-none absolute inset-0" />
        <div className="wrap relative pb-16 pt-32 md:pb-24 md:pt-44">
          <p className="eyebrow">{eyebrow}</p>
          <h1 data-split className="t-hero mt-5 max-w-4xl">
            {title}
            {accent && (
              <>
                {" "}
                <span className="accent">{accent}</span>
              </>
            )}
          </h1>
          {lede && <p className="mt-6 max-w-2xl text-lg text-white/75">{lede}</p>}
          {children}
        </div>
      </header>
    </div>
  );
}
