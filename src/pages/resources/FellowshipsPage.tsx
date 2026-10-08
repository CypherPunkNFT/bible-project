// /resources/fellowships: national fellowships from fellowships.json, grouped as the research grouped them, filtered by
// who each is for and how it meets. Each row opens in place with what it is, its cost, where to find a group, its
// statement of faith and when and where it was checked. Nothing here is written by hand about a fellowship.
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Fellowship, FellowshipsData } from "@/data/resources";
import { Checked, ResourceShell } from "./Shell";

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const sorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
// "all" in the data means a fellowship open to anyone ("Anyone"); the filter's "Everyone" (no value) means no filter.
const sentence = (text: string) => (text === "all" ? "Anyone" : text.charAt(0).toUpperCase() + text.slice(1));

export default function FellowshipsPage({ data }: { data: FellowshipsData }) {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<string[]>([]);
  const all = data.groups.flatMap((g) => g.entries);
  const who = params.get("for") ?? "", how = params.get("meets") ?? "", query = (params.get("q") ?? "").trim().toLowerCase();
  const matches = (f: Fellowship) => (!who || f.for.includes(who)) && (!how || f.meets.includes(how)) && (!query || `${f.name} ${f.summary}`.toLowerCase().includes(query));
  const groups = data.groups.map((g) => ({ ...g, entries: g.entries.filter(matches) })).filter((g) => g.entries.length);
  const shown = groups.reduce((n, g) => n + g.entries.length, 0);
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next, { replace: true }); };
  const toggle = (id: string) => setOpen((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  return <ResourceShell slug="fellowships"
    lead="National fellowships that gather believers to pray and to study the word together. Each one says who it is for, how it meets and what it costs, with its own group finder and statement of faith."
    stats={[["Fellowships", all.length], ["Kinds", data.groups.length], ["Group finders", all.filter((f) => f.locator).length], ["Checked", data.checked]]}
    note="How this list is made: every fact is copied from the fellowship’s own pages, and each entry links to the page it was checked on. Listing a fellowship is not an endorsement of every group that meets under its name.">
    <div className="tl-filters">
      <label className="tl-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Find a fellowship</span><input type="search" value={params.get("q") ?? ""} placeholder="Find a fellowship" onChange={(e) => change("q", e.target.value)} /></label>
      <Chips label="For" value={who} onChange={(v) => change("for", v)} options={[["", "Everyone"], ...sorted(all.flatMap((f) => f.for)).map((v) => [v, sentence(v)] as [string, string])]} />
      <Chips label="Meets" value={how} onChange={(v) => change("meets", v)} options={[["", "Any way"], ...sorted(all.flatMap((f) => f.meets)).map((v) => [v, sentence(v)] as [string, string])]} />
    </div>
    <p className="tl-status" role="status">{plural(shown, "fellowship")}{shown < all.length ? ` of ${all.length}` : ""}</p>
    {shown === 0 ? <p className="tl-empty">No fellowship matches these filters. <button type="button" onClick={() => setParams({}, { replace: true })}>Clear the filters</button></p> :
      groups.map((g) => <section key={g.id} aria-labelledby={`fg-${g.id}`}>
        <div className="rs-group-title"><span>{String(data.groups.findIndex((x) => x.id === g.id) + 1).padStart(2, "0")}</span><h2 id={`fg-${g.id}`}>{g.title}</h2><small>{plural(g.entries.length, "fellowship")}</small></div>
        <ol className="tl-list" style={{ borderTop: 0 }}>{g.entries.map((f) => <Row key={f.id} fellowship={f} open={open.includes(f.id)} onToggle={() => toggle(f.id)} />)}</ol>
      </section>)}
  </ResourceShell>;
}

function Chips({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <div className="tl-chips" role="group" aria-label={label}><span>{label}</span>{options.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>)}</div>;
}

function Row({ fellowship: f, open, onToggle }: { fellowship: Fellowship; open: boolean; onToggle: () => void }) {
  const panel = `fp-${f.id}`;
  return <li className="tl-row" data-open={open || undefined}>
    <button type="button" className="tl-head rs-fhead" aria-expanded={open} aria-controls={panel} onClick={onToggle}>
      <span className="tl-name">{f.name}</span>
      <span className="tl-trad">{f.for.map(sentence).join(" · ")}</span>
      <span className="tl-sum">{f.meets.map(sentence).join(" · ")}</span>
      <Plus className="tl-plus" size={18} aria-hidden="true" />
    </button>
    {open && <div id={panel} className="tl-panel">
      <div className="tl-col">
        <p className="rs-summary">{f.summary}</p>
        <div className="rs-actions">
          {f.locator && <a href={f.locator} target="_blank" rel="noreferrer">Find a group<ArrowUpRight size={14} aria-hidden="true" /></a>}
          {f.faith && <a href={f.faith} target="_blank" rel="noreferrer">Statement of faith<ArrowUpRight size={14} aria-hidden="true" /></a>}
        </div>
      </div>
      <div className="tl-col">
        <dl className="rs-facts">
          <div><dt>Who it is for</dt><dd>{f.for.map(sentence).join(", ")}</dd></div>
          <div><dt>How it meets</dt><dd>{f.meets.map(sentence).join(", ")}</dd></div>
          {f.cost && <div><dt>Cost</dt><dd>{f.cost}</dd></div>}
          {f.jacksonville && <div><dt>In Jacksonville</dt><dd>{f.jacksonville}</dd></div>}
        </dl>
        <Checked date={f.checked} source={f.source} />
      </div>
    </div>}
  </li>;
}
