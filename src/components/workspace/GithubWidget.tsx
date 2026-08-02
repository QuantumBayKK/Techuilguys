import { GitBranch, GitPullRequest, Tag } from "lucide-react";
import { getRepoSnapshot } from "@/lib/workspace/github";
import { relativeTime } from "@/lib/workspace/format";
import { Card, CardHeader } from "./ui/Primitives";

/**
 * Read-only repo pulse. Cached for five minutes at the fetch layer so a busy
 * board doesn't burn the unauthenticated rate limit.
 */
export default async function GithubWidget({ repo }: { repo: string }) {
  const snapshot = await getRepoSnapshot(repo);

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-1.5">
            <GitBranch size={13} />
            <span className="mono truncate">{snapshot.repo}</span>
          </span>
        }
        action={
          <a
            href={`https://github.com/${snapshot.repo}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[var(--ws-accent)] hover:underline"
          >
            Open ↗
          </a>
        }
      />

      {snapshot.error ? (
        <p className="px-5 py-6 text-center text-xs leading-relaxed text-[var(--ws-muted)]">
          {snapshot.error}
        </p>
      ) : (
        <>
          <div className="flex gap-5 border-b border-[var(--ws-line)] px-5 py-3 text-xs">
            <span className="flex items-center gap-1.5 text-[var(--ws-muted)]">
              <GitPullRequest size={13} />
              <span className="mono font-semibold text-[var(--ws-text)]">
                {snapshot.openPrs}
              </span>
              open PR{snapshot.openPrs === 1 ? "" : "s"}
            </span>
            {snapshot.latestRelease ? (
              <span className="flex items-center gap-1.5 text-[var(--ws-muted)]">
                <Tag size={13} />
                <span className="mono font-semibold text-[var(--ws-text)]">
                  {snapshot.latestRelease}
                </span>
              </span>
            ) : null}
          </div>

          <ul className="divide-y divide-[var(--ws-line)]">
            {snapshot.commits.length === 0 ? (
              <li className="px-5 py-6 text-center text-xs text-[var(--ws-muted)]">
                No commits yet.
              </li>
            ) : (
              snapshot.commits.map((commit) => (
                <li key={commit.sha}>
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-2.5 px-5 py-2.5 transition-colors hover:bg-[var(--ws-hover)]"
                  >
                    <span className="mono shrink-0 pt-0.5 text-[11px] text-[var(--ws-accent)]">
                      {commit.sha}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs">{commit.message}</span>
                      <span className="block text-[11px] text-[var(--ws-faint)]">
                        {commit.author ?? "unknown"} · {relativeTime(commit.at)}
                      </span>
                    </span>
                  </a>
                </li>
              ))
            )}
          </ul>

          <p className="border-t border-[var(--ws-line)] px-5 py-2.5 text-[11px] leading-relaxed text-[var(--ws-faint)]">
            Put <span className="mono text-[var(--ws-muted)]">#TASK-12</span> in a
            commit message and the sync on the board moves that task to Review.
          </p>
        </>
      )}
    </Card>
  );
}
