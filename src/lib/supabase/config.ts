/**
 * One place that knows whether Supabase is wired up.
 *
 * The marketing site must build and deploy green even with no backend env vars
 * set, so every workspace entry point checks `isSupabaseConfigured` first and
 * renders the setup screen instead of throwing at import time.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/** Bucket holding client-visible deliverables and internal attachments. */
export const FILES_BUCKET = "project-files";

/** Hard upload ceiling — Supabase Storage free tier is 1GB total. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
