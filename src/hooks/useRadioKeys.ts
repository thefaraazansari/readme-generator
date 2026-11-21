import type { KeyboardEvent } from "react";

/**
 * Keyboard behaviour for a radio group: only the checked option is a Tab stop,
 * and the arrow keys (plus Home/End) move to another option and select it.
 * Put `onKeyDown` on the `role="radiogroup"` element and spread `itemProps(value)`
 * on each option.
 */
export function useRadioKeys<T extends string>(values: readonly T[], current: T, onSelect: (value: T) => void) {
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const last = values.length - 1;
    const i = values.indexOf(current);
    const next =
      e.key === "Home" ? 0
      : e.key === "End" ? last
      : e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
      : null;
    if (next === null) return;
    e.preventDefault();
    onSelect(values[next]);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  const itemProps = (value: T) => ({
    role: "radio" as const,
    "aria-checked": value === current,
    tabIndex: value === current ? 0 : -1,
  });

  return { onKeyDown, itemProps };
}
