import type { PostgrestError } from "@supabase/supabase-js";

/** Shape every server action returns, so forms can share one renderer. */
export type ActionState = { ok?: boolean; error?: string; message?: string };

export const IDLE: ActionState = {};

export function fail(error: string): ActionState {
  return { ok: false, error };
}

export function done(message?: string): ActionState {
  return { ok: true, message };
}

/**
 * Postgres errors reach the user, so translate the two that actually happen in
 * normal use and keep everything else generic — raw driver text leaks schema.
 */
export function explain(error: PostgrestError | null, fallback: string): string {
  if (!error) return fallback;
  if (error.code === "23505") return "That already exists — pick another name.";
  if (error.code === "42501" || error.message.includes("row-level security")) {
    return "You don't have permission to do that.";
  }
  console.error("[workspace]", error);
  return fallback;
}

export function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export function optional(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value.length ? value : null;
}

export function num(form: FormData, key: string, fallback = 0): number {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export function bool(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}
