// 06 · By the numbers: scholars per field, per age, per faith and how many this site uses. Every row is also a filter
// for the catalogue: clicking it adds or removes that filter (through filterCatalogue) and brings the catalogue into
// view. The darker part of a bar is how many of that group the catalogue shows right now (`shownIds`); pressed rows
// follow the shared `filters`. Approved mock-up: design/scholars-directions/scholars/numbers.js.
import { useMemo } from "react";
import type { Era, Field, ScholarsData } from "@/data/teachers/pages-types";
import { SectionHead } from "../shared/Frame";
import { useScholars, type CatalogueFilters } from "./context";
import { toggled, type FacetKey } from "./catalogue/filtering";
import { eraParts, isUsed } from "./marks/facts";
import { FieldIcon } from "./marks/Mark";
import { toneStyle } from "./marks/shapes";
import { countWord } from "./numbers/words";
import "./Numbers.css";

interface RowsProps { data: ScholarsData; filters: CatalogueFilters; shown: ReadonlySet<string>; onToggle: (key: FacetKey, value: string) => void }

function Bars({ data, filters, shown, onToggle, facet, explain }: RowsProps & { facet: "field" | "faith"; explain: string }) {
  const labels: Record<string, string> = data[`${facet}s`];
  const total = (value: string) => data.scholars.filter((s) => s[facet] === value).length;
  const top = Math.max(...Object.keys(labels).map(total));
  return <>
    <ul className="num-bars">{Object.entries(labels).map(([value, label]) => {
      const n = total(value), now = data.scholars.filter((s) => s[facet] === value && shown.has(s.id)).length, share = `${n / top * 100}%`;
      return <li key={value}><button type="button" className="num-row" data-facet={facet} data-value={value} aria-pressed={(filters[facet] as readonly string[]).includes(value)}
        style={facet === "field" ? toneStyle(value as Field) : undefined} onClick={() => onToggle(facet, value)}>
        <span className="num-l">{facet === "field" && <FieldIcon field={value as Field} size={12} />}{label}</span>
        <span className="num-track"><i style={{ width: share }} /><b style={{ width: share, transform: `scaleX(${n ? now / n : 0})` }} /></span>
        <span className="num-n">{now === n ? <b>{n}</b> : <><b>{now}</b> of {n}</>}</span></button></li>;
    })}</ul>
    <p className="num-explain">{explain}</p>
  </>;
}

function EraDots({ data, filters, shown, onToggle }: RowsProps) {
  return <>
    <ul className="num-dots">{(Object.keys(data.eras) as Era[]).map((era) => {
      const [name, span] = eraParts(data, era), people = data.scholars.filter((s) => s.era === era);
      return <li key={era}><button type="button" className="num-row num-dotrow" data-facet="era" data-value={era} aria-pressed={filters.era.includes(era)} onClick={() => onToggle("era", era)}>
        <span className="num-l">{name} <small>{span}</small></span><span className="num-n"><b>{people.length}</b></span>
        <span className="num-dotset">{people.map((s) => <i key={s.id} data-id={s.id} className={shown.has(s.id) ? undefined : "num-off"} style={toneStyle(s.field)} title={s.short} />)}</span></button></li>;
    })}</ul>
    <p className="num-explain">One dot per scholar, coloured by field and placed in the age they lived in. Click an age to filter.</p>
  </>;
}

function OnThisSite({ data, filters, shown, onUsed }: Omit<RowsProps, "onToggle"> & { onUsed: () => void }) {
  const live = data.scholars.filter(isUsed).length, held = data.scholars.filter((s) => s.site?.status === "held").length, total = data.scholars.length;
  return <>
    <button type="button" className="num-row num-site" data-used aria-pressed={filters.used} onClick={onUsed}>
      <span className="num-big"><b>{live}</b><span>of {total} are used live on this site</span></span>
      <span className="num-grid">{data.scholars.map((s) => <i key={s.id} data-id={s.id} className={`num-${s.site?.status ?? "none"}${shown.has(s.id) ? "" : " num-off"}`} title={s.short} />)}</span>
      <span className="num-key"><span><i className="num-in-use" />Used live {live}</span><span><i className="num-held" />In the library {held}</span><span><i className="num-none" />Not yet {total - live - held}</span></span>
    </button>
    <p className="num-explain">One square per scholar. Click to show only the ones this site uses.</p>
  </>;
}

export function Numbers() {
  const { data, filters, filterCatalogue, shownIds } = useScholars();
  const shown = useMemo(() => new Set(shownIds), [shownIds]);
  const rows: RowsProps = { data, filters, shown, onToggle: (key, value) => filterCatalogue(toggled(filters, key, value)) };
  const word = countWord(data.scholars.length);
  return <>
    <SectionHead num="06" kicker="By the numbers" title={<>The {word}, <em>counted</em></>}
      line="How they fall by field, age and faith. Every bar is also a filter: click one to narrow the catalogue above." />
    <div className="num-strip">
      <div className="num-card"><h3>By field</h3><Bars {...rows} facet="field" explain="Scholars in each field. The darker part is how many the catalogue is showing now." /></div>
      <div className="num-card"><h3>By age</h3><EraDots {...rows} /></div>
      <div className="num-card"><h3>By faith</h3><Bars {...rows} facet="faith" explain="Every scholar is labelled for what they were, Christian or not." /></div>
      <div className="num-card"><h3>On this site</h3><OnThisSite data={data} filters={filters} shown={shown} onUsed={() => filterCatalogue({ ...filters, used: !filters.used })} /></div>
    </div>
  </>;
}
