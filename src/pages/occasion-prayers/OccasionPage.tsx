// One occasion page, top to bottom as design 5.2 orders it: heading, introduction (the first long paragraph, so it
// becomes the search description), a word before praying (five pages), the written prayers with the verses beneath each,
// the blessing from Scripture (closing page), the older prayer (thirteen pages), the line on praying in your own words,
// links onward and the source lines.
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { CROWN_ACKNOWLEDGEMENT, HISTORIC_PRAYERS, occasionBySlug, occasionPath, PRAYERS_PATH, type Occasion } from "@/data/occasion-prayers";
import { p } from "@/data/life-events/types";
import { readHref } from "@/pages/life-events/passage";
import { pageAnchors, sharedAnchor } from "./anchors";
import { OLDER_ANCHOR } from "./message";
import { OlderPrayer } from "./OlderPrayer";
import { PrayerPanel, RootedIn, type VerseState } from "./PrayerPanel";
import { BSB_LINE } from "./PrintPrayer";
import { usePrayerPrint } from "./usePrayerPrint";
import { usePrayerHead } from "./usePrayerHead";
import { usePrayerVerses } from "./usePrayerVerses";

const PLAIN_WORDS = readHref(p("MAT 6:7-8", "card", "Your Father knows what you need."), "MAT");

/** A shared link opens at the prayer or verse it names once the verses have drawn, highlighted for a moment. */
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
    target.classList.add("op-arrived");
    const timer = window.setTimeout(() => target.classList.remove("op-arrived"), 2400);
    return () => { window.clearTimeout(timer); target.classList.remove("op-arrived"); };
  }, [ready, hash, known]);
}

function ExploreMore({ occasion }: { occasion: Occasion }) {
  const related = occasion.related.map(occasionBySlug).filter((item): item is Occasion => Boolean(item));
  return (
    <section className="op-more" aria-labelledby="op-more-title">
      <h2 id="op-more-title">Explore more</h2>
      <h3>More prayers</h3>
      <ul>{related.map((item) => <li key={item.slug}><Link to={occasionPath(item)}>{item.heading}</Link></li>)}</ul>
      {occasion.elsewhere && (
        <>
          <h3>Elsewhere on Bible Guide</h3>
          <ul>{occasion.elsewhere.map((link) => <li key={link.href}><Link to={link.href}>{link.title}</Link></li>)}</ul>
        </>
      )}
      <h3>Bible topics</h3>
      <ul>{occasion.topics.map((topic) => <li key={topic.slug}><Link to={`/topics/${topic.slug}`}>{topic.title}</Link></li>)}</ul>
      <p><Link to={PRAYERS_PATH}>Every prayer for life's occasions</Link></p>
    </section>
  );
}

export function SourceLines({ crown }: { crown: boolean }) {
  return (
    <div className="op-source">
      <p>{BSB_LINE}</p>
      {crown && <p>{CROWN_ACKNOWLEDGEMENT}</p>}
    </div>
  );
}

export function OccasionPage({ occasion }: { occasion: Occasion }) {
  usePrayerHead(occasion.searchTitle);
  const { state, retry } = usePrayerVerses(occasion);
  const anchors = useMemo(() => pageAnchors(occasion), [occasion]);
  const known = useMemo(
    () => new Set([...occasion.prayers.map((prayer) => prayer.id), ...anchors.roots.flat(), ...(anchors.blessing ? [anchors.blessing] : []), ...(occasion.historic ? [OLDER_ANCHOR] : [])]),
    [occasion, anchors],
  );
  useArrival(state.status === "ready", known);
  const { printable, request, portal } = usePrayerPrint(`prayer-${occasion.slug}`);
  const onPrint = printable ? request : undefined;
  const versesFor = (index: number): VerseState =>
    state.status === "ready" ? { status: "ready", verses: state.value.roots[index] } : state.status === "error" ? { status: "error", retry } : { status: "loading" };
  const blessingState: VerseState =
    state.status === "ready" && state.value.blessing ? { status: "ready", verses: [state.value.blessing] } : state.status === "error" ? { status: "error", retry } : { status: "loading" };
  const crown = Boolean(occasion.historic && HISTORIC_PRAYERS[occasion.historic].rights === "bcp-1662-crown");
  return (
    <article className="op-occasion">
      <nav className="op-crumbs" aria-label="Breadcrumb">
        <Link to={PRAYERS_PATH}>Prayers for life's occasions</Link>
        <span aria-hidden="true"> / </span>
        <span>{occasion.label}</span>
      </nav>
      <h1>{occasion.heading}</h1>
      <p className="op-intro">{occasion.intro}</p>
      {occasion.before && (
        <section className="op-before" aria-labelledby="op-before-title">
          <h2 id="op-before-title">A word before you pray</h2>
          <p>{occasion.before}</p>
        </section>
      )}
      {occasion.prayers.map((prayer, index) => (
        <PrayerPanel key={prayer.id} occasion={occasion} prayer={prayer} featured={index === 0} verses={versesFor(index)} anchors={anchors.roots[index]} onPrint={onPrint} />
      ))}
      {occasion.scriptureBlessing && anchors.blessing && (
        <section className="op-blessing" aria-labelledby="op-blessing-title">
          <h2 id="op-blessing-title">A blessing from Scripture</h2>
          <p>{occasion.scriptureBlessing.note}</p>
          <RootedIn state={blessingState} anchors={[anchors.blessing]} titleId="op-blessing-verse" title="Say it over the group" />
        </section>
      )}
      {occasion.historic && <OlderPrayer occasion={occasion} id={occasion.historic} onPrint={onPrint} />}
      <p className="op-plain">
        Pray these words, or let them start you off in your own. God hears plain words. <Link to={PLAIN_WORDS}>Matthew 6:7–8</Link>
      </p>
      <ExploreMore occasion={occasion} />
      <SourceLines crown={crown} />
      {portal}
    </article>
  );
}
