# Techuila Guys — 100 Creative Reworks

Inspired by [chimdibam.co](https://www.chimdibam.co/) (day-in-a-life narrative, playful
retro dark mode) and [jackiezhang.co.za](https://jackiezhang.co.za/) (hand-drawn
scrapbook, tactile drag interactions, *"imperfect by design"*). The north star:
**one strong metaphor — the Techuila poker table — expressed through tactile
interaction and deliberate, *stable* hand-made imperfection.**

> Imperfection must be **seeded**, never `Math.random()` per render, or it reads
> as a bug. See [`src/lib/seededNoise.ts`](src/lib/seededNoise.ts).

**Status legend:** ✅ live · 🔵 wired (foundation in place, needs polish/placement)
· ⚪ queued · 💤 deferred (needs a larger dependency, e.g. a contact form / WebGL scene)

---

## A. Minute imperfections — the "human hand" layer
1. ✅ **Hand-dealt jitter** — every project card lands a hair off-square, seeded by id. `seededNoise.ts` + `ProjectShowcase.tsx`.
2. ✅ **Imperfect deal timing** — humanized per-card deal delay (not a metronome). Same source.
3. 🔵 **Worn card edges** — `#worn-edge-filter` SVG + `.worn-edge` utility ready; apply to card faces.
4. ✅ **Felt-table grain** — living `.felt-grain` noise breathing at ~7s. On the deck table.
5. ⚪ **Bent corner** — one hero card with a permanent dog-ear + cast shadow.
6. ⚪ **Off-register print** — 1px cyan/magenta misprint on section titles.
7. ⚪ **Coffee-ring stain** — a fixed faint ring mark on the table.
8. 🔵 **Handwritten annotations** — script font (Pinyon) already loaded; use for labels.
9. ⚪ **Ink bleed on hover** — handwritten links thicken on hover.
10. ⚪ **Uneven chip stacks** — leaning, slightly-misaligned chip stacks.

## B. Tactile / physical card interactions
11. ⚪ **Drag-to-fan your hand** — spread the hero cards with momentum + spring-back. *(Wave 3)*
12. ⚪ **Throw-to-dismiss** — flick a card off-screen with throw velocity. *(Wave 3)*
13. ⚪ **Riffle shuffle** — clickable deck riffles + reorders, paper-snap sound.
14. ⚪ **Peek-the-corner** — press-hold to bend a corner and peek the project. *(Wave 3)*
15. ⚪ **Cut the deck** — drag to cut and jump sections.
16. ⚪ **Magnetic chip toss** — drag + release a chip, friction slide into the pot. *(Wave 3)*
17. ⚪ **Card weight on cursor** — drag-velocity tilt that settles on release.
18. ⚪ **Stackable inspect** — pull cards into a rearrangeable messy pile.
19. ⚪ **Slingshot reveal** — pull back + release into inspect view.
20. 🔵 **Holo-foil tilt** — `spotlight-card.tsx` + loader tilt exist; add foil glare. *(Wave 3)*

