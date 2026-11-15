/*
 * A faint `git log --graph`: graph on the left, short hashes and messages in a
 * column on the right. The last commit ("docs: add README.md") is dashed until
 * a README is generated, pulses while it is being written, then lands as HEAD.
 * Decorative: render it inside an aria-hidden container.
 */
import type { Status } from "../hooks/useReadmeGenerator";

// Uneven lane spacing and curve lengths, so the graph reads like a real
// history rather than a symmetric diagram.
const X = { main: 20, feat: 54, fix: 108 };
const LABEL_X = 135;

const COMMITS = [
  { x: X.main, y: 20, hash: "a3f65f3", msg: "initial commit" },
  { x: X.main, y: 60, hash: "2b9d1e0", msg: "set up vite and tailwind" },
  { x: X.feat, y: 125, hash: "9c1e2b7", msg: "parse repository url" },
  { x: X.feat, y: 163, hash: "4d8a0f1", msg: "fetch languages and tree" },
  { x: X.fix, y: 202, hash: "e72c9d4", msg: "detect package manager" },
  { x: X.main, y: 238, hash: "5a0c3f9", msg: "fix: trailing slash in url" },
  { x: X.fix, y: 274, hash: "c4a7e19", msg: "support pyproject and cargo" },
  { x: X.feat, y: 332, hash: "b05f6a3", msg: "build readme sections" },
  { x: X.feat, y: 368, hash: "6f2e8ab", msg: "add shields.io badges" },
  { x: X.main, y: 424, hash: "71d3c8e", msg: "merge branch 'generator'" },
  { x: X.main, y: 464, hash: "d91b4c2", msg: "add preview and edit modes" },
];

const README_Y = 514;
const HEIGHT = 534;

export function GitGraph({ status }: Readonly<{ status: Status }>) {
  const done = status === "success";
  const busy = status === "loading";
  return (
    <svg
      viewBox={`0 0 400 ${HEIGHT}`}
      className="h-auto w-full font-readme"
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <g stroke="var(--color-level-1)" strokeWidth="3">
        <path d={`M${X.main} 0V${HEIGHT}`} />
        <path
          d={`M${X.main} 68C${X.main} 104 ${X.feat} 86 ${X.feat} 116V384C${X.feat} 402 ${X.main} 406 ${X.main} 424`}
        />
        <path
          d={`M${X.feat} 172C${X.feat} 184 ${X.fix} 180 ${X.fix} 194V284C${X.fix} 312 ${X.feat} 298 ${X.feat} 324`}
        />
      </g>

      {COMMITS.map((c) => (
        <g key={c.hash}>
          <circle
            cx={c.x}
            cy={c.y}
            r="7"
            fill="var(--color-paper)"
            stroke="var(--color-level-2)"
            strokeWidth="3"
          />
          <text x={LABEL_X} y={c.y + 4} fontSize="12">
            <tspan fill="var(--color-level-3)">{c.hash}</tspan>
            <tspan fill="var(--color-faint)" dx="8">
              {c.msg}
            </tspan>
          </text>
        </g>
      ))}

      <circle
        cx={X.main}
        cy={README_Y}
        r="10"
        fill={done ? "var(--color-level-4)" : "var(--color-paper)"}
        stroke={done ? "var(--color-level-4)" : "var(--color-level-2)"}
        strokeWidth="3"
        strokeDasharray={done ? undefined : "4 4"}
        className={busy ? "motion-safe:animate-pulse" : undefined}
      />
      <text
        x={LABEL_X}
        y={README_Y + 4}
        fontSize="12"
        fontWeight={done ? 700 : 400}
      >
        <tspan fill={done ? "var(--color-level-4)" : "var(--color-level-3)"}>
          {done ? "HEAD   " : "·······"}
        </tspan>
        <tspan fill={done ? "var(--color-ink)" : "var(--color-faint)"} dx="8">
          {busy ? "writing README.md..." : "docs: add README.md"}
        </tspan>
      </text>
    </svg>
  );
}
