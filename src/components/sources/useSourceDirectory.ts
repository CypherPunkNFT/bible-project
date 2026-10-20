import { useEffect, useRef, useState } from "react";
import { isScholarsOnlySource } from "@/lib/editorial-sources";
import type { Directory, SourceEntry } from "./types";

const BASE = "/content/sources/";
const general = <T,>(items: T[]) => items.filter(item => !isScholarsOnlySource(JSON.stringify(item)));

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`${url} returned ${response.status}, expected the source directory`);
  return response.json() as Promise<T>;
}

/**
 * The source directory: its summary at once, its 16,884 records (7.6 MB unpacked) only once `marker`, the element around
 * the sections that use them, comes near the screen, however the visitor gets there (scrolling, a link, the End key).
 * The unsplit dev-mode file carries both at once.
 */
export function useSourceDirectory() {
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [entries, setEntries] = useState<SourceEntry[] | null>(null);
  const [failed, setFailed] = useState<"" | "summary" | "records">("");
  const [wanted, setWanted] = useState(false);
  const marker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    getJson<Directory>(`${BASE}directory.json`, controller.signal).then(data => {
      setDirectory({ ...data, sources: general(data.sources), sourceProfiles: data.sourceProfiles && general(data.sourceProfiles) });
      if (data.entries) setEntries(general(data.entries));
    }).catch(error => { if (!controller.signal.aborted) { console.error(error); setFailed("summary"); } });
    return () => controller.abort();
  }, []);
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
    const split = directory?.split;
    if (!wanted || entries || !split) return;
    const controller = new AbortController();
    getJson<{ entries: SourceEntry[] }>(`${BASE}${split.entries}`, controller.signal).then(data => setEntries(general(data.entries)))
      .catch(error => { if (!controller.signal.aborted) { console.error(error); setFailed("records"); } });
    return () => controller.abort();
  }, [wanted, entries, directory]);
  return { directory, entries, failed, marker, want: () => setWanted(true) };
}
