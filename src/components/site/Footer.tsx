import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Logo from "./Logo";
import { NAV, SERVICES, SITE } from "@/content/site-copy";
import { WORK } from "@/content/work";

export default function Footer() {
  return (
    <footer className="pb-2 md:pb-4">
      <div className="panel dark dots">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(60%_80%_at_50%_120%,rgba(233,162,59,0.18),transparent)]" />
        <div className="wrap pt-16 md:pt-20">
          <div className="flex flex-col gap-8 border-b border-white/10 pb-12 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <p className="eyebrow !text-white/50">Based in {SITE.location}</p>
              <p className="mt-4 font-[family-name:var(--font-heading)] text-2xl font-light leading-snug">
                An independent product studio designing and building SaaS products, apps and automations.
              </p>
            </div>
            <a
              href={SITE.github}
              target="_blank"
              rel="noreferrer"
              aria-label="Techuila Guys on GitHub"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white hover:text-white"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
              </svg>
            </a>
          </div>

          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
            <FooterCol title="Services">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <Link href={`/services#${s.id}`} className="link">
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="link">
                  All services
                </Link>
              </li>
            </FooterCol>
            <FooterCol title="Work">
              {WORK.map((w) => (
                <li key={w.slug}>
                  <Link href={`/work/${w.slug}`} className="link">
                    {w.name}
                  </Link>
                </li>
              ))}
            </FooterCol>
            <FooterCol title="Studio">
              {NAV.filter((n) => n.href !== "/services" && n.href !== "/work").map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="link">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy" className="link">
                  Privacy
                </Link>
              </li>
            </FooterCol>
            <div className="rounded-[20px] border border-white/12 p-6">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/50">Start a conversation</p>
              <ul className="mt-4 space-y-1.5 text-[0.92rem]">
                {SITE.emails.map((e) => (
                  <li key={e.address}>
                    <a href={`mailto:${e.address}`} className="link break-all">
                      {e.address}
                    </a>
                  </li>
                ))}
              </ul>
              <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-white btn-sm mt-5">
                Book a call <ArrowRight size={14} aria-hidden />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-sm text-white/55 sm:flex-row sm:justify-between">
            <p>
              © {new Date().getFullYear()} {SITE.name} ·{" "}
              <Link href="/privacy" className="link">
                Privacy
              </Link>
            </p>
            <p>Working with founders and teams in India and abroad.</p>
          </div>
        </div>

        <p
          aria-hidden
          className="pointer-events-none select-none overflow-hidden whitespace-nowrap text-center font-[family-name:var(--font-heading)] text-[22vw] font-medium leading-[0.72] tracking-[-0.05em] text-white/[0.05]"
        >
          techuila
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/50">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[0.92rem] text-white/85">{children}</ul>
    </div>
  );
}
