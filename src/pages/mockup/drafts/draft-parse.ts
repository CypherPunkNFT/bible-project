// Reads one Scripture & Theology draft (content/studies/<subject>/<study>/content.md) into the parts of a basic study
// page: heading, introduction, numbered readings, reader questions and a close. The drafts come in two forms:
//  · plain drafts: "# Title", a status line, intro paragraphs, "## 01 Title" sections with **Main reading:**,
//    "### " sub-heads, quotes followed by their reference line, and **Consider:** / **Reflect:**;
//  · rewritten drafts (the 15 with design mock-ups): "Concepts:", "Motto:", "Lead:" at the top, sections with
//    "Slug:", "Ask:", "Hook:", "Read:", tagged paragraphs ("[care] …", "[source:barnes] …"), "## Question key: …"
//    and "## Close: …". Top-level fields that only drive a mock-up's drawings (FoldLead, TurnReads …) are left out.

export type NoteTag = "open" | "care" | "source" | "own" | "other" | "about" | "invite";
export type Block =
  | { kind: "para"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string; cite?: string }
  | { kind: "note"; tag: NoteTag; text: string }
  | { kind: "field"; label: string; text: string }
  | { kind: "prompt"; label: string; text: string }
  | { kind: "table"; rows: string[] }
  | { kind: "list"; ordered: boolean; items: string[] };

export type SectionKind = "reading" | "question" | "close" | "other";
export interface DraftSection {
  id: string; kind: SectionKind; title: string; number?: string; tag?: string;
  ask?: string; hook?: string; readings?: string[]; blocks: Block[];
}
export interface DraftDoc {
  title: string; concepts: string[]; motto?: string; lead?: string; selection?: string; questionsLead?: string;
  intro: Block[]; sections: DraftSection[];
}

const NOTE_TAGS = new Set<string>(["open", "care", "source", "own", "other", "about"]);
const CITE = /^.{3,90}\s·\s[A-Z]{2,6}$/;
const BOLD_FIELD = /^\*\*([^*]{2,30}?):\*\*\s*(.*)$/;
// One-word labels only (plus the covenants' "To whom"), so a sentence such as "Paul says: …" stays a paragraph.
const PLAIN_FIELD = /^([A-Z][A-Za-z]{1,24}|To whom):\s+(.+)$/;
const LIST_ITEM = /^\s*([-*]|\d+\.)\s+/;
const PROMPTS: Record<string, string> = { Consider: "Consider", Reflect: "Reflect", Question: "Your question", Way: "Take it with you", "Reading exercise": "Reading exercise" };

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "part";
const splitReadings = (text: string) => text.replace(/\.$/, "").split(/;\s*/).map(part => part.trim()).filter(Boolean);
const startsBlock = (line: string, fields: boolean) => /^(#{1,3}\s|>|\s*\||\[[a-z]+(:[^\]]*)?\])/.test(line) || LIST_ITEM.test(line) || BOLD_FIELD.test(line) || (fields && PLAIN_FIELD.test(line));

/** Turns a run of lines into blocks. `fields`: read "Label: text" lines as fields (the rewritten drafts only). */
export function parseBlocks(lines: string[], fields: boolean): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  const takeWhile = (test: (line: string) => boolean) => { const taken: string[] = []; while (i < lines.length && test(lines[i])) taken.push(lines[i++]); return taken; };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const tag = line.match(/^\[([a-z]+)(?::([^\]]+))?\]\s*(.*)$/);
    const bold = line.match(BOLD_FIELD), plain = fields ? line.match(PLAIN_FIELD) : null;
    if (/^#{1,3}\s/.test(line)) { blocks.push({ kind: "heading", text: line.replace(/^#{1,3}\s+/, "") }); i++; }
    else if (line.startsWith(">")) blocks.push(quoteAt(lines, takeWhile(l => l.startsWith(">")), () => i, n => { i = n; }));
    else if (line.trim().startsWith("|")) blocks.push({ kind: "table", rows: takeWhile(l => l.trim().startsWith("|")) });
    else if (LIST_ITEM.test(line)) blocks.push({ kind: "list", ordered: /^\s*\d+\./.test(line), items: takeWhile(l => LIST_ITEM.test(l)).map(l => l.replace(LIST_ITEM, "")) });
    else if (tag) { blocks.push(tag[1] === "read" || !NOTE_TAGS.has(tag[1]) ? { kind: "para", text: tag[3] } : { kind: "note", tag: tag[1] as NoteTag, text: tag[3] }); i++; }
    else if (bold || plain) { const [, label, text] = (bold ?? plain)!; blocks.push({ kind: "field", label: label.trim(), text: text.trim() }); i++; }
    else { i++; const rest = takeWhile(l => !!l.trim() && !startsBlock(l, fields)); blocks.push({ kind: "para", text: [line, ...rest].join(" ") }); }
  }
  return blocks;
}

