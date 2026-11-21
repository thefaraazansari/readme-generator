import { useRadioKeys } from "../hooks/useRadioKeys";
import type { Theme } from "../hooks/useTheme";

const OPTIONS: Theme[] = ["light", "dark"];

export function ThemeSwitch({
  theme,
  onChange,
}: Readonly<{
  theme: Theme;
  onChange: (theme: Theme) => void;
}>) {
  const { onKeyDown, itemProps } = useRadioKeys(OPTIONS, theme, onChange);

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      onKeyDown={onKeyDown}
      className="inline-flex gap-1 rounded-full border border-line bg-sheet p-1 text-sm"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          {...itemProps(option)}
          onClick={() => onChange(option)}
          className={`focus-ring flex h-9 items-center gap-1.5 rounded-full px-3 capitalize ${
            theme === option
              ? "bg-ink font-semibold text-paper"
              : "text-muted hover:text-ink"
          }`}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
            {option === "light" ? (
              <path d="M8 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM7.25 0h1.5v2.5h-1.5Zm0 13.5h1.5V16h-1.5ZM0 7.25h2.5v1.5H0Zm13.5 0H16v1.5h-2.5ZM2.1 3.16l1.06-1.06 1.77 1.77-1.06 1.06Zm8.97 8.97 1.06-1.06 1.77 1.77-1.06 1.06ZM2.1 12.84l1.77-1.77 1.06 1.06-1.77 1.77Zm8.97-8.97 1.77-1.77 1.06 1.06-1.77 1.77Z" />
            ) : (
              <path d="M9.6 1.1a6.5 6.5 0 1 0 5.3 8.6A5.5 5.5 0 0 1 9.6 1.1Z" />
            )}
          </svg>
          {option}
        </button>
      ))}
    </div>
  );
}
