// Section 03 of the Moses mock-up: the page's own "people around him" field, untouched, plus pills that switch the same
// place to his places, topics and passages, each drawn as rings (named on the field itself, so no second row of pills).
// Choosing Moses at the centre of any of them opens his full connections page, the way the family tree opens its own.
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useCatalog } from "@/lib/catalog";
import { aroundMoses, type Category, type CategoryKey, type MosesData } from "./around-data";
import { loadEntity, loadGraphIndex, type GraphIndex } from "./graph-data";
import { AroundPanel } from "./AroundPanel";
import { RingField } from "./RingField";
import { placeRings } from "./ring-layout";

const MOSES = "moses-exo-2-10";
const ON_FIELD: Record<CategoryKey, number> = { p: 16, l: 14, t: 12, x: 12 };
/** [heading, its gold italic words, lead] for each category the page itself does not have. */
const HEADS: Record<Exclude<CategoryKey, "p">, [string, string, string]> = {
  l: ["Every place ", "around Moses", "Rings by his road through the three forties, then every other place his verses name. Choose any place to read the verses that join it to him; choose Moses to open all of his connections."],
  t: ["Every topic ", "around Moses", "Rings by what each topic is named for: a person, a place or nation, or a theme. Choose any topic to read the verses it shares with him; choose Moses to open all of his connections."],
  x: ["Every passage ", "around Moses", "Rings by where readers' cross-references lead from his verses: within the Law, the rest of the Old Testament, the New Testament. Choose Moses to open all of his connections."],
};

/** The parts of section 03 this switches between (found by MosesConnectedMockup inside the page's shadow root). */
export interface SectionParts { id: number; head: HTMLElement; stage: HTMLElement; pills: HTMLElement; content: HTMLElement }

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

/** People shows the page's own field and heading; any other category hides them and shows its rings instead. */
function useShowPeople(parts: SectionParts, kind: CategoryKey) {
  const [original] = useState(() => ({ h2: [...(parts.head.querySelector("h2")?.childNodes ?? [])], p: parts.head.querySelector("p")?.textContent ?? "", kick: parts.head.querySelector(".mg-kick")?.textContent ?? "" }));
  useLayoutEffect(() => {
    const h2 = parts.head.querySelector("h2"), p = parts.head.querySelector("p"), kick = parts.head.querySelector(".mg-kick");
    if (kick) kick.textContent = kind === "p" ? original.kick : "Around him";
    if (kind === "p") { h2?.replaceChildren(...original.h2); if (p) p.textContent = original.p; }
    else {
      const em = document.createElement("em");
      em.textContent = HEADS[kind][1];
      h2?.replaceChildren(HEADS[kind][0], em);
      if (p) p.textContent = HEADS[kind][2];
    }
    parts.stage.style.display = kind === "p" ? "" : "none";
    parts.content.style.display = kind === "p" ? "none" : "";
  }, [parts, kind, original]);
}

export function MosesAround({ parts, openGraph }: { parts: SectionParts; openGraph: () => void }) {
  const { categories, index, failed } = useAround();
  const catalog = useCatalog();
  const [kind, setKind] = useState<CategoryKey>("p");
  const [chosen, setChosen] = useState<string>();
  const category = categories?.find((c) => c.key === kind);
  const placed = useMemo(() => (category ? placeRings(category.rings, category.points, ON_FIELD[category.key]) : []), [category]);
  const onField = useMemo(() => new Set(placed.map((p) => p.key)), [placed]);
  useShowPeople(parts, kind);

  const people = categories?.find((c) => c.key === "p");
  const count = (c: Category) => (c.key === "p" ? c.points.filter((p) => p.ring !== "named").length : c.total);
  const pills = <div className="ar ar-bar">
    <div className="ar-cats" role="tablist" aria-label="Show">{(categories ?? []).map((c) => (
      <button key={c.key} type="button" role="tab" aria-selected={c.key === kind} onClick={() => { setKind(c.key); setChosen(undefined); }}>{c.label}<small>{count(c).toLocaleString()}</small></button>))}</div>
    <button type="button" className="ar-open" onClick={openGraph}>Open every connection →</button>
  </div>;

  const point = category?.points.find((p) => p.key === chosen);
  const content = failed ? <p className="cn-plain">The connections could not be loaded.</p>
    : !category || !index || kind === "p" ? null
    : <div className="ar"><div className="cn-stage">
      <div className="cn-field" key={kind}><RingField name="Moses" kind={kind} rings={category.rings} points={placed} only="all" chosen={chosen} onChoose={setChosen} onCore={openGraph} /></div>
      <aside className="cn-panel" aria-live="polite"><AroundPanel category={category} index={index} catalog={catalog} onField={onField} point={point} choose={setChosen} centre="Moses" /></aside>
    </div></div>;
  return <>{people && createPortal(pills, parts.pills)}{createPortal(content, parts.content)}</>;
}
