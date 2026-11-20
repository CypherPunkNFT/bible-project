import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadSourceWords, loadSplitManifest, loadSplitPart } from "@/lib/data";
import { reloadingForLanguage, useSiteLanguage } from "@/lib/language";
import { assembleRows, mergeDeep, shardOf, type SplitHead, type SplitManifest } from "@/lib/split-data";
import { translateDirectory, translateEntries, translateEntry, type SourceWords } from "./source-words";
import type { Directory, SourceEntry, SourceFacetSnapshot } from "./types";

const BASE = "/content/sources/";
const DATASET = "sources";
type FacetState = 'loading' | 'ready' | 'unavailable' | 'stale';
interface Split { manifest: SplitManifest; head: SplitHead<Directory> }
const isHead = (value: unknown) => typeof value === "object" && value !== null && Array.isArray((value as SplitHead).keys) && typeof (value as SplitHead).data === "object";

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`${url} returned ${response.status}, expected the source directory`);
  return response.json() as Promise<T>;
}

/** The records with facets.json's author metadata laid on them, checked against the records as the build made them. */
async function withFacets(records: SourceEntry[], signal: AbortSignal): Promise<[SourceEntry[], FacetState]> {
  try {
    const snapshot = await getJson<SourceFacetSnapshot>(BASE + 'facets.json', signal);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(records)));
    const hash = Array.from(new Uint8Array(digest), byte=>byte.toString(16).padStart(2,'0')).join('');
    if (snapshot.schemaVersion !== 1 || snapshot.entriesSha256 !== hash) return [records, 'stale'];
    return [records.map(entry=>({...entry,metadata:snapshot.records[entry.id]})), 'ready'];
  } catch (error) {
    if (signal.aborted) throw error;
    return [records, 'unavailable'];
  }
}

/** Every record from directory.json (the unsplit dev-mode file) or the records file a release splits off it. */
async function wholeRecords(directory: Directory, signal: AbortSignal): Promise<SourceEntry[]> {
  if (directory.entries) return directory.entries;
  if (!directory.split?.entries) throw new Error(`${BASE}directory.json has neither its records nor the name of their file`);
  return (await getJson<{ entries: SourceEntry[] }>(`${BASE}${directory.split.entries}`, signal)).entries;
}

/**
 * The source directory, from its split files (scripts/split-data/sources.ts, data/split/sources/): the head (the
 * collections, providers, corpus figures and counts per collection, about 10 KB compressed) at once; the list (every
 * record's card, search, filter and author-facet fields, in parts under 100 KB) only once `marker`, the element around
 * the sections that use them, comes near the screen, however the visitor gets there (scrolling, a link, the End key);
 * the rest of one record (status, role, use basis, its authors' names, dates and evidence) when it is opened
 * (`details`). Where the split cannot be read (a fresh checkout before a build, an older release), the page reads
 * directory.json as before: whole in dev mode, or its summary and then its records file, with facets.json checked
 * against the records. In a translated language its words come from that language's sources.json (source-words.ts),
 * laid over the English as it is shown.
 */
export function useSourceDirectory() {
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [split, setSplit] = useState<Split | null>(null);
  const [entries, setEntries] = useState<SourceEntry[] | null>(null);
  const [failed, setFailed] = useState<"" | "summary" | "records">("");
  const [facetState, setFacetState] = useState<FacetState>('loading');
  const [wanted, setWanted] = useState(false);
  const marker = useRef<HTMLDivElement>(null);
  const settle = useCallback(([records, state]: [SourceEntry[], FacetState]) => { setEntries(records); setFacetState(state); }, []);
  useEffect(() => {
    const controller = new AbortController(), signal = controller.signal;
    const whole = () => getJson<Directory>(`${BASE}directory.json`, signal).then(async data => {
      setDirectory(data);
      if (data.entries) settle(await withFacets(data.entries, signal));
    });
    loadSplitManifest(DATASET).then(async manifest => {
      const head = await loadSplitPart<SplitHead<Directory>>(DATASET, manifest.head, isHead);
      if (signal.aborted) return;
      setSplit({ manifest, head });
      setDirectory(head.data);
    }, (error: unknown) => {
      if (signal.aborted) return;
      console.warn("source directory: its split files could not be read; reading directory.json", error);
      return whole();
    }).catch(error => { if (!signal.aborted) { console.error(error); setFailed("summary"); } });
    return () => controller.abort();
  }, [settle]);
  useEffect(() => {
    const target = marker.current;
    if (!directory || entries || wanted || !target) return;
    const observer = new IntersectionObserver(([seen]) => {
      if (seen.isIntersecting) setWanted(true);
    }, { rootMargin: "0px 0px 1200px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [directory, entries, wanted]);
  useEffect(() => {
    // The unsplit dev-mode file brings its records with it (the effect above lays the facets on them).
    if (!wanted || entries || !directory || (!split && directory.entries)) return;
    const controller = new AbortController(), signal = controller.signal;
    const whole = async () => {
      const source = split ? await getJson<Directory>(`${BASE}directory.json`, signal) : directory;
      settle(await withFacets(await wholeRecords(source, signal), signal));
    };
    const run = split
      ? Promise.all(split.manifest.layers.list.files.map(f => loadSplitPart<unknown[]>(DATASET, f.file, Array.isArray))).then(parts => {
        if (signal.aborted) return;
        const records = assembleRows(parts, split.head, split.manifest.rows) as SourceEntry[];
        settle([records, split.head.data.split?.facets === 'ready' ? 'ready' : 'stale']);
      }, async (error: unknown) => {
        if (signal.aborted) return;
        // A part gone from the server (a page left open across two rebuilds): the records from directory.json instead.
        console.warn("source directory: a part of its list could not be read; reading the whole records", error);
        await whole();
      })
      : whole();
    run.catch(error => { if (!signal.aborted) { console.error(error); setFailed("records"); } });
    return () => controller.abort();
  }, [wanted, entries, directory, split, settle]);
  const language = useSiteLanguage();
  const [words, setWords] = useState<SourceWords | null>(null);
  useEffect(() => {
    let current = true;
    setWords(null);
    const loading = loadSourceWords().then((found) => { if (current) setWords(found); })
      .catch((error) => console.error("source directory: its words in this language could not load; showing English", error));
    reloadingForLanguage(loading);
    return () => { current = false; };
  }, [language]);
  const byId = useMemo(() => new Map(entries?.map(entry => [entry.id, entry])), [entries]);
  /** One record whole, in the reader's language: its list fields with its details shard merged in. Resolves to null
   *  when the records are whole already (no split) or the record is unknown. */
  const details = useCallback(async (id: string): Promise<SourceEntry | null> => {
    const shards = split?.manifest.details, entry = byId.get(id);
    if (!shards || !entry) return null;
    const shard = await loadSplitPart<Record<string, unknown>>(DATASET, shards.files[shardOf(id, shards.shards)]);
    const whole = Object.prototype.hasOwnProperty.call(shard, id) ? mergeDeep(entry, shard[id]) : entry;
    return words ? translateEntry(whole, words) : whole;
  }, [split, byId, words]);
  const shownDirectory = useMemo(() => directory && translateDirectory(directory, words), [directory, words]);
  const shownEntries = useMemo(() => translateEntries(entries, words), [entries, words]);
  const want = useCallback(() => setWanted(true), []);
  return { directory: shownDirectory, entries: shownEntries, failed, marker, want, facetState, details };
}
