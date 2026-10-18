import { ImageResponse } from "next/og";

export const alt = "Techuila Guys — we design and build software products, and ship them in weeks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share preview in the site palette: felt ground, paper type, brass monogram. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#103b2d",
          color: "#f2f3ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 34, fontWeight: 700 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#0a2a20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c6a050",
              fontSize: 40,
            }}
          >
            T
          </div>
          Techuila Guys
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 980 }}>
            We design and build software products, and ship them in weeks.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#b9c6bf" }}>
            SaaS platforms, web and mobile apps, AI features and payment systems.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
