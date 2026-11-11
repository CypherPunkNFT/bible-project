// One blessings page, top to bottom as design 5.2 orders it: heading, introduction (the first long paragraph, so it
// becomes the search description), the featured item and the others, "Print a set" on the table and children's pages,
// "Explore more" and the source lines. Children's pages put any longer note after the words (design 7.2).
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { BLESSINGS_PATH, pageBySlug, pagePath, type BlessingPage as Page } from "@/data/home-blessings";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { passageReference } from "@/pages/life-events/passage";
import { knownAnchors, pageAnchors, sharedAnchor } from "./anchors";
import { ItemPanel, type VerseState } from "./ItemPanel";
import { PrintSet } from "./PrintChooser";
import { RoomByRoom } from "./RoomByRoom";
import { useBlessingHead } from "./useBlessingHead";
import { useBlessingPrint } from "./useBlessingPrint";
import { useBlessingVerses } from "./useBlessingVerses";

export const BSB_LINE = "Scripture quotations are from the Berean Standard Bible (public domain).";
export const OLDER_LINE = "Older graces and blessings on this page are in the public domain; each names its author and first printing.";
const SET_PAGES = new Set(["before-meals", "holiday-meals", "graces-for-kids", "bedtime", "blessing-your-children"]);

/** A shared link opens at the item or verse it names once the verses have drawn, highlighted for a moment. */
function useArrival(ready: boolean, known: Set<string>) {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready) return;
    const id = sharedAnchor(hash);
    if (!id || !known.has(id)) return;
    const target = document.getElementById(id);
    target?.scrollIntoView?.({ block: "start" });
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!target || still) return;
    target.classList.add("hb-arrived");
    const timer = window.setTimeout(() => target.classList.remove("hb-arrived"), 2400);
    return () => { window.clearTimeout(timer); target.classList.remove("hb-arrived"); };
  }, [ready, hash, known]);
}

function ExploreMore({ page }: { page: Page }) {
  const related = page.related.map(pageBySlug).filter((item): item is Page => Boolean(item));
  return (
    <section className="hb-more" aria-labelledby="hb-more-title">
      <h2 id="hb-more-title">Explore more</h2>
      <h3>More blessings for the home</h3>
      <ul>{related.map((item) => <li key={item.slug}><Link to={pagePath(item)}>{item.heading}</Link></li>)}</ul>
      {page.elsewhere && (
        <>
          <h3>Elsewhere on Bible Guide</h3>
          <ul>{page.elsewhere.map((link) => <li key={link.href}><Link to={link.href}>{link.title}</Link></li>)}</ul>
        </>
      )}
      <h3>Bible topics</h3>
      <ul>{page.topics.map((topic) => <li key={topic.slug}><Link to={`/topics/${topic.slug}`}>{topic.title}</Link></li>)}</ul>
      <p><Link to={BLESSINGS_PATH}>Every blessing for the home</Link></p>
    </section>
  );
}

export function SourceLines({ older }: { older: boolean }) {
  return (
    <div className="hb-source">
      <p>{BSB_LINE}</p>
      {older && <p>{OLDER_LINE}</p>}
    </div>
  );
}

function HowTo({ page }: { page: Page }) {
  if (!page.howTo) return null;
  return (
    <section className="hb-how" aria-labelledby="hb-how-title">
      <h2 id="hb-how-title">{page.howTo.title}</h2>
      <p>{page.howTo.text}</p>
      {page.gospel && <p>To explain the good news of Jesus to your child, read <Link to="/study/the-good-news">The Good News</Link>, the site's short study.</p>}
    </section>
  );
}

export function BlessingPage({ page }: { page: Page }) {
  useBlessingHead(page.searchTitle);
  const catalog = useCatalog();
  const { state, retry } = useBlessingVerses(page);
  const anchors = useMemo(() => pageAnchors(page), [page]);
  const known = useMemo(() => knownAnchors(page, anchors), [page, anchors]);
  useArrival(state.status === "ready", known);
  const printer = useBlessingPrint(`blessings-${page.slug}`);
  const verses: VerseState = state.status === "ready" ? { status: "ready", verses: state.value } : state.status === "error" ? { status: "error", retry } : { status: "loading" };
  const referenceOf = (item: Page["items"][number]) => (item.kind === "scripture" ? passageReference(item.passage, (num) => bookByNum(catalog, num)?.name ?? "") : "");
  const items = page.items.map((item, index) => (
    <ItemPanel key={item.id} page={page} item={item} featured={index === 0 && !page.stations} verses={verses} reference={referenceOf(item)} roots={anchors.roots[index]} printer={printer} />
  ));
  return (
    <article className={`hb-occasion${page.forChildren ? " hb-children" : ""}`}>
      <nav className="hb-crumbs" aria-label="Breadcrumb">
        <Link to={BLESSINGS_PATH}>Blessings for the home</Link>
        <span aria-hidden="true"> / </span>
        <span>{page.label}</span>
      </nav>
      <h1>{page.heading}</h1>
      <p className="hb-intro">{page.intro}</p>
      {!page.forChildren && <HowTo page={page} />}
      {page.stations ? (
        <>
          <RoomByRoom page={page} anchors={anchors} verses={verses} printer={printer} />
          <h2 className="hb-together">Said together at the end</h2>
          {items}
        </>
      ) : items}
      {page.forChildren && <HowTo page={page} />}
      {SET_PAGES.has(page.slug) && printer.printable && state.status === "ready" && <PrintSet page={page} verses={state.value} printer={printer} />}
      <ExploreMore page={page} />
      <SourceLines older={page.items.some((item) => item.kind === "older")} />
      {printer.portal}
    </article>
  );
}
