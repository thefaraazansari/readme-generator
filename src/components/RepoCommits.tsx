import { layoutCommits, type LayoutEdge } from "../lib/graph/layoutCommits";
import type { RecentCommit } from "../services/github";

/*
 * The repo's real latest commits drawn like `git log --graph`: branches split off into
 * their own lane and rejoin where the history really merges. Oldest at the
 * top, newest below, ending with the generated "docs: add README.md" as HEAD.
 */
const LANE_X = [20, 54, 108, 150, 190];
const GAP = 40;
const CURVE = 30;
const STUB = 14;
const TOP = 20;
const CHAR_WIDTH = 7.5;

const laneX = (lane: number) => LANE_X[Math.min(lane, LANE_X.length - 1)];

function shorten(message: string, max: number) {
  return message.length > max ? `${message.slice(0, max - 1)}…` : message;
}

/** The line for one parent link; the parent is above (older), the child below. */
function edgePath(e: LayoutEdge, rowY: (row: number) => number) {
  const xp = laneX(e.parentLane);
  const xc = laneX(e.childLane);
  const yp = e.parentRow === null ? 0 : rowY(e.parentRow);
  const yc = rowY(e.childRow);
  if (e.kind === "stub") return `M${xp} ${yc - CURVE - STUB}V${yc - CURVE}C${xp} ${yc - CURVE / 2} ${xc} ${yc - CURVE / 2} ${xc} ${yc}`;
  if (xp === xc) return `M${xp} ${yp}V${yc}`;
  // Fork: leave the parent's lane right away. Merge: stay in the branch's lane, then curve into the child.
  if (e.kind === "fork") return `M${xp} ${yp}C${xp} ${yp + CURVE / 2} ${xc} ${yp + CURVE / 2} ${xc} ${yp + CURVE}V${yc}`;
  return `M${xp} ${yp}V${yc - CURVE}C${xp} ${yc - CURVE / 2} ${xc} ${yc - CURVE / 2} ${xc} ${yc}`;
}

export function RepoCommits({ commits }: Readonly<{ commits: RecentCommit[] }>) {
  if (commits.length === 0) return null;

  const { lanes, edges, laneCount } = layoutCommits(commits);
  const n = commits.length;
  // Row 0 is the newest commit and goes at the bottom.
  const rowY = (row: number) => TOP + (n - 1 - row) * GAP;
  const readmeY = TOP + n * GAP;
  const height = readmeY + 20;
  const labelX = Math.max(47, laneX(laneCount - 1) + 27);
  const maxMessage = Math.floor((400 - labelX - 7 * CHAR_WIDTH - 8) / CHAR_WIDTH) - 1;
  const summary = [...commits]
    .reverse()
    .map((c) => `${c.sha.slice(0, 7)} ${c.message}${c.parents.length > 1 ? " (merge)" : ""}`)
    .join("; ");

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-faint text-xs">Latest commits</figcaption>
      <svg
        viewBox={`0 0 400 ${height}`}
        className="h-auto w-full font-readme"
        fill="none"
        strokeLinecap="round"
        role="img"
        aria-label={`Latest ${n} commits, oldest first: ${summary}. Then the generated commit: docs: add README.md.`}
      >
        <g stroke="var(--color-level-1)" strokeWidth="3">
          {edges.map((e, i) => (
            <path key={i} d={edgePath(e, rowY)} />
          ))}
          {/* The newest commit leads into the generated README commit. */}
          <path d={`M${laneX(lanes[0])} ${rowY(0)}V${readmeY}`} />
        </g>

        {commits.map((c, row) => {
          const y = rowY(row);
          return (
            <g key={c.sha}>
              <circle cx={laneX(lanes[row])} cy={y} r="7" fill="var(--color-paper)" stroke="var(--color-level-2)" strokeWidth="3" />
              <text x={labelX} y={y + 4} fontSize="12">
                {/* The link green, not a graph shade: the shades are too light for text on the light page. */}
                <tspan fill="var(--color-link)">{c.sha.slice(0, 7)}</tspan>
                <tspan fill="var(--color-faint)" dx="8">
                  {shorten(c.message, maxMessage)}
                </tspan>
              </text>
            </g>
          );
        })}

        <circle cx={laneX(lanes[0])} cy={readmeY} r="10" fill="var(--color-level-4)" stroke="var(--color-level-4)" strokeWidth="3" />
        <text x={labelX} y={readmeY + 4} fontSize="12" fontWeight={700}>
          <tspan fill="var(--color-level-4)">HEAD</tspan>
          <tspan fill="var(--color-ink)" dx="14">
            docs: add README.md
          </tspan>
        </text>
      </svg>
    </figure>
  );
}
