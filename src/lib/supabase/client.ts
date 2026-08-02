"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/workspace/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser client — singleton so Realtime keeps one socket across the whole
 * workspace instead of one per component that subscribes.
 */
export function supabaseBrowser() {
  cached ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
