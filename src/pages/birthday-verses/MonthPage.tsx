// A month page, /birthday-verses/march (design 6.2): one row per date with its reference and stored note, the previous
// and next month, and the way back. Loads no verse words.
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { HUB_PATH, datePath, monthDates, monthPath } from "./dates";
import { dateName, monthName } from "./format";
import { birthdayPassage, passageReference } from "./verse";

export function MonthPage({ month }: { month: number }) {
  const catalog = useCatalog();
  const name = monthName(month);
  const previous = month === 1 ? 12 : month - 1;
  const next = month === 12 ? 1 : month + 1;
  return (
    <article className="bv-page mx-auto max-w-5xl px-4 sm:px-6">
      <nav className="bv-crumbs" aria-label="Breadcrumb"><Link to={HUB_PATH}>Birthday verses</Link> › <span>{name}</span></nav>
      <h1>{`${name} Birthday Bible Verses`}</h1>
      <p className="bv-intro">{`A verse for every day in ${name}, each with a card to send.`}</p>
      <ol className="bv-rows">
        {monthDates(month).map((date) => {
          const passage = birthdayPassage(date);
          return (
            <li key={date}>
              <Link to={datePath(date)} className="bv-row-date">{dateName(date)}</Link>
              {passage && <span className="bv-ref">{passageReference(catalog, passage)}</span>}
              {passage && <span className="bv-note">{passage.note}</span>}
            </li>
          );
        })}
      </ol>
      <nav className="bv-around" aria-label="Other months">
        <Link to={monthPath(previous)}>{`Previous month: ${monthName(previous)}`}</Link>
        <Link to={monthPath(next)}>{`Next month: ${monthName(next)}`}</Link>
        <Link to={HUB_PATH}>All birthday verses</Link>
      </nav>
    </article>
  );
}
