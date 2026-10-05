import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { validateLibrary } from "../validate-library.mjs";
import { hash } from "./repository.ts";
import type { ContentDocument } from "./model.ts";
import type { ReadingLibrary, ReadingEdition } from "../../src/data/reading-library-types.ts";

interface Evidence { url: string; locator: string; note: string; checkedOn: string }
interface Review { date: string; reviewer: string; kind: "ai-assisted" | "human"; scope: string; contentHash?: string }
interface RecordBase { id: string; kind: string; editorialState: string; reviews: Review[] }
interface Author { id: string; name: string; aliases: string[]; traditions: string[]; eligibility: string; evidence: Evidence[] }
interface Source { id: string; name: string }
interface Work extends RecordBase { kind: "work"; title: string; creators: { authorId: string; role: string }[]; genre: string; role: string; era: string; depth: string; subjects: string[]; reading?: { summary: string; startingPoint: string; cautions: string[]; studyIds: string[] } }
interface Edition extends RecordBase { kind: "edition"; workId: string; label: string; languages: string[]; abridgment: string; dates: { event: string; value: string | null }[]; textRights?: ReadingEdition["textRights"] }
interface Asset extends RecordBase { kind: "asset"; editionId: string; sourceId: string; canonicalUrl: string; mediaKind: string; rights: { category: string; actions: { indexMetadata: string }; conditionsMet: boolean } }
interface Collection extends Omit<ReadingLibrary, "authors" | "works" | "subjects" | "hash"> { kind: "reading-collection"; id: string; workIds: string[]; editionIds: string[]; assetIds: string[]; reviews: Review[] }
type Document = Work | Edition | Asset | Collection | { kind: "author-registry"; authors: Author[] } | { kind: "source-registry"; sources: Source[] } | { kind: "vocabulary"; subjects: { id: string; label: string }[] } | { kind: "series" | "run" };

export function prepareReadingLibrary(root: string, studies: ContentDocument[], allowStaleReview = false) {
  const records = validateLibrary(root, false, true).documents.map(({ doc }) => doc as Document);
  const collection = records.find((d): d is Collection => d.kind === "reading-collection");
  if (!collection || collection.id !== "reformed-reading") throw new Error("The explicit Reformed reading publication manifest is missing.");
  const authors = records.find((d) => d.kind === "author-registry")!.authors;
  const sources = records.find((d) => d.kind === "source-registry")!.sources;
  const vocabulary = records.find((d) => d.kind === "vocabulary")!;
  const allWorks = records.filter((d): d is Work => d.kind === "work");
  const allEditions = records.filter((d): d is Edition => d.kind === "edition");
  const allAssets = records.filter((d): d is Asset => d.kind === "asset");
  const hasStudy = (kind: string, id: string) => studies.some((d) => d.kind === kind && d.id === id && d.publication === "published");
  if (!hasStudy("topic", collection.topicId) || !hasStudy("path", collection.pathId)) throw new Error("Reading library topic/path must resolve to published apologetics documents.");
  if (collection.featuredWorkIds.some((id) => !collection.workIds.includes(id))) throw new Error("Featured works must belong to the explicit publication list.");
  const selected: (Work | Edition | Asset)[] = [];
  const works = collection.workIds.map((id) => {
    const work = allWorks.find((w) => w.id === id);
    if (!work || work.editorialState !== "published" || !work.reading) throw new Error(`${id}: published reading metadata is required.`);
    if (work.reading.studyIds.some((id) => !hasStudy("study", id))) throw new Error(`${id}: reading recommendations must resolve to published studies.`);
    selected.push(work);
    const editions = allEditions.filter((e) => e.workId === id && e.editorialState === "published").map((edition) => {
      if (!edition.textRights || !edition.textRights.evidence.length) throw new Error(`${edition.id}: historic text rights need a stated scope and evidence.`);
      const assets = allAssets.filter((a) => a.editionId === edition.id && a.editorialState === "published");
      if (!assets.length) throw new Error(`${edition.id}: a published reading link is required.`);
      for (const asset of assets) if (!(asset.rights.actions.indexMetadata === "allowed" || (asset.rights.actions.indexMetadata === "conditional" && asset.rights.conditionsMet))) throw new Error(`${asset.id}: public metadata is not permitted.`);
      selected.push(edition, ...assets);
      return { id: edition.id, label: edition.label, languages: edition.languages, year: edition.dates.find((d) => d.event === "edition-publication")?.value ?? null, abridgment: edition.abridgment, textRights: { ...edition.textRights, evidence: edition.textRights.evidence.map(({ url, locator }) => ({ url, locator })) },
        links: assets.map((a) => ({ id: a.id, url: a.canonicalUrl, host: sources.find((s) => s.id === a.sourceId)!.name, mediaKind: a.mediaKind, rights: a.rights.category })) };
    });
    if (!editions.length) throw new Error(`${id}: no published reading editions.`);
    return { id, title: work.title, authorIds: work.creators.filter((c) => ["author", "institution"].includes(c.role)).map((c) => c.authorId), genre: work.genre, role: work.role, era: work.era, depth: work.depth, subjects: work.subjects, ...work.reading, editions };
  });
  const authorIds = new Set(works.flatMap((w) => w.authorIds)), subjectIds = new Set(works.flatMap((w) => w.subjects));
  const selectedAuthors = authors.filter((a) => authorIds.has(a.id));
  const sourceIds = new Set(selected.flatMap((d) => d.kind === "asset" ? [d.sourceId] : []));
  const selectedSources = sources.filter((s) => sourceIds.has(s.id));
  const manifest = { ...collection, reviews: undefined };
  // Only the explicit publication and its dependencies participate. A future draft acquisition
  // neither publishes itself nor invalidates this reading collection's editorial review.
  if (selected.length !== collection.workIds.length + collection.editionIds.length + collection.assetIds.length) throw new Error("Every selected edition/asset must be published and belong to a selected work.");
  const contentHash = hash({ manifest, records: selected, authors: selectedAuthors, sources: selectedSources, vocabulary });
  const last = collection.reviews.at(-1);
  if (!allowStaleReview && last?.contentHash !== contentHash) throw new Error("Reading library changed since its publication review. Inspect the changes, then explicitly record a library review.");
  const library: ReadingLibrary = { title: collection.title, description: collection.description, scopeNote: collection.scopeNote, rightsNote: collection.rightsNote, rightsSources: collection.rightsSources.map(({ url, locator }) => ({ url, locator })), topicId: collection.topicId, pathId: collection.pathId, featuredWorkIds: collection.featuredWorkIds,
    works, authors: selectedAuthors.map((a) => ({ id: a.id, name: a.name, aliases: a.aliases, traditions: a.traditions, evidenceUrl: a.evidence[0].url })).sort((a, b) => a.name.localeCompare(b.name, "en")), subjects: vocabulary.subjects.filter((s) => subjectIds.has(s.id)).map(({ id, label }) => ({ id, label })), hash: contentHash };
  const publicRecords = { schemaVersion: 1, collection: "reformed-reading", hash: contentHash, manifest: collection, authors: selectedAuthors, sources: selectedSources, records: selected };
  return { library, publicRecords, contentHash };
}

