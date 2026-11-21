import { useEffect, useState } from "react";
import type { RepoSnapshot } from "../lib/ai/buildPrompt";
import { fetchRecentCommits, type GithubToken, type RecentCommit } from "../services/github";

/** The repo's latest commits, loaded in the background so the README never waits for them. */
export function useRecentCommits(snapshot: RepoSnapshot | null, token: GithubToken): RecentCommit[] {
  const [result, setResult] = useState<{ for: RepoSnapshot; commits: RecentCommit[] } | null>(null);

  useEffect(() => {
    if (!snapshot) return;
    let stale = false;
    void fetchRecentCommits(snapshot.owner, snapshot.repo, token).then((commits) => {
      if (!stale) setResult({ for: snapshot, commits: commits ?? [] });
    });
    return () => {
      stale = true;
    };
  }, [snapshot, token]);

  return result?.for === snapshot ? result.commits : [];
}
