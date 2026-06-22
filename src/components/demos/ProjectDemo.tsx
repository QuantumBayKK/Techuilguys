"use client";

import type { DemoKind } from "@/data/projects";

/**
 * Lightweight embedded "proof" animations — one per project kind. Pure
 * SVG/CSS, no canvas loops, no WebGL. All motion is CSS keyframes (defined in
 * globals.css under `.demo--live`) so the GPU compositor does the work and the
 * animation is fully paused when the card is off-screen (`live=false`).
 */
export default function ProjectDemo({
  kind,
  live,
}: {
  kind: DemoKind;
  live: boolean;
}) {
  return (
    <div className={`demo ${live ? "demo--live" : ""}`} aria-hidden>
      {DEMOS[kind]()}
    </div>
  );
}

const C = {
  brass: "#c9a24b",
  amber: "#ff9d2f",
  electric: "#37e6cf",
  ink: "#ece4d6",
  muted: "#9a8f7d",
  felt: "#1f6d51",
  grid: "rgba(201,162,75,0.14)",
} as const;

/* A faint dotted grid backplate shared by several demos. */
function Grid() {
  return (
    <defs>
      <pattern id="dgrid" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" fill={C.grid} />
      </pattern>
    </defs>
  );
}

const box =
  "relative h-full w-full overflow-hidden rounded-xl border border-[var(--color-line)]";
const bg = { background: "radial-gradient(120% 120% at 50% 0%, #14110c, #07060488)" };

