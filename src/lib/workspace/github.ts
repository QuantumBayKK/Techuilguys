import "server-only";

/**
 * Read-only GitHub. A fine-grained PAT in `GITHUB_TOKEN` (contents:read,
 * pull-requests:read) is all this needs; without one, public repos still work
 * at 60 req/hr and the widget degrades to an empty state rather than an error.
 */
const API = "https://api.github.com";

export type Commit = {
  sha: string;
  message: string;
  author: string | null;
  avatar: string | null;
  url: string;
  at: string;
};

export type RepoSnapshot = {
  repo: string;
  commits: Commit[];
  openPrs: number;
  latestRelease: string | null;
  error: string | null;
};

async function gh<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      // Free-tier friendly: one call per repo per 5 minutes, not per page view.
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getRepoSnapshot(repo: string): Promise<RepoSnapshot> {
  const clean = repo.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").trim();

  if (!/^[\w.-]+\/[\w.-]+$/.test(clean)) {
    return {
      repo: clean,
      commits: [],
      openPrs: 0,
      latestRelease: null,
      error: "Repo should look like owner/name.",
    };
  }

  type RawCommit = {
    sha: string;
    html_url: string;
    commit: { message: string; author: { name: string; date: string } | null };
    author: { login: string; avatar_url: string } | null;
  };

  const [commits, prs, release] = await Promise.all([
    gh<RawCommit[]>(`/repos/${clean}/commits?per_page=10`),
    gh<{ total_count: number }>(
      `/search/issues?q=${encodeURIComponent(`repo:${clean} is:pr is:open`)}&per_page=1`,
    ),
    gh<{ tag_name: string }>(`/repos/${clean}/releases/latest`),
  ]);

  if (!commits) {
    return {
      repo: clean,
      commits: [],
      openPrs: 0,
      latestRelease: null,
      error: process.env.GITHUB_TOKEN
        ? "Couldn't reach that repo — check the name and the token's access."
        : "Couldn't reach that repo. Private repos need GITHUB_TOKEN set.",
    };
  }

  return {
    repo: clean,
    openPrs: prs?.total_count ?? 0,
    latestRelease: release?.tag_name ?? null,
    error: null,
    commits: commits.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0],
      author: c.author?.login ?? c.commit.author?.name ?? null,
      avatar: c.author?.avatar_url ?? null,
      url: c.html_url,
      at: c.commit.author?.date ?? new Date().toISOString(),
    })),
  };
}

/** `#TASK-123` anywhere in a commit message. */
export function taskRefsIn(messages: string[]): number[] {
  const refs = new Set<number>();
  for (const message of messages) {
    for (const match of message.matchAll(/#TASK-(\d+)/gi)) {
      refs.add(Number(match[1]));
    }
  }
  return [...refs];
}
