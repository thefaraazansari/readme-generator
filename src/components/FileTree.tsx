import type { ReadmeGenerator } from "../hooks/useReadmeGenerator";

const FILES = [
  "├── .github/",
  "├── src/",
  "│   └── index.ts",
  "├── package.json",
  "├── LICENSE",
];

/**
 * A small repo file tree whose README.md line goes from missing, to writing,
 * to new. Decorative: render it inside an aria-hidden container.
 */
export function FileTree({
  generator: g,
}: Readonly<{ generator: ReadmeGenerator }>) {
  const done = g.status === "success";
  const busy = g.status === "loading";

  return (
    <div className="w-75 rounded-md border border-line bg-sheet px-5 py-4 font-readme text-[13px] leading-6 shadow-sheet">
      <p className="font-bold text-ink">{done ? g.repoName : "your-repo"}/</p>
      {FILES.map((line) => (
        <p key={line} className="whitespace-pre text-muted">
          {line}
        </p>
      ))}
      <p className="flex items-center gap-2 whitespace-pre">
        <span className="text-muted">└── </span>
        <span
          className={`rounded px-1.5 ${
            done
              ? "bg-level-1 font-bold text-ink"
              : "border border-faint border-dashed text-faint"
          } ${busy ? "motion-safe:animate-pulse" : ""}`}
        >
          README.md
        </span>
        <span className={done ? "text-marker" : "text-faint"}>
          {done ? "# new" : busy ? "# writing" : "# missing"}
        </span>
      </p>
    </div>
  );
}
