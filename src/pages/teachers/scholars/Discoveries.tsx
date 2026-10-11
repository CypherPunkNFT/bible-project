// 03: Selected discovery case studies, with explicit historical evidence and checked study links.
// Preserve the map and internal list; researcher profiles are not treated as a chain of source transmission.
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Find } from "@/data/teachers/pages-types";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { useScholars } from "./context";
import { FindCard, OverviewCard } from "./discoveries/Cards";
import { MapCard } from "./discoveries/MapCard";
import { buildModel, cssVars, scholarById, toneOf, VIEWS, word, type DiscoveryModel } from "./discoveries/model";
import { buildProjections } from "./discoveries/projection";
import { markersFor } from "./discoveries/stage";
import { useDiscoveryMap, useListFollow } from "./discoveries/useDiscoveryMap";
import "./Discoveries.css";

export function Discoveries() {
  const { data } = useScholars();
  const model = useMemo(() => buildModel(data), [data]);
  const projections = useMemo(() => buildProjections(data), [data]);
  const markers = useMemo(() => ({ holyland: markersFor(model, projections, VIEWS[0]), med: markersFor(model, projections, VIEWS[1]) }), [model, projections]);

  // 0 is the "All 7" card; 1… are the finds in date order.
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const pick = useCallback((index: number) => {
    if (index < 0 || index === activeRef.current) return;
    activeRef.current = index;
    setActive(index);
  }, []);
  const { listRef, endRef, scrollToCard } = useListFollow(pick);
  const { stagesEl, edgeRef, mode, show, switchMap } = useDiscoveryMap(model, projections, markers);
  const choose = useCallback((index: number) => {
    if (index < 0 || index === activeRef.current) return;
    pick(index);
    scrollToCard(index);
  }, [pick, scrollToCard]);
  const chooseFind = useCallback((find: Find) => choose(model.finds.indexOf(find) + 1), [choose, model]);

  const find = active > 0 ? model.finds[active - 1] : null;
  useLayoutEffect(() => { show(find); }, [find, show]);

  return <>
    <SectionHead section="discoveries" kicker="The discoveries" title={<>{word(model.finds.length)} discoveries, <em>with the evidence in view.</em></>}
      line="Seven selected case studies from a much larger collection. Explore the places, distinguish finders from later researchers, and follow historical sources and verified study links." />
    <div className="dsc-grid">
      <div className="dsc-list-wrap">
        <div ref={listRef} className="dsc-list" tabIndex={0} role="region" aria-label="Discovery case studies">
          <OverviewCard model={model} on={active === 0} onChoose={() => choose(0)} />
          {model.finds.map((f, i) => <FindCard key={f.id} model={model} find={f} on={active === i + 1} onChoose={() => choose(i + 1)} />)}
          <div ref={endRef} className="dsc-list-end" />
        </div>
      </div>
      <MapCard model={model} markers={markers} mode={mode} find={find} stagesEl={stagesEl} edgeRef={edgeRef} onSwitch={switchMap} onFind={chooseFind} />
    </div>
    <Chain model={model} people={find ? new Set(find.by) : null} />
  </>;
}

/** Profile shortcuts for the researchers actually named by these case studies. */
function Chain({ model, people }: { model: DiscoveryModel; people: Set<string> | null }) {
  const { openProfile } = useScholars();
  return <div className="dsc-chain">
    <span className="dsc-chain-k">Researchers in these case studies</span>
    <ol>{[...new Set(model.finds.flatMap(f => f.by))].map((id) => {
      const scholar = scholarById(model.byId, id);
      return <li key={id}><button type="button" className={people?.has(id) ? "dsc-hl" : undefined} style={cssVars({ "--tone": toneOf(scholar) })} title="Open researcher profile"
        onClick={(e) => openProfile(id, e.currentTarget)}>{scholar.short}</button></li>;
    })}</ol>
  </div>;
}
