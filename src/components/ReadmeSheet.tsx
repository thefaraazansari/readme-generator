import type { ReadmeGenerator, ViewMode } from "../hooks/useReadmeGenerator";
import { Markdown } from "./Markdown";

const VIEW_MODES: ViewMode[] = ["preview", "edit"];

/** The sections generateReadme writes, shown as the empty sheet's outline. */
const SECTIONS = ["Tech Stack", "Getting Started", "Usage", "License"];

const PREVIEW_CLASSES = [
  "prose max-w-none px-6 py-10 font-readme text-[15px] text-body leading-7 sm:px-12 sm:py-14",
  // Headings, with a markdown-style ## marker before h2 (hidden from screen readers)
  "prose-headings:font-bold prose-headings:text-ink prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-xl",
  "prose-h2:before:text-marker prose-h2:before:content-['##_'/_'']",
  // Body text, lists and links
  "prose-p:text-body prose-li:text-body prose-li:marker:text-marker prose-a:text-link prose-strong:text-ink",
  // Inline code: GitHub-style chip, no stray backticks
  "prose-code:rounded prose-code:bg-code prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-[0.85em] prose-code:text-ink",
  "prose-code:before:content-none prose-code:after:content-none [&_code]:font-[inherit]",
  // Code blocks
  "prose-pre:rounded-md prose-pre:bg-pre prose-pre:text-on-pre [&_pre]:font-[inherit] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-on-pre",
  // Badges sit in one row, as on GitHub
  "prose-img:my-0 prose-img:mr-1 prose-img:inline",
  // Tables (Usage): theme borders, and scroll sideways instead of overflowing the sheet
  "prose-table:text-sm prose-th:text-ink prose-thead:border-line prose-tr:border-line",
  "[&_table]:block [&_table]:overflow-x-auto [&_td]:whitespace-nowrap",
].join(" ");

export function ReadmeSheet({ generator: g }: Readonly<{ generator: ReadmeGenerator }>) {
  return (
    <section aria-labelledby="readme-title" className="flex min-w-0 flex-col">
      <div className="flex min-h-11 flex-wrap items-end justify-between gap-3 pb-4">
        <h2 id="readme-title" className="font-semibold text-sm">
          README.md
        </h2>
        {g.status === "success" && (
          <div className="flex items-center gap-5">
            <div className="flex gap-4">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={g.viewMode === mode}
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
            <button
              type="button"
              onClick={g.handleDownload}
              className="focus-ring h-11 rounded-full border-2 border-ink px-5 font-semibold text-sm hover:bg-ink hover:text-paper"
            >
              Download
            </button>
          </div>
        )}
      </div>

      <div className="min-h-128 rounded-sm border border-line bg-sheet shadow-sheet">
        {g.status !== "success" && (
          <div className="flex flex-col gap-10 px-6 py-10 sm:px-12 sm:py-14">
            <div className="h-9 w-2/3 rounded bg-skeleton" />
            {SECTIONS.map((name) => (
              <div key={name} className="flex flex-col gap-3">
                <p className="font-semibold text-faint text-xl">{name}</p>
                <div className="h-3 w-full rounded bg-skeleton" />
                <div className="h-3 w-4/5 rounded bg-skeleton" />
              </div>
            ))}
          </div>
        )}

        {g.status === "success" &&
          (g.viewMode === "preview" ? (
            <div
              role="region"
              aria-label="README preview"
              className={PREVIEW_CLASSES}
            >
              <Markdown>{g.generatedReadme}</Markdown>
            </div>
          ) : (
            <textarea
              aria-label="README markdown"
              value={g.generatedReadme}
              onChange={(e) => g.setGeneratedReadme(e.target.value)}
              spellCheck={false}
              className="block min-h-128 w-full resize-y whitespace-pre bg-sheet px-6 py-10 font-mono text-ink text-sm leading-6 focus:outline-2 focus:outline-link focus:-outline-offset-2 sm:px-12"
            />
          ))}
      </div>
    </section>
  );
}
