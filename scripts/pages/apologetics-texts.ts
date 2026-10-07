// CONTENT.md for Historic texts: the Reformed reading library (/apologetics/texts) and the source room (/apologetics/sources).
import type { ReadingWork } from "../../src/data/reading-library-types.ts";
import { BASE, cited, find, lines, sourceLine, stateLine, studyLink, type ApologeticsData } from "./apologetics-data";

const plain = (id: string) => id.replace(/-/g, " ");

function authorNames(work: ReadingWork, data: ApologeticsData): string {
  return work.authorIds.map((id) => data.library.authors.find((author) => author.id === id)?.name ?? id).join("; ");
}

function workEntry(work: ReadingWork, data: ApologeticsData): string {
  const subjects = work.subjects.map((id) => data.library.subjects.find((s) => s.id === id)?.label ?? id).join(", ");
  const studies = work.studyIds.map((id) => studyLink(find(data.studies, id, "study"))).join(" · ");
  return lines(
    `**${work.title}**`,
    "",
    `**${authorNames(work, data)}** · ${plain(work.genre)} · ${plain(work.role)} · level: ${work.depth} · subjects: ${subjects}`,
    "",
    work.summary,
    "",
    `**Where to begin:** ${work.startingPoint}`,
    ...work.cautions.flatMap((note) => ["", `*Reading note:* ${note}`]),
    "",
    ...work.editions.map((edition) => {
      const extent = edition.abridgment === "excerpt" ? "partial holding / excerpt" : edition.abridgment === "unknown" ? "extent not fully verified" : edition.abridgment;
      const rights = edition.textRights.status === "public-domain" ? "public-domain historic text" : "text rights need further verification";
      const links = edition.links.map((link) => `[${link.mediaKind === "scan" ? "historic scan" : "text"} at ${link.host}](${link.url})`).join(", ");
      return `- Edition: ${edition.label} (${edition.languages.join("/")}${edition.year ? ", " + edition.year : ""}; ${extent}; ${rights}, ${edition.textRights.jurisdiction}): ${links}`;
    }),
    "",
    `**Explore the question:** ${studies}`,
    "",
  );
}

export function historicTextsPage(data: ApologeticsData): string {
  const library = data.library, eras = [...new Set(library.works.map((work) => work.era))];
  return lines(
    `Address: [bibleproject.io/apologetics/texts](${BASE}/texts) (filters live in the address: ?q=, ?author=, ?era=, ?subject=, ?depth=, ?language=, ?view=authors, ?page=). The source room, [bibleproject.io/apologetics/sources](${BASE}/sources), is documented in the second half of this file.`,
    "",
    "## Part 1: The historic reading library",
    "",
    `**${library.title}.** ${library.description}`,
    "",
    `${library.works.length} works · ${library.authors.length} authors · ${library.works.reduce((n, w) => n + w.editions.length, 0)} editions or volume holdings · ${data.libraryReview} · fingerprint ${library.hash.slice(0, 12)} (the first 12 characters of the publication's content hash, which changes whenever the published selection changes)`,
    "",
    `**Scope:** ${library.scopeNote}`,
    "",
    `**Rights:** ${library.rightsNote} Evidence: ${library.rightsSources.map((s) => `[${s.locator}](${s.url})`).join("; ")}`,
    "",
    "### Three doors into the library (featured works)",
    "",
    ...library.featuredWorkIds.map((id, i) => {
      const work = library.works.find((w) => w.id === id);
      if (!work) throw new Error(`Featured reading work ${id} is not in the published reading library.`);
      return `${i + 1}. *${work.title}* (${authorNames(work, data)}): ${work.summary}`;
    }),
    "",
    "### Authors",
    "",
    "| Author | Traditions | Works here |",
    "|---|---|---:|",
    ...library.authors.map((a) => `| [${a.name}](${a.evidenceUrl}) | ${a.traditions.map(plain).join(", ")} | ${library.works.filter((w) => w.authorIds.includes(a.id)).length} |`),
    "",
    `**Subjects used as filters:** ${library.subjects.map((s) => s.label).join(" · ")}`,
    "",
    "### Every work, by period",
    "",
    ...eras.flatMap((era) => [`#### ${plain(era)}`, "", ...library.works.filter((w) => w.era === era).map((w) => workEntry(w, data))]),
    "**Downloads on the page:** reading list as Markdown (/content/apologetics/reformed-reading.md) and structured records as JSON (/content/apologetics/reformed-reading.json). They hold catalogue details, not the books.",
    "",
    sourceRoom(data),
  );
}

function sourceRoom(data: ApologeticsData): string {
  const e = data.editorial.content, policy = e.policy, kinds = [...new Set(data.sources.map((s) => s.content.kind))];
  return lines(
    "## Part 2: The source room",
    "",
    `Eyebrow: The source room · Title: Go beyond the summary. · Lead: ${e.copy.sourceRoomIntro}`,
    "",
    `### ${policy.eyebrow}: ${policy.title}`,
    "",
    `${cited(policy.introduction, data)}`,
    "",
    ...policy.sections.flatMap((section) => [`**${section.title}.** ${section.text}`, ""]),
    "**Downloads:** study documents as Markdown (/content/apologetics/library.md) and the structured collection as JSON (/content/apologetics/library.json).",
    "",
    `**Note:** ${e.copy.sourceRoomNote}`,
    "",
    `### ${data.sources.length} sources, by type (the filter chips)`,
    "",
    ...kinds.flatMap((kind) => [
      `#### ${kind}`,
      "",
      ...data.sources.filter((s) => s.content.kind === kind).flatMap((source) => {
        const studies = data.studies.filter((study) => [study.content.answer, ...study.content.reasoning, study.content.conclusion, ...study.content.sections, study.content.reply, study.content.limit, study.content.prompt]
          .some((block) => block.citations.some((cite) => cite.kind === "source" && cite.source === source.id)));
        const debates = data.debates.filter((d) => d.content.source === source.id);
        const usedBy = [...studies.map(studyLink), ...debates.map((d) => `debate: [${d.content.title}](${BASE}/debates/${d.id})`)];
        return [`- ${sourceLine(source)} · ${stateLine(source, data)}  \n  ${source.content.note}${usedBy.length ? `  \n  *Used by:* ${usedBy.join(" · ")}` : ""}`];
      }),
      "",
    ]),
  );
}
