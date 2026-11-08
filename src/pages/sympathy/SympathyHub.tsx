// /sympathy (design 5.3): the twelve loss pages and the funeral readings, the hub's own verses for any loss, the guide to
// what to write in a sympathy card, and the card maker.
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FUNERAL_HEADING, FUNERAL_PATH, HUB_SET, KEEP_SHOWING_UP, LEAVE_OUT, LINES_TO_USE, LOSS_SETS, sympathySetPath, type SympathySet,
} from "@/data/sympathy";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { passageReference } from "@/pages/life-events/passage";
import { CardMaker } from "./CardMaker";
import { PassageList } from "./PassageList";
import { ExploreMore, LoadState, SourceLine } from "./parts";
import { scrollToMaker, useScrollToHash } from "./scroll";
import { useSympathyPassages } from "./useSympathyPassages";

function WritingGuide() {
  return (
    <section className="sy-guide" id="what-to-write" aria-labelledby="sy-guide-title">
      <h2 id="sy-guide-title">What to write in a sympathy card</h2>
      <h3>Short lines you can use or adapt</h3>
      <ul className="sy-lines">{LINES_TO_USE.map((line) => <li key={line}>{line}</li>)}</ul>
      <h3>Meant kindly, but can land hard</h3>
      <dl className="sy-leave-out">
        {LEAVE_OUT.map((item) => <div key={item.saying}><dt>{item.saying}</dt><dd>{item.why}</dd></div>)}
      </dl>
      <h3>Keep showing up</h3>
      <p>{KEEP_SHOWING_UP}</p>
    </section>
  );
}

export function SympathyHub() {
  const catalog = useCatalog();
  const { state, retry } = useSympathyPassages("hub", HUB_SET.passages);
  const [chosen, setChosen] = useState<{ key: string; count: number } | null>(null);
  const passages = state.status === "ready" ? state.value : null;
  useScrollToHash(Boolean(passages));
  // References only: quoting a verse per page would fetch a dozen whole books just to draw this menu (design 5.3).
  const firstCardVerse = (set: SympathySet) => {
    const passage = set.passages.find((item) => item.role === "card") ?? set.passages[0];
    return passageReference(passage, (book) => bookByNum(catalog, book)?.name ?? `Book ${book}`);
  };
  const use = (key: string) => {
    setChosen((current) => ({ key, count: (current?.count ?? 0) + 1 }));
    scrollToMaker();
  };
  return (
    <article className="sy-page sy-hub mx-auto max-w-5xl px-4 sm:px-6">
      <h1>{HUB_SET.heading}</h1>
      <p className="sy-intro">{HUB_SET.intro}</p>
      <section className="sy-losses" aria-labelledby="sy-losses-title">
        <h2 id="sy-losses-title">Choose the loss</h2>
        <Link to={FUNERAL_PATH} className="sy-loss-card sy-loss-funeral">
          <h3>{FUNERAL_HEADING}</h3>
          <span className="sy-loss-foot">Passages in the order of a service, with a large-type sheet for the readers</span>
        </Link>
        <ul className="sy-loss-grid">
          {LOSS_SETS.map((set) => (
            <li key={set.slug}>
              <Link to={sympathySetPath(set)} className="sy-loss-card">
                <h3>{set.short}</h3>
                <span className="sy-loss-ref">{firstCardVerse(set)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <LoadState state={state} retry={retry} />
      {passages && <PassageList items={passages} onUse={use} cardsTitle="Verses for any loss" />}
      <WritingGuide />
      <CardMaker label="hub" passages={passages} failed={state.status === "error"} defaults={HUB_SET.card} chosen={chosen} />
      <ExploreMore set={HUB_SET} />
      <SourceLine />
    </article>
  );
}
