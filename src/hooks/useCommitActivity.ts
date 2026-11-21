import { useEffect, useState } from "react";
import type { RepoSnapshot } from "../lib/ai/buildPrompt";
import { fetchCommitActivity, type CommitWeek, type GithubToken } from "../services/github";

export interface CommitActivity {
  status: "idle" | "loading" | "ready" | "unavailable";
  weeks: CommitWeek[];
}

/**
 * Loads a year of commit counts for the generated repo in the background, so
 * the README never waits for it (GitHub can take a few seconds to compute it).
 */
export function useCommitActivity(snapshot: RepoSnapshot | null, token: GithubToken): CommitActivity {
  const [result, setResult] = useState<{ for: RepoSnapshot; weeks: CommitWeek[] | null } | null>(null);

  useEffect(() => {
    if (!snapshot) return;
    let stale = false;
    void fetchCommitActivity(snapshot.owner, snapshot.repo, token, () => stale).then((weeks) => {
      if (!stale) setResult({ for: snapshot, weeks });
    });
    return () => {
      stale = true;
    };
  }, [snapshot, token]);

  if (!snapshot) return { status: "idle", weeks: [] };
  if (result?.for !== snapshot) return { status: "loading", weeks: [] };
  return result.weeks ? { status: "ready", weeks: result.weeks } : { status: "unavailable", weeks: [] };
}
