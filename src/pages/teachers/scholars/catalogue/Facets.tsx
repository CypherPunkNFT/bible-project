// The catalogue's filter panel: search, the "used on this site" switch, and the field / era / faith options, each with
// how many would show if it were added, given every other filter. On narrow screens it becomes rows of chips (CSS).
import { Search } from "lucide-react";
import type { Era, Field, ScholarsData } from "@/data/teachers/pages-types";
import type { CatalogueFilters } from "../context";
import { eraParts, isUsed } from "../marks/facts";
import { FieldIcon } from "../marks/Mark";
import { toneStyle } from "../marks/shapes";
import { FACETS, facetLabels, hasFilters, passes, type FacetKey } from "./filtering";

interface FacetsProps {
  data: ScholarsData; filters: CatalogueFilters; haystack: Map<string, string>; text: string;
  onText: (text: string) => void; onToggle: (key: FacetKey, value: string) => void; onUsed: () => void; onClear: () => void;
}

function OptionIcon({ facet, value }: { facet: FacetKey; value: string }) {
  if (facet === "field") return <FieldIcon field={value as Field} size={14} />;
  if (facet === "era") return <i className={`cat-era-ic cat-era-${value}`} />;
  return <i className="cat-faith-ic" />;
}

function OptionLabel({ data, facet, value, label }: { data: ScholarsData; facet: FacetKey; value: string; label: string }) {
  if (facet !== "era") return <>{label}</>;
  const [name, span] = eraParts(data, value as Era);
  return <>{name} <small>{span}</small></>;
}

export function Facets({ data, filters, haystack, text, onText, onToggle, onUsed, onClear }: FacetsProps) {
  const usedCount = data.scholars.filter((s) => isUsed(s) && passes(s, filters, haystack, "used")).length;
  return <aside className="cat-side" aria-label="Filter the scholars">
    <div className="cat-side-head"><span className="kicker">Filter</span>
      <button type="button" className="cat-clear" hidden={!hasFilters(filters)} onClick={onClear}>Clear all</button></div>
    <label className="cat-search"><Search size={16} aria-hidden="true" />
      <input type="search" placeholder="Name, place or work" aria-label="Search the scholars" autoComplete="off" value={text} onChange={(e) => onText(e.target.value)} /></label>
    <button type="button" className="cat-used" role="switch" aria-checked={filters.used} onClick={onUsed}>
      <span className="cat-sw"><i /></span><span className="cat-used-l">Used on this site</span><em>{usedCount}</em></button>
    {FACETS.map(({ key, title }) => <div key={key} className="cat-facet" data-facet={key}><h3>{title}</h3><div className="cat-opts">
      {Object.entries(facetLabels(data, key)).map(([value, label]) => {
        const on = (filters[key] as readonly string[]).includes(value);
        const n = data.scholars.filter((s) => s[key] === value && passes(s, filters, haystack, key)).length;
        return <button key={value} type="button" className={`cat-opt${!n && !on ? " cat-opt-zero" : ""}`} data-facet={key} data-value={value} aria-pressed={on}
          style={key === "field" ? toneStyle(value as Field) : undefined} onClick={() => onToggle(key, value)}>
          <span className="cat-opt-ic"><OptionIcon facet={key} value={value} /></span>
          <span className="cat-opt-l"><OptionLabel data={data} facet={key} value={value} label={label} /></span><em>{n}</em></button>;
      })}
    </div></div>)}
  </aside>;
}
