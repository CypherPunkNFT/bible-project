// The first screen of a test: what to be tested on (kind, topic, book, Testament, and whether to keep to questions with
// options) and how many questions. It opens with whatever was chosen on the questions page.
import { ArrowRight, X } from "lucide-react";
import type { ReactNode } from "react";
import type { QuestionBank } from "@/lib/data";
import { KindChips } from "../FilterRail";
import type { Facets, Filters } from "../model";
import { LENGTHS, itemOf, type TestQuestion } from "./engine";

interface Props {
  bank: QuestionBank;
  pool: TestQuestion[];
  facets: Facets;
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  length: number;
  setLength: (n: number) => void;
  onBegin: () => void;
}

export function TestSetup({ bank, pool, facets, filters, update, length, setLength, onBegin }: Props) {
  const available = facets.rows.length;
  const count = Math.min(length, available);
  return <section className="tp-setup" aria-labelledby="tp-setup-title">
    <div className="tp-setup-head">
      <p className="tp-eyebrow"><span aria-hidden />Your test</p>
      <h1 id="tp-setup-title">Set your <em>test</em></h1>
      <p>Choose what to be tested on and how many questions. They come one at a time, in a new order every time, and each answer opens the verse it comes from.</p>
    </div>
    <KindChips facets={facets} filters={filters} update={update} />
    <div className="tp-setup-grid">
      <Field label="Topic"><TopicSelect bank={bank} facets={facets} filters={filters} update={update} /></Field>
      <Field label="Book"><BookSelect bank={bank} facets={facets} filters={filters} update={update} /></Field>
      <Field label="Testament">
        <Segments value={filters.testament} onChange={(testament) => update({ testament })}
          options={[["", "Both"], ["OT", "Old"], ["NT", "New"]]} counts={facets.counts.testament} />
      </Field>
      <Field label="Answers">
        <div className="tp-segments" role="group" aria-label="Answers">
          <button type="button" aria-pressed={!filters.choices} onClick={() => update({ choices: false })}>Any kind</button>
          <button type="button" aria-pressed={filters.choices} onClick={() => update({ choices: true })}>Options only</button>
        </div>
      </Field>
    </div>
    {filters.search && <p className="tp-search-chip">Only questions with “{filters.search}”
      <button type="button" onClick={() => update({ search: "" })} aria-label="Drop the search"><X size={13} aria-hidden /></button></p>}
    <div className="tp-setup-foot">
      <div className="tp-lengths" role="group" aria-label="How many questions">
        {LENGTHS.map((n) => <button key={n} type="button" aria-pressed={length === n} onClick={() => setLength(n)}>
          <strong>{n}</strong><small>questions</small>
        </button>)}
      </div>
      <div className="tp-begin">
        <Mix pool={pool} rows={facets.rows} />
        <button type="button" className="tp-begin-go" disabled={!available} onClick={onBegin}>
          {available ? <>Begin · {count} question{count === 1 ? "" : "s"}</> : "No questions match"}<ArrowRight size={17} strokeWidth={1.6} aria-hidden />
        </button>
      </div>
    </div>
  </section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="tp-field"><span className="tp-field-label">{label}</span>{children}</div>;
}

/** What the chosen questions are made of: options, true or false, and answers you give yourself. */
function Mix({ pool, rows }: { pool: TestQuestion[]; rows: number[] }) {
  const counts = { choice: 0, truefalse: 0, open: 0 };
  for (const row of rows) counts[itemOf(pool[row]).format]++;
  if (!rows.length) return <p className="tp-mix">Loosen a filter to find questions.</p>;
  const parts = [[counts.choice, "with options"], [counts.truefalse, "true or false"], [counts.open, "to answer yourself"]] as const;
  return <p className="tp-mix"><strong>{rows.length.toLocaleString()}</strong> to draw from: {parts.filter(([n]) => n).map(([n, label]) => `${n.toLocaleString()} ${label}`).join(", ")}.</p>;
}

type SelectProps = { bank: QuestionBank; facets: Facets; filters: Filters; update: Props["update"] };

function TopicSelect({ bank, facets, filters, update }: SelectProps) {
  const counts = facets.counts.topic;
  const group = (g: "story" | "teaching") => bank.topics.filter((t) => t.group === g && (counts.get(t.id) || filters.topic === t.id));
  return <select className="tp-select" value={filters.topic} onChange={(e) => update({ topic: e.target.value })} aria-label="Topic">
    <option value="">Every topic</option>
    {([["The Bible's story", group("story")], ["Christian teaching", group("teaching")]] as const).map(([label, topics]) =>
      topics.length ? <optgroup key={label} label={label}>{topics.map((t) => <option key={t.id} value={t.id}>{t.title} ({(counts.get(t.id) ?? 0).toLocaleString()})</option>)}</optgroup> : null)}
  </select>;
}

function BookSelect({ bank, facets, filters, update }: SelectProps) {
  const counts = facets.counts.book;
  const books = (testament: "OT" | "NT") => bank.books.filter((b) => b.testament === testament && (counts.get(b.code) || filters.book === b.code));
  return <select className="tp-select" value={filters.book} onChange={(e) => update({ book: e.target.value })} aria-label="Book">
    <option value="">Every book</option>
    {([["Old Testament", books("OT")], ["New Testament", books("NT")]] as const).map(([label, list]) =>
      list.length ? <optgroup key={label} label={label}>{list.map((b) => <option key={b.code} value={b.code}>{b.name} ({(counts.get(b.code) ?? 0).toLocaleString()})</option>)}</optgroup> : null)}
  </select>;
}

function Segments({ value, onChange, options, counts }: { value: string; onChange: (v: string) => void; options: [string, string][]; counts: Map<string, number> }) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return <div className="tp-segments" role="group">
    {options.map(([id, label]) => <button key={label} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>
      {label}<small>{(id ? counts.get(id) ?? 0 : total).toLocaleString()}</small>
    </button>)}
  </div>;
}
