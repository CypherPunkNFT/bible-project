// Section 03, every unit (design section 2): one table per kind, each unit with its size today, how it relates to the
// others, how sure the size is and where it comes from, the Berean's note word for word. Then the measures with no
// fixed size. Tables sit in a labelled scroll area so a phone can pan them.
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { choiceSearch } from "./choice";
import { writeToday } from "./modern";
import { CONFIDENCE_LABELS, KINDS, NO_FIXED_SIZE, unitsOf } from "./units";
import { verseHref, verseReference } from "./verse";

export function UnitTables({ wage }: { wage: number }) {
  const catalog = useCatalog();
  return <>
    {KINDS.map((kind) => <div key={kind.key} className="cv-kind">
      <h3>{kind.title}</h3>
      <p className="cv-quiet">{kind.text}</p>
      <div className="cv-scroll" role="region" aria-label={kind.title} tabIndex={0}>
        <table className="cv-table cv-units">
          <thead><tr>
            <th scope="col">Unit</th>
            <th scope="col">{kind.key === "money" ? "Work and dollars" : "Size today"}</th>
            <th scope="col">How it relates</th>
            <th scope="col">Where it comes from</th>
          </tr></thead>
          <tbody>
            {unitsOf(kind.key).map((unit) => {
              const [first, second] = writeToday(unit.kind, unit.size, wage);
              return <tr key={unit.id}>
                <th scope="row">
                  <Link to={`${choiceSearch(unit.kind, unit.id, 1)}#convert`}>{unit.name}</Link>
                  {unit.alsoCalled && <span className="cv-also">{`Also called: ${unit.alsoCalled}`}</span>}
                </th>
                <td className="cv-size">{first}<br />{second}</td>
                <td>{unit.equals}{unit.caution && <p className="cv-caution">{unit.caution}</p>}</td>
                <td>
                  <span className={`cv-sure cv-sure-${unit.confidence}`}>{CONFIDENCE_LABELS[unit.confidence]}</span>
                  {unit.berean
                    ? <p className="cv-note"><Link to={verseHref(catalog, unit.berean.verse)}>{verseReference(catalog, unit.berean.verse)}</Link>: <q>{unit.berean.text}</q></p>
                    : <p className="cv-note">Found in <Link to={verseHref(catalog, unit.verse)}>{verseReference(catalog, unit.verse)}</Link></p>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>)}
    <div className="cv-kind">
      <h3>Measures with no fixed size</h3>
      <p className="cv-quiet">The Bible also measures by what people could do. These had no set size, so the tool gives no number for them.</p>
      <dl className="cv-loose">
        {NO_FIXED_SIZE.map((item) => <div key={item.name}>
          <dt>{item.name}</dt>
          <dd>{item.text} <Link to={verseHref(catalog, item.verse)}>{verseReference(catalog, item.verse)}</Link></dd>
        </div>)}
      </dl>
    </div>
  </>;
}
