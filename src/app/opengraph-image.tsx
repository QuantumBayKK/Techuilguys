import { ImageResponse } from "next/og";

export const alt = "Techuila Guys — we design & build SaaS products that ship";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A poker-card share preview, generated at the edge (system fonts only). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 90% at 50% -10%, #1a130b, #0a0907 60%), #0a0907",
          color: "#ece4d6",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* framed card border */}
        <div
          style={{
            position: "absolute",
            inset: 48,
            border: "2px solid rgba(201,162,75,0.35)",
            borderRadius: 28,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#c9a24b",
            letterSpacing: 12,
            fontSize: 22,
            textTransform: "uppercase",
          }}
        >
          <span>♠</span> Studio · cinematic software <span>♣</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -2,
            marginTop: 18,
            textTransform: "uppercase",
          }}
        >
          Techuila&nbsp;<span style={{ color: "#ff9d2f" }}>Guys</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 28,
            color: "#9a8f7d",
          }}
        >
          We design & build SaaS — web, apps, AI, automation & payments.
        </div>

        {/* a dealt hand — a royal flush in spades */}
        <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
          {["10", "J", "Q", "K", "A"].map((r, i) => (
            <div
              key={r}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                width: 78,
                height: 108,
                padding: "8px 6px",
                borderRadius: 10,
                border: `2px solid ${i === 4 ? "#ff9d2f" : "rgba(201,162,75,0.5)"}`,
                background: "#0f0b07",
                color: i === 4 ? "#ff9d2f" : "#c9a24b",
                transform: `rotate(${(i - 2) * 4}deg) translateY(${Math.abs(i - 2) * 6}px)`,
                fontSize: 26,
                fontWeight: 700,
                boxShadow: i === 4 ? "0 0 30px rgba(255,157,47,0.5)" : "none",
              }}
            >
              <span style={{ alignSelf: "flex-start" }}>{r}</span>
              <span style={{ fontSize: 34 }}>♠</span>
              <span style={{ alignSelf: "flex-end", transform: "rotate(180deg)" }}>{r}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 70,
            fontSize: 20,
            letterSpacing: 6,
            color: "#5f5746",
            textTransform: "uppercase",
          }}
        >
          Kailosh ♠ · Keni ♣
        </div>
      </div>
    ),
    { ...size }
  );
}
