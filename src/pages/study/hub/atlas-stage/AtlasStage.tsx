// The study page's Atlas window, under the two doors (owner, 2026-11-06): the map full width with the nine categories
// and the chosen place laid over it (mock-up version 3), outlined in indigo the way the doors are outlined in gold and
// orange (the colour of mock-up version 1), with version 1's full-size "Enter the full Atlas" button.
import { useLayoutEffect, useRef, type RefObject } from "react";
import { AtlasMap, type Inset } from "./AtlasMap";
import { Caveat, EnterAtlas, GroupedCategories, PlaceNote, useAtlasChoice } from "./parts";
import { RefText } from "./RefText";

/** Room the map keeps clear for the panels laid over its left and right, so places are not hidden under them. */
const PANEL_INSET: Inset = { left: 252, right: 332 };

/** The Atlas window stands as tall as the Academic Studies door above it (owner, 2026-11-06). The door's height changes
 *  with the screen width, so it is read from the page and handed to the stylesheet as `--door-height`; phones ignore it. */
function useDoorHeight(section: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const door = document.querySelector<HTMLElement>(".study-door.academic"), host = section.current;
    if (!door || !host) return;
    const match = () => host.style.setProperty("--door-height", `${door.offsetHeight}px`);
    const observer = new ResizeObserver(match);
    observer.observe(door);
    match();
    return () => observer.disconnect();
  }, [section]);
}

/** `titled`: the Atlas as its own section under a numbered title (mock-up /study/sections_mockup), not tucked under the doors. */
export default function AtlasStage({ titled = false }: { titled?: boolean }) {
  const choice = useAtlasChoice(), { category } = choice;
  const section = useRef<HTMLElement>(null);
  useDoorHeight(section);
  return <section ref={section} className={`hub-section atlas-section${titled ? "" : " in-doors"} am-section am-v3 am-toned atlas-stage`} id="world" {...(titled ? { "aria-labelledby": "world-title" } : { "aria-label": "The Atlas" })}>
    {titled && <div className="section-heading"><div><p className="eyebrow">02 / Time &amp; place</p><h2 id="world-title">Step into <em>their world.</em></h2></div><p>Put a place to the passage, and follow the journeys across the map.</p></div>}
    <div className="am-window">
    <div className="am-scene"><AtlasMap category={category} chosen={choice.chosen.key} choose={choice.choose} inset={PANEL_INSET} />
      <div className="am-over-left"><GroupedCategories choice={choice} /></div>
      <div className="am-over-right"><p className="am-intro"><RefText text={category.intro} /></p><PlaceNote choice={choice} /><Caveat c={category} /></div>
      <div className="am-over-top"><EnterAtlas /></div>
    </div>
  </div></section>;
}
