// Supabase Edge Function — storage janitor.
//
// Deploy:   supabase functions deploy storage-janitor
// Schedule: weekly, via Database → Cron.
//
// The free Storage tier is 1 GB and nothing here ever deletes an object on its
// own: a message row removed by its author leaves the attachment behind, and a
// file row deleted from the UI leaves the blob. Left alone that quietly fills
// the bucket with objects no row points at.
//
// Deliberately conservative — an object is only removed when BOTH are true:
//   1. no row references its path, and
//   2. it is older than the grace period.
// (2) exists because an upload lands in Storage before its row is inserted; a
// janitor without a grace window would race that and eat live uploads.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const GRACE_HOURS = 24;
const BUCKETS = ["chat-attachments", "project-files"] as const;

Deno.serve(async (req) => {
  if (CRON_SECRET) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const cutoff = Date.now() - GRACE_HOURS * 3_600_000;
  const report: Record<string, { scanned: number; orphans: string[] }> = {};

  for (const bucket of BUCKETS) {
    // Objects are keyed `<parent_id>/<uuid>-<name>`, so listing the top level
    // gives the folders and a second list gives the objects.
    const { data: folders, error: listError } = await supabase.storage
      .from(bucket)
      .list("", { limit: 1000 });

    if (listError) {
      console.error("storage-janitor: list failed", bucket, listError);
      report[bucket] = { scanned: 0, orphans: [] };
      continue;
    }

    const paths: { path: string; createdAt: number }[] = [];
    for (const folder of folders ?? []) {
      const { data: objects } = await supabase.storage
        .from(bucket)
        .list(folder.name, { limit: 1000 });

      for (const object of objects ?? []) {
        paths.push({
          path: `${folder.name}/${object.name}`,
          createdAt: new Date(object.created_at ?? 0).getTime(),
        });
      }
    }

    const referenced = new Set(
      bucket === "chat-attachments"
        ? await column(supabase, "messages", "attachment_path")
        : await column(supabase, "files", "storage_path"),
    );

    const orphans = paths
      .filter((p) => p.createdAt < cutoff && !referenced.has(p.path))
      .map((p) => p.path);

    if (orphans.length > 0 && !dryRun) {
      const { error } = await supabase.storage.from(bucket).remove(orphans);
      if (error) console.error("storage-janitor: remove failed", bucket, error);
    }

    report[bucket] = { scanned: paths.length, orphans };
  }

  return Response.json({ dryRun, graceHours: GRACE_HOURS, report });
});

/**
 * Every non-null value of one column, paged so a big table cannot truncate.
 *
 * Takes a structural slice of the client rather than `SupabaseClient` itself:
 * the concrete generics differ between an untyped `createClient()` and the
 * declared parameter type, and nothing here needs the full surface.
 */
type Queryable = {
  from: (table: string) => {
    select: (columns: string) => {
      not: (
        column: string,
        operator: string,
        value: null,
      ) => {
        range: (
          from: number,
          to: number,
        ) => PromiseLike<{ data: unknown[] | null; error: unknown }>;
      };
    };
  };
};

async function column(
  supabase: Queryable,
  table: string,
  field: string,
): Promise<string[]> {
  const out: string[] = [];
  const PAGE = 1000;

  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from(table)
      .select(field)
      .not(field, "is", null)
      .range(page * PAGE, page * PAGE + PAGE - 1);

    if (error) {
      console.error("storage-janitor: column read failed", table, field, error);
      break;
    }
    const rows = (data ?? []) as unknown as Record<string, string | null>[];
    for (const row of rows) {
      const value = row[field];
      if (value) out.push(value);
    }
    if (rows.length < PAGE) break;
  }

  return out;
}
