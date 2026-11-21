import type { KeyboardEvent } from "react";
import type { ReadmeGenerator, ViewMode } from "../hooks/useReadmeGenerator";
import type { ReadmeVersions } from "../hooks/useReadmeVersions";
import { VERSION_LABELS, type Version } from "../hooks/useReadmeVersions";
import { useRadioKeys } from "../hooks/useRadioKeys";
import type { RepoAi } from "../hooks/useRepoAi";
import { Markdown } from "./Markdown";
import { PREVIEW_CLASSES } from "./previewClasses";
import { Waiting } from "./Waiting";

const VIEW_MODES: ViewMode[] = ["preview", "edit"];
const VERSIONS: Version[] = ["auto", "ai"];

export function ReadmeSheet({
  generator: g,
  ai,
  versions: v,
}: Readonly<{
  generator: ReadmeGenerator;
  ai: RepoAi;
  versions: ReadmeVersions;
}>) {
  const { hasAi, shown, text, setText, setVersion, writing, writeReadme, download } = v;
  const versionKeys = useRadioKeys<Version>(VERSIONS, shown, setVersion);

  /** Arrow keys, Home and End move between the Preview and Edit tabs (they wrap around). */
  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = VIEW_MODES.length - 1;
    const current = VIEW_MODES.indexOf(g.viewMode);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? last
      : e.key === "ArrowRight" ? (current === last ? 0 : current + 1)
      : e.key === "ArrowLeft" ? (current === 0 ? last : current - 1)
      : null;
    if (next === null) return;
    e.preventDefault();
    g.setViewMode(VIEW_MODES[next]);
    e.currentTarget.querySelector<HTMLElement>(`#readme-tab-${VIEW_MODES[next]}`)?.focus();
  };

  return (
    <section
      aria-labelledby="readme-title"
      className="flex min-w-0 flex-col lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid"
    >
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 pb-4">
        <h2 id="readme-title" className="font-semibold text-sm">
          README.md
        </h2>
        {g.status === "success" && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <div role="tablist" aria-label="README view" onKeyDown={onTabKeyDown} className="flex gap-4">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode}
                  id={`readme-tab-${mode}`}
                  type="button"
                  role="tab"
                  aria-selected={g.viewMode === mode}
                  aria-controls="readme-panel"
                  tabIndex={g.viewMode === mode ? 0 : -1}
                  onClick={() => g.setViewMode(mode)}
                  className={`focus-ring min-h-11 text-sm capitalize underline-offset-[6px] ${
                    g.viewMode === mode
                      ? "font-semibold underline decoration-2 decoration-link"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            {ai.canUse && (
              <button
                type="button"
                onClick={writeReadme}
                disabled={ai.status === "loading"}
                className="focus-ring h-11 rounded-full border-2 border-ink px-5 font-semibold text-sm hover:bg-ink hover:text-paper disabled:cursor-wait disabled:opacity-60"
              >
                {writing ? "Writing with AI..." : hasAi ? "Rewrite with AI" : "Create with AI"}
              </button>
            )}
            <button
              type="button"
              onClick={download}
              className="focus-ring h-11 rounded-full bg-primary px-6 font-semibold text-on-primary text-sm hover:bg-primary-hover"
            >
              Download
            </button>
          </div>
        )}
      </div>

      <div className="min-h-128 rounded-sm border border-line bg-sheet shadow-sheet">
        {g.status === "success" && (
          <div className="flex flex-col gap-3 px-6 pt-6 sm:px-12 sm:pt-8">
            {/* Display only: kept outside the markdown, so it never reaches the .md text or download. */}
            {hasAi ? (
              <div
                role="radiogroup"
                aria-label="README version"
                onKeyDown={versionKeys.onKeyDown}
                className="flex flex-wrap gap-2"
              >
                {VERSIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    {...versionKeys.itemProps(v)}
                    onClick={() => setVersion(v)}
                    className={`focus-ring rounded-full px-2.5 py-1 font-semibold text-xs ${
                      shown === v ? "bg-ink text-paper" : "bg-level-1 text-muted hover:text-ink"
                    }`}
                  >
                    {VERSION_LABELS[v]}
                  </button>
                ))}
              </div>
            ) : (
              <span className="w-fit rounded-full bg-level-1 px-2.5 py-1 font-semibold text-ink text-xs">
                {VERSION_LABELS.auto}
              </span>
            )}
            {writing && !hasAi && <Waiting />}
            <p aria-live="polite" className="text-red-600 text-sm empty:hidden">
              {ai.kind === "readme" && ai.error}
            </p>
          </div>
        )}


        {g.status === "success" && (
          // One panel for both tabs. Preview and editor share one grid cell and the inactive one is hidden, so the
          // editor is exactly as tall as the preview. Not a Tab stop: the README text is not interactive.
          <div id="readme-panel" role="tabpanel" aria-labelledby={`readme-tab-${g.viewMode}`} className="grid">
            <div className={`${PREVIEW_CLASSES} col-start-1 row-start-1 ${g.viewMode === "edit" ? "invisible" : ""}`}>
              <Markdown>{text}</Markdown>
            </div>
            <textarea
              aria-label="README markdown"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className={`col-start-1 row-start-1 block h-full w-full resize-none rounded-sm whitespace-pre bg-sheet px-6 py-10 font-mono text-ink text-sm leading-6 focus:outline-2 focus:outline-link focus:-outline-offset-2 sm:px-12 sm:py-14 ${
                g.viewMode === "edit" ? "" : "invisible"
              }`}
            />
          </div>
        )}
      </div>
    </section>
  );
}
