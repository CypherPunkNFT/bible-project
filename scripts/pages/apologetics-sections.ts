// CONTENT.md for the Explore hub (with My study), learning paths, worldviews, debates and practice.
import { BASE, cited, citations, find, lines, sourceLine, stateLine, studyLink, type ApologeticsData } from "./apologetics-data";

const address = (route: string) => `[${BASE.replace("https://", "")}${route}](${BASE}${route})`;
const studyList = (ids: string[], data: ApologeticsData) => ids.map((id) => studyLink(find(data.studies, id, "study"))).join(" · ");

export function explorePage(data: ApologeticsData): string {
  const e = data.editorial.content, policy = e.policy;
  return lines(
    `Address: ${address("")}. Also covered here: My study, ${address("/saved")}.`,
    "",
    "## Counts shown in the hero",
    "",
    `${data.studies.length} studies · ${data.topics.length} connected fields · ${data.paths.length} learning paths`,
    "",
    "## Our doctrinal basis (short form)",
    "",
    `**${policy.eyebrow}: ${policy.title}** ${policy.introduction.text} The full policy is in the source room ([../historic-texts/CONTENT.md](../historic-texts/CONTENT.md)).`,
    "",
    "## Connected fields (the topic cards and the constellation)",
    "",
    ...data.topics.map((topic, i) => `${i + 1}. **${topic.content.title}** (${data.studies.filter((s) => s.content.topic === topic.id).length} studies, [/apologetics/topics/${topic.id}](${BASE}/topics/${topic.id})): ${topic.content.description} *${topic.content.question}*`),
    "",
    "## Start where you are (the first three learning paths)",
    "",
    ...data.paths.slice(0, 3).map((p) => `- **${p.content.title}** (${p.content.label}, ${p.content.studies.length} studies): ${p.content.description}`),
    "",
    "## Footer on every Apologetics page",
    "",
    `**${e.copy.footerTitle}** ${e.copy.footerText} Link: "Our starting point · ${e.anchor}".`,
    "",
    "## My study (/apologetics/saved)",
    "",
    "Holds only what the visitor saves on their own device: saved studies, studies marked read, and their own reflections on studies, debates and practice scenarios. Nothing is stored on a server, so there is no content to list here.",
  );
}

export function pathsPage(data: ApologeticsData): string {
  return lines(
    `Address: ${address("/paths")}; each path has /apologetics/paths/<id>. Progress counts studies the visitor marked read on this device.`,
    "",
    ...data.paths.flatMap((p, index) => [
      `## ${index + 1}. ${p.content.title}`,
      "",
      `${address("/paths/" + p.id)} · label: ${p.content.label} · ${stateLine(p, data)}`,
      "",
      p.content.description,
      "",
      ...p.content.studies.map((id, step) => {
        const study = find(data.studies, id, "study"), topic = find(data.topics, study.content.topic, "topic");
        return `${step + 1}. ${studyLink(study)} (${topic.content.title}): ${study.content.summary}`;
      }),
      "",
    ]),
  );
}

export function worldviewsPage(data: ApologeticsData): string {
  return lines(
    `Address: ${address("/worldviews")}; each collection has /apologetics/worldviews/<id>.`,
    "",
    ...data.worldviews.flatMap((w) => {
      const c = w.content;
      return [
        `## ${c.title}`,
        "",
        `${address("/worldviews/" + w.id)} · ${stateLine(w, data)}`,
        "",
        c.description,
        "",
        `### ${c.subtitle}`,
        "",
        `Comparison cards: ${w.id === "islam" ? "Christian truth" : "Christian starting point"} · ${c.otherLabel}. Each question links to a connected study.`,
        "",
        ...c.rows.flatMap((row) => [
          `**${row.question}** (study: ${studyLink(find(data.studies, row.study, "study"))})`,
          "",
          `- ${w.id === "islam" ? "Christian truth" : "Christian starting point"}: ${cited(row.christian, data)}`,
          `- ${c.otherLabel}: ${row.other.text}${citations(row.other.citations, data, "Primary record")}`,
          "",
        ]),
        `**Connected studies:** ${studyList(c.studies, data)}`,
        "",
        "**The texts behind the conversation:**",
        "",
        ...(c.readingPlan ? [c.readingPlan.introduction, ...c.readingPlan.stages.flatMap(stage => [`### ${stage.title}`, stage.aim, ...stage.readings.flatMap(reading => [`#### ${reading.title}`, `Source: ${sourceLine(find(data.sources, reading.source, "source"))}`, ...(["context", "purpose", "examine", "connection", "christian"] as const).map(key => `**${key}:** ${cited(reading[key], data)}`)])])] : []),
          ...c.sources.map((id) => `- ${sourceLine(find(data.sources, id, "source"))}`),
        "",
      ];
    }),
  );
}

export function debatesPage(data: ApologeticsData): string {
  const copy = data.editorial.content.copy;
  return lines(
    `Address: ${address("/debates")}; each debate study has /apologetics/debates/<id>.`,
    "",
    `**Note under the list:** ${copy.debateIndexNote}`,
    "",
    ...data.debates.flatMap((d, index) => {
      const c = d.content, source = find(data.sources, c.source, "source");
      return [
        `## ${index + 1}. ${c.title}`,
        "",
        `${address("/debates/" + d.id)} · ${c.lens} · ${stateLine(d, data)}`,
        "",
        `**Speakers:** ${c.speakers} · **Setting:** ${c.setting}`,
        "",
        c.description,
        "",
        `**Full transcript:** ${sourceLine(source)}. ${source.content.note}`,
        "",
        `**What is being argued?** ${cited(c.claim, data, "Record of the exchange")}`,
        "",
        `**The hinge:** ${c.hinge}`,
        "",
        "**Read with these questions:**",
        "",
        ...c.prompts.map((prompt, i) => `${i + 1}. ${prompt}`),
        "",
        `**Study the questions underneath:** ${studyList(c.studies, data)}`,
        "",
      ];
    }),
    `**Note on every debate page:** ${copy.debateNote}`,
  );
}

export function practicePage(data: ApologeticsData): string {
  const e = data.editorial.content;
  return lines(
    `Address: ${address("/practice")}; a scenario can be opened directly with ?scenario=<id>.`,
    "",
    "## Imagined conversations",
    "",
    ...data.practice.flatMap((p) => {
      const c = p.content;
      return [
        `### ${c.label}: ${c.title}`,
        "",
        `${address("/practice?scenario=" + p.id)} · ${stateLine(p, data)}`,
        "",
        c.context,
        "",
        `**${c.question}**`,
        "",
        ...c.options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}${i === c.best ? " **(the suggested first response)**" : ""}`),
        "",
        `**Feedback:** ${cited(c.explanation, data, "Basis for this application")}`,
        "",
        `**Underlying study:** ${studyLink(find(data.studies, c.study, "study"))} · **Reflection prompt:** ${c.prompt}`,
        "",
      ];
    }),
    "## A rhythm to return to: Listen. Clarify. Give a reason. Invite.",
    "",
    `*${e.copy.practiceNote}*`,
    "",
    ...e.conversationSteps.map((step, i) => `${i + 1}. **${step.title}.** ${step.line} ${step.detail} Prompt: "${step.prompt}" (${step.reference})`),
  );
}
