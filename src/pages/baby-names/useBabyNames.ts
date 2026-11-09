// Loading the baby-name data (data/baby-names/, built by scripts/bible/build_baby_names.py). The index (about 1,800
// rows) is read once by the list pages and the name pages; each name page reads its own one file. The files are rebuilt
// apart from the catalogue, so the browser asks the server each time (a cheap 304 when unchanged), as the games'
// translated data does (src/pages/games/translated-data.ts).
import { useState } from "react";
import type { NameDocument, NamesIndex } from "@/data/baby-names";
import { useAsync, type AsyncState } from "@/lib/useAsync";

const SLUG = /^[a-z][a-z-]*$/;
const cache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(path: string, check: (value: unknown) => boolean): Promise<T> {
  const response = await fetch(`/data/baby-names/${path}`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`baby-names: /data/baby-names/${path} answered HTTP ${response.status}`);
  const value: unknown = await response.json();
  if (!check(value)) throw new Error(`baby-names: /data/baby-names/${path} does not have the expected shape`);
  return value as T;
}

function load<T>(path: string, check: (value: unknown) => boolean): Promise<T> {
  let pending = cache.get(path);
  if (!pending) {
    pending = fetchJson<T>(path, check);
    pending.catch(() => cache.delete(path));
    cache.set(path, pending);
  }
  return pending as Promise<T>;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export const loadNamesIndex = () =>
  load<NamesIndex>("index.json", (v) => isObject(v) && Array.isArray(v.names) && isObject(v.aliases) && Array.isArray(v.themes));

export function loadNameDocument(slug: string): Promise<NameDocument> {
  if (!SLUG.test(slug)) return Promise.reject(new Error(`baby-names: "${slug}" is not a name slug`));
  return load<NameDocument>(`names/${slug}.json`, (v) => isObject(v) && v.slug === slug && Array.isArray(v.bearers));
}

export function useNamesIndex(): { state: AsyncState<NamesIndex>; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const state = useAsync(loadNamesIndex, `baby-names:index:${attempt}`);
  return { state, retry: () => setAttempt((value) => value + 1) };
}

/** Clears the session cache: for tests, which swap the data between cases. */
export function forgetBabyNames(): void {
  cache.clear();
}
