// 08 · Everyone, by where they served (ported from design/authors-directions/teachers/directory.js): all the teachers
// grouped by the country or region where each lived longest after their birthplace, with the town, their years and how
// many of their works the library holds; a name/town search and family chips narrow the list; a row opens the profile.
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Person } from "@/data/teachers/pages-types";
import { SectionHead } from "../shared/Frame";
import { FAMILIES, formatNumber, lifeLabel } from "../shared/people";
import { usePreachers } from "./context";
import { cssVars, toneOf } from "./drawer/helpers";
import { filterIntoColumns, regionGroups, type ShownGroup } from "./directory/regions";
import "./directory.css";

function WorksCount({ person }: { person: Person }) {
  const n = person.works;
  if (!n) return <span className="dir-wk"><span className="dir-none">no works yet</span></span>;
  return <span className="dir-wk" title={`${formatNumber(n)} of their works in the library`}><b>{formatNumber(n)}</b> {n === 1 ? "work" : "works"}</span>;
}

function Group({ group, onOpen }: { group: ShownGroup; onOpen: (id: string, origin: Element) => void }) {
  const count = group.rows.length;
  return <section className="dir-group" style={{ order: group.order }}>
    <h3>{group.region}<span>{count} {count === 1 ? "teacher" : "teachers"}</span></h3>
    <ul>{group.rows.map(({ person, town }) => <li key={person.id}>
      <button type="button" onClick={(event) => onOpen(person.id, event.currentTarget)}>
        <i className="dir-dot" style={cssVars({ "--tone": toneOf(person) })} />
        <span className="dir-nm">{person.name}</span>
        <span className="dir-town">{town}</span>
        <span className="dir-yr">{lifeLabel(person)}</span>
        <WorksCount person={person} />
      </button>
    </li>)}</ul>
  </section>;
}

export function Directory() {
  const { data, openProfile } = usePreachers();
  const people = data.people;
  const groups = useMemo(() => regionGroups(people), [people]);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const { shown, columns } = useMemo(() => filterIntoColumns(groups, query, family), [groups, query, family]);
  const open = (id: string, origin: Element) => openProfile(id, origin);
  const familyLabel = FAMILIES.find((f) => f.key === family)?.label;

  return <>
    <SectionHead num="08" kicker="Everyone" title={<>All {people.length}, <em>by where they served</em></>}
      line="Grouped by the country where each one lived longest after their birthplace, with the town and how many of their works the library holds. Choose a name to open the profile." />
    <div className="dir-tools">
      <label className="dir-search">
        <Search size={15} strokeWidth={1.5} aria-hidden />
        <input type="search" placeholder="Find a name or a town" aria-label="Find a name or a town" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="dir-chips" role="group" aria-label="Family">
        {FAMILIES.map((f) => <button key={f.key} type="button" aria-pressed={f.key === family} style={cssVars({ "--tone": `var(${f.tone})` })}
          onClick={() => setFamily((current) => (current === f.key ? null : f.key))}><i />{f.label}</button>)}
      </div>
      <span className="dir-count" role="status">{shown} of {people.length} teachers</span>
    </div>
    <div className="dir-list">
      {shown ? columns.map((column, i) => <div key={i} className="dir-col">{column.map((g) => <Group key={g.region} group={g} onOpen={open} />)}</div>)
        : <p className="dir-empty">No one matches{query.trim() ? ` “${query.trim()}”` : ""}{familyLabel ? ` among the ${familyLabel}` : ""}.</p>}
    </div>
  </>;
}
