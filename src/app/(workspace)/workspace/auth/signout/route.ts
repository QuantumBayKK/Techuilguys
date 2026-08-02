import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** POST-only so a prefetch or an <img> can't sign someone out. */
export async function POST(request: NextRequest) {
  if (isSupabaseConfigured) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/workspace/login", request.url), {
    status: 303,
  });
}
