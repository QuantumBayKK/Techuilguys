import Image from "next/image";
import Link from "next/link";
import { COMMITMENTS, ENGAGEMENTS, PROCESS, SERVICES, SITE } from "@/content/site";
import { FOUNDERS } from "@/content/team";
import { WORK, type CaseStudy } from "@/content/work";

/** Section heading row: title left, optional intro and link right. */
export function SectionHead({
  title,
  intro,
  action,
  tone = "paper",
}: {
  title: string;
  intro?: string;
  action?: { href: string; label: string };
  tone?: "paper" | "felt";
}) {
  return (
    <div className="grid gap-6 md:grid-cols-12 md:items-end">
      <h2 className="t-1 md:col-span-7">{title}</h2>
      {(intro || action) && (
        <div className="md:col-span-5">
          {intro && <p className={tone === "felt" ? "text-mist" : "text-muted"}>{intro}</p>}
          {action && (
            <Link href={action.href} className="link-u link mt-3 inline-block font-medium">
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** Services as ruled rows — name, what it is, what's included. */
export function ServicesList({ detailed = false }: { detailed?: boolean }) {
  return (
    <ul className="border-t border-ink">
      {SERVICES.map((s) => (
        <li
          key={s.id}
          id={detailed ? s.id : undefined}
          className="grid scroll-mt-28 gap-4 border-b border-rule py-8 md:grid-cols-12 md:gap-8"
        >
          <h3 className="t-3 md:col-span-4">{s.name}</h3>
          <p className="text-muted md:col-span-5">{s.summary}</p>
          <ul className="flex flex-wrap content-start gap-2 md:col-span-3 md:flex-col md:gap-1.5">
            {s.includes.map((x) => (
              <li
                key={x}
                className="rounded-md border border-rule px-2.5 py-1 text-sm md:border-0 md:p-0 md:text-[0.95rem]"
              >
                {x}
              </li>
            ))}
          </ul>
          {detailed && s.proof.length > 0 && (
            <p className="text-sm text-muted md:col-span-8 md:col-start-5">
              See it in{" "}
              {s.proof.map((slug, i) => {
                const w = WORK.find((x) => x.slug === slug);
                if (!w) return null;
                return (
                  <span key={slug}>
                    {i > 0 && (i === s.proof.length - 1 ? " and " : ", ")}
                    <Link href={`/work/${slug}`} className="link-u link text-ink">
                      {w.name}
                    </Link>
                  </span>
                );
              })}
              .
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** One case study as a card; `large` spans the full width with the copy beside the image. */
export function WorkCard({ work, large = false }: { work: CaseStudy; large?: boolean }) {
  return (
    <Link
      href={`/work/${work.slug}`}
      className={`group grid gap-6 ${large ? "md:grid-cols-12 md:items-center md:gap-10" : ""}`}
    >
      <div
        className={`relative aspect-[16/10] overflow-hidden rounded-2xl border border-ink/10 bg-paper-2 ${
          large ? "md:col-span-8" : ""
        }`}
      >
        <Image
          src={work.image}
          alt={`${work.name} homepage`}
          fill
          sizes={large ? "(min-width: 768px) 800px, 100vw" : "(min-width: 768px) 600px, 100vw"}
          className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
        />
      </div>
      <div className={large ? "md:col-span-4" : ""}>
        <p className="text-sm text-muted">
          {work.sector}, {work.platform.toLowerCase()}
        </p>
        <h3 className={`${large ? "t-2" : "t-3"} mt-2`}>{work.name}</h3>
        <p className={`mt-3 ${large ? "text-lg" : ""} text-ink/85`}>{work.headline}</p>
        <span className="link mt-4 inline-block font-medium group-hover:bg-[length:100%_1px]">
          Read the case study
        </span>
      </div>
    </Link>
  );
}

export function WorkGrid({ limit }: { limit?: number }) {
  const items = limit ? WORK.slice(0, limit) : WORK;
  const [first, ...rest] = items;
  return (
    <div className="space-y-16 md:space-y-20">
      <WorkCard work={first} large />
      <div className="grid gap-14 md:grid-cols-2 md:gap-x-10 md:gap-y-16">
        {rest.map((w) => (
          <WorkCard key={w.slug} work={w} />
        ))}
      </div>
    </div>
  );
}

/** The four steps on felt. Numbered because it genuinely is a sequence. */
export function ProcessSection() {
  return (
    <section className="on-felt bg-felt text-paper">
      <div className="wrap py-24 md:py-32">
        <SectionHead
          tone="felt"
          title="How a project runs"
          intro="The same four steps whether we're building an MVP or extending a product you already run."
        />
        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-4">
          {PROCESS.map((p, i) => (
            <li key={p.name} className="bg-felt p-7 md:p-8">
              <span className="font-[family-name:var(--font-heading)] text-sm font-semibold text-brass">
                Step {i + 1}
              </span>
              <h3 className="t-3 mt-3">{p.name}</h3>
              <p className="mt-3 text-[0.95rem] text-mist">{p.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 md:grid-cols-12">
          <h3 className="t-3 md:col-span-4">What you get on every project</h3>
          <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2 md:col-span-8">
            {COMMITMENTS.map((c) => (
              <li key={c} className="flex gap-3 text-[0.98rem]">
                <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" className="mt-1 shrink-0">
                  <path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="var(--color-brass)" strokeWidth="2" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function EngagementsSection() {
  return (
    <section className="wrap py-24 md:py-32">
      <SectionHead
        title="Ways to work with us"
        intro="Pick the shape that fits where you are. You can switch as the product grows."
      />
      <ul className="mt-14 grid border-t border-ink md:grid-cols-3">
        {ENGAGEMENTS.map((e, i) => (
          <li
            key={e.name}
            className={`border-b border-rule py-8 md:border-b-0 md:py-10 ${
              i > 0 ? "md:border-l md:pl-8" : ""
            } ${i < ENGAGEMENTS.length - 1 ? "md:pr-8" : ""}`}
          >
            <h3 className="t-3">{e.name}</h3>
            <p className="mt-4 text-lg font-medium leading-snug">{e.lead}</p>
            <p className="mt-3 text-muted">{e.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FoundersSection({ withBio = true }: { withBio?: boolean }) {
  return (
    <div className="grid gap-12 md:grid-cols-2 md:gap-10">
      {FOUNDERS.map((f) => (
        <article key={f.id} className="grid gap-6 sm:grid-cols-[180px_1fr] sm:gap-7">
          <div className="relative aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-2xl bg-paper-2 sm:max-w-none">
            <Image
              src={f.portrait}
              alt={`Portrait of ${f.name}`}
              fill
              sizes="220px"
              className="object-cover grayscale-[35%]"
            />
          </div>
          <div>
            <h3 className="t-3">{f.name}</h3>
            <p className="mt-1 text-muted">{f.role}</p>
            {withBio && <p className="mt-4 text-[0.98rem]">{f.bio}</p>}
            <div className="mt-4 flex flex-col gap-1 text-[0.95rem]">
              <a href={`mailto:${f.email}`} className="link-u link w-fit break-all">
                {f.email}
              </a>
              <a href={f.github} target="_blank" rel="noreferrer" className="link w-fit text-muted hover:text-ink">
                GitHub
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/** The closing ask, used at the foot of every page. */
export function CtaBand({
  title = "Have a product to build? Let's talk it through.",
  body = "Book a 30-minute call with the founders, or send us a short brief and we'll reply with next steps.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="on-felt bg-felt text-paper">
      <div className="wrap grid gap-10 py-24 md:grid-cols-12 md:items-end md:py-28">
        <div className="md:col-span-8">
          <h2 className="t-1 max-w-[16ch]">{title}</h2>
          <p className="mt-5 max-w-xl text-lg text-mist">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:col-span-4 md:flex-col md:items-stretch">
          <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-brass">
            Book a call
          </a>
          <Link href="/contact" className="btn btn-ghost-light">
            Send a brief
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Top of every inner page. */
export function PageHeader({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="wrap pb-14 pt-36 md:pb-20 md:pt-44">
      <h1 className="t-hero max-w-[18ch]">{title}</h1>
      {lede && <p className="lede mt-6 text-muted">{lede}</p>}
    </header>
  );
}
