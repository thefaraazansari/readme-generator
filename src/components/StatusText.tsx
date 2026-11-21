import type { ReadmeGenerator } from "../hooks/useReadmeGenerator";
import type { RepoAi } from "../hooks/useRepoAi";

/** Announces progress and completion to screen readers and sighted users. */
export function StatusText({ generator: g, ai }: Readonly<{ generator: ReadmeGenerator; ai: RepoAi }>) {
  return (
    <p aria-live="polite" className="min-h-5 text-muted text-sm">
      {g.status === "loading" &&
        "Fetching repository data and generating README..."}
      {g.status === "success" &&
        (ai.status === "loading"
          ? "AI is working on it. Free models can take up to a minute..."
          : `Generated README for ${g.repoName}`)}
    </p>
  );
}
