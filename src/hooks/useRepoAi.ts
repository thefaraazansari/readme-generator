import { useEffect, useRef, useState } from "react";
import { buildPrompt, pickKeyFiles, type AiKind, type RepoContext, type RepoSnapshot } from "../lib/ai/buildPrompt";
import { streamAi } from "../services/ai";
import { fetchExistingReadme, fetchFileContent, type GithubToken } from "../services/github";

export type AiStatus = "idle" | "loading" | "done" | "error";

/**
 * AI summary and README for the last generated repo. `apiKey` is the person's
 * own Gemini key; without one the shared Worker is used.
 */
export function useRepoAi(snapshot: RepoSnapshot | null, token: GithubToken, apiKey: string) {
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<AiStatus>("idle");
  const [error, setError] = useState("");
  const [kind, setKind] = useState<AiKind>("summary"); // what the latest run was for
  const abort = useRef<AbortController | null>(null);
  const cache = useRef<{ snapshot: RepoSnapshot; context: RepoContext } | null>(null);

  // A new repo makes the old summary stale.
  const [summaryFor, setSummaryFor] = useState<RepoSnapshot | null>(null);
  if (summaryFor !== snapshot) {
    setSummaryFor(snapshot);
    setSummary("");
    setStatus("idle");
    setError("");
  }

  /** Fetch the extra files once per repo; reused by both summary and README. */
  const loadContext = async (s: RepoSnapshot): Promise<RepoContext> => {
    if (cache.current?.snapshot === s) return cache.current.context;
    const [readme, files] = await Promise.all([
      fetchExistingReadme(s.owner, s.repo, token),
      Promise.all(
        pickKeyFiles(s.tree).map(async (path) => ({
          path,
          content: (await fetchFileContent(s.owner, s.repo, path, token)) ?? "",
        })),
      ),
    ]);
    const context = { ...s, readme: readme?.content ?? null, files: files.filter((f) => f.content) };
    cache.current = { snapshot: s, context };
    return context;
  };

  const run = async (kind: AiKind, sink: (text: string) => void) => {
    if (!snapshot || snapshot.metadata.isPrivate) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;

    setKind(kind);
    setStatus("loading");
    setError("");
    try {
      const context = await loadContext(snapshot);
      await streamAi(buildPrompt(kind, context), { apiKey, signal: controller.signal, onText: sink });
      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const generateSummary = () => {
    setSummary(""); // so the loader shows again on regenerate
    return run("summary", setSummary);
  };

  // The summary starts by itself whenever a new repo has been generated.
  useEffect(() => {
    // Deferred so the state updates happen in a callback, not in the effect body.
    if (snapshot) queueMicrotask(() => void generateSummary());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  return {
    summary,
    status,
    error,
    kind,
    canUse: snapshot !== null && !snapshot.metadata.isPrivate,
    generateSummary,
    generateReadme: (sink: (text: string) => void) => run("readme", sink),
  };
}

export type RepoAi = ReturnType<typeof useRepoAi>;
