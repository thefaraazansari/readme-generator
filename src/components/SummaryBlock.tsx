import type { RepoAi } from "../hooks/useRepoAi";
import { Waiting } from "./Waiting";

const GET_KEY_URL = "https://aistudio.google.com/apikey";

/**
 * The AI summary as readable prose: sans-serif, no card. Lines stop at a
 * book-like length unless `wide`, which lets the text run the full section width.
 */
export function SummaryBlock({
  ai,
  geminiKey,
  setGeminiKey,
  wide = false,
}: Readonly<{ ai: RepoAi; geminiKey: string; setGeminiKey: (key: string) => void; wide?: boolean }>) {
  const measure = wide ? "" : "max-w-[68ch]";
  const summarizing = ai.status === "loading" && ai.kind === "summary";
  const paragraphs = ai.summary.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <section aria-labelledby="summary-title" className="flex flex-col gap-4 border-line border-t pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="summary-title" className="font-semibold text-2xl tracking-tight">
          Summary
        </h2>
        {ai.canUse && (
          <button
            type="button"
            onClick={ai.generateSummary}
            disabled={ai.status === "loading"}
            className="focus-ring min-h-11 rounded-sm px-1 text-muted text-sm underline underline-offset-4 hover:text-ink disabled:cursor-wait disabled:no-underline disabled:opacity-60"
          >
            {summarizing ? "Writing..." : "Regenerate"}
          </button>
        )}
      </div>

      {!ai.canUse && (
        <p className={`${measure} text-muted`}>
          AI is only available for public repositories, so private code is never sent to an AI provider.
        </p>
      )}

      {summarizing && !ai.summary && <Waiting />}

      {paragraphs.length > 0 && (
        <div role="region" aria-label="AI summary" className={`flex ${measure} flex-col gap-4 text-body text-lg leading-8`}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      <p aria-live="polite" className="text-error text-sm empty:hidden">
        {ai.kind === "summary" && ai.error}
      </p>

      <details open={ai.status === "error" || undefined} className={`group ${measure} text-sm`}>
        <summary className="focus-ring inline-flex cursor-pointer list-none items-center gap-2 rounded-sm py-2 text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
          <svg
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
            fill="currentColor"
            className="transition-transform group-open:rotate-90 motion-reduce:transition-none"
          >
            <path d="M6 3.5 10.5 8 6 12.5 5 11.5 8.5 8 5 4.5Z" />
          </svg>
          Use your own Gemini key (optional)
          {geminiKey && (
            <span className="rounded-full bg-level-1 px-2 py-0.5 font-semibold text-ink text-xs">Added</span>
          )}
        </summary>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            aria-label="Gemini API key"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value.trim())}
            placeholder="AIza..."
            className="rounded-sm h-11 border-rule border-b-2 bg-transparent font-readme text-ink text-sm placeholder:text-faint focus:border-link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
          />
          <p className="text-faint text-xs leading-relaxed">
            Used when the shared free quota runs out. Sent only to Google, kept in memory until you reload.{" "}
            <a href={GET_KEY_URL} target="_blank" rel="noreferrer" className="focus-ring rounded-sm text-link underline underline-offset-2">
              Get a free key
            </a>
            .
          </p>
        </div>
      </details>
    </section>
  );
}
