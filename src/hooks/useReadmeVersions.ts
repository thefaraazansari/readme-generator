import { useState } from "react";
import { stripFence } from "../lib/ai/buildPrompt";
import { downloadTextFile } from "../utils/downloadFile";
import type { ReadmeGenerator } from "./useReadmeGenerator";
import type { RepoAi } from "./useRepoAi";

export type Version = "auto" | "ai";

export const VERSION_LABELS: Record<Version, string> = { auto: "Auto-generated", ai: "AI-generated" };

/**
 * The auto-generated README and the AI one, kept side by side so they can be
 * compared.
 */
export function useReadmeVersions(g: ReadmeGenerator, ai: RepoAi) {
  const [aiReadme, setAiReadme] = useState("");
  // The snapshot the AI README was written for; a new generation makes a new snapshot, which drops it.
  const [aiFor, setAiFor] = useState<unknown>(null);
  const [version, setVersion] = useState<Version>("auto");

  const hasAi = aiFor !== null && aiFor === g.snapshot && aiReadme !== "";
  const shown: Version = hasAi && version === "ai" ? "ai" : "auto";
  const text = shown === "ai" ? aiReadme : g.generatedReadme;
  const setText = shown === "ai" ? setAiReadme : g.setGeneratedReadme;
  const writing = ai.status === "loading" && ai.kind === "readme";

  const writeReadme = () => {
    g.setViewMode("preview");
    setVersion("ai");
    setAiReadme("");
    setAiFor(null);
    void ai.generateReadme((t) => {
      setAiReadme(stripFence(t));
      setAiFor(g.snapshot);
    });
  };

  // GitHub only renders a README at the repo root named exactly README.md.
  const download = () => downloadTextFile("README.md", text);

  return { hasAi, shown, text, setText, setVersion, writing, writeReadme, download };
}

export type ReadmeVersions = ReturnType<typeof useReadmeVersions>;