/** A block quote, with the reference line that follows it ("Mark 1:17 · KJV") taken as its citation. */
function quoteAt(lines: string[], quoted: string[], at: () => number, moveTo: (n: number) => void): Block {
  const text = quoted.map(l => l.replace(/^>\s?/, "")).join(" ").trim();
  let next = at();
  while (next < lines.length && !lines[next].trim()) next++;
  if (next < lines.length && CITE.test(lines[next].trim())) { moveTo(next + 1); return { kind: "quote", text, cite: lines[next].trim() }; }
  return { kind: "quote", text };
}

/** What a "## " line says the section is: a numbered reading, a reader question, the close, or another part. */
function sectionHead(head: string): Omit<DraftSection, "id" | "blocks"> {
  const numbered = head.match(/^(\d+)\s+(.*)$/);
  if (numbered) return { kind: "reading", number: numbered[1], title: numbered[2] };
  const question = head.match(/^Question\s+\w+:\s*(.*)$/);
  if (question) return { kind: "question", title: question[1] };
  const close = head.match(/^Close:\s*(.*)$/);
  if (close) return { kind: "close", title: close[1] };
  const part = head.match(/^Part:\s*(.*)$/);
  if (part) { const [, title = part[1], tag] = part[1].split(/\s*\|\s*/); return { kind: "other", title, tag }; }
  const labelled = head.match(/^[A-Z][a-z]+:\s*(.*)$/);
  return { kind: "other", title: labelled ? labelled[1] : head };
}

/** Lifts a section's own fields (its slug, question, hook and readings) out of its blocks, and marks the prompts. */
function shapeSection(head: Omit<DraftSection, "id" | "blocks">, blocks: Block[]): DraftSection {
  const section: DraftSection = { ...head, id: "", blocks: [] };
  let slug: string | undefined;
  for (const block of blocks) {
    if (block.kind !== "field") { section.blocks.push(block); continue; }
    const { label, text } = block;
    if (label === "Slug") slug = text;
    else if (label === "Ask") section.ask = text;
    else if (label === "Hook") section.hook = text;
    else if (/^(Main readings?|Read|Read again|Text|Passage)$/.test(label)) section.readings = [...(section.readings ?? []), ...splitReadings(text)];
    else if (label === "Close") section.blocks.push({ kind: "para", text });
    else if (label === "Invite") section.blocks.push({ kind: "note", tag: "invite", text });
    else if (label === "Again") continue;
    else if (PROMPTS[label]) section.blocks.push({ kind: "prompt", label: PROMPTS[label], text });
    else section.blocks.push(block);
  }
  section.id = slug ?? (head.number ? `part-${head.number}-${slugify(head.title)}` : slugify(head.title));
  return section;
}

const TOP_FIELDS = new Set(["Concepts", "Motto", "Lead", "Selection", "QuestionsLead"]);
const isStatusLine = (block: Block) => block.kind === "para" && /draft/i.test(block.text) && /(Study \d+|review pending)/i.test(block.text);
const isStatusField = (block: Block) => block.kind === "field" && /^Study \d+ ·/.test(`${block.label}: ${block.text}`);

/** A plain draft's opening tagline ("Receiving one another. Caring for one another. Growing together in Christ."):
 *  a few short sentences, read as the motto under the title. */
function isTagline(text: string) {
  const sentences = text.trim().split(/(?<=[.?!])\s+/);
  return text.length <= 110 && sentences.length >= 2 && sentences.every(sentence => sentence.length <= 50);
}

/** Parses one draft's Markdown. `fallbackTitle` is used when the text has no "# " title; `values` fills the
 *  {{placeholders}} a rewritten draft shares with its mock-up (draft-numbers.json). */