## C. New scenes / acts in the poker narrative
21. ⚪ **"The Buy-In" intro** — slide chips to buy your seat; chip count = loader progress.
22. ⚪ **"The Tell"** — read each founder's tell on hover.
23. ⚪ **"The River"** — final CTA as the last community card flipping to contact.
24. ⚪ **"Side Pot"** — hidden experiments section behind the felt.
25. 🔵 **"The Rake"** — footer exists; reframe as the house's cut + credits.
26. ⚪ **Dealer's POV scroll** — a scene from the dealer's hands.
27. ⚪ **Tournament bracket** — projects as a bracket.
28. ⚪ **All-in moment** — push all-in → full-screen flagship cinematic.
29. ⚪ **"Reading the table"** — community cards as sticky nav. *(see #81)*
30. ⚪ **Last call at the lounge** — late-night dimming end scene. *(ties to #49)*

## D. Sound & haptics
31. 🔵 **Foley card deck** — `audio.ts` has hooks (select/hover/flip); add riffle/chip/felt + pitch variation.
32. 🔵 **Ambient lounge bed** — `audio.startBed()` exists; add ducking.
33. ⚪ **Chip-stack scrub** — scroll speed → riffle sound rate.
34. ⚪ **Mobile haptics** — `navigator.vibrate` on deal/flip/win.
35. ⚪ **Win sting** — chip-cascade + soft cheer at the contact "win".

## E. Cursor & pointer personality
36. ⚪ **Cursor is a chip** — spinning chip cursor with shadow. *(Wave 3/5)*
37. 🔵 **Dealer-hand cursor** — `Cursor.tsx` already swaps `data-cursor` labels; add a hand glyph over draggables.
38. ⚪ **Trailing chips** — short fading chip trail on fast movement. *(SuitTrail in reborn/ is a basis)*
39. ✅ **Magnetic buttons** — `data-magnetic` pull already in `Cursor.tsx`.
40. ✅ **Idle tell** — `IdleTell.tsx`: "Your move." surfaces after 8s still.

## F. Typography & visual system
41. 🔵 **Marquee card-suit ticker** — `Marquee.tsx` exists; add ♠♥♦♣ separators + speed wobble.
42. ⚪ **Numbers as card pips** — stats rendered as pip arrangements.
43. ⚪ **Kinetic title shuffle** — headings riffle-scramble then settle.
44. ✅ **Two-font system** — Zilla Slab (structure) + Pinyon Script (hand) already paired.
45. 🔵 **Suit-color accents** — token palette in place; map red/black semantics.

## G. Easter eggs & personality
46. 🔵 **Konami → cheat mode** — `reborn/KonamiJackpot.tsx` exists; port to main.
47. ⚪ **The Joker** — hidden joker card → wildcard surprise.
48. ⚪ **Losing hand** — spam-click the deck → comically bad hand + "fold?".
49. ✅ **Time-of-day table** — `TimeOfDay.tsx` sets `data-timeband`; room light shifts by local hour.
50. ⚪ **Drag the felt** — slide the tablecloth to reveal a hidden doodle.

## H. Shader, light & generative
51. ⚪ **Volumetric table light** — swaying lamp cone. *(Wave 5)*
52. ⚪ **Smoke reacts to cursor** — smoke shader curls from the pointer.
53. ⚪ **Caustic glass refraction** — glass bends the felt behind it.
54. 🔵 **Generative felt weave** — `dithering-shader.tsx` / `ShaderBackdrop` present; drive procedural felt.
55. ⚪ **Chip metallic PBR** — real reflections on chips.
56. ⚪ **Heat-haze over candle** — distortion ripple above a flame.
57. ⚪ **Card-back moiré** — live moiré when card backs overlap.
58. ⚪ **Felt burn-in trail** — pressed-nap cursor trail that springs back.
59. ✅ **Neon sign flicker** — buzzing "Techuila" neon (dead 'l' tube) in the lounge (`NeonSign.tsx`).
60. ⚪ **Depth-of-field rack focus** — background blurs, focused card snaps sharp.

## I. Scroll-as-camera cinematics
61. ⚪ **One continuous dolly** — whole site as one camera move. *(Wave 4)*
62. ⚪ **Scrub the deal** — scroll forward deals, back un-deals.
63. ⚪ **Orbit the pot** — 360° chip-pot orbit on scroll.
64. ⚪ **Match-cut transitions** — shape-matched cuts (chip → "O" → spotlight).
65. ⚪ **Pinned hand reveal** — pin + flip five cards, one stat each.
66. ⚪ **Pull-focus on names** — names rack into focus in the light cone.
67. ⚪ **Time-remap on fast scroll** — fast scroll speeds the deal + motion blur.
68. ⚪ **Camera shake on all-in** — subtle handheld shake at the climax.
69. ⚪ **Reveal-by-wipe** — sections wipe like a card sliding over the last.
70. ⚪ **End-credits crane-up** — closing lifts off the table.

## J. Copy, microcopy & states
71. ✅ **Poker 404** — `not-found.tsx` "Dead hand" already shipped.
72. ✅ **Loading = the shuffle** — `IntroPick.tsx` cycles `SHUFFLE_LINES` patter.
73. 🔵 **Empty states** — `EMPTY_STATES` copy bank ready in `dealerPatter.ts`.
74. 🔵 **Tooltips as tells** — `TELLS` bank ready; wire into hover labels.
75. 💤 **Form validation as a bluff** — `BLUFF_LINES` ready; needs a real contact form.
76. ✅ **Console message** — `ConsoleEgg.tsx` prints a royal flush + `techuila.allIn()`.
77. ✅ **Meta/OG card** — `opengraph-image.tsx` now deals a royal flush in spades.
78. ✅ **Cursor-idle whisper** — `IdleTell.tsx` (shared with #40).
79. ✅ **Copyright as a chip count** — footer reads "pot: ∞ chips" (ContactLounge "The Rake").
80. 💤 **Send button = "Go all in"** — needs the contact form (#75).

## K. Unconventional navigation
81. ⚪ **Community-card nav** — five face-up cards as sticky nav. *(Wave 4)*
82. ✅ **Chip-stack progress** — `ChipScrollProgress.tsx`: a chip stack that climbs as you read.
83. ⚪ **Logo = deal the menu** — click logo → fan of cards as full-screen menu.
84. ⚪ **Dealer button marker** — a puck marks the current section. *(Wave 4)*
85. ⚪ **Drag-to-seat nav** — drag your chip to a seat to jump.
86. ⚪ **Mini-map "table view"** — overhead diagram to teleport.
87. ✅ **Suit shortcuts** — S/H/D/C (+T/W) keys jump tables (`SuitShortcuts.tsx`), with a hint chip.
88. ⚪ **Breadcrumb as betting line** — call/raise/fold path.
89. ✅ **Back-to-top = rack the chips** — `RackTop.tsx`: chip button + chip-clatter on click.
90. ⚪ **Scroll-hint card peek** — next section's card peeks at the bottom edge.

## L. The dealer as a character
91. 🔵 **Recurring dealer persona** — extend `PixelCat.tsx` into a reacting host. *(Wave 5)*
92. 🔵 **Dealer reacts to you** — cat meows when you reach for the contact CTA; idle-drum/side-eye still TODO.
93. ⚪ **Win/lose tells** — dealer animations for win (contact) vs fold.
94. ✅ **First-vs-returning greeting** — `DealerGreeting.tsx` via localStorage.
95. ⚪ **Cat as the dealer's tell** — tail flicks toward easter eggs.

## M. Personalization & replayability
96. ⚪ **Deal a different hand each visit** — date-seeded project order. *(Wave 5; `seededNoise.ts` ready)*
97. ⚪ **"Your seat" memory** — resume last section reached.
98. ⚪ **Lucky-card pick** — cut the deck once → themes accent colors.
99. ⚪ **Shareable hand** — generate a 5-card share image of the visit. *(Wave 5)*
100. ✅ **Time-zone dealer line** — greeting adapts to visitor's local hour (`DealerGreeting`/`greeting()`).

---

## Build order
- **Wave 1 (done):** seeded-noise foundation, hand-dealt jitter, felt grain, copy bank.
- **Wave 2 (in progress):** shuffle loader, console egg, idle tell, time-of-day light, greeting. Queued: tooltips, empty states, OG hand, worn-edge placement.
- **Wave 3:** tactile cards (drag-to-fan, peek-corner, throw, chip toss, holo-foil).
- **Wave 4:** scroll-camera + nav (dolly, community-card nav, chip-stack progress, dealer button).
- **Wave 5:** shader/light + dealer host + personalization (lamp cone, neon flicker, persona, shuffle/shareable hand).

Every wave ends green: `npm run build` passes before moving on.
