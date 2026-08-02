import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

/**
 * Next 16 proxy (previously `middleware`). Scoped to `/workspace` so the
 * marketing site never pays for it.
 *
 * Its only job is refreshing the Supabase session cookie so Server Components
 * downstream see a live session. Authorization is *not* decided here — roles are
 * enforced by RLS in Postgres and re-checked per route. A proxy-only guard would
 * be a single point of failure; RLS is the guarantee.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching getUser() is what triggers the refresh-token round trip.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/workspace/:path*"],
};