export function recordReadingReview(root: string, studies: ContentDocument[], details: Omit<Review, "date" | "contentHash">) {
  if (!["ai-assisted", "human"].includes(details.kind) || !details.reviewer.trim() || !details.scope.trim()) throw new Error("Supply a reviewer, review kind and scope.");
  const result = prepareReadingLibrary(root, studies, true), file = path.join(root, "content/library/publication.json");
  const manifest = JSON.parse(readFileSync(file, "utf8")) as Collection;
  const review = { ...details, date: new Date().toISOString().slice(0, 10), contentHash: result.contentHash };
  manifest.reviews.push(review); writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  return review;
}

export function readingArtifacts(root: string, studies: ContentDocument[]) {
  const { library, publicRecords } = prepareReadingLibrary(root, studies);
  const markdown = [`# ${library.title}`, library.description, library.scopeNote, library.rightsNote, `Publication fingerprint: ${library.hash}`];
  for (const work of library.works) {
    markdown.push(`## ${work.title}`, `**${work.authorIds.map((id) => library.authors.find((a) => a.id === id)!.name).join("; ")}** · ${work.era} · ${work.depth}`, work.summary, `Start here: ${work.startingPoint}`, ...work.cautions.map((c) => `Reading note: ${c}`));
    for (const edition of work.editions) markdown.push(`### ${edition.label}`, `${edition.languages.join(", ")} · ${edition.abridgment}`, ...edition.links.map((link) => `[Read at ${link.host}](${link.url})`), `${edition.textRights.jurisdiction}: ${edition.textRights.scope}`, edition.textRights.basis);
    markdown.push(`Related guides: ${work.studyIds.map((id) => `[${studies.find((d) => d.kind === "study" && d.id === id)!.content.title}](https://bibleproject.io/apologetics/study/${id})`).join(" · ")}`);
  }
  return new Map([
    ["src/generated/reading-library.ts", '// Generated from content/library. Do not edit.\nimport type { ReadingLibrary } from "../data/reading-library-types";\nexport const REFORMED_LIBRARY: ReadingLibrary = ' + JSON.stringify(library, null, 2) + ';\n'],
    ["public/content/apologetics/reformed-reading.json", JSON.stringify(publicRecords, null, 2) + "\n"],
    ["public/content/apologetics/reformed-reading.md", markdown.join("\n\n") + "\n"],
  ]);
}
