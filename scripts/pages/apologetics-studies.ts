// CONTENT.md for the question library (every study and connected field) and the Reformed theology branch.
import { BASE, cited, citations, find, lines, stateLine, studyLink, type ApologeticsData, type Doc } from "./apologetics-data";

const topicStudies = (data: ApologeticsData, topicId: string) => data.studies.filter((study) => study.content.topic === topicId);

function historicReading(data: ApologeticsData, studyId: string): string[] {
  // The study page shows at most three historic works that recommend this study (ReformedLibraryPage HistoricReading).
  return data.library.works.filter((work) => work.studyIds.includes(studyId)).slice(0, 3).map((work) => {
    const authors = work.authorIds.map((id) => data.library.authors.find((author) => author.id === id)?.name ?? id).join("; ");
    return `*${work.title}* (${authors})`;
  });
}

/** Sources in first-cited order, as the site's compiler lists them in the study sidebar. */
function studySources(study: Doc<"study">): string[] {
  const c = study.content;
  const all = [c.answer, ...c.reasoning, c.conclusion, ...c.sections, c.reply, c.limit, c.prompt].flatMap((block) => block.citations);
  return [...new Set(all.flatMap((cite) => cite.kind === "source" ? [cite.source] : []))];
}

function studySection(study: Doc<"study">, data: ApologeticsData): string {
  const c = study.content, topic = find(data.topics, c.topic, "topic");
  const paths = data.paths.filter((p) => p.content.studies.includes(study.id)).map((p) => `[${p.content.title}](${BASE}/paths/${p.id})`);
  const reading = historicReading(data, study.id);
  return lines(
    `### ${c.title}`,
    "",
    `[${BASE.replace("https://", "")}/study/${study.id}](${BASE}/study/${study.id}) · field: ${topic.content.title} · ${stateLine(study, data)}`,
    "",
    `**Summary.** ${c.summary}`,
    "",
    `**The starting answer.** ${cited(c.answer, data)}`,
    "",
    "**Follow the reasoning.**",
    "",
    ...c.reasoning.map((step, index) => `${index + 1}. ${cited(step, data)}`),
    "",
    `**Conclusion.** ${cited(c.conclusion, data)}`,
    "",
    ...c.sections.flatMap((section) => [`**${section.title}.** ${section.text}${citations(section.citations, data)}`, ""]),
    `**Objection: ${c.objection}** ${cited(c.reply, data)}`,
    "",
    `**What this answer establishes, and what remains.** ${cited(c.limit, data)}`,
    "",
    `**Carry it into a conversation.** "${c.prompt.text}"${citations(c.prompt.citations, data, "Editorial application")}`,
    "",
    `**Open the Scriptures:** ${c.passages.map((passage) => `${passage.reference} (${passage.note})`).join("; ")}`,
    "",
    `**Go to the source:** ${studySources(study).map((id) => find(data.sources, id, "source").content.title).join("; ") || "none"}`,
    "",
    `**Related studies:** ${c.related.map((id) => studyLink(find(data.studies, id, "study"))).join(" · ")}`,
    paths.length > 0 && "",
    paths.length > 0 && `**In learning paths:** ${paths.join(" · ")}`,
    reading.length > 0 && "",
    reading.length > 0 && `**Read a fuller argument (historic texts):** ${reading.join("; ")}`,
    "",
    `*Search keywords:* ${c.keywords.join(", ")}`,
    "",
  );
}

export function questionsPage(data: ApologeticsData): string {
  const topics = data.topics;
  return lines(
    `Address: [${BASE.replace("https://", "")}/questions](${BASE}/questions). Each study also has its own address, /apologetics/study/<id>, and each connected field has /apologetics/topics/<id>.`,
    "",
    `The library holds **${data.studies.length} studies** in **${topics.length} connected fields**. Visitors search by words (ranked) or, when meaning search is switched on, by what they mean; the filter chips are "All questions" plus one per field.`,
    "",
    "## Connected fields",
    "",
    "Each field page (/apologetics/topics/<id>) is this same library filtered to one field, with links to the neighbouring fields. The Reformed theology field has its own folder: [../reformed-theology/CONTENT.md](../reformed-theology/CONTENT.md).",
    "",
    "| Field | Address | Studies | The field's question | Description | State |",
    "|---|---|---:|---|---|---|",
    ...topics.map((topic) => `| ${topic.content.title} (${topic.content.short}) | [/apologetics/topics/${topic.id}](${BASE}/topics/${topic.id}) | ${topicStudies(data, topic.id).length} | ${topic.content.question} | ${topic.content.description} | ${stateLine(topic, data)} |`),
    "",
    "## Every study, by field",
    "",
    `Every study page also carries the shared note: "${data.editorial.content.copy.guideNote}"`,
    "",
    ...topics.flatMap((topic) => [`## Field: ${topic.content.title}`, "", ...topicStudies(data, topic.id).map((study) => studySection(study, data))]),
  );
}

export function reformedPage(data: ApologeticsData): string {
  const topic = find(data.topics, "reformed", "topic"), studies = topicStudies(data, "reformed");
  const path = find(data.paths, data.library.pathId, "path");
  return lines(
    `Address: [${BASE.replace("https://", "")}/topics/reformed](${BASE}/topics/reformed) (the old /apologetics/reformed forwards here). ${stateLine(topic, data)}.`,
    "",
    `**Eyebrow:** Explore a field · **Title:** ${topic.content.title}`,
    "",
    `**Lead:** ${topic.content.description}`,
    "",
    `**The field's question:** ${topic.content.question}`,
    "",
    "## The door into the historic texts",
    "",
    `"Read deeply. Trace the argument." ${data.library.works.length} historic works by ${data.library.authors.length} authors, connected to the questions below. Three buttons: follow the Reformed learning path ([${path.content.title}](${BASE}/paths/${path.id})), open the historic reading library ([/apologetics/texts](${BASE}/texts)), and meet the theologians ([/apologetics/texts?view=authors](${BASE}/texts?view=authors)). The library itself is in [../historic-texts/CONTENT.md](../historic-texts/CONTENT.md).`,
    "",
    `## The ${studies.length} studies in this field`,
    "",
    "Shown as study cards. Each study's full text (reasoning, sections, objection, limits, passages, sources) is in [../questions/CONTENT.md](../questions/CONTENT.md).",
    "",
    ...studies.flatMap((study) => [
      `### ${study.content.title}`, "",
      `[/apologetics/study/${study.id}](${BASE}/study/${study.id}) · ${stateLine(study, data)}`, "",
      `**Summary.** ${study.content.summary}`, "",
      `**The starting answer.** ${cited(study.content.answer, data)}`, "",
    ]),
    `## The Reformed learning path: ${path.content.title}`,
    "",
    `${path.content.description} Steps, in order: ${path.content.studies.map((id, index) => `${index + 1}. ${studyLink(find(data.studies, id, "study"))}`).join(" ")}`,
    "",
    "## Follow a neighbouring question",
    "",
    data.topics.filter((other) => other.id !== "reformed").map((other) => `[${other.content.title}](${BASE}/topics/${other.id})`).join(" · "),
  );
}
