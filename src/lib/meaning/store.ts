import { useEffect, useSyncExternalStore } from "react";
import { cachedJson, cachedVectors, checkDevice, embedQuestion, fetchManifest, installPack, installedVersion, nearest, packSize, removePack, type MeaningManifest } from "./engine";

/** Where meaning search stands on this device; shared by every page (one store, many readers). */
export type MeaningPhase = "checking" | "off" | "unsupported" | "downloading" | "ready" | "update" | "error";
export interface MeaningState { phase: MeaningPhase; progress: number; manifest: MeaningManifest | null; reason: string; storedBytes: number }

let state: MeaningState = { phase: "checking", progress: 0, manifest: null, reason: "", storedBytes: 0 };
const listeners = new Set<() => void>();
const set = (next: Partial<MeaningState>) => { state = { ...state, ...next }; listeners.forEach((listener) => listener()); };

let started = false;
async function start() {
  if (started) return;
  started = true;
  try {
    const manifest = await fetchManifest();
    const installed = installedVersion();
    if (installed === manifest.version) return set({ phase: "ready", manifest, storedBytes: await packSize() });
    const device = await checkDevice(manifest.bytes);
    if (!device.ok) return set({ phase: "unsupported", manifest, reason: device.reason });
    set({ phase: installed ? "update" : "off", manifest });
  } catch (error) {
    console.error("meaning search: could not start", error);
    set({ phase: "error", reason: "Meaning search is not available right now. Word search still works." });
  }
}

/** Download the pack (first time, or a newer version) and switch meaning search on. */
export async function enableMeaning(): Promise<void> {
  const manifest = state.manifest;
  if (!manifest || state.phase === "downloading") return;
  set({ phase: "downloading", progress: 0, reason: "" });
  try {
    if (installedVersion() && installedVersion() !== manifest.version) await removePack(); // drop the old version's files
    await installPack(manifest, (progress) => set({ progress }));
    indexes = null;
    set({ phase: "ready", storedBytes: await packSize() });
  } catch (error) {
    console.error("meaning search: download failed", error);
    set({ phase: "error", reason: `The download stopped (${error instanceof Error ? error.message : String(error)}). Try again on a steadier connection.` });
  }
}

export async function disableMeaning(): Promise<void> {
  await removePack();
  indexes = null;
  set({ phase: "off", progress: 0, storedBytes: 0 });
}

export function useMeaning(): MeaningState {
  useEffect(() => { void start(); }, []);
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => state);
}

interface Indexes { studyIds: string[]; studyVectors: Int8Array; verseIds: string[]; verseText: string[]; verseVectors: Int8Array }
let indexes: Promise<Indexes> | null = null;
function loadIndexes(manifest: MeaningManifest): Promise<Indexes> {
  indexes ??= (async () => {
    const [studyIds, studyVectors, bible, verseVectors] = await Promise.all([
      cachedJson<string[]>(manifest, "index/studies.json"), cachedVectors(manifest, "index/studies.i8"),
      cachedJson<{ ids: string[]; text: string[] }>(manifest, "index/bible-web.json"), cachedVectors(manifest, "index/bible-web.i8"),
    ]);
    return { studyIds, studyVectors, verseIds: bible.ids, verseText: bible.text, verseVectors };
  })();
  indexes.catch(() => { indexes = null; });
  return indexes;
}

export interface MeaningResults { studies: { id: string; score: number }[]; verses: { id: string; text: string; score: number }[] }

/** Studies and World English Bible verses closest in meaning to `question`, on this device. */
export async function searchByMeaning(question: string, verseCount = 12): Promise<MeaningResults> {
  const manifest = state.manifest;
  if (state.phase !== "ready" || !manifest) throw new Error("meaning search: not switched on");
  const [query, index] = await Promise.all([embedQuestion(manifest, question), loadIndexes(manifest)]);
  const dims = manifest.dimensions;
  return {
    studies: nearest(query, index.studyVectors, dims, index.studyIds.length).map((hit) => ({ id: index.studyIds[hit.index], score: hit.score })),
    verses: nearest(query, index.verseVectors, dims, verseCount).map((hit) => ({ id: index.verseIds[hit.index], text: index.verseText[hit.index], score: hit.score })),
  };
}

/** Meaning leads for real questions (3+ words); short exact terms ("Calvin", "grace") stay with keyword search. */
export const preferMeaning = (query: string) => query.trim().split(/\s+/).filter((word) => word.length > 1).length >= 3;
