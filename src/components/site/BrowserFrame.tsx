/** Minimal browser chrome around a product screenshot; the address bar shows the real host. */
export default function BrowserFrame({
  host,
  children,
  className = "",
}: {
  host: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_1px_0_rgba(13,26,21,0.04),0_30px_60px_-30px_rgba(13,26,21,0.35)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-ink/10 bg-paper-2/60 px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <i className="block h-2.5 w-2.5 rounded-full bg-ink/15" />
          <i className="block h-2.5 w-2.5 rounded-full bg-ink/15" />
          <i className="block h-2.5 w-2.5 rounded-full bg-ink/15" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-white/80 px-3 py-1 text-center text-xs text-muted">
          {host}
        </span>
        <span aria-hidden className="w-[42px]" />
      </div>
      <div className="relative aspect-[16/10] bg-paper-2">{children}</div>
    </div>
  );
}
