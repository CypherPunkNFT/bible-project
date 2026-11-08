// Timeline sort's scoring (design §7): slot ticks and neighbour joins between Daily tries, pairs in order and stars
// for Practice. All of them compare the player's order with the true one; none of them needs the event data.

/** For each position, whether the card there is in its right slot. */
export const slotTicks = (order: readonly string[], truth: readonly string[]): boolean[] => order.map((id, i) => truth[i] === id);

/** For each gap between neighbours (length n - 1), whether those two cards are consecutive in the true order. */
export function joins(order: readonly string[], truth: readonly string[]): boolean[] {
  const at = new Map(truth.map((id, i) => [id, i]));
  return order.slice(1).map((id, i) => at.get(id)! === at.get(order[i])! + 1);
}

/** How many of all pairs of cards are the right way round (Kendall's measure, §2.3). */
export function pairsInOrder(order: readonly string[], truth: readonly string[]): { right: number; total: number } {
  const at = new Map(truth.map((id, i) => [id, i]));
  let right = 0;
  for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) if (at.get(order[i])! < at.get(order[j])!) right++;
  return { right, total: (order.length * (order.length - 1)) / 2 };
}

/** Three stars for every pair, two for at least 80%, one for at least 60%, else none. */
export function stars(right: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0 || right === total) return 3;
  const share = right / total;
  return share >= 0.8 ? 2 : share >= 0.6 ? 1 : 0;
}

export const isSolved = (order: readonly string[], truth: readonly string[]) => slotTicks(order, truth).every(Boolean);

/** The share grid's row for one try: a green square for each card in its right place, white otherwise (§11.2). */
export const shareRow = (order: readonly string[], truth: readonly string[]) => slotTicks(order, truth).map((tick) => (tick ? "🟩" : "⬜")).join("");
