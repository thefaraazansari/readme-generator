import type { CSSProperties } from "react";
import type { CommitActivity } from "../hooks/useCommitActivity";
import type { Status } from "../hooks/useReadmeGenerator";

const ROWS = 7;

/** Stable pseudo-random level 0–4, weighted toward quieter days like a real graph. */
function cellLevel(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  const f = x - Math.floor(x);
  return f < 0.3 ? 0 : f < 0.55 ? 1 : f < 0.75 ? 2 : f < 0.9 ? 3 : 4;
}

function cellStyle(i: number, status: Status): CSSProperties {
  const level = cellLevel(i);
  return {
    background:
      status === "success"
        ? `var(--color-level-${level})`
        : status === "loading"
          ? "var(--color-level-1)"
          : "var(--color-level-0)",
    transitionDelay: status === "success" ? `${(i % 400) * 3}ms` : undefined,
    animationDelay: `${Math.floor(i / ROWS) * 45 + (i % ROWS) * 20}ms`,
    // Peak colour for the loading wave (see the cell-fill keyframes).
    ["--cell-color" as string]: `var(--color-level-${Math.max(level, 2)})`,
  };
}

const DAY_SECONDS = 86400;

/** Commit count to colour level 0-4, relative to the busiest day shown. */
function countLevel(count: number, max: number) {
  return count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
}

/**
 * A contribution-graph band that doubles as the status indicator: empty while
 * idle, a moving wave while loading. With `activity` it shows the repo's real
 * commits (one cell per day, newest week last) instead of the decorative fill.
 * Decorative for assistive tech; the status is announced by StatusText.
 */
export function ContributionGrid({
  status,
  weeks,
  activity,
}: Readonly<{
  status: Status;
  /** Number of columns; each column is a week of seven cells. */
  weeks: number;
  activity?: CommitActivity;
}>) {
  // The latest `weeks` of real data, padded with empty weeks on the left when the repo is younger.
  const shown = activity?.status === "ready" ? activity.weeks.slice(-weeks) : [];
  const offset = weeks - shown.length;
  const max = Math.max(1, ...shown.flatMap((w) => w.days));
  // Same animation as before: a wave while loading, then a staggered fill. With real data the wave
  // keeps running after the README is ready, until the commits arrive and fill the squares in.
  const phase: Status =
    status === "success" && activity
      ? activity.status === "loading"
        ? "loading"
        : activity.status === "ready"
          ? "success"
          : "initial"
      : status;
  const waiting = phase === "loading";

  return (
    <div
      aria-hidden="true"
      className="grid w-full grid-flow-col gap-0.5 sm:gap-0.75"
      style={{
        gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${ROWS}, auto)`,
      }}
    >
      {Array.from({ length: weeks * ROWS }, (_, i) => {
        const week = shown[Math.floor(i / ROWS) - offset];
        const count = week?.days[i % ROWS] ?? 0;
        const style = cellStyle(i, phase);
        if (activity && phase === "success") style.background = `var(--color-level-${countLevel(count, max)})`;
        const date = week && new Date((week.week + (i % ROWS) * DAY_SECONDS) * 1000);

        return (
          <span
            key={i}
            title={date ? `${count} commit${count === 1 ? "" : "s"} on ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : undefined}
            className={`aspect-square rounded-xs ${
              waiting ? "motion-safe:animate-cell-fill" : "transition-colors duration-500 motion-reduce:transition-none"
            }`}
            style={style}
          />
        );
      })}
    </div>
  );
}
