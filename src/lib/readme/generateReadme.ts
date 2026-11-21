import type { FileTreeEntry, RepoMetadata } from "../../services/github";
import {
  runCommandFor,
  type Ecosystem,
  type NodePackageInfo,
  type TechStackSummary,
} from "./detectStack";
import { detectFrameworks } from "./detectFrameworks";
import { detectRepoFeatures, type RepoFeatures } from "./detectRepoFeatures";

export interface ReadmeInput {
  metadata: RepoMetadata;
  techStack: TechStackSummary;
  packageInfo: NodePackageInfo | null;
  tree: FileTreeEntry[];
}

/** Most entries shown in the project structure before it is cut short. */
const MAX_STRUCTURE_ENTRIES = 14;

/** Most scripts listed under Usage; the rest are left to package.json. */
const MAX_USAGE_SCRIPTS = 10;

/** Scripts people run most, listed first under Usage in this order. */
const COMMON_SCRIPTS = ["dev", "start", "serve", "build", "preview", "lint", "format", "typecheck"];

/** Scripts npm runs by itself during install and publish; nobody types these. */
const LIFECYCLE_SCRIPTS = new Set([
  "install",
  "preinstall",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "prepack",
  "postpack",
  "dependencies",
]);

/** npm init's placeholder test script; not a real test command. */
const PLACEHOLDER_TEST_SCRIPT = /no test specified/i;

/** Test commands for repos without a package.json test script. */
const TEST_COMMANDS: Partial<Record<Ecosystem, string>> = {
  python: "pytest",
  rust: "cargo test",
  go: "go test ./...",
  "java-maven": "mvn test",
  "java-gradle": "./gradlew test",
  php: "vendor/bin/phpunit",
};

const bashBlock = (commands: string[]) => ["```bash", ...commands, "```"];

// -------
// Header
// -------

function generateHeader(metadata: RepoMetadata) {
  const lines = [`# ${metadata.name}`, ""];

  if (metadata.description) {
    lines.push(metadata.description, "");
  }

  return lines.join("\n");
}

function generateBadges(
  metadata: RepoMetadata,
  techStack: TechStackSummary,
  features: RepoFeatures,
): string {
  const badges: string[] = [];
  const repo = metadata.fullName;

  // CI status first, since it's the badge people act on.
  const workflow = features.workflows[0];
  if (workflow) {
    const workflowUrl = `https://github.com/${repo}/actions/workflows/${workflow}`;
    const label = workflow.replace(/\.ya?ml$/, "");
    badges.push(`[![${label}](${workflowUrl}/badge.svg)](${workflowUrl})`);
  }

  // shields.io can't read private repos; its badges would say "repo not found".
  if (!metadata.isPrivate) {
    if (techStack.primaryLanguage) {
      badges.push(
        `![Top Language](https://img.shields.io/github/languages/top/${repo})`,
      );
    }

    badges.push(`![Stars](https://img.shields.io/github/stars/${repo})`);

    if (metadata.license) {
      badges.push(`![License](https://img.shields.io/github/license/${repo})`);
    }
  }

  return badges.length > 0 ? `${badges.join(" ")}\n` : "";
}

// -----------
// Tech stack
// -----------

function generateTechStackSection(
  techStack: TechStackSummary,
  packageInfo: NodePackageInfo | null,
): string {
  const frameworks = detectFrameworks(packageInfo);
  if (techStack.languageBreakdown.length === 0 && frameworks.length === 0) {
    return "";
  }

  const lines = ["## Tech Stack", ""];

  lines.push(
    ...techStack.languageBreakdown
      .slice(0, 5)
      .map((lang) => `- ${lang.name} (${lang.percentage.toFixed(1)}%)`),
  );

  if (frameworks.length > 0) {
    if (techStack.languageBreakdown.length > 0) lines.push("");
    lines.push(
      "Built with:",
      "",
      ...frameworks.map((f) => `- [${f.name}](${f.url})`),
    );
  }

  lines.push("");
  return lines.join("\n");
}

// ------------------
// Project structure
// ------------------

function generateStructureSection(
  metadata: RepoMetadata,
  features: RepoFeatures,
): string {
  const entries = [
    ...features.topLevel.dirs.map((dir) => `${dir}/`),
    ...features.topLevel.files,
  ];
  if (entries.length === 0) return "";

  const shown = entries.slice(0, MAX_STRUCTURE_ENTRIES);
  const hidden = entries.length - shown.length;
  if (hidden > 0) shown.push(`... ${hidden} more`);

  const lines = shown.map(
    (entry, i) => `${i === shown.length - 1 ? "└──" : "├──"} ${entry}`,
  );

  return [
    "## Project Structure",
    "",
    "```text",
    `${metadata.name}/`,
    ...lines,
    "```",
    "",
  ].join("\n");
}

// ----------------
// Getting started
// ----------------

function generateGettingStartedSection(
  metadata: RepoMetadata,
  techStack: TechStackSummary,
): string {
  return [
    "## Getting Started",
    "",
    "Clone the repository and install its dependencies:",
    "",
    ...bashBlock([
      `git clone ${metadata.htmlUrl}.git`,
      `cd ${metadata.name}`,
      ...techStack.installCommands,
    ]),
    "",
  ].join("\n");
}

// ------
// Usage
// ------

