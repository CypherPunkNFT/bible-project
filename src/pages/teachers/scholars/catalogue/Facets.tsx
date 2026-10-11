// The catalogue's filter panel: search, the "used on this site" switch, and the field / era / faith options, each with
// how many would show if it were added, given every other filter. On narrow screens it becomes rows of chips (CSS).
import { Search } from "lucide-react";
import type { Era, Field, ScholarsData } from "@/data/teachers/pages-types";
import type { CatalogueFilters } from "../context";
import { eraParts, isUsed } from "../marks/facts";
import { FieldIcon } from "../marks/Mark";
import { toneStyle } from "../marks/shapes";
import { FACETS, facetLabels, hasFilters, type FacetKey } from "./filtering";
import { matchesLibrary, libraryEra, libraryFields, type LibraryPerson, type LibraryOptions } from "./library";
import { FIELD_COLLECTIONS } from "../field-library";

interface FacetsProps {
  data: ScholarsData; filters: CatalogueFilters; people: LibraryPerson[]; options: LibraryOptions; onOptions: (next: LibraryOptions) => void; text: string;
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

export function Facets({ data, filters, people, options, onOptions, text, onText, onToggle, onUsed, onClear }: FacetsProps) {
  const usedCount = people.filter(p => p.scholar && isUsed(p.scholar) && matchesLibrary(p, filters, options, "used")).length;
  return <aside className="cat-side" aria-label="Filter the scholars">
    <div className="cat-side-head"><span className="kicker">Filter</span>
      <button type="button" className="cat-clear" hidden={!hasFilters(filters) && !Object.values(options).some(Boolean)} onClick={onClear}>Clear all</button></div>
    <label className="cat-search"><Search size={16} aria-hidden="true" />
      <input type="search" placeholder="Name, place or work" aria-label="Search the scholars" autoComplete="off" value={text} onChange={(e) => onText(e.target.value)} /></label>
    <div className="cat-library-filters">
      <label>Collection<select aria-label="Collection" value={options.collection} onChange={e => onOptions({ ...options, collection: e.target.value })}><option value="">All collections</option>{FIELD_COLLECTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>Entry<select aria-label="Entry type" value={options.scope} onChange={e => onOptions({ ...options, scope: e.target.value })}><option value="">All contributors</option><option value="profiles">Documented profiles</option><option value="library">Library entries</option></select></label>
      <label>Role<select aria-label="Contributor role" value={options.role} onChange={e => onOptions({ ...options, role: e.target.value })}><option value="">All roles</option>{[...new Set(people.flatMap(p => p.roles))].sort().map(role => <option key={role} value={role}>{role}</option>)}</select></label>
      <label className="cat-checkbox"><input type="checkbox" checked={options.unclassified} onChange={e => onOptions({ ...options, unclassified: e.target.checked })} />No assigned field</label>
      <label className="cat-checkbox"><input type="checkbox" checked={options.expertiseOnly} onChange={e => onOptions({ ...options, expertiseOnly: e.target.checked })} />Use documented expertise for fields</label>
    </div>
    <button type="button" className="cat-used" role="switch" aria-checked={filters.used} onClick={onUsed}>
      <span className="cat-sw"><i /></span><span className="cat-used-l">Used on this site</span><em>{usedCount}</em></button>
    {FACETS.map(({ key, title }) => <div key={key} className="cat-facet" data-facet={key}><h3>{key === "field" ? options.expertiseOnly ? "Documented expertise" : "Work subjects" : title}</h3><div className="cat-opts">
      {Object.entries(facetLabels(data, key)).map(([value, label]) => {
        const on = (filters[key] as readonly string[]).includes(value);
        const n = people.filter(p => (key === 'field' ? libraryFields(p, options.expertiseOnly).includes(value) : (key === 'faith' ? p.scholar?.faith ?? 'unrecorded' : libraryEra(p)) === value) && matchesLibrary(p, filters, options, key)).length;
        return <button key={value} type="button" className={`cat-opt${!n && !on ? " cat-opt-zero" : ""}`} data-facet={key} data-value={value} aria-pressed={on}
          style={key === "field" ? toneStyle(value as Field) : undefined} onClick={() => onToggle(key, value)}>
          <span className="cat-opt-ic"><OptionIcon facet={key} value={value} /></span>
          <span className="cat-opt-l"><OptionLabel data={data} facet={key} value={value} label={label} /></span><em>{n}</em></button>;
      })}
    </div>{key === "era" && <label className="cat-checkbox"><input aria-label="Era unknown" type="checkbox" checked={options.unknownEra} onChange={e => onOptions({ ...options, unknownEra: e.target.checked })} />Era unknown <span>{people.filter(p => !libraryEra(p) && matchesLibrary(p, filters, options, "era")).length.toLocaleString()}</span></label>}</div>)}
    <p className="cat-coverage">Era uses documented profiles or interpretable source dates; death-only dates and conflicts remain unknown. Subject matches describe works, not qualifications. Faith is recorded only for documented profiles.</p>
  </aside>;
}
