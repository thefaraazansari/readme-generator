import { useEffect, useState } from "react";

function waitingMessage(seconds: number): string {
  if (seconds < 4) return "Reading the repository...";
  if (seconds < 15) return "Sending it to the AI...";
  if (seconds < 40) return "The AI is thinking. Free models can be slow...";
  return "Still working. Busy models can take a minute or more...";
}

/** 9 -> "9s", 75 -> "1m 15s". */
function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

/** Spinner and a changing message while the AI hasn't produced any text yet. */
export function Waiting() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div role="status" className="flex items-center gap-3 text-muted text-sm">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-line border-t-link motion-reduce:animate-none"
      />
      <span>
        {waitingMessage(seconds)} <span className="text-faint tabular-nums">{formatElapsed(seconds)}</span>
      </span>
    </div>
  );
}
