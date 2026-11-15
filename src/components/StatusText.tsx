import type { ReadmeGenerator } from "../hooks/useReadmeGenerator";

/** Announces progress and completion to screen readers and sighted users. */
export function StatusText({ generator: g }: Readonly<{ generator: ReadmeGenerator }>) {
  return (
    <p aria-live="polite" className="min-h-5 text-muted text-sm">
      {g.status === "loading" &&
        "Fetching repository data and generating README..."}
      {g.status === "success" && `Generated README for ${g.repoName}`}
    </p>
  );
}
