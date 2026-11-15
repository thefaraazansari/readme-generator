import type { ReadmeGenerator } from "../hooks/useReadmeGenerator";

export function RepoForm({ generator: g }: Readonly<{ generator: ReadmeGenerator }>) {
  const busy = g.status === "loading";
  const hasError = g.status === "error";

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        g.handleGenerate();
      }}
    >
      <label htmlFor="repo-url" className="font-semibold text-sm">
        GitHub Repository URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
        <input
          id="repo-url"
          type="text"
          inputMode="url"
          autoComplete="url"
          value={g.repoUrl}
          onChange={(e) => g.updateRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          disabled={busy}
          aria-invalid={hasError}
          aria-describedby={hasError ? "repo-url-error" : undefined}
          className="h-12 min-w-0 flex-1 border-rule border-b-2 bg-transparent text-ink text-lg placeholder:text-faint focus:border-link focus:outline-none disabled:text-muted aria-invalid:border-error"
        />
        <button
          type="submit"
          disabled={!g.repoUrl.trim() || busy}
          className="focus-ring h-12 w-full shrink-0 rounded-full bg-primary px-8 font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled sm:w-fit"
        >
          {busy ? "Generating..." : "Generate"}
        </button>
      </div>
      {hasError && (
        <p id="repo-url-error" role="alert" className="text-error text-sm">
          {g.errorMessage}
        </p>
      )}
    </form>
  );
}
