// The directory's groups and rows: an era heading with its count, or a surname letter in a narrow gutter; each row gives
// years, faith and field, and a mark when the site uses their work (filled: a live feature; ring: in the library).
import { memo, type CSSProperties } from "react";
import type { Scholar, ScholarsData } from "@/data/teachers/pages-types";
import { faithOf, toneOf, yearsOf } from "../built/labels";
import { USE_LABEL, type Group, type Mode } from "./groups";

const Row = memo(function Row({ data, s }: { data: ScholarsData; s: Scholar }) {
  const st = s.site?.status;
  return <li data-id={s.id}>
    <button type="button" data-scholar={s.id} style={{ "--tone": `var(${toneOf(s.field)})` } as CSSProperties}>
      <i className="dir-dot" aria-hidden="true" /><span className="dir-nm">{s.name}</span><span className="dir-yr">{yearsOf(s)}</span>
      <span className="dir-meta">{faithOf(data, s)} · {data.fields[s.field]}</span>
      {st ? <span className={`dir-use dir-use-${st} dir-mark`} title={USE_LABEL[st]} aria-label={USE_LABEL[st]} /> : <span className="dir-mark" aria-hidden="true" />}
    </button>
  </li>;
});

export function Groups({ data, groups, mode }: { data: ScholarsData; groups: Group[]; mode: Mode }) {
  return <>{groups.map((g) => mode === "era"
    ? <div key={`era-${g.key}`} className="dir-group dir-group-era"><h3 className="dir-gh">{g.label}<span>{g.people.length}</span></h3>
      <ul>{g.people.map((s) => <Row key={s.id} data={data} s={s} />)}</ul></div>
    : <div key={`az-${g.key}`} className="dir-group dir-group-az"><span className="dir-gh dir-letter">{g.label}</span>
      <ul>{g.people.map((s) => <Row key={s.id} data={data} s={s} />)}</ul></div>)}</>;
}
