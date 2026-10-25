// Section 03 of the Moses mock-up, "Around Moses": the people section and the connections joined into one. Pills choose
// the category (people, places, topics, passages); a second row chooses one relationship inside it; the field shows
// every relationship as its own ring, and a list below holds all of them.
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCatalog } from "@/lib/catalog";
import { aroundMoses, type Category, type CategoryKey, type MosesData } from "./around-data";
import { loadEntity, loadGraphIndex, type GraphIndex } from "./graph-data";
import { AroundPanel } from "./AroundPanel";
import { RingField } from "./RingField";
import { placeRings } from "./ring-layout";

const MOSES = "moses-exo-2-10";
const ON_FIELD: Record<CategoryKey, number> = { p: 16, l: 14, t: 12, x: 12 };
const LEADS: Record<CategoryKey, string> = {
  p: "Family, those who stood beside him and against him, and those who speak of him later, as the page has always shown them; then everyone else the verses name with him.",
  l: "His road through the three forties, from the Atlas: Egypt, Midian, then the wilderness to Nebo. Then every other place his verses name.",
  t: "The site's topics that share his verses, sorted by what each is named for: a person, a place or nation, or a theme.",
  x: "Where readers' cross-references lead from the verses that name him: within the Law, through the rest of the Old Testament, and in the New Testament looking back.",
};

function useAround(): { categories?: Category[]; index?: GraphIndex; failed?: boolean } {
  const catalog = useCatalog();
  const [state, setState] = useState<{ categories?: Category[]; index?: GraphIndex; failed?: boolean }>({});
  useEffect(() => {
    let live = true;
    Promise.all([loadGraphIndex(), loadEntity("p", MOSES), import("@/components/moses-page/data/merged.json"), import("@/components/moses-page/data/moses.json")])
      .then(([index, entity, merged, moses]) => {
        if (!entity) throw new Error(`connections: ${MOSES} is not in data/graph`);
        const data = { people: merged.default.people, route: moses.default.map.route } as unknown as MosesData;
        if (live) setState({ index, categories: aroundMoses(entity, data, index, catalog) });
      })
      .catch((reason: unknown) => { console.error("Around Moses: data did not load", reason); if (live) setState({ failed: true }); });
    return () => { live = false; };
  }, [catalog]);
  return state;
}

export function MosesAround() {
  const { categories, index, failed } = useAround();
  const catalog = useCatalog();
  const [kind, setKind] = useState<CategoryKey>("p");
  const [only, setOnly] = useState("all");
  const [chosen, setChosen] = useState<string>();
  const [more, setMore] = useState(false);
  const category = categories?.find((c) => c.key === kind);
  const placed = useMemo(() => (category ? placeRings(category.rings, category.points, ON_FIELD[category.key]) : []), [category]);
  const onField = useMemo(() => new Set(placed.map((p) => p.key)), [placed]);

  if (failed) return <div className="wrap"><p className="cn-plain">The connections could not be loaded.</p></div>;
  if (!categories || !category || !index) return <div className="wrap ar-wait" role="status" aria-label="Loading" />;
  const switchTo = (next: CategoryKey) => { setKind(next); setOnly("all"); setChosen(undefined); setMore(false); };
  const point = category.points.find((p) => p.key === chosen);

  return <div className="wrap ar">
    <header className="mx-head"><div className="mx-section-label"><span className="mx-n">03</span><span className="mg-kick">Around him</span></div>
      <h2>Everyone and everything <em>around Moses</em></h2>
      <p>{LEADS[kind]} Choose any point to read what joins it to him; lines show what else it is joined to.</p>
    </header>
    <div className="ar-cats" role="tablist" aria-label="Show">{categories.map((c) => (
      <button key={c.key} type="button" role="tab" aria-selected={c.key === kind} onClick={() => switchTo(c.key)}>{c.label}<small>{c.total.toLocaleString()}</small></button>))}</div>
    <div className="ar-rings" role="group" aria-label={`Kinds of ${category.label.toLowerCase()}`}>
      <button type="button" aria-pressed={only === "all"} onClick={() => setOnly("all")}>All</button>
      {category.rings.filter((r) => category.points.some((p) => p.ring === r.key)).map((r) => (
        <button key={r.key} type="button" aria-pressed={only === r.key} style={{ "--cn-tone": r.tone } as CSSProperties} onClick={() => { setOnly(r.key); setChosen(undefined); }}><i aria-hidden />{r.label}</button>))}
    </div>
    <div className="cn-stage">
      <div className="cn-field" key={kind}><RingField name="Moses" kind={kind} rings={category.rings} points={placed} only={only} chosen={chosen} onChoose={setChosen} /></div>
      <aside className="cn-panel" aria-live="polite"><AroundPanel category={category} index={index} catalog={catalog} onField={onField} point={point} choose={setChosen} centre="Moses" /></aside>
    </div>
    <div className="ar-list">
      <div className="cn-cols" data-count={category.rings.length}>{category.rings.filter((r) => only === "all" || r.key === only).map((r) => {
        const rows = category.points.filter((p) => p.ring === r.key);
        return rows.length ? <div key={r.key} className="cn-col" style={{ "--cn-tone": r.tone } as CSSProperties}>
          <h3>{r.label} <small>{rows.length < r.total ? `strongest ${rows.length} of ${r.total.toLocaleString()}` : `${rows.length}`}</small></h3>
          <ol>{rows.slice(0, more ? rows.length : 8).map((p) => <li key={p.key}><button type="button" onClick={() => setChosen(p.key)}>{p.label}</button>{p.kind !== "p" || p.ring === "named" ? <span>{p.weight.toLocaleString()}</span> : p.role ? <span>{p.role}</span> : null}</li>)}</ol>
        </div> : null;
      })}</div>
      <button type="button" className="cn-more" onClick={() => setMore((v) => !v)}>{more ? "Show fewer" : "Show all of them"}</button>
      <p className="cn-source">Numbers are shared verses (for passages, cross-references). Family, beside him, against him and who speaks of him are this page's hand-checked lists; his road is the Atlas's; everything else is joined through shared verses in the site's people, places and topics and OpenBible.info's cross-references. Nothing here is written by AI.</p>
    </div>
  </div>;
}
