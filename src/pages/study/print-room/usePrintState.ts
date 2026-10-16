import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/** Local reading position survives visits to passages; never stores personal data. */
export function usePrintState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try { const saved = sessionStorage.getItem(`print-room:${key}`); return saved === null ? initial : JSON.parse(saved) as T; }
    catch { return initial; }
  });
  useEffect(() => { try { sessionStorage.setItem(`print-room:${key}`, JSON.stringify(value)); } catch { /* Storage may be disabled. */ } }, [key, value]);
  return [value, setValue];
}
