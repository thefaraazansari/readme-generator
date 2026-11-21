import { useState } from "react";
import { parseGithubUrl } from "../utils/parseGithubUrl";
import {
  fetchFileContent,
  fetchFileTree,
  fetchLanguages,
  fetchRepoMetadata,
  type GithubToken,
} from "../services/github";
import {
  buildTechStackSummary,
  detectManifests,
  parsePackageJson,
} from "../lib/readme/detectStack";
import { generateReadme } from "../lib/readme/generateReadme";
import type { RepoSnapshot } from "../lib/ai/buildPrompt";

export type ViewMode = "preview" | "edit";
export type Status = "initial" | "loading" | "error" | "success";

/**
 * State and actions for turning a GitHub repository URL into a README.
 * Pass a personal access token to raise the rate limit and read private repos.
 */
export function useReadmeGenerator(token: GithubToken = "") {
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState<Status>("initial");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedReadme, setGeneratedReadme] = useState("");
  const [repoName, setRepoName] = useState("");
  const [snapshot, setSnapshot] = useState<RepoSnapshot | null>(null);

  const updateRepoUrl = (value: string) => {
    setRepoUrl(value);
    // Clear a stale error once the person starts correcting the URL.
    if (status === "error") {
      setStatus("initial");
      setErrorMessage("");
    }
  };

  /** `url` lets a caller generate right after setting the URL, before state has updated. */
  const handleGenerate = async (url: string = repoUrl) => {
    const result = parseGithubUrl(url);

    if (!result.success || !result.data) {
      setStatus("error");
      setErrorMessage(result.error ?? "Invalid URL.");
      return;
    }

    const { owner, repo } = result.data;

    setStatus("loading");
    setErrorMessage("");
    setGeneratedReadme("");

    try {
      // Metadata first, because the file tree needs the default branch.
      const metadata = await fetchRepoMetadata(owner, repo, token);

      // These two don't depend on each other, so fetch them in parallel.
      const [languages, tree] = await Promise.all([
        fetchLanguages(owner, repo, token),
        fetchFileTree(owner, repo, metadata.defaultBranch, token),
      ]);

      const manifests = detectManifests(tree);
      const nodeManifest = manifests.find((m) => m.ecosystem === "node");

      let packageInfo = null;
      if (nodeManifest) {
        const rawPackageJson = await fetchFileContent(
          owner,
          repo,
          nodeManifest.manifestPath,
          token,
        );
        if (rawPackageJson) {
          packageInfo = parsePackageJson(rawPackageJson);
        }
      }

      const techStack = buildTechStackSummary(
        languages,
        manifests,
        tree,
        packageInfo?.packageManager,
      );

      const readme = generateReadme({ metadata, techStack, packageInfo, tree });

      setGeneratedReadme(readme);
      setRepoName(metadata.name);
      setSnapshot({ owner, repo, metadata, languages, tree });
      setStatus("success");
    } catch (err) {
      console.error("Generation failed:", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  };

  return {
    repoUrl,
    updateRepoUrl,
    status,
    viewMode,
    setViewMode,
    errorMessage,
    generatedReadme,
    setGeneratedReadme,
    repoName,
    snapshot,
    handleGenerate,
  };
}

export type ReadmeGenerator = ReturnType<typeof useReadmeGenerator>;
