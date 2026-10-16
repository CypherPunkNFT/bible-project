import type { LibraryPerson } from "../catalogue/library";
import { usedEntry } from "../site-evidence";
// The directory's groups and rows: an era heading with its count, or a surname letter in a narrow gutter; each row gives
// years, faith and field, and a mark when the site uses their work (filled: a live feature; ring: in the library).
import { memo, type CSSProperties } from "react";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { dateLabel } from "../population";
import { faithOf, toneOf } from "../built/labels";
import { USE_LABEL, type Group, type Mode } from "./groups";

const Row = memo(function Row({ data, s }: { data: ScholarsData; s: LibraryPerson }) {
  const st = usedEntry(s) ? "in-use" : (s.population ? s.population.counts.publicRecords+s.population.counts.localCopies+s.population.counts.intakeRecords>0 : s.records>0) ? "held" : undefined;
  const field = s.scholar?.field ?? Object.keys(s.fields)[0];
  return <li data-id={s.id}>
    <button type="button" data-scholar={s.id} style={{ "--tone": `var(${field ? toneOf(field as keyof ScholarsData["fields"]) : "--muted"})` } as CSSProperties}>
      <i className="dir-dot" aria-hidden="true" /><span className="dir-nm">{s.name}</span><span className="dir-yr">{dateLabel(s)}</span>
      <span className="dir-meta">{s.scholar ? faithOf(data, s.scholar) : "Faith unrecorded"} · {field ? data.fields[field as keyof ScholarsData["fields"]] : "Subject unassigned"}</span>
      {st ? <span className={`dir-use dir-use-${st} dir-mark`} title={USE_LABEL[st]} aria-label={USE_LABEL[st]} /> : <span className="dir-mark" aria-hidden="true" />}
    </button>
  </li>;
});

export function Groups({ data, groups, mode, limit }: { data: ScholarsData; groups: Group[]; mode: Mode; limit: number }) {
  let remaining = limit;
  const visible = groups.map(g => { const people = g.people.slice(0,remaining); remaining -= people.length; return {...g, total:g.people.length, people}; }).filter(g=>g.people.length);
  return <>{visible.map((g) => mode === "era"
    ? <div key={`era-${g.key}`} className="dir-group dir-group-era"><h3 className="dir-gh">{g.label}<span>{g.total.toLocaleString()}</span></h3>
      <ul>{g.people.map((s) => <Row key={s.id} data={data} s={s} />)}</ul></div>
    : <div key={`az-${g.key}`} className="dir-group dir-group-az"><span className="dir-gh dir-letter">{g.label}</span>
      <ul>{g.people.map((s) => <Row key={s.id} data={data} s={s} />)}</ul></div>)}</>;
}
