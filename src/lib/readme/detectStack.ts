import type { FileTreeEntry, LanguageBreakdown } from "../../services/github";

// -----------------------------
// To get the detected manifests
// -----------------------------

export type Ecosystem =
  | "node"
  | "python"
  | "rust"
  | "go"
  | "ruby"
  | "java-maven"
  | "java-gradle"
  | "php";

export interface DetectedManifest {
  ecosystem: Ecosystem;
  manifestPath: string;
}

// Only checks root-level (or near-root) manifest files, since that's where
// they conventionally live for a project's primary language/stack.
const MANIFEST_PATTERNS: { pattern: RegExp; ecosystem: Ecosystem }[] = [
  { pattern: /^package\.json$/, ecosystem: "node" },
  { pattern: /^requirements\.txt$/, ecosystem: "python" },
  { pattern: /^pyproject\.toml$/, ecosystem: "python" },
  { pattern: /^Cargo\.toml$/, ecosystem: "rust" },
  { pattern: /^go\.mod$/, ecosystem: "go" },
  { pattern: /^Gemfile$/, ecosystem: "ruby" },
  { pattern: /^pom\.xml$/, ecosystem: "java-maven" },
  { pattern: /^build\.gradle(\.kts)?$/, ecosystem: "java-gradle" },
  { pattern: /^composer\.json$/, ecosystem: "php" },
];

export function detectManifests(tree: FileTreeEntry[]): DetectedManifest[] {
  const rootFiles = tree.filter(
    (entry) => entry.type === "blob" && !entry.path.includes("/"),
  );

  const found: DetectedManifest[] = [];

  for (const file of rootFiles) {
    for (const { pattern, ecosystem } of MANIFEST_PATTERNS) {
      if (pattern.test(file.path)) {
        found.push({ ecosystem, manifestPath: file.path });
      }
    }
  }

  return found;
}

// ---------------------------------
// To get and parse the package info
// ---------------------------------

export interface NodePackageInfo {
  name?: string;
  description?: string;
  scripts: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  packageManager?: string; // e.g. "pnpm@8.6.0" if the field is present
}

export function parsePackageJson(rawContent: string): NodePackageInfo | null {
  try {
    const parsed = JSON.parse(rawContent);

    return {
      name: parsed.name,
      description: parsed.description,
      scripts: parsed.scripts ?? {},
      dependencies: Object.keys(parsed.dependencies ?? {}),
      devDependencies: Object.keys(parsed.devDependencies ?? {}),
      packageManager: parsed.packageManager,
    };
  } catch (err) {
    console.error("Failed to parse package.json:", err);
    return null;
  }
}

// -----------------------------
// To detect the package manager
// -----------------------------

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun" | "unknown";

export const LOCKFILE_MAP: { fileName: string; manager: PackageManager }[] = [
  { fileName: "pnpm-lock.yaml", manager: "pnpm" },
  { fileName: "yarn.lock", manager: "yarn" },
  { fileName: "bun.lockb", manager: "bun" },
  { fileName: "package-lock.json", manager: "npm" },
];

export function detectPackageManager(
  tree: FileTreeEntry[],
  packageManagerField?: string,
) {
  if (packageManagerField) {
    const name = packageManagerField.split("@")[0];
    if (
      name === "npm" ||
      name === "yarn" ||
      name === "pnpm" ||
      name === "bun"
    ) {
      return name;
    }
  }

  const rootFiles = rootFileNames(tree);

  for (const { fileName, manager } of LOCKFILE_MAP) {
    if (rootFiles.has(fileName)) {
      return manager;
    }
  }

  return "unknown";
}

/** Names of the files at the repo root. */
export function rootFileNames(tree: FileTreeEntry[]): Set<string> {
  return new Set(
    tree
      .filter((entry) => entry.type === "blob" && !entry.path.includes("/"))
      .map((entry) => entry.path),
  );
}

export function installCommandFor(manager: PackageManager): string {
  switch (manager) {
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn";
    case "bun":
      return "bun install";
    case "npm":
      return "npm install";
    default:
      return "npm install";
  }
}

/** The command that runs a package.json script with the given package manager. */
export function runCommandFor(
  manager: PackageManager | null,
  script: string,
): string {
  switch (manager) {
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    case "bun":
      return `bun run ${script}`;
    default:
      // npm has shortcuts for these two.
      return script === "test" || script === "start"
        ? `npm ${script}`
        : `npm run ${script}`;
  }
}

/** Install commands for one ecosystem, based on the files at the repo root. */
function installCommandsForEcosystem(
  ecosystem: Ecosystem,
  rootFiles: Set<string>,
  packageManager: PackageManager | null,
): string[] {
  switch (ecosystem) {
    case "node":
      return [installCommandFor(packageManager ?? "npm")];
    case "python":
      if (rootFiles.has("uv.lock")) return ["uv sync"];
      if (rootFiles.has("poetry.lock")) return ["poetry install"];
      if (rootFiles.has("requirements.txt"))
        return ["pip install -r requirements.txt"];
      return ["pip install -e ."];
    case "rust":
      return ["cargo build"];
    case "go":
      return ["go mod download"];
    case "ruby":
      return ["bundle install"];
    case "java-maven":
      return [rootFiles.has("mvnw") ? "./mvnw install" : "mvn install"];
    case "java-gradle":
      return [rootFiles.has("gradlew") ? "./gradlew build" : "gradle build"];
    case "php":
      return ["composer install"];
  }
}

// -----------------------------
// To get the tech stack summary
// -----------------------------

export interface TechStackSummary {
  primaryLanguage: string | null;
  languageBreakdown: LanguageBreakdown[];
  ecosystems: Ecosystem[];
  packageManager: PackageManager | null;
  /** One or more commands to install dependencies, in order. */
  installCommands: string[];
}

export function buildTechStackSummary(
  languages: LanguageBreakdown[],
  manifests: DetectedManifest[],
  tree: FileTreeEntry[],
  packageManagerField?: string,
): TechStackSummary {
  const primaryLanguage = languages.length > 0 ? languages[0].name : null;
  // A repo can have several manifests for one ecosystem (e.g. requirements.txt
  // and pyproject.toml); list each ecosystem once.
  const ecosystems = [...new Set(manifests.map((m) => m.ecosystem))];
  const hasNode = ecosystems.includes("node");
  const packageManager = hasNode
    ? detectPackageManager(tree, packageManagerField)
    : null;
  const rootFiles = rootFileNames(tree);

  return {
    primaryLanguage,
    languageBreakdown: languages,
    ecosystems,
    packageManager,
    installCommands: ecosystems.flatMap((ecosystem) =>
      installCommandsForEcosystem(ecosystem, rootFiles, packageManager),
    ),
  };
}
