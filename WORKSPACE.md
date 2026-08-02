# TechuilaGuys Workspace

Client-facing project workspace living at **`/workspace`**, inside the same
Next.js app as the marketing site. Admins and employees run builds; clients
track only their own. Zero recurring cost on free tiers.

The marketing site is untouched apart from one addition: a **Client login**
button in the top nav next to *Hire us*.

---

## 1. What's here

```
/                                    marketing site (unchanged)
/workspace                           role router — sends you where you belong
/workspace/login                     Google OAuth + email magic link
/workspace/pending                   holding screen for unapproved signups

Internal (admin + employee)
/workspace/dashboard                 queues, health, utilization, neglect warnings
/workspace/projects                  all projects
/workspace/projects/new              create (admin)
/workspace/projects/[slug]           overview, settings, team, GitHub pulse
             …/board                 realtime Kanban, drag-drop, client_visible toggle
             …/milestones            create / status / delete
             …/updates               composer + feed
             …/files                 deliverables, visibility toggle
             …/notes                 internal-only comment stream
             …/docs                  rendered Notion page
/workspace/requests                  client intake queue
/workspace/time                      timer, manual entry, weekly timesheet
/workspace/admin/people              role assignment + approval gate (admin)
/workspace/admin/organizations       client orgs + logos (admin)
/workspace/admin/audit               audit log (admin)
/workspace/notifications             full inbox
/workspace/settings                  your profile

Client
/workspace/portal                    your projects (auto-enters if you have one)
/workspace/portal/[slug]             progress ring, next milestone, activity, team
             …/timeline              vertical timeline + Approve
             …/updates               changelog + inline comments
             …/files                 deliverables + download-all zip
             …/requests              request box + your own status pipeline

/api/cron/digest                     9am daily email digest (Vercel Cron)
```

---

## 2. Setup

### 2.1 Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. SQL Editor → paste **all** of `supabase/migrations/0001_workspace.sql` → Run.
   That creates the schema, every RLS policy, the triggers, the RPCs, the
   `project-files` storage bucket and its policies, and enables Realtime.
3. Authentication → Providers → **Google**: enable it, paste your Google OAuth
   client ID and secret.
4. Authentication → URL Configuration → add redirect URLs:
   - `http://localhost:3000/workspace/auth/callback`
   - `https://your-domain.com/workspace/auth/callback`

### 2.2 Google OAuth

Google Cloud Console → Credentials → OAuth client (Web application):

- Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`

### 2.3 Environment

Copy `.env.example` → `.env.local` and fill it in. On Vercel, add the same keys
under Project → Settings → Environment Variables.

| Variable | Required | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Without it `/workspace` shows a setup notice |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Browser + server client, always behind RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | for digest | Cron only — reads across all users |
| `NEXT_PUBLIC_SITE_URL` | prod | Absolute links in emails |
| `RESEND_API_KEY` | optional | Email. Without it, in-app notifications still work |
| `RESEND_FROM` | optional | Verified sender |
| `GITHUB_TOKEN` | optional | Private repos in the commit widget |
| `NOTION_TOKEN` | optional | Docs tab |
| `CRON_SECRET` | optional | Guards `/api/cron/digest` |

### 2.4 First run

```bash
npm install
npm run dev          # http://localhost:3000
```

Go to `/workspace`, sign in with Google. **The first account ever created
becomes an admin automatically** — every account after that lands in `pending`
until an admin grants access at `/workspace/admin/people`.

Then, in order: create an organization → create a project → add milestones →
invite the client and link them to that organization.

---

## 3. The security model

Multi-tenancy is enforced in **Postgres, not React**. A bug in a component
cannot leak Client A's data to Client B, because the database returns zero rows.

| Table | Client sees | Employee sees | Admin sees |
| --- | --- | --- | --- |
| `projects` | own org only | all | all |
| `tasks` | own org **and** `client_visible` | all | all |
| `comments` | `internal_only = false` | all | all |
| `files` | own org **and** `client_visible` | all | all |
| `time_logs` | **nothing** | own rows only | all |
| `updates` / `milestones` | own org | all | all |
| `audit_log` | nothing | nothing | read-only |

Supporting mechanisms:

- **`current_role_of()` / `current_org_of()` / `is_staff()`** are `SECURITY
  DEFINER` so the policy on `profiles` can call them without recursing.
- **`guard_profile_privileges`** trigger silently reverts any `role` or
  `organization_id` change made by a non-admin, so "edit your own profile"
  can't become privilege escalation.
- **`approve_milestone`** is the only write path a client has into
  `milestones`, and it only moves `done → approved`.
- **`workspace_search`** is `SECURITY INVOKER`, so ⌘K results are RLS-filtered —
  a client cannot surface another org's project however they phrase the query.
- **`audit_log`** has a read policy and no insert policy. Only the `SECURITY
  DEFINER` triggers can write to it.
- Storage bucket is **private**; downloads go through 10-minute signed URLs.

Worth verifying yourself before trusting it with a real client: sign in as a
second Google account, have an admin make it a client of Org A, then try to
open Org B's project slug directly. You should get a 404, not a redirect.

---

## 4. Free-tier discipline

| Limit | Ceiling | How this stays under |
| --- | --- | --- |
| Supabase Storage 1 GB | ~100 files | 10 MB per-file cap in the UI *and* on the bucket; code in GitHub, big assets linked to Drive |
| Resend 100/day | ~25 accounts | Only approvals and new requests email immediately; everything else batches into the 9am digest |
| Supabase Realtime 200 concurrent | not reachable | ~25 accounts, one socket per browser (singleton client) |
| GitHub API 60/hr unauthenticated | busy board | Repo fetches cached 5 minutes at the fetch layer |
| Supabase DB 500 MB | years away | Prune `audit_log` if it ever matters |

### Vercel Hobby

The PRD flagged this and it's still the one real risk: Vercel's Hobby plan
prohibits commercial use, and a client-facing portal leans commercial. This
deploys to the existing Vercel project because that's where the site already
lives. Two ways out when you want to be strictly safe:

1. Upgrade to Vercel Pro, or
2. Deploy to **Cloudflare Workers** via OpenNext — same code, no commercial
   restriction. Nothing here is Vercel-specific except `vercel.json`'s cron,
   which becomes a Cloudflare Cron Trigger hitting the same route.

---

## 5. Deliberate scope choices

- **No shadcn/ui.** The site already has a token system (`--ws-*` in
  `globals.css`); running the shadcn CLI would have rewritten the global
  stylesheet the marketing site depends on. Primitives are hand-built in
  `components/workspace/ui/` against those tokens.
- **GitHub sync is a button, not a webhook.** `#TASK-12` in a commit message
  moves task 12 to Review when you press *Sync* on the board. A webhook would
  mean a public endpoint to secure and a secret to rotate, for a feature you'll
  use a few times a week.
- **Notion is read-only** and covers the block types that appear in specs
  (headings, lists, to-dos, quotes, callouts, code, dividers). Tables, embeds
  and databases render as plain text or are skipped.
- **Board drag-drop is desktop-first.** On mobile the columns scroll
  horizontally and cards open for editing on tap — dragging fights the scroll.
- **Types are hand-maintained** in `lib/workspace/database.types.ts` rather than
  generated, so the repo has no Supabase CLI dependency. Change the migration
  and that file in the same commit.
- **Excluded per the PRD**: invoicing, contracts/e-sign, scheduling,
  WhatsApp/Slack, per-project granular permissions, multi-language,
  white-labeling for resale.

---

## 6. Known gaps

- **ESLint doesn't run** in this repo — `next/typescript` via `FlatCompat`
  throws `Converting circular structure to JSON` on ESLint 9.39. This predates
  the workspace; `npm run build` typechecks cleanly regardless.
- **No automated tests.** The RLS policies are the thing most worth testing;
  the manual check in §3 is the current substitute.
- **Approval emails are best-effort.** A Resend outage logs and moves on rather
  than rolling back the database write — the in-app notification still lands.
