import type { ScholarsData } from '@/data/teachers/pages-types';
import { getAcquired, localLibraryEnabled, workUrl } from '../shared/acquired';
import type { FieldEntry } from './field-library';
import type { ContributorFact, ContributorFacts } from './facts';
import type { LibraryPerson } from './catalogue/library';

export const POPULATION_BASE = '/content/scholar-population';
export interface PopulationIdentity {
  status: string; entityType: string | null; reviewRequired: boolean; joinBasis?: string;
  candidateIds?: string[];
  authorities?: { id: string; name: string; authority: string; unresolved?: string[]; review?: { date: string; kind: string; scope: string }; evidence?: { url: string; locator?: string; checkedOn?: string }[] }[];
}
export interface PopulationEntry extends FieldEntry {
  profileAvailability: { scholarId: string|null; teacherId: string|null };
  facts: ContributorFact; verifiedAliases: string[]; identity: PopulationIdentity;
  sourceLifeDates: string[];
  // The split index (scripts/split-scholar-index.mjs) leaves these out: search text loads on first search, the rest when a record opens.
  provenance?: string[]; searchText?: string;
  counts: { works: number; workGroups: number; editions: number; publicRecords: number; localCopies: number; intakeRecords: number; publicReadable: number; localReadable: number; siteSources: number };
}
export interface PopulationSummary {
  contributors: number; baselineMergedEntries: number; sourceContributors: number; sourceAuthorEntries: number;
  registryAdditions: number; intakeCreditAdditions: number; featureCreditAdditions: number; featureCreditLabels: number; siteSourceRecords: number; documentedTeacherProfiles: number; documentedSourceConflicts: number; documentedProfiles: number;
  publicRecords: number; publicReadingRecords: number; publicHeldRecords: number; catalogueOnlyPublicRecords: number; canonicalWorks: number; canonicalEditions: number; localReadingCopies: number;
  intakeMetadataRecords: number; recordRepresentations: number; recordContributorAssociations: number;
  workContributorAssociations: number; unattributedRecords: number; publicWithoutAuthorLabels: number;
  publicUnattributedRecords: number; datedBirths: number; approximateBirths: number; floruitOnly: number; deathOnly: number;
  dateStatus: Record<string, number>; eras: Record<string, number>; identityReviewEntries: number; kinds: Record<string, number>; unclassified: number;
}
/** Present when the build split the index (scripts/split-scholar-index.mjs); dev mode serves the whole file without it. */
export interface PopulationSplit { schemaVersion: 1; search: string; details: string; shards: number }
/** One scholar's detail-only fields, as the split moves them into details/<shard>.json. */
export interface PopulationDetails {
  provenance?: string[]; evidence?: ContributorFact['dates']['evidence']; legacyLabels?: string[];
  joinBasis?: string; authorities?: PopulationIdentity['authorities']; fieldBasis?: Record<string, string>;
}
export interface PopulationSnapshot {
  split?: PopulationSplit;
  schemaVersion: number; builtAt: string; summary: PopulationSummary; entries: PopulationEntry[];
  factSummary: ContributorFacts['summary']; sourceCredits: Record<string,string[]>;
  reconciliation: { sourceCreditMemberships: {catalogueDeclared:number;contributorShards:number;recordContributorIds:number;missingFromShards:number;shardOnly:number}; baselineMerge: {fieldEntries:number;fallbackEntries:number;entriesWithoutSourceIds:number;groupsWithMultipleSourceIds:number}; oldFactsSummary: { catalogueEntries: number }; counting: string; packagedUpdatedAt: string; shelfMembershipDrift: { contributorId: string; shardOnly: string[]; recordOnly: string[] }[]; unresolvedWorkIds: string[]; unresolvedEditionIds: string[]; intake: { fileStatuses: Record<string,number>; bodyHashesAbsentFromPublic: number }; localReaderAudit: { builtAt: string; issues: Record<string,number> } | null };
}
export interface PopulationCredit { role: string; basis: string; editionId?: string }
export interface PopulationRecord {
  id: string; title: string; workId: string | null; editionId: string | null; source: string;
  sourceUrl: string | null; language: string; availability: string; origin: string;
  publicReadable: boolean; localReadable: boolean; localRecordId?: string;
  provenance: string[]; reviewWarning: string | null; credits?: PopulationCredit[];
  intakeStatus?: string; intakeWorkIds?: string[]; intakeEditionIds?: string[];
}
export interface PopulationWork {
  id: string; workId: string | null; title: string; canonical: boolean; editionIds: string[];
  records: PopulationRecord[]; credits: PopulationCredit[]; provenance: string[];
  editions: { id: string; label: string; languages: string[]; dates: unknown[]; evidence: { url: string; locator?: string }[] }[];
}
export function hydratePopulation(snapshot: PopulationSnapshot, data: ScholarsData): LibraryPerson[] {
  const profiles = new Map(data.scholars.map(s => [s.id, s]));
  return snapshot.entries.map(p => {
    const scholar = profiles.get(p.profileId ?? '');
    return { ...p, population: p, scholar, search: [p.id, ...p.contributorIds, p.name, ...p.aliases, ...p.verifiedAliases, ...p.roles, ...p.traditions,
      ...Object.keys(p.fields).map(f => data.fields[f as keyof typeof data.fields]), p.facts.kind, p.facts.dates.status, p.identity.status,
      p.searchText, ...(scholar ? [scholar.short, scholar.place[0], scholar.line, ...scholar.works.map(w => w[0]), ...(scholar.tags ?? [])] : [])].join(' ').toLocaleLowerCase() };
  });
}
export function eligibleBirth(p: LibraryPerson): number | null {
  const d=p.facts?.dates;
  return d && ['documented-profile','source-supported'].includes(d.status) && Number.isFinite(d.born) ? d.born! : null;
}
export function dateLabel(p: LibraryPerson): string {
  const d=p.facts?.dates;
  if (!d) return 'Dates unrecorded';
  const prefix=d.approximate ? 'c. ' : '';
  if (d.status==='conflicting') return 'Conflicting dates · review required';
  if (d.status==='needs-review') return 'Source dates need review';
  if (d.born!==undefined) return `${prefix}${d.born}${d.died ? `–${d.died}` : ' · birth year'} · ${d.status==='documented-profile'?'documented profile':'source-supported'}${d.sourceConflict?' · conflicting source labels retained':''}`;
  if (d.floruit!==undefined) return `fl. ${prefix}${d.floruit} · birth unrecorded`;
  if (d.died) return `Died ${prefix}${d.died} · birth unrecorded`;
  return 'Dates unrecorded';
}
const shelfCache=new Map<string, Promise<PopulationWork[]>>();
interface PopulationHosting {shelves:Record<string,string[]>;zipParts:{file:string;bytes:number;sha256:string}[];zipBytes:number;unattributedPages?:Record<string,string>}
let hosting:Promise<PopulationHosting>|undefined;
const getHosting=()=>hosting??(hosting=getAcquired<PopulationHosting>(`${POPULATION_BASE}/hosting.json`).catch(():PopulationHosting=>({shelves:{},zipParts:[],zipBytes:0})));
export async function getUnattributedPage(page:number,signal?:AbortSignal):Promise<PopulationRecord[]>{const manifest=await getHosting(),file=manifest.unattributedPages?.[page];if(!file)return getAcquired(`${POPULATION_BASE}/unattributed/${page}.json`,signal);const rows=await getAcquired<Record<string,PopulationRecord[]>>(`${POPULATION_BASE}/${file}`,signal);if(!rows[page])throw Error('Unattributed page is absent from the snapshot.');return rows[page];}
export async function downloadPopulationExport(){
 const manifest=await getHosting();
 const pieces:BlobPart[]=[];
 if(manifest.zipParts.length){
  for(const part of manifest.zipParts){
   const response=await fetch(`${POPULATION_BASE}/${part.file}`);if(!response.ok)throw Error('The complete export could not be loaded.');
   const buffer=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(b=>b.toString(16).padStart(2,'0')).join('');
   if(buffer.byteLength!==part.bytes||hash!==part.sha256)throw Error('Export integrity check failed.');pieces.push(buffer);
  }
 }else{const response=await fetch(`${POPULATION_BASE}/scholars-library-export.zip`);if(!response.ok)throw Error('The complete export could not be loaded.');pieces.push(await response.arrayBuffer());}
 const blob=new Blob(pieces,{type:'application/zip'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='scholars-library-export.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export async function getPopulationShelf(id: string): Promise<PopulationWork[]> {
  let pending=shelfCache.get(id);
  if (!pending) {
    pending=(async()=>{
      const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));
      const shard=new Uint8Array(hash)[0].toString(16).padStart(2,'0');
      const manifest=await getHosting();
      const files=manifest.shelves[id]??[shard+'.json'];
      const output:PopulationWork[]=[];
      for(const file of files){const rows=await getAcquired<Record<string,PopulationWork[]>>(`${POPULATION_BASE}/contributors/${file}`);if(!(id in rows))throw new Error('This contributor is absent from the reconciled snapshot.');output.push(...rows[id]);}
      return output;
    })().catch(error=>{shelfCache.delete(id);throw error;});
    shelfCache.set(id,pending);
  }
  return pending;
}
// Must match detailsShard() in scripts/split-scholar-index.mjs: the first SHA-256 byte of the id, in 64 groups.
export async function detailsShard(id: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id));
  return (new Uint8Array(hash)[0] >> 2).toString(16).padStart(2, '0');
}
const detailsCache = new Map<string, Promise<Record<string, PopulationDetails>>>();
export async function getPopulationDetails(split: PopulationSplit, id: string): Promise<PopulationDetails | null> {
  const shard = await detailsShard(id);
  let pending = detailsCache.get(shard);
  if (!pending) {
    pending = getAcquired<Record<string, PopulationDetails>>(`${POPULATION_BASE}/${split.details}/${shard}.json`);
    pending.catch(() => detailsCache.delete(shard));
    detailsCache.set(shard, pending);
  }
  return (await pending)[id] ?? null;
}
let searchCache: Promise<Record<string, string>> | null = null;
export function getPopulationSearch(split: PopulationSplit): Promise<Record<string, string>> {
  if (!searchCache) { searchCache = getAcquired<Record<string, string>>(`${POPULATION_BASE}/${split.search}`); searchCache.catch(() => { searchCache = null; }); }
  return searchCache;
}
/** The entry as it was before the split: its details put back where the record views read them. */
export function withDetails(entry: PopulationEntry, d: PopulationDetails): PopulationEntry {
  const fields = Object.fromEntries(Object.entries(entry.fields).map(([key, f]) => [key, f && { ...f, basis: d.fieldBasis?.[key] ?? f.basis }])) as PopulationEntry['fields'];
  return { ...entry, fields, provenance: d.provenance ?? entry.provenance,
    identity: { ...entry.identity, joinBasis: d.joinBasis ?? entry.identity.joinBasis, authorities: d.authorities ?? entry.identity.authorities },
    facts: { ...entry.facts, dates: { ...entry.facts.dates, evidence: d.evidence ?? entry.facts.dates.evidence, legacyLabels: d.legacyLabels ?? entry.facts.dates.legacyLabels } } };
}
export function readingLink(r: PopulationRecord): { url: string; label: string } | null {
  if (r.localReadable && localLibraryEnabled()) return {url:workUrl(r.localRecordId ?? r.id),label:'Read local copy'};
  if (r.publicReadable) return {url:workUrl(r.id),label:'Read on this site'};
  if (r.origin==='packaged-record') return {url:workUrl(r.id),label:'Record details'};
  return null;
}