export function parseDraft(markdown: string, fallbackTitle: string, values: Record<string, string> = {}): DraftDoc {
  const filled = markdown.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => values[key] ?? whole);
  const lines = filled.replace(/\r\n/g, "\n").split("\n");
  const rewritten = lines.some(line => /^(Concepts|Slug):\s/.test(line));
  const titleAt = lines.findIndex(line => /^#\s/.test(line));
  const title = titleAt >= 0 ? lines[titleAt].replace(/^#\s+/, "").trim() : fallbackTitle;
  const body = titleAt >= 0 ? lines.slice(titleAt + 1) : lines;
  const starts = body.map((line, n) => (/^##\s/.test(line) ? n : -1)).filter(n => n >= 0);
  const preamble = parseBlocks(body.slice(0, starts[0] ?? body.length), rewritten).map(block => (block.kind === "para" && /^\*\*[^*]+\*\*$/.test(block.text.trim()) ? { kind: "para" as const, text: block.text.trim().slice(2, -2) } : block));
  const doc: DraftDoc = { title, concepts: [], intro: [], sections: [] };
  for (const block of preamble) {
    if (isStatusLine(block) || isStatusField(block)) continue;
    if (block.kind === "field" && rewritten && !TOP_FIELDS.has(block.label)) continue;
    if (block.kind === "field" && block.label === "Concepts") doc.concepts = block.text.split(/\s*·\s*/).filter(Boolean);
    else if (block.kind === "field" && block.label === "Motto") doc.motto = block.text;
    else if (block.kind === "field" && block.label === "Lead") doc.lead = block.text;
    else if (block.kind === "field" && block.label === "Selection") doc.selection = block.text;
    else if (block.kind === "field" && block.label === "QuestionsLead") doc.questionsLead = block.text;
    else doc.intro.push(block);
  }
  const first = doc.intro[0];
  if (!rewritten && !doc.motto && first?.kind === "para" && isTagline(first.text)) { doc.motto = first.text; doc.intro.shift(); }
  // The lead is the first paragraph, even when an opening verse comes before it; the verse stays in the introduction.
  const leadAt = doc.lead ? -1 : doc.intro.findIndex(block => block.kind === "para");
  if (leadAt >= 0) doc.lead = (doc.intro.splice(leadAt, 1)[0] as { text: string }).text;
  doc.sections = starts.map((start, n) => shapeSection(sectionHead(body[start].replace(/^##\s+/, "").trim()), parseBlocks(body.slice(start + 1, starts[n + 1] ?? body.length), rewritten)));
  splitPlainClose(doc);
  uniqueIds(doc.sections);
  return doc;
}

/** Plain drafts end their last reading with a closing paragraph after its prompts, or with an unnumbered part:
 *  either becomes the page's close, so every draft ends the same way. */
function splitPlainClose(doc: DraftDoc) {
  const last = doc.sections[doc.sections.length - 1];
  if (!last || doc.sections.some(section => section.kind === "close")) return;
  if (last.kind === "other" && !last.tag) { last.kind = "close"; return; }
  if (last.kind !== "reading") return;
  const lastPrompt = last.blocks.map(block => block.kind).lastIndexOf("prompt");
  if (lastPrompt < 0 || lastPrompt === last.blocks.length - 1) return;
  const closing = last.blocks.splice(lastPrompt + 1);
  doc.sections.push({ id: "to-close", kind: "close", title: "To close", blocks: closing });
}

function uniqueIds(sections: DraftSection[]) {
  const seen = new Map<string, number>();
  for (const section of sections) {
    const count = seen.get(section.id) ?? 0;
    seen.set(section.id, count + 1);
    if (count > 0) section.id = `${section.id}-${count + 1}`;
  }
}

/** The books a plain draft reads, in order, for its heading's line of page words when it has no Concepts. */
export function readingBooks(doc: DraftDoc, limit = 4): string[] {
  const books: string[] = [];
  for (const reference of doc.sections.flatMap(section => section.readings ?? [])) {
    const book = reference.match(/^((?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s(?:of\s)?[A-Z][a-z]+)*)\s+\d/)?.[1];
    if (book && !books.includes(book)) books.push(book);
  }
  return books.slice(0, limit);
}
