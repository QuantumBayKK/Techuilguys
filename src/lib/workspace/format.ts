/** Small formatting helpers shared across the workspace. No dependencies. */

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DIVISIONS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.34524, "week"],
  [12, "month"],
  [Number.POSITIVE_INFINITY, "year"],
];

/** "3 hours ago" / "in 2 days". */
export function relativeTime(iso: string | null | undefined) {
  if (!iso) return "—";
  let delta = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(delta) < amount) return RTF.format(Math.round(delta), unit);
    delta /= amount;
  }
  return "—";
}

/** Whole days from today to a date-only string. Negative = overdue. */
export function daysUntil(date: string | null | undefined) {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function countdownLabel(date: string | null | undefined) {
  const d = daysUntil(date);
  if (d === null) return "No date set";
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  if (d < 0) return `${Math.abs(d)} days overdue`;
  return `${d} days out`;
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date.length <= 10 ? `${date}T00:00:00` : date).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

/** 95 → "1h 35m". Timesheets read in hours, tracking stores minutes. */
export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)}h`;
}

export function initials(name: string | null | undefined, email?: string) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

/** URL-safe slug from a project name. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Deterministic hue per string — client logos and avatars stay stable. */
export function hueFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function startOfWeek(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // Monday-first
  date.setDate(date.getDate() - day);
  return date;
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
