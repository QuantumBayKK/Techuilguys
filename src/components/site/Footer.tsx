import Link from "next/link";
import Logo from "./Logo";
import { NAV, SERVICES, SITE } from "@/content/site";
import { WORK } from "@/content/work";

export default function Footer() {
  return (
    <footer className="on-felt bg-felt-deep text-paper">
      <div className="wrap grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo tone="paper" />
          <p className="mt-5 max-w-xs text-[0.95rem] text-mist">
            A product studio designing and building software for founders and companies worldwide.
          </p>
          <ul className="mt-6 space-y-1.5 text-[0.95rem]">
            {SITE.emails.map((e) => (
              <li key={e.address}>
                <a href={`mailto:${e.address}`} className="link break-all text-paper">
                  {e.address}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterCol title="Studio" className="md:col-span-2">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="link">
                {n.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/workspace" className="link">
              Client login
            </Link>
          </li>
        </FooterCol>

        <FooterCol title="Services" className="md:col-span-3">
          {SERVICES.map((s) => (
            <li key={s.id}>
              <Link href={`/services#${s.id}`} className="link">
                {s.name}
              </Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Work" className="md:col-span-3">
          {WORK.map((w) => (
            <li key={w.slug}>
              <Link href={`/work/${w.slug}`} className="link">
                {w.name}
              </Link>
            </li>
          ))}
        </FooterCol>
      </div>

      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-6 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Based in {SITE.location}, working worldwide.
          </p>
          <div className="flex gap-6">
            <a href={SITE.github} target="_blank" rel="noreferrer" className="link">
              GitHub
            </a>
            <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="link">
              Book a call
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className="text-sm text-mist">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[0.95rem]">{children}</ul>
    </div>
  );
}
