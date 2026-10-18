/** Re-mounts on every navigation, so each page arrives with a short fade-up. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
