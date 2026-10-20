import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { CtaPanel, PageHero } from "@/components/site/Sections";
import { WORK, hostOf, workBySlug } from "@/content/work";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return WORK.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const work = workBySlug((await params).slug);
  if (!work) return {};
  return {
    title: `${work.name} case study`,
    description: work.summary,
    alternates: { canonical: `/work/${work.slug}` },
    openGraph: { images: [{ url: work.image, width: 1920, height: 1200 }] },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const work = workBySlug((await params).slug);
  if (!work) notFound();
  const next = WORK[(WORK.indexOf(work) + 1) % WORK.length];

  return (
    <>
      <PageHero eyebrow={`${work.category} · ${work.platform}`} title={work.name} lede={work.headline}>
        <div className="mt-9 flex flex-wrap gap-3">
          {work.live ? (
            <a href={work.live} target="_blank" rel="noreferrer" className="btn btn-accent btn-lg">
              {work.liveLabel ?? "Open the live product"} <ArrowUpRight size={16} aria-hidden />
            </a>
          ) : null}
          <Link href="/work" className="btn btn-ghost btn-lg">
            <ArrowLeft size={16} aria-hidden /> All work
          </Link>
        </div>
      </PageHero>

      <section className="wrap -mt-2 pt-10">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-white/8 bg-night shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
          <Image src={work.image} alt={`${work.name} product screen`} fill priority sizes="(min-width: 1240px) 1180px, 100vw" className="object-cover object-top" />
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {[work.hero, ...work.facts].map((f) => (
            <div key={f.label} className="rounded-[20px] border border-white/8 bg-card p-5">
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="figure block text-3xl">{f.value}</span>
                <span className="mt-1 block text-sm text-muted">{f.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="wrap grid gap-12 py-20 md:grid-cols-12 md:py-28">
        <aside className="h-fit space-y-6 rounded-[22px] border border-white/8 bg-card p-6 md:sticky md:top-28 md:col-span-4">
          <Meta label="Status">{work.status}</Meta>
          <Meta label="Our role">{work.role}</Meta>
          <Meta label="Built with">{work.stack.join(", ")}</Meta>
          {work.live && (
            <Meta label="Live at">
              <a href={work.live} target="_blank" rel="noreferrer" className="link-u link break-all">
                {hostOf(work.live)}
              </a>
            </Meta>
          )}
        </aside>

        <div className="space-y-14 md:col-span-7 md:col-start-6">
          <Block title="Context">
            <p>{work.context}</p>
          </Block>
          <Block title="The problem">
            <p>{work.problem}</p>
          </Block>
          <Block title="Decisions we made">
            <ul className="space-y-3">
              {work.decisions.map((d) => (
                <li key={d} className="flex gap-3">
                  <ArrowRight size={17} aria-hidden className="mt-1 shrink-0 text-accent-deep" />
                  {d}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="What shipped">
            <ul className="divide-y divide-rule rounded-[20px] border border-white/8 bg-card">
              {work.shipped.map((s) => (
                <li key={s} className="flex gap-3 px-5 py-4">
                  <Check size={17} aria-hidden className="mt-1 shrink-0 text-accent-deep" />
                  {s}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Evidence">
            <p>{work.evidence}</p>
          </Block>
        </div>
      </section>

      <section className="wrap">
        <Link
          href={`/work/${next.slug}`}
          className="lift group flex items-center justify-between gap-6 rounded-[24px] border border-white/8 bg-card p-6 md:p-8"
        >
          <span>
            <span className="eyebrow">Next case study</span>
            <span className="t-1 mt-2 block">{next.name}</span>
          </span>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform group-hover:translate-x-1">
            <ArrowRight size={20} aria-hidden />
          </span>
        </Link>
      </section>

      <CtaPanel title={`Building something like ${work.name}?`} accent="Let's talk it through." />
    </>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="mt-1.5 text-[0.95rem]">{children}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="t-2">{title}</h2>
      <div className="mt-5 text-[1.02rem] leading-relaxed text-ink/85">{children}</div>
    </div>
  );
}
