// Shared data, hooks and helpers; React components stay in their own refresh boundary.
export function sayHandlers(set: (id: string | null) => void) {
  const pick = (e: { target: EventTarget }) => set((e.target as Element).closest<HTMLElement | SVGElement>("[data-open]")?.dataset.open ?? null);
  return { onPointerOver: pick, onFocus: pick, onPointerLeave: () => set(null) };
}
