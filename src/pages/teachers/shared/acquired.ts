export interface AcquiredContributor {
  id: string; name: string; side: "preachers" | "scholars"; traditions: string[];
  profileId: string | null; roles: string[]; records: number; readable: number;
  sourceLifeDates?: string[];
}
export interface AcquiredCatalogue {
  schemaVersion: number; updatedAt: string; heldTextRecords: number; onSiteTexts: number;
  contributors: AcquiredContributor[]; unknownAuthorRecords: number; workRecordCount: number;
}
export interface AcquiredWork {
  id: string; title: string; language: string; source: string; availability: string; genre: string;
  localReadable?: boolean;
}
export interface ReadingRecord extends AcquiredWork {
  authors: string[]; contributors: string[]; sourceId: string | null; sourceUrl: string | null;
  licence: string; credit: unknown; sha256: string | null; pages: number; reviewWarning: string | null;
  workId: string | null; editionId: string | null;
  editors?: string[]; licenseUrl?: string | null;
  translators?: string[];
  editionDetails?: { printDate: string | null; electronicDate: string | null; printPublisher: string | null; electronicPublisher: string | null };
  pageBundles?: string[];
  localCopy?: boolean;
}
export const ACQUIRED_BASE = "/content/teacher-library";
export const workUrl = (id: string) => `/teachers/works/${encodeURIComponent(id)}`;
export async function getAcquired<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.headers.get("content-type")?.includes("json")) throw new Error("The library record could not be loaded.");
  return response.json() as Promise<T>;
}
export function localLibraryEnabled(): boolean {
  return typeof window!=='undefined'&&['127.0.0.1','localhost','[::1]'].includes(window.location.hostname)&&['8930','8931'].includes(window.location.port);
}
export async function getWorkRecord(id:string,signal?:AbortSignal):Promise<ReadingRecord> {
  if(localLibraryEnabled()){
    const response=await fetch(`/api/local-library/records/${encodeURIComponent(id)}`,{signal,cache:'no-store'});
    if(response.ok)return response.json() as Promise<ReadingRecord>;
    if(response.status!==404){const result=await response.json().catch(()=>({}));throw new Error(result.error??'The local reading copy could not be loaded.');}
  }
  const rows=await getAcquired<Record<string,ReadingRecord>>(await recordUrl(id),signal);
  if(!rows[id])throw new Error('This work is not in the current catalogue.');
  return rows[id];
}
export async function getProfileShelf<T>(id:string,signal?:AbortSignal):Promise<T> {
  if(localLibraryEnabled())return getAcquired<T>(`/api/local-library/profiles/${encodeURIComponent(id)}`,signal);
  return getAcquired<T>(`/content/teacher-profiles/${encodeURIComponent(id)}.json`,signal);
}
export async function getContributorShelf(id:string,signal?:AbortSignal):Promise<AcquiredWork[]> {
  if(localLibraryEnabled()){
    const response=await fetch(`/api/local-library/contributors/${encodeURIComponent(id)}`,{signal,cache:'no-store'});
    if(response.ok)return response.json() as Promise<AcquiredWork[]>;
    if(response.status!==404)throw new Error('The local contributor shelf could not be loaded.');
  }
  const rows=await getAcquired<Record<string,AcquiredWork[]>>(await recordUrl(id,'contributors'),signal);
  return rows[id]??[];
}
export async function recordUrl(id: string, kind: "records" | "contributors" = "records"): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  const shard = new Uint8Array(digest)[0].toString(16).padStart(2, "0");
  return `${ACQUIRED_BASE}/${kind}/${shard}.json`;
}

export type ReadingPage = { blocks: { text: string; locator: string }[] };
// Bound memory to the latest bundle. Abort and error responses are never cached.
let lastBundle: { url: string; data: Record<string, ReadingPage> } | undefined;
export async function getReadingPage(record: ReadingRecord, page: number, signal?: AbortSignal): Promise<ReadingPage> {
  if(record.localCopy){
    if(!localLibraryEnabled())throw new Error('This reading copy is available in the local preview.');
    return getAcquired<ReadingPage>(`/api/local-library/pages/${encodeURIComponent(record.id)}/${page}`,signal);
  }
  const part = record.pageBundles?.[page];
  if (!part) return getAcquired(`${ACQUIRED_BASE}/text/${encodeURIComponent(record.id)}/${page}.json`, signal);
  if (!/^pages\/[a-f0-9]{64}\.json$/.test(part)) throw new Error("Invalid reading bundle.");
  const url = `${ACQUIRED_BASE}/${part}`;
  const data = lastBundle?.url === url ? lastBundle.data : await getAcquired<Record<string, ReadingPage>>(url, signal);
  if (signal?.aborted) throw new DOMException("Reading cancelled", "AbortError");
  lastBundle = { url, data };
  const result = data[`${record.id}/${page}`];
  if (!result) throw new Error("This reading page is missing from its bundle.");
  return result;
}

export function languageLabel(value: string): string {
  const code=(value??'').trim().toLowerCase();
  if (!code || code === "und") return "Language unrecorded";
  const names: Record<string,string> = { lat: "Latin", grc: "Ancient Greek", eng: "English", en: "English", es: "Spanish", spa: "Spanish", ko: "Korean", kor: "Korean", heb: "Hebrew", deu: "German", ger: "German", de: "German", fra: "French", fr: "French", pt: "Portuguese", por: "Portuguese" };
  return names[code] ?? value;
}
export function sourceLabel(value: string): string {
  const names: Record<string,string> = { "source-criswell": "Criswell sermons", "source-billy-graham": "Billy Graham collection", first1k: "First 1,000 Years of Greek", pta: "Patristic Text Archive", catenae: "Open Greek and Latin catenae", ia: "Internet Archive", tcp: "Text Creation Partnership", "private-biblical-history": "Biblical history datasets" };
  return names[value] ?? value;
}
