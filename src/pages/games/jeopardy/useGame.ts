// Bible Jeopardy's game in progress (design 7.1, 8): every host action goes through the reducer and is saved under
// bp-jeopardy at once. Before saving, the stored game is read back: a newer save from another tab means the game is
// open there too, and this tab stops until the host chooses "Use this tab". Clues the room saw go on the seen list
// when the game reaches its results or is left.
import { useCallback, useRef, useState } from "react";
import { reduce, seenIds, type Action, type Game } from "./rules";
import { addSeen, clearGame, loadGame, saveGame } from "./storage";

export function useGame(store: Storage | null, tab: string, onSeen: (seen: string[]) => void) {
  const [game, setGame] = useState<Game | null>(null);
  const [conflict, setConflict] = useState(false);
  const current = useRef<Game | null>(null);
  const lastSaved = useRef(0);
  // While saving fails (storage full or blocked) this tab cannot tell its own game from another tab's, so it plays on.
  const unsaved = useRef(false);

  const keep = useCallback((next: Game | null) => {
    current.current = next;
    setGame(next);
    if (!next) return;
    const savedAt = saveGame(store, next, tab);
    unsaved.current = savedAt === null;
    if (savedAt !== null) lastSaved.current = savedAt;
  }, [store, tab]);

  const remember = useCallback((done: Game) => onSeen(addSeen(store, seenIds(done))), [store, onSeen]);

  const dispatch = useCallback((action: Action) => {
    const before = current.current;
    if (!before) return;
    const stored = loadGame(store);
    if (!unsaved.current && stored && stored.tab !== tab && stored.savedAt > lastSaved.current) { setConflict(true); return; }
    const next = reduce(before, action);
    if (next === before) return;
    keep(next);
    if (next.play.screen === "results" && before.play.screen !== "results") remember(next);
  }, [store, tab, keep, remember]);

  /** Take the game back from another tab: load what it saved and save it as this tab's. */
  const takeOver = useCallback(() => {
    const stored = loadGame(store);
    setConflict(false);
    keep(stored ? stored.game : current.current);
  }, [store, keep]);

  /** Leave the game: what was played goes on the seen list and the saved game is removed. */
  const leave = useCallback(() => {
    if (current.current) remember(current.current);
    current.current = null;
    setGame(null);
    clearGame(store);
  }, [store, remember]);

  return { game, start: keep, dispatch, conflict, takeOver, leave };
}
