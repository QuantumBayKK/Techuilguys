import Link from "next/link";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { WORK } from "@/content/work";

export const metadata = { title: "Page not found — Techuila Guys" };

/** Root-level, so it brings its own site chrome rather than inheriting `(site)`. */
export default function NotFound() {
  return (
    <div className="site flex min-h-svh flex-col">
      <Nav />
      <main id="main" className="wrap flex-1 pb-24 pt-36 md:pt-44">
        <p className="text-muted">Error 404</p>
        <h1 className="t-hero mt-3 max-w-[14ch]">This page doesn&apos;t exist.</h1>
        <p className="lede mt-6 text-muted">
          The link may be old or mistyped. Try the home page, or jump straight to one of our case studies.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-ink">
            Go to the home page
          </Link>
          <Link href="/contact" className="btn btn-line">
            Contact us
          </Link>
        </div>
        <ul className="mt-16 flex flex-wrap gap-x-8 gap-y-3 border-t border-rule pt-6">
          {WORK.map((w) => (
            <li key={w.slug}>
              <Link href={`/work/${w.slug}`} className="link-u link">
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
