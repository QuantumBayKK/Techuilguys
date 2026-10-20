import type { Metadata } from "next";
import { PageHero } from "@/components/site/Sections";
import { SITE } from "@/content/site-copy";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this website collects, why, and who to contact about it.",
  alternates: { canonical: "/privacy" },
};

/** Plain-language notice covering only what this site actually does. */
export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="What this site collects." />
      <section className="wrap max-w-3xl space-y-10 py-20 text-[1.02rem] leading-relaxed md:py-28">
        <Part title="The contact form">
          When you send a brief, we receive your name, email, optional company, project type, budget range, timeline
          and message. It is emailed to the two founders so we can reply. We use it only to respond to your enquiry and
          don&apos;t sell or share it.
        </Part>
        <Part title="Booking a call">
          The booking calendar is provided by Cal.com. When you book, Cal.com processes your name, email and chosen time
          under its own privacy policy, and sends both sides a calendar invite.
        </Part>
        <Part title="Analytics">
          We use Vercel Web Analytics to count page views. It does not use cookies and does not identify you personally.
        </Part>
        <Part title="Questions or deletion">
          To ask what we hold about you, or to have it deleted, email{" "}
          {SITE.emails.map((e, i) => (
            <span key={e.address}>
              {i > 0 && " or "}
              <a href={`mailto:${e.address}`} className="link-u link break-all">
                {e.address}
              </a>
            </span>
          ))}
          .
        </Part>
      </section>
    </>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="t-2">{title}</h2>
      <p className="mt-4 text-ink/85">{children}</p>
    </div>
  );
}
