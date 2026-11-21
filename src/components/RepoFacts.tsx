import type { RepoSnapshot } from "../lib/ai/buildPrompt";
import { roundToTotal } from "../lib/roundToTotal";

const SHOWN_LANGUAGES = 3;
const BAR_COLORS = ["var(--color-level-4)", "var(--color-level-3)", "var(--color-level-2)"];
const OTHER_COLOR = "var(--color-faint)";

/** Facts read from the repo itself (no invented data): description, stats, languages. */
export function RepoFacts({ snapshot }: Readonly<{ snapshot: RepoSnapshot }>) {
  const { metadata: m, languages } = snapshot;

  // The top languages, then everything else as "Other"; the shown numbers add up to exactly 100.0.
  const top = languages.slice(0, SHOWN_LANGUAGES);
  const otherBytes = languages.slice(SHOWN_LANGUAGES).reduce((sum, l) => sum + l.percentage, 0);
  const parts = [
    ...top.map((l, i) => ({ name: l.name, raw: l.percentage, color: BAR_COLORS[i] })),
    ...(otherBytes > 0 ? [{ name: "Other", raw: otherBytes, color: OTHER_COLOR }] : []),
  ];
  const total = parts.reduce((sum, p) => sum + p.raw, 0);
  const rounded = roundToTotal(parts.map((p) => (p.raw / total) * 100));
  const segments = total > 0 ? parts.map((p, i) => ({ ...p, pct: rounded[i], width: (p.raw / total) * 100 })) : [];

  return (
    <aside aria-labelledby="facts-title" className="flex flex-col gap-6 rounded-md border border-line bg-sheet p-5">
      <div className="flex flex-col gap-1.5">
        <h2 id="facts-title" className="break-words font-semibold text-lg">
          {m.fullName}
        </h2>
        <p className="text-muted text-sm leading-6">{m.description ?? "No description on GitHub."}</p>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        {[
          ["Stars", m.stargazersCount.toLocaleString()],
          ["License", m.license ?? "None"],
          ["Branch", m.defaultBranch],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-muted text-xs">{label}</dt>
            <dd className="truncate font-semibold" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {segments.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-sm">Languages</h3>
          <div role="img" aria-label="Language breakdown" className="flex h-2 overflow-hidden rounded-full bg-skeleton">
            {segments.map((s) => (
              <span key={s.name} style={{ width: `${s.width}%`, background: s.color }} />
            ))}
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            {segments.map((s) => (
              <li key={s.name} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: s.color }} />
                <span className="flex-1">{s.name}</span>
                <span className="text-muted tabular-nums">{s.pct.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </aside>
  );
}