const DEMOS: Record<DemoKind, () => React.ReactElement> = {
  /* ---------------- Bifrost — LAN mesh discovery ---------------- */
  mesh: () => (
    <div className={box} style={bg}>
      <svg viewBox="0 0 320 200" className="h-full w-full">
        <Grid />
        <rect width="320" height="200" fill="url(#dgrid)" />
        {/* links */}
        {[
          [60, 150, 160, 60],
          [160, 60, 260, 150],
          [60, 150, 260, 150],
          [160, 60, 160, 150],
          [60, 150, 160, 150],
          [260, 150, 160, 150],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            className="mesh-link"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.electric}
            strokeWidth="1.2"
            strokeDasharray="4 5"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
        {/* discovery pulse rings */}
        {[[60, 150], [160, 60], [260, 150], [160, 150]].map(([cx, cy], i) => (
          <g key={i}>
            <circle
              className="mesh-ping"
              cx={cx}
              cy={cy}
              r="6"
              fill="none"
              stroke={C.amber}
              style={{ animationDelay: `${i * 0.5}s` }}
            />
            <circle cx={cx} cy={cy} r="6" fill={C.brass} />
            <circle cx={cx} cy={cy} r="2.5" fill="#07060a" />
          </g>
        ))}
        <text x="160" y="192" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="monospace">
          peers discovered · ~5s · no server
        </text>
      </svg>
    </div>
  ),

  /* ---------------- ATLAS — face detection scan ---------------- */
  vision: () => (
    <div className={box} style={bg}>
      <svg viewBox="0 0 320 200" className="h-full w-full">
        <Grid />
        <rect width="320" height="200" fill="url(#dgrid)" />
        {/* silhouette head */}
        <g opacity="0.85">
          <ellipse cx="160" cy="96" rx="34" ry="42" fill="#2a2620" />
          <ellipse cx="160" cy="150" rx="58" ry="34" fill="#211d18" />
        </g>
        {/* scanline */}
        <rect className="cv-scan" x="40" y="40" width="240" height="2" fill={C.electric} opacity="0.7" />
        {/* tracking box */}
        <g className="cv-box">
          <rect x="124" y="58" width="72" height="84" fill="none" stroke={C.amber} strokeWidth="1.5" />
          {[[124, 58], [196, 58], [124, 142], [196, 142]].map(([x, y], i) => (
            <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill={C.amber} />
          ))}
          <text x="124" y="52" fill={C.amber} fontSize="9" fontFamily="monospace">
            MATCH 0.97
          </text>
        </g>
        <text x="160" y="190" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="monospace">
          detect · track · confirm
        </text>
      </svg>
    </div>
  ),

  /* ---------------- sm1ly — recon terminal + risk score ---------------- */
  terminal: () => (
    <div className={box} style={{ ...bg, fontFamily: "monospace" }}>
      <div className="flex items-center gap-1.5 border-b border-[var(--color-line)] px-3 py-2">
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
        ))}
        <span className="ml-2 text-[9px] text-[var(--color-muted)]">sm1ly — recon</span>
      </div>
      <div className="space-y-1 px-3 py-3 text-[10px] leading-relaxed">
        {[
          ["$ sm1ly scan acme.io --all", C.electric],
          ["▸ nmap        12 ports open", C.muted],
          ["▸ httpx       3 live hosts", C.muted],
          ["▸ nuclei      2 medium · 1 high", C.muted],
          ["▸ amass       41 subdomains", C.muted],
        ].map(([t, c], i) => (
          <div key={i} className="term-line" style={{ color: c, animationDelay: `${i * 0.45}s` }}>
            {t}
          </div>
        ))}
        <div className="term-line mt-2" style={{ animationDelay: "2.4s" }}>
          <span className="text-[var(--color-muted)]">risk score </span>
          <span className="text-[var(--color-neon-amber)]">72 / 100</span>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
            <div className="risk-fill h-full rounded-full" style={{ background: C.amber }} />
          </div>
        </div>
      </div>
    </div>
  ),

  /* ---------------- Anemoi — geospatial path ---------------- */
  geo: () => (
    <div className={box} style={bg}>
      <svg viewBox="0 0 320 200" className="h-full w-full">
        <Grid />
        <rect width="320" height="200" fill="url(#dgrid)" />
        <path
          className="geo-path"
          d="M40,160 C90,150 80,90 130,90 S200,140 230,90 270,40 290,52"
          fill="none"
          stroke={C.electric}
          strokeWidth="2"
        />
        {[[40, 160], [130, 90], [230, 90], [290, 52]].map(([cx, cy], i) => (
          <g key={i} className="geo-pin" style={{ animationDelay: `${0.4 + i * 0.5}s` }}>
            <circle cx={cx} cy={cy} r="9" fill="none" stroke={C.amber} opacity="0.4" />
            <circle cx={cx} cy={cy} r="3.5" fill={C.amber} />
          </g>
        ))}
        <text x="160" y="190" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="monospace">
          capture → reconstruct → query by meaning
        </text>
      </svg>
    </div>
  ),

  /* ---------------- Cheri — voice waveform + reply ---------------- */
  voice: () => (
    <div className={box} style={bg}>
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-end gap-1" style={{ height: 54 }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="voice-bar w-[3px] rounded-full"
              style={{
                background: i % 3 === 0 ? C.amber : C.electric,
                animationDelay: `${(i % 7) * 0.09}s`,
              }}
            />
          ))}
        </div>
        <div className="voice-reply max-w-[80%] rounded-2xl rounded-tl-sm border border-[var(--color-line-warm)] px-3 py-2 text-[10px] text-[var(--color-ink)]">
          “On-device. Nothing leaves your machine.”
        </div>
        <span className="text-[9px] font-mono text-[var(--color-muted)]">
          listening · local LLM · speaking
        </span>
      </div>
    </div>
  ),

  /* ---------------- ipsec-pqc — key exchange handshake ---------------- */
  handshake: () => (
    <div className={box} style={bg}>
      <svg viewBox="0 0 320 200" className="h-full w-full">
        <Grid />
        <rect width="320" height="200" fill="url(#dgrid)" />
        {[
          [54, "A"],
          [266, "B"],
        ].map(([x, label], i) => (
          <g key={i}>
            <rect x={(x as number) - 26} y="72" width="52" height="52" rx="8" fill="#1a1610" stroke={C.brass} />
            <text x={x as number} y="103" fill={C.ink} fontSize="16" textAnchor="middle" fontFamily="monospace">
              {label}
            </text>
          </g>
        ))}
        {/* exchanged key packets */}
        <circle className="hs-packet hs-a" cy="98" r="5" fill={C.electric} />
        <circle className="hs-packet hs-b" cy="98" r="5" fill={C.amber} />
        <line x1="80" y1="98" x2="240" y2="98" stroke={C.grid} strokeWidth="1" strokeDasharray="3 4" />
        {/* lock closing */}
        <g className="hs-lock" transform="translate(160,150)">
          <rect x="-12" y="-4" width="24" height="18" rx="3" fill={C.brass} />
          <path d="M-7,-4 v-6 a7,7 0 0 1 14,0 v6" fill="none" stroke={C.brass} strokeWidth="2.5" />
        </g>
        <text x="160" y="44" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="monospace">
          ML-KEM (Kyber) · IKEv2
        </text>
      </svg>
    </div>
  ),

  /* ---------------- qrmf-x — multi-chain blocks ---------------- */
  chain: () => (
    <div className={box} style={bg}>
      <svg viewBox="0 0 320 200" className="h-full w-full">
        <Grid />
        <rect width="320" height="200" fill="url(#dgrid)" />
        {[40, 100, 160].map((y, lane) => (
          <g key={lane}>
            {[0, 1, 2, 3].map((b) => (
              <g
                key={b}
                className="chain-block"
                style={{ animationDelay: `${lane * 0.3 + b * 0.45}s` }}
                transform={`translate(${30 + b * 70}, ${y})`}
              >
                <rect width="44" height="26" rx="4" fill="#1a1610" stroke={lane === 1 ? C.amber : C.brass} />
                <rect x="6" y="9" width="32" height="3" rx="1.5" fill={C.electric} opacity="0.7" />
                {b < 3 && <line x1="44" y1="13" x2="70" y2="13" stroke={C.grid} strokeWidth="1.5" />}
              </g>
            ))}
          </g>
        ))}
        <text x="160" y="192" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="monospace">
          PQC-verified · multi-chain
        </text>
      </svg>
    </div>
  ),

  /* ---------------- zk-airec — zero-knowledge proof ---------------- */
  zk: () => (
    <div className={box} style={bg}>
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 font-mono">
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-muted)]">
          <span>private input</span>
          <span className="rounded bg-[var(--color-line)] px-2 py-1 tracking-widest text-[var(--color-ink)]">
            ●●●●●●
          </span>
        </div>
        <div className="zk-flow text-[var(--color-electric)]">↓ proof ↓</div>
        <div className="zk-verify flex items-center gap-2 rounded-full border border-[var(--color-line-warm)] px-4 py-2 text-[11px]">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              className="zk-check"
              d="M3 8.5 L6.5 12 L13 4"
              fill="none"
              stroke={C.electric}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[var(--color-ink)]">verified · data never seen</span>
        </div>
      </div>
    </div>
  ),

  /* ---------------- founderos — idea graph ---------------- */
  founder: () => (
    <div className={box} style={bg}>
      <svg viewBox="0 0 320 200" className="h-full w-full">
        <Grid />
        <rect width="320" height="200" fill="url(#dgrid)" />
        {[
          [120, 70],
          [120, 130],
          [220, 60],
          [220, 100],
          [220, 140],
        ].map(([x, y], i) => (
          <line
            key={i}
            className="fo-link"
            x1="60"
            y1="100"
            x2={x}
            y2={y}
            stroke={C.grid}
            strokeWidth="1.4"
            style={{ animationDelay: `${0.3 + i * 0.2}s` }}
          />
        ))}
        <circle cx="60" cy="100" r="14" fill={C.amber} />
        <text x="60" y="104" fontSize="9" textAnchor="middle" fontFamily="monospace" fill="#1a1208">
          idea
        </text>
        {[
          [120, 70, "plan"],
          [120, 130, "build"],
          [220, 60, "GTM"],
          [220, 100, "hire"],
          [220, 140, "raise"],
        ].map(([x, y, t], i) => (
          <g key={i} className="fo-node" style={{ animationDelay: `${0.5 + i * 0.2}s` }}>
            <circle cx={x as number} cy={y as number} r="11" fill="#1a1610" stroke={C.brass} />
            <text x={x as number} y={(y as number) + 3} fontSize="7.5" textAnchor="middle" fontFamily="monospace" fill={C.ink}>
              {t}
            </text>
          </g>
        ))}
      </svg>
    </div>
  ),

  /* ---------------- Pairs-Trading-Quant — cointegrated spread ---------------- */
  quant: () => (
    <div className={box} style={bg}>
      <svg viewBox="0 0 320 200" className="h-full w-full">
        <Grid />
        <rect width="320" height="200" fill="url(#dgrid)" />
        <line x1="20" y1="100" x2="300" y2="100" stroke={C.grid} strokeWidth="1" strokeDasharray="2 4" />
        <path
          className="q-line"
          d="M20,70 C70,40 90,120 130,80 S210,30 250,70 290,60 300,64"
          fill="none"
          stroke={C.electric}
          strokeWidth="1.8"
        />
        <path
          className="q-line"
          style={{ animationDelay: "0.4s" }}
          d="M20,120 C70,95 90,150 130,118 S210,80 250,120 290,108 300,112"
          fill="none"
          stroke={C.amber}
          strokeWidth="1.8"
        />
        {[[130, 99], [250, 99]].map(([cx, cy], i) => (
          <circle
            key={i}
            className="q-mark"
            cx={cx}
            cy={cy}
            r="4"
            fill={C.brass}
            style={{ animationDelay: `${1 + i * 0.5}s` }}
          />
        ))}
        <text x="160" y="192" fill={C.muted} fontSize="9" textAnchor="middle" fontFamily="monospace">
          cointegration · mean-reversion · entries
        </text>
      </svg>
    </div>
  ),
};
