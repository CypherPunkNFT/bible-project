export type SourceLink = { url: string; sourceId: string; name?: string; held?: boolean; format?: string; edition?: string; acquired?: string };
/** A page of this site that cites the work (content/feature-citations.json). */
export type CitedOn = { feature: string; page: string; address: string };
export type SourceAuthorMetadata = { id: string; name: string; traditions: string[]; era: string | null; born: number | null; died: number | null; approximate: boolean; dateStatus: string; dateBasis: string; sourceConflict: boolean; evidence: string[] };
export type SourceMetadata = { authors: SourceAuthorMetadata[]; traditions: string[]; eras: string[]; basis: string; caution?: string };
export type SourceFacetSnapshot = { schemaVersion: number; entriesSha256: string; populationBuiltAt: string; records: Record<string, SourceMetadata> };
export type SourceEntry = { id: string; title: string; author: string; categories: string[]; kind: string; status: string; role: string; held?: boolean; basis?: string; citedOn?: CitedOn[]; links: SourceLink[]; metadata?: SourceMetadata };
export interface CollectionCounts { records: number; authors: number }
export type SourceProfile = {
  id: string; name: string; url?: string; category: "library" | "data" | "software";
  formats: string[]; terms: string; channel: string;
  files?: number; bytes?: number; textReady?: number; pending?: number;
};
export type Directory = {
  collections: { id: string; label: string; definition: string }[];
  sources: { id: string; name: string; url: string; role: string }[];
  /** Present in the unsplit file (dev mode); the build moves the records to `split.entries`. */
  entries?: SourceEntry[];
  split?: { schemaVersion: 1; entries: string; records: number; collections: Record<string, CollectionCounts> };
  sourceProfiles?: SourceProfile[];
  sourceProfilesMeasuredAt?: string;
  intakeSnapshot?: { measuredAt: string; files: number; bytes: number; textReady: number; pendingText: number; supportFiles: number; duplicates: number; textGaps: number };
  corpus: {
    measured_at: string; files: number; bytes: number; formats: Record<string, number>;
    sources: { name: string; files: number; bytes: number }[];
    coverage: { built_at: string; editions: number; languages: number; counts: { documents: number; chunks: number; verses: number } };
    embedding: { updated_at: string; state: string; indexed: number; total: number; remaining: number };
    bibliographyUpdatedAt: string; verifiedFiles: number; incompleteIdentity: number;
  };
};
