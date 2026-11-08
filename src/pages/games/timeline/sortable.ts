// Timeline sort: the one pure move every input method ends in (design §9.1), so drag, tap and keyboard cannot disagree.

/** A new order with the card at `from` taken out and put back in at `to` (an insert, not a swap). */
export function move<T>(order: readonly T[], from: number, to: number): T[] {
  if (!Number.isInteger(from) || from < 0 || from >= order.length) throw new Error(`timeline sort: no card at position ${from} of ${order.length}`);
  const target = Math.max(0, Math.min(order.length - 1, Math.trunc(to)));
  const next = [...order];
  const [card] = next.splice(from, 1);
  next.splice(target, 0, card);
  return next;
}

export const sameOrder = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, i) => id === b[i]);
