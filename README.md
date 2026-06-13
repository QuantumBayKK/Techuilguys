# Techuila Guys — Cinematic Portfolio (v2)

A high-end poker table where every project is a playing card. Tap to enter →
chip spins, rolls, drops → the table reveals → pick a dealer (Kailosh / Kenny) →
get dealt a five-card hand → inspect & flip each card to read the project and its
tech stack on the back → scroll into the lounge → reach across the colorizing
hands to make contact.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 (CSS
custom-property tokens) · React Three Fiber + drei (persistent WebGL canvas) ·
GSAP + ScrollTrigger + CustomEase (intro choreography) · Lenis (weighty smooth
scroll, velocity piped to `scrollSignal`) · Framer Motion (HUD/overlays) ·
Web Audio (procedural SFX — see below).

## How it's wired

- **One state machine** drives everything: `src/lib/experience.ts`
  (`gate → intro → dealers → dealt → inspect → body`). Both the WebGL scene and
  the DOM HUD subscribe to it through a framework-agnostic external store, so the
  canvas persists across stage changes (the seamless-transition trick).
- **Persistent canvas** lives in `layout.tsx` (`CanvasRoot`). The 3D layer owns
  the environment (chip, felt table, brass rail, cinematic lights, fog); the DOM
  HUD layers above it (dealers, cards, body, cursor).
- **The intro** is a directed GSAP timeline in `three/Scene.tsx`: spin-up →
  edge-roll across frame with wobble → drop flat → crane-up table reveal →
  settle to player POV. Skippable; reduced-motion snaps straight to the table.
- **Cards** are DOM + 3D-transform (crisp text, accessible, reliable flip).
  `cards/CardFaces.tsx` = front (branded face) + back (blurb / role / outcome /
  **tech-stack skill chips**). `sections/InspectCard.tsx` = drag-to-rotate with
  inertia + Y-axis flip.
- **Contact colorize-hands** (`sections/ColorizeHands.tsx`): grayscale line-art
  hands with a cursor-following radial **mask** revealing a vivid color copy —
  color paints on where the cursor moves.

## Key directories

```
src/lib/        experience (state machine), scrollSignal, gsap, audio, useCapability
src/data/       dealers.ts, projects.ts   ← all content lives here, swappable
src/components/three/    Chip, Table, Lights, Scene, CanvasRoot
src/components/sections/ EntryGate, DealerStage, Hand, InspectCard, Body, ColorizeHands
src/components/cards/    CardFaces (front + skills back)
src/components/ui/       Cursor, MuteToggle, Marquee
```

## Decisions / what's stubbed (vs. the full spec)

These are deliberate scope choices for a runnable first milestone, not blockers:

- **No GLB/Blender assets** — the chip and table are procedural geometry. Drop a
  Draco GLB into `Chip`/`Table` later for richer detail.
- **Procedural audio** — every cue (spin, roll, clack, thud, deal, flip, hover)
  is synthesized in `lib/audio.ts` so sound works with zero asset weight. Swap
  the `synth` bodies for Howler one-shots when real SFX land in `/public/audio`.
- **Choreographed deal**, not Rapier physics — deterministic and performant.
  Layer `@react-three/rapier` in for true throw physics if desired.
- **Single-page experience** — `/works` and `/contact` routes can be split out
  later; the body section already contains the full deck and contact.
- **Velocity-distortion shaders** — the velocity signal is plumbed
  (`scrollSignal`, marquee reacts to it); the WebGL RGB-split/displacement
  shader on covers is the next enhancement.
- **Hands art** is original stylized SVG line-art (placeholder for commissioned
  hand art); the colorize mechanic is final.

## Content to replace (data-driven, no code changes)

- `src/data/dealers.ts` — **confirm which photo is Kailosh vs Kenny** (currently
  a guess), ranks, taglines.
- `src/data/projects.ts` — real five-card hand per dealer: title, blurb, role,
  outcomes, skills, links.

## Accessibility / fallbacks

`lib/useCapability.ts` is the single source of truth (reduced-motion, touch,
low-power). Reduced motion skips the cinematic and the cursor mask; touch hides
the custom cursor; low-power caps DPR. Cards/dealers are real buttons with ARIA
labels and keyboard focus.
