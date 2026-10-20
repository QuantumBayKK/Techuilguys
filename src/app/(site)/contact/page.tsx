import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import CalEmbed from "@/components/site/CalEmbed";
import ContactForm from "@/components/site/ContactForm";
import { PageHero } from "@/components/site/Sections";
import { CONTACT, FIT, SITE } from "@/content/site-copy";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a project with Techuila Guys. Send a short brief or book a 30-minute call with the founders.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title={CONTACT.title} lede={CONTACT.lede} />

      <section className="wrap grid gap-6 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Suspense>
            <ContactForm />
          </Suspense>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-[24px] border border-white/8 bg-card p-6">
            <h2 className="t-3">What happens next</h2>
            <ol className="mt-5 space-y-4">
              {CONTACT.next.map((step, i) => (
                <li key={step} className="flex gap-4 text-[0.95rem]">
                  <span className="figure text-sm text-accent-deep">{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="dark rounded-[24px] bg-night p-6 text-white">
            <h2 className="t-3">Email us directly</h2>
            <ul className="mt-4 space-y-3">
              {SITE.emails.map((e) => (
                <li key={e.address}>
                  <span className="block text-xs text-white/50">{e.name}</span>
                  <a href={`mailto:${e.address}`} className="link-u link break-all text-[0.95rem]">
                    {e.address}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="tile-soft rounded-[24px] p-6">
            <h2 className="t-3">A useful brief covers</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink/80">
              {FIT.helps.map((h) => (
                <li key={h}>— {h}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section id="book" className="bg-band">
        <div className="wrap py-20 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Book a call</p>
              <h2 className="t-1 mt-4">Pick a time that suits you.</h2>
              <p className="mt-4 max-w-xl text-muted">
                30 minutes on video. Times are shown in your own time zone, and you get a calendar invite.
              </p>
            </div>
            <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="btn btn-line btn-sm self-start md:self-auto">
              Open in a new tab <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
          <div className="mt-10 overflow-hidden rounded-[28px] border border-white/8 bg-card p-2 md:p-4">
            <CalEmbed calLink={SITE.calLink} fallbackHref={SITE.bookCall} />
          </div>
        </div>
      </section>
    </>
  );
}
