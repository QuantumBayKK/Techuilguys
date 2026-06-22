# Project hero art — drop-in guide

Each project card in the deck shows a hero image **if the matching file exists
here**, and otherwise falls back to the built-in live SVG demo. So you can add
images one at a time, in any order, and nothing breaks in between.

## How to add an image

1. Generate the image in **Gemini** (e.g. "Nano Banana" / Gemini image
   generation, or the Gemini app).
2. Export it and save it in this folder with the **exact filename** below.
3. That's it — refresh the site. No code changes needed.

> Recommended: **16:10 aspect ratio**, at least **1280×800**, `.png` (or save as
> `.webp`/`.jpg` and update the matching `image:` path in
> `src/data/projects.ts`). Keep them dark and warm so they sit inside the poker
> lounge palette (deep black, brass/gold, one amber accent, a teal highlight).

## Filenames

| File                          | Project            | Dealer  |
| ----------------------------- | ------------------ | ------- |
| `bifrost.png`                 | Bifrost            | Kailosh |
| `atlas.png`                   | ATLAS              | Kailosh |
| `sm1ly.png`                   | sm1ly              | Kailosh |
| `anemoi.png`                  | Anemoi             | Kailosh |
| `cheri.png`                   | Cheri              | Kailosh |
| `ipsec-pqc.png`               | ipsec-pqc-ikev2    | Keni    |
| `qrmf-x.png`                  | qrmf-x             | Keni    |
| `zk-airec.png`                | zk-airec           | Keni    |
| `founderos.png`               | founderos          | Keni    |
| `pairs-trading.png`           | Pairs-Trading-Quant| Keni    |

## Suggested Gemini prompts

A shared style prefix keeps the whole deck cohesive — paste it before each
project line:

> **Style:** cinematic dark UI hero illustration, deep near-black background,
> warm brass/gold linework, a single neon-amber accent and a teal highlight,
> subtle film grain, 16:10, no text, no logos, premium and minimal.

- **bifrost.png** — two laptops on the same Wi-Fi discovering each other, glowing mesh links and discovery pulse rings between device nodes, peer-to-peer, no server.
- **atlas.png** — a city CCTV grid, one face highlighted by a tracking reticle moving across multiple camera feeds, surveillance HUD.
- **sm1ly.png** — a hacker recon terminal collapsing many scans into one glowing risk-score dial, attack-surface map.
- **anemoi.png** — a reconstructed travel path drawn across an abstract map, geospatial pins, memory-as-a-graph.
- **cheri.png** — a phone speaking back to its owner, a private on-device voice waveform, everything staying local, cozy.
- **ipsec-pqc.png** — two endpoints exchanging a post-quantum key, a lock closing over a VPN tunnel, lattice-crypto motif.
- **qrmf-x.png** — several blockchains linked by a quantum-resistant verification layer, multiple chains of blocks.
- **zk-airec.png** — a recommendation proven correct behind a privacy curtain, zero-knowledge proof, data never revealed.
- **founderos.png** — an AI cofounder as a glowing node branching idea → plan → build → raise, a startup engine.
- **pairs-trading.png** — two cointegrated price lines converging on a mean-reversion spread, quant trading chart.
