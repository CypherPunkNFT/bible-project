import { useLocation } from "react-router-dom";
import { isCameFrom } from "@/lib/came-from";

/**
 * The way back the reader arrived with (router state `from`), carried by the person | page switch and from ruler to
 * ruler, so flipping between pages never changes or traps the back link (PRESENTATION.md §2.3).
 */
export function useCarried(): { from: { path: string; label: string } } | undefined {
  const state: unknown = useLocation().state;
  const from = typeof state === "object" && state !== null ? (state as { from?: unknown }).from : undefined;
  return isCameFrom(from) ? { from } : undefined;
}
