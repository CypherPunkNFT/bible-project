// Draws any part of an Academic research file as plain reading: text as paragraphs, lists of words as one line, lists
// of records as small cards, and every record's fields as label-and-text rows. Each research file has its own sections,
// so nothing here knows a particular study; the evidence / inference / limit triple gets its plain-English labels.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { inline } from "./draft-inline";
import { humanise } from "./academic-drafts";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";

const FIELD_LABELS: Record<string, string> = {
  evidence: "What the evidence says", inference: "What the study infers", limit: "Where the evidence stops",
  forIt: "For it", against: "Against it", wouldShow: "What would settle it", held: "Who holds it", tag: "In short",
  in: "In this study", out: "Left to other studies", why: "Why", answers: "What it answers", read: "How it was read",
  test: "The question to ask", claim: "The claim", status: "Status", licence: "Licence", credit: "Credit", holder: "Held by",
  when: "When", where: "Where", verses: "Verses", sources: "Sources", links: "Linked studies", note: "Note",
};
/** Fields shown as the item's title, or as plain paragraphs without a label. */
const TITLE_FIELDS = ["name", "title", "head", "label", "word", "edition", "work", "subject", "verse"];
const PLAIN_FIELDS = new Set(["lead", "reads", "body", "text", "note", "intro"]);
/** Fields never shown: ids and drawing hints a reader has no use for. */
const HIDDEN_FIELDS = new Set(["id", "kind", "tone", "code", "chapter"]);
const LINK_FIELDS = new Set(["route", "href", "url", "to", "licenceUrl"]);
const INTERNAL_ROUTE = /^\/(study|read|topics|people|atlas|places|apologetics|bible)[A-Za-z0-9_\-/#?=.]*$/;
const EXTERNAL_URL = /^https?:\/\/\S+$/;
const MAX_DEPTH = 8;

/** Text with its check-note highlights (settled check marks open their note in the side sheet). */
const rich = (text: string) => <Checked text={text} render={inline} />;
const labelFor = (key: string) => FIELD_LABELS[key] ?? humanise(key);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isEmpty = (value: unknown) => value === null || value === undefined || value === "" ||
  (Array.isArray(value) && value.length === 0) || (isRecord(value) && Object.keys(value).length === 0);

/** A link only for a link field whose whole value is a site route or an http(s) address; otherwise plain text. */
function LinkValue({ value: raw }: { value: string }) {
  const value = plainText(raw);
  if (INTERNAL_ROUTE.test(value)) return <Link to={value}>{value}</Link>;
  if (EXTERNAL_URL.test(value)) return <a href={value} target="_blank" rel="noopener noreferrer">{value.replace(/^https?:\/\//, "")}</a>;
  return <>{value}</>;
}

function Scalar({ value, field }: { value: unknown; field?: string }) {
  if (typeof value === "string") return field && LINK_FIELDS.has(field) ? <LinkValue value={value} /> : rich(value);
  if (typeof value === "number") return <>{value}</>;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  return null;
}

/** The field that names a record, if it has one; it becomes the card's heading. */
const titleField = (record: Record<string, unknown>) => TITLE_FIELDS.find(field => typeof record[field] === "string" || typeof record[field] === "number");

function RecordCard({ record, depth }: { record: Record<string, unknown>; depth: number }) {
  const heading = titleField(record);
  const number = typeof record.n === "string" || typeof record.n === "number" ? `${record.n} · ` : "";
  return <div className="ar-item">
    {heading && <h4 className="ar-item-title">{number}{rich(String(record[heading]))}</h4>}
    <ResearchFields record={record} depth={depth + 1} skip={heading ? [heading, "n"] : ["n"]} />
  </div>;
}

/** A value of any shape: text, a list or a record. */
export function ResearchValue({ value, field, depth = 0 }: { value: unknown; field?: string; depth?: number }): ReactNode {
  if (isEmpty(value)) return null;
  if (depth > MAX_DEPTH) return <p className="ar-cut">(Nested too deep to show here.)</p>;
  if (Array.isArray(value)) {
    if (value.every(item => typeof item === "string" || typeof item === "number")) {
      const short = value.every(item => String(item).length < 40);
      return short ? <p className="ar-inline-list">{value.map((item, i) => <span key={i}><Scalar value={item} field={field} /></span>)}</p>
        : <ul>{value.map((item, i) => <li key={i}><Scalar value={item} field={field} /></li>)}</ul>;
    }
    return <div className="ar-items">{value.map((item, i) => isRecord(item) ? <RecordCard key={i} record={item} depth={depth} /> : <ResearchValue key={i} value={item} field={field} depth={depth + 1} />)}</div>;
  }
  if (isRecord(value)) return <ResearchFields record={value} depth={depth + 1} />;
  if (typeof value === "string" && !(field && LINK_FIELDS.has(field))) return <p><Scalar value={value} /></p>;
  return <p><Scalar value={value} field={field} /></p>;
}

/** A record's fields in their own order: plain text first-class, the rest as label-and-value rows. */
export function ResearchFields({ record, depth = 0, skip = [] }: { record: Record<string, unknown>; depth?: number; skip?: string[] }) {
  const entries = Object.entries(record).filter(([key, value]) => !skip.includes(key) && !HIDDEN_FIELDS.has(key) && !isEmpty(value));
  return <>{entries.map(([key, value]) => {
    if (PLAIN_FIELDS.has(key) && typeof value === "string") return <p key={key} className={`ar-${key}`}>{rich(value)}</p>;
    const nested = Array.isArray(value) ? value.some(item => isRecord(item)) : isRecord(value);
    if (nested) return <div key={key} className="ar-group"><h4 className="ar-group-title">{labelFor(key)}</h4><ResearchValue value={value} field={key} depth={depth} /></div>;
    return <dl key={key} className={`ds-fields ar-field ar-field-${key}`}><div><dt>{labelFor(key)}</dt><dd><ResearchValue value={value} field={key} depth={depth} /></dd></div></dl>;
  })}</>;
}
