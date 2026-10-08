/// <reference types="vite/client" /> // for import.meta.glob below
// The Resources data files (learning.json, fellowships.json, life.json, us-states.json), loaded on demand through a glob
// so a section whose file has not been written yet simply reports "not ready" instead of breaking the build.
import { useEffect, useState } from "react";

export interface Workbook {
  id: string; title: string; kind: string; sessions: number; pages: number; summary: string;
  pdf: { a4: string; letter: string }; cover: string; builtFrom: string[]; checked: string;
}
export interface LearningData { items: Workbook[] }

export interface Fellowship {
  id: string; name: string; summary: string; for: string[]; meets: string[]; cost?: string; locator?: string; faith?: string;
  cities?: string[]; jacksonville?: string; source: string; checked: string;
}
export interface FellowshipsData { checked: string; groups: { id: string; title: string; entries: Fellowship[] }[] }

export interface Contact { kind: string; value: string; note?: string }
export interface Help {
  id: string; name: string; summary: string; faith?: boolean | null; contact: Contact[]; hours?: string; cost?: string; locator?: string;
  source: string; checked: string;
}
export interface LocalHelp extends Help { category: string; address: string; lat: number; lon: number; geocode?: string }
/** A local line reached by phone or text only: no public address, so no point on the map. */
export interface LocalLine extends Help { category?: string; address?: string }
/** Only cities with verified: true are shown (owner, 2026-10-08: Jacksonville first). */
export interface City { id: string; name: string; lat: number; lon: number; verified?: boolean; centre?: string; entries: LocalHelp[]; lines?: LocalLine[] }
export interface LifeData { checked: string; groups: { id: string; title: string; entries: Help[] }[]; cities: City[] }

export interface UsStates { width: number; height: number; scale: number; translate: [number, number]; states: { id: string; name: string; d: string }[] }

interface Files { learning: LearningData; fellowships: FellowshipsData; life: LifeData; "us-states": UsStates }
export type ResourceFile = keyof Files;

const FILES = import.meta.glob<{ default: unknown }>("/src/data/resources/*.json");
const path = (name: ResourceFile) => `/src/data/resources/${name}.json`;

export const hasResource = (name: ResourceFile) => path(name) in FILES;

export async function loadResource<K extends ResourceFile>(name: K): Promise<Files[K] | null> {
  const load = FILES[path(name)];
  return load ? ((await load()).default as Files[K]) : null;
}

/** "loading", the data, or "missing" when the file has not been written. A failed import is thrown to the error boundary. */
export function useResource<K extends ResourceFile>(name: K): Files[K] | "loading" | "missing" {
  const [state, setState] = useState<{ name: K; value: Files[K] | "loading" | "missing" }>({ name, value: "loading" });
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    let live = true;
    loadResource(name).then((value) => { if (live) setState({ name, value: value ?? "missing" }); }, (e: unknown) => { if (live) setError(e); });
    return () => { live = false; };
  }, [name]);
  if (error) throw error instanceof Error ? error : new Error(`resources: could not load ${name}.json: ${String(error)}`);
  return state.name === name ? state.value : "loading";
}
