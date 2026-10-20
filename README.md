# Techuila Guys — website

Marketing site for Techuila Guys, a product studio, plus the client workspace
at `/workspace`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Framer Motion
(menu, accordion, showcase only) · Resend (contact form) · Cal.com embed.

## Editing content

All marketing copy lives in `src/content/` — components only lay it out.

| File | What's in it |
| --- | --- |
| `site.ts` | Emails, booking link, nav, services, process, engagement models, commitments, FAQ |
| `work.ts` | Case studies (one entry = one `/work/<slug>` page) |
| `team.ts` | Founder bios, portraits, emails |

Case-study screenshots are in `public/work/` (1920px WebP). To add a project,
drop a screenshot there and add an entry to `work.ts`.

## Pages

`/` · `/work` · `/work/[slug]` · `/services` · `/about` · `/contact` — plus
`sitemap.xml`, `robots.txt`, an Open Graph image and a branded 404.

## Contact form

`POST /api/contact` emails both founders (Reply-To = the sender). It needs
`RESEND_API_KEY`, and `RESEND_FROM` on a domain verified in Resend for reliable
delivery. Without the key the form doesn't pretend to send — it shows both email
addresses instead.

## Design system

Tokens are in `src/app/globals.css` (`@theme`): paper `#f2f3ef`, ink `#0d1a15`,
felt `#103b2d`, brass `#c6a050`. Headings use Schibsted Grotesk (`t-hero`,
`t-1`, `t-2`, `t-3` — deliberately not `h-*`, which is Tailwind's height
utility), body text Instrument Sans.

## Workspace

The internal workspace under `/workspace` is a separate product (no longer linked
from the marketing site) with its own styles (scoped under `.ws`). See `WORKSPACE.md` and
`docs/ARCHITECTURE.md`.
