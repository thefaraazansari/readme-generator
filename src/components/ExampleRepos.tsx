import type { ReadmeGenerator } from "../hooks/useReadmeGenerator";

const EXAMPLES = ["sindresorhus/is-plain-obj", "expressjs/express", "vitejs/vite"];

/** One-click starting points for someone with no repo in mind. */
export function ExampleRepos({ generator: g }: Readonly<{ generator: ReadmeGenerator }>) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Try one:</span>
      {EXAMPLES.map((repo) => (
        <button
          key={repo}
          type="button"
          disabled={g.status === "loading"}
          onClick={() => {
            const url = `https://github.com/${repo}`;
            g.updateRepoUrl(url);
            void g.handleGenerate(url);
          }}
          className="focus-ring h-9 rounded-full border border-line px-3.5 font-readme text-body text-xs hover:border-ink hover:text-ink disabled:opacity-60"
        >
          {repo}
        </button>
      ))}
    </div>
  );
}
