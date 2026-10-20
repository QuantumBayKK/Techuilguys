/**
 * The Techuila Guys mark, redrawn as SVG from the logo: a laptop whose screen
 * holds a tequila shot between `<` and `/>`. Every part has an id prefix so
 * the hero intro can animate it; `idPrefix` keeps ids unique when the mark
 * appears more than once on a page.
 */
export default function BrandMark({
  className = "",
  idPrefix = "bm",
  title = "Techuila Guys",
}: {
  className?: string;
  idPrefix?: string;
  title?: string;
}) {
  const id = (s: string) => `${idPrefix}-${s}`;
  return (
    <svg
      viewBox="0 0 200 124"
      className={className}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <defs>
        <clipPath id={id("glass-clip")}>
          <path d="M86 40h28l-4.2 40H90.2z" />
        </clipPath>
      </defs>

      {/* lid + screen */}
      <g id={id("lid")}>
        <rect x="27" y="2" width="146" height="100" rx="6" fill="#16080a" stroke="#e0303a" strokeWidth="1.6" />
        <rect id={id("screen")} x="35" y="10" width="130" height="84" rx="1.5" fill="#a3373c" />
        <g id={id("dots")} fill="#fff">
          <circle cx="44" cy="18" r="2" />
          <circle cx="51" cy="18" r="2" />
          <circle cx="58" cy="18" r="2" />
        </g>
      </g>

      {/* code brackets */}
      <path id={id("lb")} d="M68 46l-10 9 10 9" fill="none" stroke="#2a0d12" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <g id={id("rb")} fill="none" stroke="#2a0d12" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M127 64l4-18" />
        <path d="M136 46l10 9-10 9" />
      </g>

      {/* the shot */}
      <g id={id("glass")}>
        <g clipPath={`url(#${id("glass-clip")})`}>
          <rect id={id("liquid")} x="84" y="54" width="32" height="30" fill="#fff" opacity="0.92" />
        </g>
        <path d="M86 40h28l-4.2 40H90.2z" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M90.6 74h18.8l-.6 6H91.2z" fill="#fff" />
        <g id={id("lime")}>
          <path d="M108 40a11 11 0 0 1 15.5-6.2L114.6 46z" fill="#fff" />
          <path d="M109.6 39.2a9 9 0 0 1 12.2-4.7l-6.7 9.4z" fill="#a3373c" opacity="0.35" />
        </g>
      </g>

      {/* base */}
      <g id={id("base")}>
        <rect x="6" y="102" width="188" height="11" rx="5.5" fill="#16080a" stroke="#e0303a" strokeWidth="1.6" />
        <rect x="86" y="102" width="28" height="3" rx="1.5" fill="#050304" />
      </g>
    </svg>
  );
}

/** The wordmark: heavy uppercase with the logo's red offset shadow. */
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`wordmark ${className}`}>Techuilaguys</span>;
}
