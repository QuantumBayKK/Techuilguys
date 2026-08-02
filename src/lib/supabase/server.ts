import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/workspace/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Server client for Server Components, Route Handlers and Server Actions.
 * Writes are no-ops inside a Server Component (cookies are read-only there);
 * the middleware refresh keeps the session alive, so that's safe.
 */
export async function supabaseServer() {
  const store = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — middleware already refreshed.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS, so it is only ever used for the two things
 * RLS can't express: reading a *pending* user's own profile during the gate,
 * and admin-only writes (role assignment, org linking) that must sidestep the
 * "clients see only their org" policies. Never import this into a Client
 * Component — the key must not reach the browser.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;

  return createServerClient<Database>(SUPABASE_URL, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
