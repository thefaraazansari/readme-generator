import type { FileTreeEntry, LanguageBreakdown, RepoMetadata } from "../../services/github";

export interface RepoSnapshot {
  owner: string;
  repo: string;
  metadata: RepoMetadata;
  languages: LanguageBreakdown[];
  tree: FileTreeEntry[];
}

export interface RepoContext extends RepoSnapshot {
  readme: string | null;
  files: { path: string; content: string }[];
}

const IGNORED = /(^|\/)(node_modules|dist|build|\.git|\.next|vendor|__pycache__)(\/|$)|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.DS_Store)$/;
const MAX_TREE_LINES = 250;
const MAX_FILE_CHARS = 4000;
const MAX_README_CHARS = 8000;

// Highest priority first: manifests, then likely entry points.
const KEY_FILES = [
  /^package\.json$/, /^pyproject\.toml$/, /^Cargo\.toml$/, /^go\.mod$/, /^pom\.xml$/, /^requirements\.txt$/,
  /^src\/(main|index)\.[jt]sx?$/, /^src\/App\.[jt]sx$/, /^(main|app|server|index)\.(py|js|ts)$/, /^(cmd\/.*\/)?main\.go$/, /^src\/main\.rs$/,
];

/** Paths worth reading for context, at most `limit`. */
export function pickKeyFiles(tree: FileTreeEntry[], limit = 5): string[] {
  const files = tree.filter((e) => e.type === "blob").map((e) => e.path);
  const picked: string[] = [];
  for (const pattern of KEY_FILES) {
    const hit = files.find((p) => pattern.test(p) && !picked.includes(p));
    if (hit) picked.push(hit);
    if (picked.length === limit) break;
  }
  return picked;
}

function describeTree(tree: FileTreeEntry[]): string {
  const paths = tree.filter((e) => !IGNORED.test(e.path)).map((e) => (e.type === "tree" ? `${e.path}/` : e.path));
  const extra = paths.length - MAX_TREE_LINES;
  return paths.slice(0, MAX_TREE_LINES).join("\n") + (extra > 0 ? `\n... and ${extra} more` : "");
}

export type AiKind = "summary" | "readme";

const TASKS: Record<AiKind, string> = {
  summary: `Write a short summary of this repository as one or two plain paragraphs of prose, for someone new to it. Cover what it is, who it is for, what it can do, and roughly how it is built. Do not use headings, bullet points, numbered lists, tables or code blocks, and do not give install or run steps. Base every claim on the data below; if something is not shown, leave it out instead of guessing.`,
  readme: `Write a complete, accurate README.md for this repository: title, short description, features, tech stack, getting started, usage, and license if known. Base every claim on the data below and do not invent commands, features or badges. Output only the Markdown, with no surrounding code fence and no commentary.`,
};

/** The License section is fixed so it always reads as a sentence, like the auto-generated README. */
function licenseRule(license: string | null): string {
  return license
    ? `The README must end with a "## License" section whose only text is exactly: "This project is licensed under the ${license}." Do not shorten it to just the license name.`
    : `The license is not known, so leave out the License section.`;
}

export function buildPrompt(kind: AiKind, c: RepoContext): string {
  const { metadata: m } = c;
  const langs = c.languages.slice(0, 6).map((l) => `${l.name} ${l.percentage.toFixed(0)}%`).join(", ");
  const files = c.files.map((f) => `### ${f.path}\n${f.content.slice(0, MAX_FILE_CHARS)}`).join("\n\n");

  return [
    TASKS[kind],
    kind === "readme" ? licenseRule(m.license) : "",
    `## Repository: ${m.fullName}`,
    `Description: ${m.description ?? "none"}`,
    `Topics: ${m.topics.join(", ") || "none"}`,
    `License: ${m.license ?? "none"}`,
    `Languages: ${langs || "unknown"}`,
    `## File tree\n${describeTree(c.tree)}`,
    c.readme ? `## Existing README\n${c.readme.slice(0, MAX_README_CHARS)}` : "## Existing README\nnone",
    files ? `## Key files\n${files}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Models sometimes wrap the whole README in a ```markdown fence. */
export function stripFence(text: string): string {
  return text.replace(/^\s*```(?:markdown|md)?\n/, "").replace(/\n```\s*$/, "");
}
