import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const EVENT = 'print-room-state';

/** Local reading position survives visits to passages; never stores personal data. */
export function usePrintState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try { const saved = sessionStorage.getItem(`print-room:${key}`); return saved === null ? initial : JSON.parse(saved) as T; }
    catch { return initial; }
  });
  useEffect(() => { try { sessionStorage.setItem(`print-room:${key}`, JSON.stringify(value)); } catch { /* Storage may be disabled. */ } }, [key, value]);
  // Another part of the page (the timeline) can set this value from outside.
  useEffect(() => {
    const onSet = (e: Event) => { const { key: k, value: v } = (e as CustomEvent<{ key: string; value: T }>).detail; if (k === key) setValue(v); };
    window.addEventListener(EVENT, onSet);
    return () => window.removeEventListener(EVENT, onSet);
  }, [key]);
  return [value, setValue];
}

/** Sets a value held by usePrintState anywhere on the page. */
export function setPrintState(key: string, value: unknown) {
  // Stored first, so a part of the page that mounts only after this change (a switched-in tab) starts with the value.
  try { sessionStorage.setItem(`print-room:${key}`, JSON.stringify(value)); } catch { /* Storage may be disabled. */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key, value } }));
}
