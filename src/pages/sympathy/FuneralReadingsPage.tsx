// /sympathy/funeral-readings (design 5.6): 47 readings in the order a service often uses them, each folded to its first
// line with "Show reading", its note, labels and reading time, and "Add to our list". At 47 rows it stays under the site's
// long-list threshold, so it renders in full. The chosen list lives in "Our readings" and in the page's own address.
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FUNERAL_HEADING, FUNERAL_HYMNS, FUNERAL_INTRO, FUNERAL_READINGS, PARTICULAR_FAITH_NOTE, PARTICULAR_LIVES, SERVICE_PARTS, SYMPATHY_PATH,
} from "@/data/sympathy";
import { p } from "@/data/life-events/types";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { plural } from "@/lib/site-format";
import { passageReference } from "@/pages/life-events/passage";
import { BelieverLabel } from "./PassageList";
import { ExploreMore, LoadState, SourceLine } from "./parts";
import { ReadingsPanel } from "./ReadingsPanel";
import { readingTime } from "./reading-text";
import { useScrollToHash } from "./scroll";
import { useReadingList } from "./useReadingList";
import { useSympathyPassages, type ShownSympathy } from "./useSympathyPassages";

function ReadingRow({ item, chosen, toggle }: { item: ShownSympathy; chosen: boolean; toggle: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const textId = `reading-text-${item.key}`;
  return (
    <li className="sy-passage sy-reading-row" id={`reading-${item.key}`}>
      <div className="sy-passage-head">
        <span className="sy-reference-line">
          <a href={item.readHref} className="sy-reference">{item.reference}</a>
          {item.passage.believer && <BelieverLabel />}
          <small className="sy-reading-time">{readingTime(item.text)}</small>
        </span>
        <label className="sy-check sy-add">
          <input type="checkbox" checked={chosen} onChange={() => toggle(item.key)} aria-label={`Add ${item.reference} to our list`} />
          <span>Add to our list</span>
        </label>
      </div>
      <blockquote id={textId} className={`scripture sy-text${open ? "" : " sy-folded"}`} lang="en">{item.text}</blockquote>
      <button type="button" className="sy-link-button" aria-expanded={open} aria-controls={textId} onClick={() => setOpen((value) => !value)}>
        {open ? <span>Show less</span> : <span>Show reading</span>}
      </button>
      <p className="sy-note">{item.passage.note}</p>
      {item.passage.context && <p className="sy-note sy-context"><strong>In context: </strong>{item.passage.context}</p>}
    </li>
  );
}

function ParticularLives() {
  const catalog = useCatalog();
  const name = (book: number) => bookByNum(catalog, book)?.name ?? `Book ${book}`;
  return (
    <section className="sy-particular" aria-labelledby="sy-particular-title">
      <h2 id="sy-particular-title">Readings for a particular life</h2>
      <dl>
        {PARTICULAR_LIVES.map((group) => (
          <div key={group.title}>
            <dt>{group.title}</dt>
            <dd>{group.items.map((item) => {
              const label = passageReference(p(item.reference, "reading", "-"), name);
              return item.href.startsWith("#") ? <a key={item.reference} href={item.href}>{label}</a> : <Link key={item.reference} to={item.href}>{label}</Link>;
            })}</dd>
          </div>
        ))}
      </dl>
      <p className="sy-note">{PARTICULAR_FAITH_NOTE}</p>
      <h2 id="sy-hymns-title">Hymns</h2>
      <ul className="sy-hymns">{FUNERAL_HYMNS.map((hymn) => <li key={hymn.id}><Link to={`/study/hymns/${hymn.id}`}>{hymn.title}</Link></li>)}</ul>
    </section>
  );
}

export function FuneralReadingsPage() {
  const { state, retry } = useSympathyPassages("funeral", FUNERAL_READINGS);
  const { keys, chosen, skipped, toggle, move } = useReadingList();
  const items = state.status === "ready" ? state.value : null;
  useScrollToHash(Boolean(items));
  const byKey = new Map((items ?? []).map((item) => [item.key, item]));
  const picked = keys.map((key) => byKey.get(key)).filter((item): item is ShownSympathy => Boolean(item));
  return (
    <article className="sy-page sy-funeral mx-auto max-w-6xl px-4 sm:px-6">
      <nav className="sy-crumbs" aria-label="Breadcrumb"><Link to={SYMPATHY_PATH}>Sympathy</Link><span aria-hidden="true"> / </span><span>Funeral readings</span></nav>
      <h1>{FUNERAL_HEADING}</h1>
      <p className="sy-intro">{FUNERAL_INTRO}</p>
      {skipped > 0 && (
        <p className="sy-notice" role="status">{plural(skipped, "One reading in this link could not be found, so it was left out.", "{n} readings in this link could not be found, so they were left out.")}</p>
      )}
      <LoadState state={state} retry={retry} />
      <div className="sy-funeral-grid">
        <div>
          {items && SERVICE_PARTS.map((part) => (
            <section key={part.id} className="sy-role" aria-labelledby={`part-${part.id}`}>
              <h2 id={`part-${part.id}`}>{part.title}</h2>
              <p className="sy-part-what">{part.what}</p>
              <ul className="sy-passages">
                {items.filter((item) => item.passage.servicePart === part.id).map((item) => <ReadingRow key={item.key} item={item} chosen={chosen.has(item.key)} toggle={toggle} />)}
              </ul>
            </section>
          ))}
        </div>
        <ReadingsPanel items={picked} move={move} remove={toggle} failed={state.status === "error"} />
      </div>
      <ParticularLives />
      <ExploreMore funeral={false} />
      <SourceLine />
    </article>
  );
}
