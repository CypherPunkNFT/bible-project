import { useEffect, useState } from "react";
interface Notebook { saved: string[]; read: string[]; notes: Record<string, string> }
const KEY = "bp-apologetics-notebook-v1";
const empty: Notebook = { saved: [], read: [], notes: {} };
function readNotebook(): Notebook {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!value || typeof value !== "object") return empty;
    const ids = (input: unknown) => Array.isArray(input) ? input.filter((id): id is string => typeof id === "string") : [];
    const notes = value.notes && typeof value.notes === "object" ? Object.fromEntries(Object.entries(value.notes).filter(([key, text]) => key.length < 100 && typeof text === "string" && text.length <= 8000)) as Record<string, string> : {};
    return { saved: ids(value.saved), read: ids(value.read), notes };
  } catch { return empty; }
}
export function useApologeticsNotebook() {
  const [notebook, setNotebook] = useState(readNotebook), [storageError, setStorageError] = useState(false);
  useEffect(() => { const sync = (event: StorageEvent) => { if (event.key === KEY || event.key === null) setNotebook(readNotebook()); }; window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync); }, []);
  function update(next: Notebook) { setNotebook(next); try { localStorage.setItem(KEY, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); } }
  return { notebook, storageError,
    toggle: (kind: "saved" | "read", id: string) => update({ ...notebook, [kind]: notebook[kind].includes(id) ? notebook[kind].filter((item) => item !== id) : [...notebook[kind], id] }),
    note: (id: string, text: string) => update({ ...notebook, notes: { ...notebook.notes, [id]: text.slice(0, 8000) } }),
  };
}
export type ApNotebook = ReturnType<typeof useApologeticsNotebook>;