/** Make a package.json script safe to show inside a Markdown table cell. */
function formatScript(script: string): string {
  const oneLine = script.replace(/\s+/g, " ").trim();
  const short = oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine;
  return short.replace(/`/g, "'").replace(/\|/g, "\\|");
}

function hasRealTestScript(packageInfo: NodePackageInfo | null): boolean {
  const test = packageInfo?.scripts.test;
  return Boolean(test && !PLACEHOLDER_TEST_SCRIPT.test(test));
}

function generateUsageSection(
  techStack: TechStackSummary,
  packageInfo: NodePackageInfo | null,
): string {
  if (!packageInfo) return "";

  const all = packageInfo.scripts;
  // pre<x>/post<x> hooks run automatically around script x.
  const isHook = (name: string) =>
    /^(pre|post)./.test(name) && name.replace(/^(pre|post)/, "") in all;
  const rank = (name: string) => {
    const i = COMMON_SCRIPTS.indexOf(name);
    return i === -1 ? COMMON_SCRIPTS.length : i;
  };

  // A real test script gets its own Testing section, and npm's placeholder
  // isn't worth listing, so "test" is never shown here.
  const names = Object.keys(all)
    .filter((name) => name !== "test" && !LIFECYCLE_SCRIPTS.has(name) && !isHook(name))
    .sort((a, b) => rank(a) - rank(b)); // stable: others keep package.json order
  if (names.length === 0) return "";

  const shown = names.slice(0, MAX_USAGE_SCRIPTS);
  const lines = [
    "## Usage",
    "",
    "| Command | What it runs |",
    "| --- | --- |",
    ...shown.map(
      (name) =>
        `| \`${runCommandFor(techStack.packageManager, name)}\` | \`${formatScript(all[name])}\` |`,
    ),
    "",
  ];

  const hidden = names.length - shown.length;
  if (hidden > 0) {
    lines.push(
      `${hidden} more ${hidden === 1 ? "script is" : "scripts are"} listed in \`package.json\`.`,
      "",
    );
  }

  return lines.join("\n");
}

// -------
// Docker
// -------

function generateDockerSection(
  metadata: RepoMetadata,
  features: RepoFeatures,
): string {
  if (features.hasCompose) {
    return [
      "## Running with Docker",
      "",
      ...bashBlock(["docker compose up --build"]),
      "",
    ].join("\n");
  }

  if (features.hasDockerfile) {
    const image = metadata.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    return [
      "## Running with Docker",
      "",
      ...bashBlock([`docker build -t ${image} .`, `docker run --rm ${image}`]),
      "",
    ].join("\n");
  }

  return "";
}

// --------
// Testing
// --------

function testCommand(
  techStack: TechStackSummary,
  packageInfo: NodePackageInfo | null,
  features: RepoFeatures,
): string | null {
  if (hasRealTestScript(packageInfo)) {
    return runCommandFor(techStack.packageManager, "test");
  }
  if (!features.hasTests) return null;

  for (const ecosystem of techStack.ecosystems) {
    const command = TEST_COMMANDS[ecosystem];
    if (command) return command;
  }
  return null;
}

function generateTestingSection(
  techStack: TechStackSummary,
  packageInfo: NodePackageInfo | null,
  features: RepoFeatures,
): string {
  const command = testCommand(techStack, packageInfo, features);
  if (!command) return "";

  return ["## Testing", "", ...bashBlock([command]), ""].join("\n");
}

// -------------
// Contributing
// -------------

function generateContributingSection(features: RepoFeatures): string {
  if (features.contributingPath) {
    return [
      "## Contributing",
      "",
      `Contributions are welcome. Please read [CONTRIBUTING.md](${features.contributingPath}) before opening a pull request.`,
      "",
    ].join("\n");
  }

  return [
    "## Contributing",
    "",
    "Contributions are welcome:",
    "",
    "1. Fork the repository",
    "2. Create a branch: `git checkout -b feature/your-feature`",
    '3. Commit your changes: `git commit -m "Add your feature"`',
    "4. Push the branch: `git push origin feature/your-feature`",
    "5. Open a pull request",
    "",
  ].join("\n");
}

// --------
// License
// --------

function generateLicenseSection(
  metadata: RepoMetadata,
  features: RepoFeatures,
): string {
  const { license } = metadata;
  const path = features.licensePath;

  if (license) {
    const name = path ? `[${license}](${path})` : license;
    return ["## License", "", `This project is licensed under the ${name}.`, ""].join("\n");
  }
  if (path) {
    return ["## License", "", `See [${path}](${path}).`, ""].join("\n");
  }
  return "";
}

// -------
// README
// -------

export function generateReadme(input: ReadmeInput): string {
  const { metadata, techStack, packageInfo, tree } = input;
  const features = detectRepoFeatures(tree);

  const sections = [
    generateHeader(metadata),
    generateBadges(metadata, techStack, features),
    generateTechStackSection(techStack, packageInfo),
    generateStructureSection(metadata, features),
    generateGettingStartedSection(metadata, techStack),
    generateUsageSection(techStack, packageInfo),
    generateDockerSection(metadata, features),
    generateTestingSection(techStack, packageInfo, features),
    generateContributingSection(features),
    generateLicenseSection(metadata, features),
  ];

  return sections.filter((section) => section.trim() !== "").join("\n");
}
