import type { CSSProperties } from "react";
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

/**
 * A contribution-graph band that doubles as the status indicator: empty while
 * idle, a moving wave while loading, filled in once the README is ready.
 * Decorative; the status is announced by StatusText.
 */
export function ContributionGrid({
  status,
  weeks,
}: Readonly<{
  status: Status;
  /** Number of columns; each column is a week of seven cells. */
  weeks: number;
}>) {
  return (
    <div
      aria-hidden="true"
      className="grid w-full grid-flow-col gap-0.5 sm:gap-0.75"
      style={{
        gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${ROWS}, auto)`,
      }}
    >
      {Array.from({ length: weeks * ROWS }, (_, i) => (
        <span
          key={i}
          className={`aspect-square rounded-xs ${
            status === "loading"
              ? "motion-safe:animate-cell-fill"
              : "transition-colors duration-500 motion-reduce:transition-none"
          }`}
          style={cellStyle(i, status)}
        />
      ))}
    </div>
  );
}
