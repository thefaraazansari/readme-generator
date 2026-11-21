export interface LayoutCommit {
  sha: string;
  /** Parent shas, first parent first (the branch the commit was made on). */
  parents: string[];
}

export interface LayoutEdge {
  /** Row 0 is the newest commit; null means the parent is older than the window. */
  parentRow: number | null;
  parentLane: number;
  childRow: number;
  childLane: number;
  /**
   * "fork": the child starts a side branch off its parent. "merge": a side branch joins the child.
   * "stub": a merged branch whose tip is older than the window, so only its joining end is drawn.
   */
  kind: "straight" | "fork" | "merge" | "stub";
}

export interface CommitLayout {
  /** Lane (column) of each commit, in the order given. */
  lanes: number[];
  edges: LayoutEdge[];
  laneCount: number;
}

/**
 * Lay out commits (newest first) the way `git log --graph` does: each commit
 * sits in a lane, branches take a new lane when they split off and give it
 * back when they rejoin. Pure, so it is easy to test.
 */
export function layoutCommits(commits: LayoutCommit[]): CommitLayout {
  // lanes[i] is the sha the lane is waiting for, or null when it is free.
  const expecting: (string | null)[] = [];
  const freeLane = () => {
    const free = expecting.indexOf(null);
    return free === -1 ? expecting.length : free;
  };

  const inWindow = new Set(commits.map((c) => c.sha));
  const lanes: number[] = [];
  const pending: { childRow: number; childLane: number; parent: string; first: boolean; expectedLane: number; stub?: boolean }[] = [];

  commits.forEach((commit, row) => {
    const waiting = expecting.flatMap((sha, lane) => (sha === commit.sha ? [lane] : []));
    const lane = waiting.length > 0 ? waiting[0] : freeLane();
    // Several lanes waiting for the same commit means branches rejoin here.
    waiting.slice(1).forEach((l) => (expecting[l] = null));

    lanes.push(lane);
    expecting[lane] = commit.parents[0] ?? null;

    commit.parents.forEach((parent, i) => {
      if (i === 0) {
        pending.push({ childRow: row, childLane: lane, parent, first: true, expectedLane: lane });
        return;
      }
      // A merged branch from before the window would hold a lane open to the bottom for nothing: draw a stub.
      if (!inWindow.has(parent)) {
        pending.push({ childRow: row, childLane: lane, parent, first: false, expectedLane: lane + 1, stub: true });
        return;
      }
      let expectedLane = expecting.indexOf(parent);
      if (expectedLane === -1) {
        expectedLane = freeLane();
        expecting[expectedLane] = parent;
      }
      pending.push({ childRow: row, childLane: lane, parent, first: false, expectedLane });
    });
  });

  const rowOf = new Map(commits.map((c, row) => [c.sha, row]));
  const edges: LayoutEdge[] = pending.map((p) => {
    const parentRow = rowOf.get(p.parent) ?? null;
    const parentLane = parentRow === null ? p.expectedLane : lanes[parentRow];
    const kind = p.stub ? "stub" : parentLane === p.childLane ? "straight" : p.first ? "fork" : "merge";
    return { parentRow, parentLane, childRow: p.childRow, childLane: p.childLane, kind };
  });

  const laneCount = Math.max(1, ...lanes.map((l) => l + 1), ...edges.map((e) => e.parentLane + 1));
  return { lanes, edges, laneCount };
}
