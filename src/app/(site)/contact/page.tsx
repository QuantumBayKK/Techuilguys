import type { Metadata } from "next";
import Link from "next/link";
import CalEmbed from "@/components/site/CalEmbed";
import ContactForm from "@/components/site/ContactForm";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a project with Techuila Guys. Book a 30-minute call or send us a brief — we reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <header className="wrap pb-12 pt-36 md:pt-44">
        <h1 className="t-hero max-w-[14ch]">Tell us what you&apos;re building.</h1>
        <p className="lede mt-6 text-muted">
          Send a short brief and both founders will read it, or pick a time below and talk to us directly.
        </p>
      </header>

      <section className="wrap grid gap-12 pb-24 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ContactForm />
        </div>

        <aside className="space-y-10 lg:col-span-5">
          <div className="border-t border-ink pt-5">
            <h2 className="t-3">Email us</h2>
            <ul className="mt-4 space-y-3">
              {SITE.emails.map((e) => (
                <li key={e.address}>
                  <span className="block text-sm text-muted">{e.name}</span>
                  <a href={`mailto:${e.address}`} className="link-u link break-all text-lg">
                    {e.address}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-rule pt-5">
            <h2 className="t-3">Already a client?</h2>
            <p className="mt-3 text-muted">
              Timelines, approvals, files and requests live in your workspace.
            </p>
            <Link href="/workspace" className="btn btn-line btn-sm mt-4">
              Client login
            </Link>
          </div>
          <div className="border-t border-rule pt-5">
            <h2 className="t-3">Where we are</h2>
            <p className="mt-3 text-muted">
              Based in {SITE.location}, working with clients worldwide. We set overlap hours for calls in your time zone.
            </p>
          </div>
        </aside>
      </section>

      <section id="book" className="border-t border-rule bg-paper-2">
        <div className="wrap py-20 md:py-28">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <h2 className="t-1 md:col-span-7">Book a 30-minute call</h2>
            <p className="text-muted md:col-span-5">
              Pick a slot that suits your time zone. You&apos;ll get a calendar invite with a video link.{" "}
              <a href={SITE.bookCall} target="_blank" rel="noreferrer" className="link-u link text-ink">
                Open the booking page in a new tab
              </a>
              .
            </p>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-rule bg-white p-2 md:p-4">
            <CalEmbed calLink={SITE.calLink} fallbackHref={SITE.bookCall} />
          </div>
        </div>
      </section>
    </>
  );
}
