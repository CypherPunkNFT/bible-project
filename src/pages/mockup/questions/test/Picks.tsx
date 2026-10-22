// The test's settings as plain dropdowns whose choices read as words in a sentence ("every topic", "the Old
// Testament"): option B sets them inline in one sentence, option D stacks them in its side column.
import type { QuestionBank } from "@/lib/data";
import { KINDS, type Facets, type Filters } from "../model";
import { LENGTHS } from "./engine";

export interface PickProps { bank: QuestionBank; facets: Facets; filters: Filters; update: (patch: Partial<Filters>) => void; className?: string }

export function KindPick({ filters, update, className }: PickProps) {
  return <select className={className} value={filters.kind} aria-label="Kind of question" onChange={(e) => update({ kind: e.target.value, topic: "", collection: "" })}>
    {KINDS.map((k) => <option key={k.label} value={k.id}>{k.id ? k.label : "every kind of question"}</option>)}
  </select>;
}

export function TopicPick({ bank, facets, filters, update, className }: PickProps) {
  const counts = facets.counts.topic;
  const group = (g: "story" | "teaching") => bank.topics.filter((t) => t.group === g && (counts.get(t.id) || filters.topic === t.id));
  return <select className={className} value={filters.topic} aria-label="Topic" onChange={(e) => update({ topic: e.target.value })}>
    <option value="">every topic</option>
    {([["The Bible's story", group("story")], ["Christian teaching", group("teaching")]] as const).map(([label, topics]) =>
      topics.length ? <optgroup key={label} label={label}>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</optgroup> : null)}
  </select>;
}

export function BookPick({ bank, facets, filters, update, className }: PickProps) {
  const counts = facets.counts.book;
  const books = (testament: "OT" | "NT") => bank.books.filter((b) => b.testament === testament && (counts.get(b.code) || filters.book === b.code));
  return <select className={className} value={filters.book} aria-label="Book" onChange={(e) => update({ book: e.target.value })}>
    <option value="">every book</option>
    {([["Old Testament", books("OT")], ["New Testament", books("NT")]] as const).map(([label, list]) =>
      list.length ? <optgroup key={label} label={label}>{list.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</optgroup> : null)}
  </select>;
}

export function TestamentPick({ filters, update, className }: PickProps) {
  return <select className={className} value={filters.testament} aria-label="Testament" onChange={(e) => update({ testament: e.target.value })}>
    <option value="">both Testaments</option><option value="OT">the Old Testament</option><option value="NT">the New Testament</option>
  </select>;
}

export function AnswersPick({ filters, update, className }: PickProps) {
  return <select className={className} value={filters.choices ? "1" : ""} aria-label="Answers" onChange={(e) => update({ choices: e.target.value === "1" })}>
    <option value="">with or without options</option><option value="1">with options only</option>
  </select>;
}

export function LengthPick({ length, setLength, className }: { length: number; setLength: (n: number) => void; className?: string }) {
  return <select className={className} value={length} aria-label="How many questions" onChange={(e) => setLength(Number(e.target.value))}>
    {LENGTHS.map((n) => <option key={n} value={n}>{n} questions</option>)}
  </select>;
}
