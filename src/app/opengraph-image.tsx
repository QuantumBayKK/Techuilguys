import { ImageResponse } from "next/og";

export const alt = "Techuila Guys — we design and build SaaS products that ship";
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
          background: "radial-gradient(70% 90% at 80% 110%, #5a0a10, #0b0b0b 65%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 34, fontWeight: 700 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#d61f2c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 40,
            }}
          >
            T
          </div>
          Techuila Guys
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 78, fontWeight: 400, lineHeight: 1.04, letterSpacing: -2.5, maxWidth: 980 }}>
            We design and build SaaS products that ship.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#a6a6a2" }}>
            Independent product studio — web, mobile, AI, automation and payments.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
