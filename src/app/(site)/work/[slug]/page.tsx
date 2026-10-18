import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BrowserFrame from "@/components/site/BrowserFrame";
import { CtaBand } from "@/components/site/Sections";
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

  const i = WORK.indexOf(work);
  const next = WORK[(i + 1) % WORK.length];

  return (
    <>
      <header className="wrap pb-12 pt-32 md:pt-40">
        <Link href="/work" className="link text-sm text-muted hover:text-ink">
          All work
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="t-hero">{work.name}</h1>
            {work.note && <p className="mt-3 text-muted">{work.note}</p>}
            <p className="lede mt-6">{work.headline}</p>
          </div>
          <div className="lg:col-span-4">
            <a href={work.live} target="_blank" rel="noreferrer" className="btn btn-ink w-full sm:w-auto">
              Open the live product
            </a>
          </div>
        </div>
      </header>

      <section className="wrap">
        <BrowserFrame host={hostOf(work.live)}>
          <Image
            src={work.image}
            alt={`${work.name} homepage`}
            fill
            priority
            sizes="(min-width: 1240px) 1160px, 100vw"
            className="object-cover object-top"
          />
        </BrowserFrame>
      </section>

      <section className="wrap grid gap-12 py-20 md:grid-cols-12 md:py-28">
        <dl className="grid h-fit grid-cols-2 gap-6 border-t border-ink pt-6 md:col-span-4 md:grid-cols-1">
          <Fact label="Sector">{work.sector}</Fact>
          <Fact label="Platform">{work.platform}</Fact>
          <Fact label="What we did">
            <ul>
              {work.services.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Fact>
          <Fact label="Live at">
            <a href={work.live} target="_blank" rel="noreferrer" className="link-u link break-all">
              {hostOf(work.live)}
            </a>
          </Fact>
        </dl>

        <div className="space-y-14 md:col-span-7 md:col-start-6">
          <div>
            <h2 className="t-2">The product</h2>
            <p className="mt-5 text-lg">{work.summary}</p>
            <p className="mt-4 text-muted">{work.product}</p>
          </div>
          <div>
            <h2 className="t-2">What we built</h2>
            <ul className="mt-6 border-t border-rule">
              {work.built.map((b) => (
                <li key={b} className="border-b border-rule py-4">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-rule">
        <Link href={`/work/${next.slug}`} className="group wrap flex items-center justify-between gap-6 py-12 md:py-16">
          <span>
            <span className="block text-sm text-muted">Next case study</span>
            <span className="t-1 mt-2 block transition-colors group-hover:text-felt">{next.name}</span>
          </span>
          <svg aria-hidden width="40" height="40" viewBox="0 0 40 40" className="shrink-0 transition-transform duration-300 group-hover:translate-x-1.5">
            <path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Link>
      </section>

      <CtaBand title={`Building something like ${work.name}?`} />
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}
