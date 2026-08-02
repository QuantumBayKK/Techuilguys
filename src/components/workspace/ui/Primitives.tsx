import type { ComponentPropsWithRef, ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { hueFor, initials } from "@/lib/workspace/format";
import type { Health, ProjectStatus } from "@/lib/workspace/database.types";

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-[var(--ws-line)] bg-[var(--ws-surface)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  hint,
  action,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--ws-line)] px-5 py-3.5">
      <div className="min-w-0">
        <h2 className="truncate text-[13px] font-semibold tracking-tight">
          {title}
        </h2>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-[var(--ws-muted)]">{hint}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ws-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-prose text-sm text-[var(--ws-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

type Variant = "primary" | "ghost" | "outline" | "danger" | "subtle";
type Size = "sm" | "md";

export function buttonClass(variant: Variant = "outline", size: Size = "md") {
  return clsx(
    "inline-flex select-none items-center justify-center gap-1.5 rounded-lg font-semibold tracking-tight transition-colors disabled:pointer-events-none disabled:opacity-45",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-[13px]",
    variant === "primary" &&
      "bg-[var(--ws-accent)] text-[var(--ws-accent-ink)] hover:brightness-110",
    variant === "outline" &&
      "border border-[var(--ws-line-strong)] text-[var(--ws-text)] hover:bg-[var(--ws-hover)]",
    variant === "ghost" && "text-[var(--ws-muted)] hover:bg-[var(--ws-hover)] hover:text-[var(--ws-text)]",
    variant === "subtle" && "bg-[var(--ws-hover)] text-[var(--ws-text)] hover:brightness-125",
    variant === "danger" &&
      "border border-[var(--ws-red)]/40 text-[var(--ws-red)] hover:bg-[var(--ws-red)]/10",
  );
}

export function Button({
  variant,
  size,
  className,
  ...rest
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={clsx(buttonClass(variant, size), className)} {...rest} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={clsx(buttonClass(variant, size), className)} {...rest} />;
}

/* -------------------------------------------------------------------------- */
/* Form fields                                                                 */
/* -------------------------------------------------------------------------- */

const FIELD =
  "w-full rounded-lg border border-[var(--ws-line-strong)] bg-[var(--ws-bg)] px-3 py-2 text-[13px] text-[var(--ws-text)] placeholder:text-[var(--ws-faint)] focus:border-[var(--ws-accent)] focus:outline-none";

export function Label({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-muted)]">
        {children}
      </span>
      {hint ? <span className="text-[11px] text-[var(--ws-faint)]">{hint}</span> : null}
    </span>
  );
}

export function Input({ className, ...rest }: ComponentPropsWithRef<"input">) {
  return <input className={clsx(FIELD, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea className={clsx(FIELD, "resize-y leading-relaxed", className)} {...rest} />
  );
}

export function Select({ className, ...rest }: ComponentPropsWithRef<"select">) {
  return (
    <select
      className={clsx(FIELD, "appearance-none bg-[var(--ws-surface)] pr-8", className)}
      {...rest}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Status vocabulary                                                           */
/* -------------------------------------------------------------------------- */

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "accent" | "green" | "amber" | "red" | "live";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap",
        tone === "neutral" &&
          "border-[var(--ws-line-strong)] text-[var(--ws-muted)]",
        tone === "accent" &&
          "border-[var(--ws-accent)]/40 bg-[var(--ws-accent-soft)] text-[var(--ws-accent)]",
        tone === "green" && "border-[var(--ws-green)]/40 text-[var(--ws-green)]",
        tone === "amber" && "border-[var(--ws-amber)]/40 text-[var(--ws-amber)]",
        tone === "red" && "border-[var(--ws-red)]/40 text-[var(--ws-red)]",
        tone === "live" && "border-[var(--ws-live)]/40 text-[var(--ws-live)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

const HEALTH_TONE = { green: "green", amber: "amber", red: "red" } as const;
const HEALTH_WORD = { green: "On track", amber: "At risk", red: "Blocked" };

export function HealthBadge({ health, note }: { health: Health; note?: string | null }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Badge tone={HEALTH_TONE[health]}>
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: `var(--ws-${health === "green" ? "green" : health})` }}
        />
        {HEALTH_WORD[health]}
      </Badge>
      {note ? (
        <span className="truncate text-xs text-[var(--ws-muted)]">{note}</span>
      ) : null}
    </span>
  );
}

const STATUS_TONE: Record<ProjectStatus, "neutral" | "accent" | "green" | "amber"> = {
  discovery: "neutral",
  building: "accent",
  review: "amber",
  launched: "green",
  paused: "neutral",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}

/* -------------------------------------------------------------------------- */
/* People                                                                      */
/* -------------------------------------------------------------------------- */

export function Avatar({
  name,
  email,
  src,
  size = 28,
  title,
}: {
  name?: string | null;
  email?: string;
  src?: string | null;
  size?: number;
  title?: string;
}) {
  const seed = name || email || "?";
  const label = title ?? name ?? email ?? "Unassigned";

  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element -- avatars come from
       arbitrary OAuth CDNs; not worth the remotePatterns allowlist churn. */
    return (
      <img
        src={src}
        alt={label}
        title={label}
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-[var(--ws-line)] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--ws-line)] font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hueFor(seed)} 45% 22%)`,
        color: `hsl(${hueFor(seed)} 70% 82%)`,
      }}
    >
      {initials(name, email)}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 5,
}: {
  people: { full_name: string | null; email: string; avatar_url: string | null }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <span className="flex items-center">
      {shown.map((p) => (
        <span key={p.email} className="-ml-1.5 first:ml-0">
          <Avatar name={p.full_name} email={p.email} src={p.avatar_url} size={26} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="-ml-1.5 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[var(--ws-line)] bg-[var(--ws-hover)] text-[10px] font-semibold text-[var(--ws-muted)]">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty states — clients see these on day one, so never a bare "No data".     */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  art,
  title,
  children,
  action,
}: {
  art?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--ws-line-strong)] px-6 py-14 text-center">
      <div className="mb-4 text-[var(--ws-faint)]">{art ?? <EmptyArt />}</div>
      <p className="font-display text-base font-bold tracking-tight">{title}</p>
      {children ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--ws-muted)]">
          {children}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** House illustration: a fanned hand of blank cards waiting to be dealt. */
export function EmptyArt() {
  return (
    <svg width="88" height="62" viewBox="0 0 88 62" fill="none" aria-hidden>
      {[-22, -11, 0, 11, 22].map((deg, i) => (
        <rect
          key={deg}
          x={30}
          y={12}
          width="28"
          height="40"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          opacity={0.35 + i * 0.14}
          transform={`rotate(${deg} 44 52)`}
        />
      ))}
      <circle cx="44" cy="30" r="2.2" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "green" | "amber" | "red" | "accent";
}) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ws-muted)]">
        {label}
      </p>
      <p
        className="mono mt-1.5 text-2xl font-semibold leading-none tracking-tight"
        style={tone ? { color: `var(--ws-${tone})` } : undefined}
      >
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-xs text-[var(--ws-muted)]">{sub}</p> : null}
    </Card>
  );
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-[var(--ws-line)]" />;
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-[var(--ws-line)]" />
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--ws-faint)]">
        {label}
      </span>
      <hr className="flex-1 border-[var(--ws-line)]" />
    </div>
  );
}
