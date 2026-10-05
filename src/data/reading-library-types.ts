export interface ReadingAuthor { id: string; name: string; aliases: string[]; traditions: string[]; evidenceUrl: string }
export interface ReadingEdition {
  id: string; label: string; languages: string[]; year: string | null; abridgment: string;
  textRights: { status: "public-domain" | "unverified"; jurisdiction: string; scope: string; basis: string; evidence: { url: string; locator: string }[] };
  links: { id: string; url: string; host: string; mediaKind: string; rights: string }[];
}
export interface ReadingWork {
  id: string; title: string; authorIds: string[]; genre: string; role: string; era: string; depth: string; subjects: string[];
  summary: string; startingPoint: string; cautions: string[]; studyIds: string[]; editions: ReadingEdition[];
}
export interface ReadingLibrary {
  title: string; description: string; scopeNote: string; rightsNote: string;
  rightsSources: { url: string; locator: string }[]; topicId: string; pathId: string;
  featuredWorkIds: string[]; authors: ReadingAuthor[]; works: ReadingWork[];
  subjects: { id: string; label: string }[]; hash: string;
}
