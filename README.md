# Techuila Guys — website

Marketing site for Techuila Guys, an independent product studio, plus the
internal workspace at `/workspace`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also type-checks)
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Framer Motion
(menu, accordion, form states) · Resend (contact form) · Cal.com embed.
Deployed on Vercel from `main`.

## Editing content

All marketing copy lives in `src/content/` — components only lay it out.

| File | What's in it |
| --- | --- |
| `site-copy.ts` | Emails, booking link, nav, hero, services, process, fit filter, FAQ, closing CTA, contact copy |
| `work.ts` | Case studies (one entry = one `/work/<slug>` page) — every fact verified against the live product or repo |
| `team.ts` | Founder bios, focus areas, emails |

Case-study screenshots are in `public/work/` (1920px WebP). To add a project,
drop a screenshot there and add an entry to `work.ts`. Mark products you run
yourselves with `inHouse: true`.

## Pages

`/` · `/work` · `/work/[slug]` · `/services` · `/studio` · `/contact` ·
`/privacy` (`/about` redirects to `/studio`) — plus `sitemap.xml`, `robots.txt`,
an Open Graph image and a branded 404.

## Contact form

`POST /api/contact` validates on the server and emails both founders (Reply-To =
the sender). It needs these env vars in Vercel:

- `RESEND_API_KEY`
- `RESEND_FROM` — an address on a domain verified in Resend

Without the key the form never pretends to send: it shows both email addresses
instead. The hero prompt carries its text to `/contact?brief=…`.

## Design system

Light grey page with near-black rounded panels and one amber accent. Tokens are
in `src/app/globals.css` (`@theme`). Headings use Space Grotesk (`t-hero`, `t-1`,
`t-2`, `t-3` — deliberately not `h-*`, which is a Tailwind height utility);
body text uses Inter; labels and figures use JetBrains Mono.

## Brand and motion

- **Logo** — `public/brand/logo.png` is the source artwork (also the share
  image). `components/site/BrandMark.tsx` redraws the laptop-and-shot mark as
  SVG for the nav and the hero; the wordmark uses Archivo 900 with the logo's
  red offset shadow.
- **WebGL** — `HeroShader.tsx` is one raw-WebGL fragment shader (red liquid
  smoke that follows the cursor). It renders at reduced resolution, pauses
  off-screen, and draws a single still frame for reduced motion, Save-Data or
  low-power devices.
- **GSAP** — `HeroIntro.tsx` plays the logo build-up and headline. Everything
  else is driven by data attributes read in `MotionRoot.tsx`: `data-split`
  (word reveal), `data-reveal` / `data-reveal-item` (stagger), `data-parallax`,
  `data-count`, `data-tilt` (3D tilt and glare), `data-magnetic`. Add the
  attribute to new markup and it animates; no new code needed.
- **Cursor** — `CursorRing.tsx` adds a trailing ring; `data-cursor="Label"`
  shows a label on hover. The native cursor stays visible.
- All of it is skipped for `prefers-reduced-motion`, and hover effects only run
  on mouse/trackpad devices. Content is fully visible without JavaScript.

## Hero film

`public/film/` holds an 8-second silent loop (WebM + MP4, about 0.55 MB each)
and WebP posters, rendered with HyperFrames from real product screenshots. The
page paints the poster first; the video attaches only after load, on screens
768px and wider, and never for reduced motion or Save-Data.

## Workspace

The internal workspace under `/workspace` is a separate product (not linked from
the marketing site) with its own styles, scoped under `.ws`. See `WORKSPACE.md`
and `docs/ARCHITECTURE.md`.
