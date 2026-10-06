export type SourceLink = { url: string; sourceId: string; name?: string; held?: boolean; format?: string; edition?: string; acquired?: string };
export type SourceEntry = { id: string; title: string; author: string; categories: string[]; kind: string; status: string; role: string; held?: boolean; links: SourceLink[] };
export type Directory = {
  collections: { id: string; label: string; definition: string }[];
  sources: { id: string; name: string; url: string; role: string }[];
  entries: SourceEntry[];
  corpus: {
    measured_at: string; files: number; bytes: number; formats: Record<string, number>;
    sources: { name: string; files: number; bytes: number }[];
    coverage: { built_at: string; editions: number; languages: number; counts: { documents: number; chunks: number; verses: number } };
    embedding: { updated_at: string; state: string; indexed: number; total: number; remaining: number };
    bibliographyUpdatedAt: string; verifiedFiles: number; incompleteIdentity: number;
  };
};
