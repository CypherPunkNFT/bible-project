// The dashed ink lines the passage study's drawings share (mock-up js/parts-base.js inkLines).

/** Rows of broken ink, as the mock-up's drawings draw a written column. */
export function inkLines(x: number, y: number, w: number, rows: number, gap: number, seed = 0, dash = "6 2 3 1.5") {
  return Array.from({ length: rows }, (_, r) => <path key={`${x}-${y}-${r}`} d={`M${x} ${(y + r * gap).toFixed(1)}h${w - ((r * 7 + seed) % 11)}`}
    strokeDasharray={dash} opacity={(0.32 + (r % 4) * 0.12).toFixed(2)} />);
}
