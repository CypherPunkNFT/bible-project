// The draft as the page holds it (design §4 and §9): the answers, saved to this browser half a second after typing
// stops and at once when the tab is hidden, closed or left, so the debounce never holds the only copy. Another tab's
// save is taken over, except for an answer with unsaved edits here, which this tab keeps and then saves. A record from
// a newer version of the site makes the form read-only. A failed save is said once and retried on every later save.
import { useCallback, useEffect, useRef, useState } from "react";
import { answeredCount, browserStore, clearStored, readRecord, readStored, writeStored, STORAGE_KEY, type Answers } from "./storage";

export const SAVE_DELAY_MS = 500;

export const NOT_SAVED = "Your latest changes could not be saved in this browser, perhaps because its storage is full. Save a draft file to keep them.";
export const NEWER = "Your draft was saved by a newer version of Bible Guide, so this page shows it but will not change it. Reload the page to keep writing.";
export const NO_STORE = "This browser is not letting the page save, so your draft lasts only while this page is open. Save a draft file to keep it.";
export const CHANGED_ELSEWHERE = "Your draft was changed in another tab. The answer you are writing here is kept and will be saved over it.";
export const CLEARED_ELSEWHERE = "Your draft was cleared in another tab.";

export interface Draft {
  answers: Answers;
  /** True while the page holds a record a newer version wrote: every field is read-only. */
  newer: boolean;
  /** True from the first failed save until the next one that succeeds. */
  saveFailed: boolean;
  /** Whether this browser keeps anything at all. */
  saving: boolean;
  /** What happened last, for a status line; cleared by the page when it has shown it. */
  notice: string | null;
  setAnswer: (id: string, text: string) => void;
  /** Writes the draft now, debounce or not. */
  flush: () => void;
  /** Puts a whole set of answers in place of the draft (Open a draft file) and saves it. */
  replace: (answers: Answers) => void;
  /** Removes the draft from the page and the browser (Start over). */
  clear: () => void;
  clearNotice: () => void;
}

/** The answers that count: an answer of only spaces is not kept. */
const kept = (answers: Answers): Answers => Object.fromEntries(Object.entries(answers).filter(([, text]) => text.trim() !== ""));

export function useDraft(): Draft {
  const [storeFound] = useState(() => browserStore());
  const store = useRef<Storage | null>(storeFound);
  const [stored] = useState(() => readStored(store.current));
  const [answers, setAnswers] = useState<Answers>(stored.answers);
  const [newer, setNewer] = useState(stored.newer);
  const [saveFailed, setSaveFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef<Answers>(stored.answers);
  const dirty = useRef(new Set<string>());
  const timer = useRef<number | null>(null);
  const persisted = useRef(false);

  const save = useCallback((): void => {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
    if (newer || !store.current) return;
    const ok = writeStored(store.current, kept(latest.current));
    if (ok) dirty.current.clear();
    setSaveFailed(!ok);
    setNotice((current) => (ok ? (current === NOT_SAVED ? null : current) : NOT_SAVED));
    if (ok && !persisted.current && answeredCount(latest.current) > 0) {
      persisted.current = true;
      navigator.storage?.persist?.().catch(() => undefined);
    }
  }, [newer]);

  const setAnswer = useCallback((id: string, text: string): void => {
    if (newer) return;
    latest.current = { ...latest.current, [id]: text };
    dirty.current.add(id);
    setAnswers(latest.current);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(save, SAVE_DELAY_MS);
  }, [newer, save]);

  const replace = useCallback((next: Answers): void => {
    latest.current = next;
    dirty.current.clear();
    setAnswers(next);
    save();
  }, [save]);

  const clear = useCallback((): void => {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
    latest.current = {};
    dirty.current.clear();
    setAnswers({});
    setNewer(false);
    const ok = clearStored(store.current);
    setSaveFailed(!ok);
    if (!ok) setNotice(NOT_SAVED);
  }, []);

  // Flushed when the tab is hidden or closed, and when the page is left.
  useEffect(() => {
    const edits = dirty.current;
    const onHide = () => { if (document.visibilityState === "hidden" && edits.size) save(); };
    const onPageHide = () => { if (edits.size) save(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      if (edits.size) save();
    };
  }, [save]);

  // Leaving with unsaved work that this browser cannot keep: ask first.
  useEffect(() => {
    const atRisk = (!store.current || saveFailed) && answeredCount(answers) > 0;
    if (!atRisk) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveFailed, answers]);

  // Another tab saved or cleared the draft: follow it, keeping what is being written here.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      const theirs = event.key === null || event.newValue === null ? { answers: {}, newer: false } : safeRead(event.newValue);
      const mine = latest.current;
      const merged: Record<string, string> = { ...theirs.answers };
      let clash = false;
      for (const id of dirty.current) {
        if ((theirs.answers[id] ?? "") !== (mine[id] ?? "")) clash = true;
        if (mine[id] !== undefined) merged[id] = mine[id]; else delete merged[id];
      }
      latest.current = merged;
      setAnswers(merged);
      setNewer(theirs.newer);
      setNotice(event.key === null || event.newValue === null ? CLEARED_ELSEWHERE : clash ? CHANGED_ELSEWHERE : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    answers, newer, saveFailed, saving: store.current !== null, notice,
    setAnswer, flush: save, replace, clear, clearNotice: () => setNotice(null),
  };
}

function safeRead(text: string): { answers: Answers; newer: boolean } {
  try {
    return readRecord(text);
  } catch (error) {
    console.warn("Testimony builder: another tab wrote a draft this page could not read:", error);
    return { answers: {}, newer: false };
  }
}
