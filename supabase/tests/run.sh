#!/usr/bin/env bash
# Apply both migrations to a throwaway Postgres and assert the security model.
#
#   ./supabase/tests/run.sh
#
# Needs Docker and nothing else — no Supabase CLI, no local Postgres, no pgTAP.
# Exits non-zero on the first failed assertion, so it drops straight into CI.
set -euo pipefail

CONTAINER="${CONTAINER:-ws-migration-test}"
IMAGE="${IMAGE:-postgres:16-alpine}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Two Windows quirks, both load-bearing:
#   MSYS_NO_PATHCONV stops Git Bash rewriting the container-side /tmp paths;
#   `cd "$ROOT"` + relative sources stops it handing Docker a `/f/…` path that
#   Windows Docker cannot resolve. Harmless on Linux and macOS.
export MSYS_NO_PATHCONV=1
cd "$ROOT"

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

echo "→ starting $IMAGE"
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ws "$IMAGE" >/dev/null

# `pg_isready` goes true against initdb's temporary server, which is then shut
# down before the real one starts — so poll with an actual query instead.
ready=""
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" psql -U postgres -d ws -c 'select 1' >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
[ -n "$ready" ] || { echo "✗ Postgres never came up"; docker logs "$CONTAINER" | tail -20; exit 1; }

# Applies one file, failing loudly. Output is echoed so assertion PASS lines
# are visible; psql's exit status is what decides success.
apply() {
  local label="$1" file="$2" mode="${3:-quiet}" status=0
  docker cp "$file" "$CONTAINER:/tmp/step.sql" >/dev/null

  if [ "$mode" = "loud" ]; then
    # Stream output so the PASS lines are visible, but keep psql's status —
    # letting the trailing echo swallow it would report green on a failure.
    docker exec "$CONTAINER" psql -U postgres -d ws \
      -v ON_ERROR_STOP=1 --quiet --no-psqlrc -f /tmp/step.sql || status=$?
  else
    docker exec "$CONTAINER" psql -U postgres -d ws \
      -v ON_ERROR_STOP=1 --quiet --no-psqlrc -f /tmp/step.sql \
      >/tmp/out 2>&1 || status=$?
    if [ "$status" -ne 0 ]; then cat /tmp/out; fi
  fi

  if [ "$status" -ne 0 ]; then
    echo "✗ $label"
    return "$status"
  fi
  echo "→ $label"
}

# The harness stands in for Supabase's auth/storage schemas. Not idempotent —
# applied exactly once, unlike the migrations.
apply "harness"                    supabase/tests/00_harness.sql
apply "0001_workspace.sql"         supabase/migrations/0001_workspace.sql
apply "0002_collaboration.sql"     supabase/migrations/0002_collaboration.sql

# Re-running must be a no-op. This is what makes it safe to paste a migration
# back into the SQL editor after editing one policy.
apply "0001 re-run (idempotent)"   supabase/migrations/0001_workspace.sql
apply "0002 re-run (idempotent)"   supabase/migrations/0002_collaboration.sql

apply "seed"                       supabase/tests/01_seed.sql

echo "→ assertions"
if apply "assertions" supabase/tests/02_assert.sql loud; then
  echo ""
  echo "✓ all green"
else
  echo ""
  echo "✗ assertions failed"
  exit 1
fi
