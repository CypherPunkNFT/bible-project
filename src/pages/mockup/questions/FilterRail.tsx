// 02's filters: the four kinds as large chips across the top, and the side rail (topic, Testament, collection, and
// the two switches). Every count is what that choice would give with the other filters kept.
import type { CSSProperties, ReactNode } from "react";
import type { BankTopic, QuestionBank } from "@/lib/data";
import { KINDS, type Facets, type Filters } from "./model";

type Update = (patch: Partial<Filters>) => void;

export function KindChips({ facets, filters, update }: { facets: Facets; filters: Filters; update: Update }) {
  const counts = facets.counts.kind;
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return <div className="qp-kinds" role="group" aria-label="Kind of question">
    {KINDS.map(({ id, label, note, tone, Icon }) => {
      const n = id ? counts.get(id) ?? 0 : total;
      return <button key={label} type="button" className="qp-kind" aria-pressed={filters.kind === id} style={{ "--tone": tone } as CSSProperties}
        onClick={() => update({ kind: id, topic: "", collection: "" })}>
        <span className="qp-kind-icon"><Icon size={20} strokeWidth={1.5} aria-hidden /></span>
        <span className="qp-kind-text"><strong>{label}</strong><small>{note}</small></span>
        <span className="qp-kind-n">{n.toLocaleString()}</span>
      </button>;
    })}
  </div>;
}

export function FilterRail({ bank, facets, filters, update, testMode, setTestMode }:
  { bank: QuestionBank; facets: Facets; filters: Filters; update: Update; testMode: boolean; setTestMode: (on: boolean) => void }) {
  const t = facets.counts.testament;
  const collections = bank.collections.filter((c) => !filters.kind || c.kind === filters.kind);
  return <aside className="qp-rail" aria-label="Filters">
    <TopicList topics={bank.topics} counts={facets.counts.topic} selected={filters.topic} onChoose={(topic) => update({ topic })} />
    <RailGroup title="Testament">
      <div className="qp-segments" role="group" aria-label="Testament">
        {([["", "Both"], ["OT", "Old"], ["NT", "New"]] as const).map(([id, label]) =>
          <button key={label} type="button" aria-pressed={filters.testament === id} onClick={() => update({ testament: id })}>
            {label}<small>{(id ? t.get(id) ?? 0 : [...t.values()].reduce((a, b) => a + b, 0)).toLocaleString()}</small>
          </button>)}
      </div>
    </RailGroup>
    <RailGroup title="Collection">
      <select className="qp-select" value={filters.collection} onChange={(e) => update({ collection: e.target.value })} aria-label="Collection">
        <option value="">Every collection</option>
        {collections.map((c) => <option key={c.title} value={c.title}>{c.title} ({(facets.counts.collection.get(c.title) ?? 0).toLocaleString()})</option>)}
      </select>
    </RailGroup>
    <RailGroup title="Show">
      <Switch on={filters.choices} onChange={(choices) => update({ choices })}>Multiple choice only</Switch>
      <Switch on={testMode} onChange={setTestMode}>Test yourself: hide the answers</Switch>
    </RailGroup>
  </aside>;
}

function TopicList({ topics, counts, selected, onChoose }: { topics: BankTopic[]; counts: Map<string, number>; selected: string; onChoose: (id: string) => void }) {
  const max = Math.max(1, ...counts.values());
  const groups: [string, BankTopic[]][] = [["The Bible's story", topics.filter((t) => t.group === "story")],
    ["Christian teaching", [...topics.filter((t) => t.group === "teaching"), { id: "none", title: "Other questions", group: "teaching" }]]];
  return <>{groups.map(([title, items]) => {
    const shown = items.filter((t) => counts.get(t.id) || selected === t.id);
    if (!shown.length) return null;
    return <RailGroup key={title} title={title}>
      <ul className="qp-topics">{shown.map((t) => {
        const n = counts.get(t.id) ?? 0, on = selected === t.id;
        return <li key={t.id}><button type="button" aria-pressed={on} onClick={() => onChoose(on ? "" : t.id)} style={{ "--share": `${(n / max) * 100}%` } as CSSProperties}>
          <span>{t.title}</span><small>{n.toLocaleString()}</small>
        </button></li>;
      })}</ul>
    </RailGroup>;
  })}</>;
}

function RailGroup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="qp-rail-group"><h3>{title}</h3>{children}</div>;
}

function Switch({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return <button type="button" role="switch" aria-checked={on} className="qp-switch" onClick={() => onChange(!on)}>
    <span className="qp-switch-track" aria-hidden><span /></span>{children}
  </button>;
}
