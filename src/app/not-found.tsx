import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { WORK } from "@/content/work";

export const metadata = { title: "Page not found — Techuila Guys" };

/** Root-level, so it brings its own site chrome rather than inheriting `(site)`. */
export default function NotFound() {
  return (
    <div className="site flex min-h-svh flex-col">
      <Nav />
      <main id="main" className="flex-1">
        <div className="pt-2 md:pt-4">
          <section className="panel dark">
            <div className="glow pointer-events-none absolute inset-0" />
            <div className="wrap relative pb-20 pt-36 md:pb-28 md:pt-48">
              <p className="eyebrow">Error 404</p>
              <h1 className="t-hero mt-5 max-w-3xl">
                This page <span className="accent">doesn&apos;t exist.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/75">
                The link may be old or mistyped. Go back home, or jump straight to one of our case studies.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/" className="btn btn-accent btn-lg">
                  Go to the home page <ArrowRight size={16} aria-hidden />
                </Link>
                <Link href="/contact" className="btn btn-ghost btn-lg">
                  Contact us
                </Link>
              </div>
            </div>
          </section>
        </div>
        <ul className="wrap flex flex-wrap gap-3 py-16">
          {WORK.map((w) => (
            <li key={w.slug}>
              <Link href={`/work/${w.slug}`} className="btn btn-line btn-sm">
                {w.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
