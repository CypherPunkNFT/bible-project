import { useCallback, useEffect, useState } from "react";

/**
 * Reading progress, kept in KJV chapter numbering on this browser only (never sent anywhere).
 * Stored as a list of "BOOK.chapter" strings, e.g. "ROM.3".
 */
const KEY = "bp-read";
const ENTRY = /^[0-9A-Z]{3}\.\d{1,3}$/;
const EVENT = "bp-progress";

export const chapterKey = (code: string, chapter: number | string) => `${code}.${chapter}`;

function load(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string" && ENTRY.test(value)));
  } catch (error) {
    console.warn("progress: saved reading progress unreadable; starting empty", error);
    return new Set();
  }
}

function save(read: Set<string>): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify([...read].sort()));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch (error) {
    console.warn("progress: could not save reading progress", error);
    return false;
  }
}

export interface Progress {
  read: Set<string>;
  isRead: (code: string, chapter: number | string) => boolean;
  toggle: (code: string, chapter: number | string) => void;
  /** false when this browser refuses storage (e.g. a private window): marks then last only for this visit */
  saving: boolean;
}

/** Shared by every component on the page and kept in step with other open tabs. */
export function useProgress(): Progress {
  const [read, setRead] = useState<Set<string>>(load);
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    const refresh = () => setRead(load());
    const onStorage = (event: StorageEvent) => event.key === KEY && refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback(
    (code: string, chapter: number | string) => {
      const next = new Set(read);
      const key = chapterKey(code, chapter);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setRead(next);
      setSaving(save(next));
    },
    [read],
  );

  const isRead = useCallback((code: string, chapter: number | string) => read.has(chapterKey(code, chapter)), [read]);
  return { read, isRead, toggle, saving };
}
