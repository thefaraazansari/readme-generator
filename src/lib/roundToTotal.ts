/**
 * Round `values` to `decimals` places so the rounded numbers add up to exactly
 * the rounded total (largest-remainder method). Plain rounding can leave a
 * list of percentages at 99.9 or 100.1.
 */
export function roundToTotal(values: number[], decimals = 1): number[] {
  const factor = 10 ** decimals;
  const scaled = values.map((v) => v * factor);
  const floors = scaled.map(Math.floor);
  let remaining = Math.round(scaled.reduce((a, b) => a + b, 0)) - floors.reduce((a, b) => a + b, 0);

  const byRemainder = scaled.map((v, i) => ({ i, remainder: v - floors[i] })).sort((a, b) => b.remainder - a.remainder);
  for (const { i } of byRemainder) {
    if (remaining <= 0) break;
    floors[i] += 1;
    remaining -= 1;
  }
  return floors.map((v) => v / factor);
}
