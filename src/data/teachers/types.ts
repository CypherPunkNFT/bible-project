// The shape of teachers.json, written by scripts/build-teachers.ts and read by the Teachers pages.

export type Section = "preacher" | "author" | "scholar";
export interface Link { label: string; href: string }
/** A work the site publishes in its reading library: `read` is the on-site address, `source` the host's text. */
export interface PublishedWork { title: string; read: string; source: string | null; rights: string | null }
/** A work the study pages cite, with the pages that cite it. */
export interface CitedEntry { title: string; year: string; urls: string[]; citedOn: { page: string; address: string }[] }
/** A source on the Apologetics pages written by this person, with the studies that cite it. */
export interface ApologeticsEntry { title: string; url: string; studies: Link[] }
export interface Teacher {
  id: string;
  name: string;
  /** "library": a person in the Christian library's author registry; "cited": a scholar only the study pages cite. */
  origin: "library" | "cited";
  sections: Section[];
  /** Why the person is in each section, in words built from the counts. */
  basis: Partial<Record<Section, string>>;
  dates?: string;
  traditions: string[];
  era?: string;
  eraBasis?: string;
  status?: "provisional";
  evidence?: { url: string; locator: string };
  /** Their shelf in the site's reading library, when the site publishes a work of theirs. */
  shelf?: string;
  holdings?: { total: number; genres: [string, number][]; sermonBooks: number };
  published: PublishedWork[];
  apologetics: ApologeticsEntry[];
  cited: CitedEntry[];
}
export interface TeachersData {
  about: string;
  rules: Record<Section, string>;
  labels: { traditions: Record<string, string>; genres: Record<string, string>; eras: Record<string, string> };
  counts: Record<Section, number>;
  teachers: Teacher[];
  notListed: { name: string; reason: string }[];
}
