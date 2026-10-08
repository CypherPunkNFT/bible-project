// 03 · The discoveries: the seven finds in date order beside a map of the Holy Land and Sinai that flies to the chosen
// one (approved mock-up: design/scholars-directions/scholars/discoveries.js). Each find's card traces it on: who found or
// studied it, what came of it, and where it reaches this site, or plainly that it does not yet. Ramsay's find lies
// beyond that map, so an edge marker points to it and choosing it crossfades to the wider map. A quiet chain of names
// closes the section, lighting the names the chosen find's thread passes through. From 901px the map sits on the left.
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Find } from "@/data/teachers/pages-types";
import { SectionHead } from "../shared/Frame";
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
    <SectionHead num="03" kicker="The discoveries" title={<>{word(model.finds.length)} discoveries, <em>from the dig to your screen.</em></>}
      line="Choose a discovery, or scroll the list: the map flies to the place, and its card follows the find through the scholar who found or studied it to where it reaches this site." />
    <div className="dsc-grid">
      <div className="dsc-list-wrap">
        <div ref={listRef} className="dsc-list">
          <OverviewCard model={model} on={active === 0} onChoose={() => choose(0)} />
          {model.finds.map((f, i) => <FindCard key={f.id} model={model} find={f} on={active === i + 1} onChoose={() => choose(i + 1)} />)}
          <div ref={endRef} className="dsc-list-end" />
        </div>
      </div>
      <MapCard model={model} markers={markers} mode={mode} find={find} stagesEl={stagesEl} edgeRef={edgeRef} onSwitch={switchMap} onFind={chooseFind} />
    </div>
    <Chain model={model} people={find ? model.threads[find.id].people : null} />
  </>;
}

/** How the Bible's text reached English readers, as a quiet closing line; the names the chosen find passes through are lit. */
function Chain({ model, people }: { model: DiscoveryModel; people: Set<string> | null }) {
  const { openProfile } = useScholars();
  return <div className="dsc-chain">
    <span className="dsc-chain-k">{model.data.chain.about.replace(/\.$/, "")}</span>
    <ol>{model.data.chain.steps.map(([id, what]) => {
      const scholar = scholarById(model.byId, id);
      return <li key={id}><button type="button" className={people?.has(id) ? "dsc-hl" : undefined} style={cssVars({ "--tone": toneOf(scholar) })} title={what}
        onClick={(e) => openProfile(id, e.currentTarget)}>{scholar.short}</button></li>;
    })}</ol>
  </div>;
}
