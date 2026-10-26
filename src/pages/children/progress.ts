// Finished children's lessons, kept in this browser only (best score per lesson). Storage can be missing or refuse
// (a private window), so every read and write is guarded and the page works without it.
import { useState } from "react";

export type Progress = Record<string, { right: number; total: number }>;
const KEY = "bible-guide.children-lessons";

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch (error) {
    console.warn("Children's lessons: could not read saved progress", error);
    return {};
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(read);
  const save = (id: string, right: number, total: number) => setProgress((now) => {
    const best = now[id] && now[id].right >= right ? now : { ...now, [id]: { right, total } };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(best));
    } catch (error) {
      console.warn("Children's lessons: could not save progress", error);
    }
    return best;
  });
  return { progress, save };
}
