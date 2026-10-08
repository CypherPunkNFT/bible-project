// 04 · Five ways to study the Bible (approved mock-up: design/scholars-directions/scholars/fields.js): the five fields as
// cards side by side. Choosing one widens it (the grid's columns animate; the row height never changes) to show its
// people, one line each, and a small link that filters the catalogue to that field. On narrow screens the cards stack
// and open in place (and close again). People open the shared profile.
import { useMemo, useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import type { Field, Scholar } from "@/data/teachers/pages-types";
import { SectionHead } from "../shared/Frame";
import { faithOf, toneOf, yearsOf } from "./built/labels";
import { Mark } from "./marks/Mark";
import { useScholars } from "./context";
import "./Fields.css";

interface Group { key: Field; label: string; people: Scholar[] }

const spanOf = (people: Scholar[]) => {
  const a = people[0], b = people[people.length - 1];
  return people.length === 1 ? a.short : `From ${a.short} to ${b.short}, ${a.circa ? "c. " : ""}${a.born}–${b.died}`;
};

export function Fields() {
  const { data, openProfile, filterCatalogue } = useScholars();
  const groups = useMemo<Group[]>(() => (Object.entries(data.fields) as [Field, string][])
    .map(([key, label]) => ({ key, label, people: data.scholars.filter((s) => s.field === key) }))
    .filter((g) => g.people.length), [data]);
  // The last card chosen keeps the wide column; on narrow screens choosing it again closes it in place.
  const [choice, setChoice] = useState<{ key: Field; open: boolean; picked: boolean }>({ key: "texts", open: true, picked: false });
  const columns = groups.map((g) => (g.key === choice.key ? "3.4fr" : "1fr")).join(" ");

  const choose = (key: Field) => {
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    setChoice((c) => ({ key, open: !(c.key === key && c.open && narrow), picked: true }));
  };

  return <>
    <SectionHead num="04" kicker="Fields" title={<>Five ways to <em>study the Bible</em></>}
      line="Every scholar here worked mainly in one of five fields. Choose a field to see its people." />
    <div className={`fld-grid${choice.picked ? " fld-picked" : ""}`} style={{ "--cols": columns } as CSSProperties}>
      {groups.map((g) => {
        const sel = choice.open && choice.key === g.key;
        return <article key={g.key} className={`fld-card${sel ? " fld-sel" : ""}`} data-field={g.key} style={{ "--tone": `var(${toneOf(g.key)})` } as CSSProperties}>
          <button type="button" className="fld-head" aria-expanded={sel} aria-controls={`fld-list-${g.key}`} onClick={() => choose(g.key)}>
            <span className="fld-count">{g.people.length} scholar{g.people.length === 1 ? "" : "s"}</span>
            <h3>{g.label}</h3>
            <span className="fld-span">{spanOf(g.people)}</span>
            <span className="fld-avatars" aria-hidden="true">{g.people.map((s) => <Mark key={s.id} scholar={s} size={28} />)}</span>
            <span className="fld-open" aria-hidden="true"><ArrowRight size={16} /></span>
          </button>
          <div className="fld-body" id={`fld-list-${g.key}`}><div className="fld-body-in">
            <ul className="fld-people">{g.people.map((s) => <li key={s.id}>
              <button type="button" data-scholar={s.id} onClick={(e) => openProfile(s.id, e.currentTarget)}>
                <Mark scholar={s} size={28} />
                <span><b>{s.name}</b><small>{yearsOf(s)} · {faithOf(data, s)}</small><em>{s.line}</em></span>
              </button>
            </li>)}</ul>
            <button type="button" className="fld-cat" onClick={() => filterCatalogue({ field: [g.key] })}>See them in the catalogue <ArrowRight size={14} /></button>
          </div></div>
        </article>;
      })}
    </div>
  </>;
}
