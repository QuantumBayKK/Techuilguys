/**
 * Hidden, document-wide SVG filter defs reused by the imperfection layer.
 * Rendered once at the root. Server component (no client JS).
 *
 *  #worn-edge-filter (#3) — a small fractal displacement that softens card
 *  corners so they look thumbed and hand-cut rather than laser-perfect. Applied
 *  via the `.worn-edge` utility in globals.css.
 */
export default function SvgFilters() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      <defs>
        <filter id="worn-edge-filter" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.014"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={3.2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
