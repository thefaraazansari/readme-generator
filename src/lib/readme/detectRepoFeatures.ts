import type { FileTreeEntry } from "../../services/github";

export interface RepoFeatures {
  /** A Dockerfile at the repo root. */
  hasDockerfile: boolean;
  /** A Docker Compose file at the repo root. */
  hasCompose: boolean;
  /** GitHub Actions workflow file names, likeliest main CI first, e.g. "ci.yml". */
  workflows: string[];
  /** A test folder at the root, or Go test files anywhere. */
  hasTests: boolean;
  /** Path to CONTRIBUTING.md, if the repo has one. */
  contributingPath: string | null;
  /** Path to the license file, if the repo has one. */
  licensePath: string | null;
  /** Top-level folders and files, folders first. */
  topLevel: { dirs: string[]; files: string[] };
}

const COMPOSE_FILES = [
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
  "compose.yaml",
];
const TEST_DIRS = ["test", "tests", "__tests__", "spec"];
/** Matched case-insensitively, since repos use both LICENSE and license. */
const CONTRIBUTING_PATHS = [
  "contributing.md",
  ".github/contributing.md",
  "docs/contributing.md",
];
const LICENSE_FILES = [
  "license",
  "license.md",
  "license.txt",
  "licence",
  "licence.md",
  // Dual-licensed projects (common in Rust)
  "license-mit",
  "license-apache",
];

/** Workflow names most likely to be the main CI, in order of preference. */
const PRIMARY_WORKFLOWS = ["ci", "test", "tests", "build", "main", "node", "release"];

function workflowRank(file: string): number {
  const rank = PRIMARY_WORKFLOWS.indexOf(file.replace(/\.ya?ml$/, "").toLowerCase());
  return rank === -1 ? PRIMARY_WORKFLOWS.length : rank;
}

/** The real path of the first candidate present in the tree, ignoring case. */
function findPath(tree: FileTreeEntry[], candidates: string[]): string | null {
  const byLowerPath = new Map(
    tree.filter((e) => e.type === "blob").map((e) => [e.path.toLowerCase(), e.path]),
  );
  for (const candidate of candidates) {
    const match = byLowerPath.get(candidate);
    if (match) return match;
  }
  return null;
}

/** Dot-folders that are worth showing in a project structure. */
const VISIBLE_DOT_ENTRIES = new Set([".github"]);

const byName = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: "base" });

/** What the repo's file tree says about how it is built, tested and run. */
export function detectRepoFeatures(tree: FileTreeEntry[]): RepoFeatures {
  const paths = new Set(tree.map((entry) => entry.path));
  const isTopLevel = (entry: FileTreeEntry) => !entry.path.includes("/");
  const isVisible = (name: string) =>
    !name.startsWith(".") || VISIBLE_DOT_ENTRIES.has(name);

  const topDirs = tree
    .filter((e) => e.type === "tree" && isTopLevel(e) && isVisible(e.path))
    .map((e) => e.path)
    .sort(byName);
  const topFiles = tree
    .filter((e) => e.type === "blob" && isTopLevel(e) && isVisible(e.path))
    .map((e) => e.path)
    .sort(byName);

  const workflows = tree
    .filter(
      (e) =>
        e.type === "blob" &&
        /^\.github\/workflows\/[^/]+\.ya?ml$/.test(e.path),
    )
    .map((e) => e.path.split("/").pop() as string)
    .sort((a, b) => workflowRank(a) - workflowRank(b) || byName(a, b));

  return {
    hasDockerfile: paths.has("Dockerfile"),
    hasCompose: COMPOSE_FILES.some((file) => paths.has(file)),
    workflows,
    hasTests:
      TEST_DIRS.some((dir) => topDirs.includes(dir)) ||
      tree.some((e) => e.path.endsWith("_test.go")),
    contributingPath: findPath(tree, CONTRIBUTING_PATHS),
    licensePath: findPath(tree, LICENSE_FILES),
    topLevel: { dirs: topDirs, files: topFiles },
  };
}
