// Four condensed Atlas windows for the study page, each with the nine categories and tripled places (owner, 2026-11-06).
// 1 Grouped index: the map with the chosen place in a strip under it, a grouped list of the nine beside it.
// 2 Category rail: the nine across the top, the map, the category's places listed beside it.
// 3 Map stage: the map full width, the nine and the chosen place laid over it.
// 4 Three columns: the nine, the map, the category's numbered places.
import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { StudyLink } from "@/pages/study/hub/shared";
import { CATEGORIES, GROUPS, placeHref } from "@/pages/study/hub/atlas-stage/atlas-data";
import { AtlasMap as MockMap, type Inset } from "@/pages/study/hub/atlas-stage/AtlasMap";
import { RefText } from "@/pages/study/hub/atlas-stage/RefText";
import { Caveat, CategoryButton, EnterAtlas, GroupedCategories, PlaceNote, useAtlasChoice } from "@/pages/study/hub/atlas-stage/parts";
import "./atlas-mock.css";

/** `tone`: the colour the window is outlined in, as the two doors are in gold and orange (/study/atlas_colors_mockup).
 *  `copy`: one of several copies on a comparison page, so it gives up the page's "world" anchor. */
export interface Tone { tone?: string; copy?: boolean }
function Section({ version, tone, copy, children }: { version: number; children: React.ReactNode } & Tone) {
  return <section className={`hub-section atlas-section in-doors am-section am-v${version}${tone ? " am-toned" : ""}`} id={copy ? undefined : "world"} aria-label="The Atlas" style={tone ? { ["--tone" as string]: tone } : undefined}>{children}</section>;
}

export function AtlasV1({ tone, copy }: Tone = {}) {
  const choice = useAtlasChoice(), { category } = choice;
  return <Section version={1} tone={tone} copy={copy}><div className="am-window">
    <div className="am-scene"><MockMap category={category} chosen={choice.chosen.key} choose={choice.choose} /><div className="am-strip"><PlaceNote choice={choice} /><Caveat c={category} /></div></div>
    <div className="am-side"><GroupedCategories choice={choice} count /><EnterAtlas /></div>
  </div></Section>;
}

export function AtlasV2() {
  const choice = useAtlasChoice(), { category, chosen } = choice;
  return <Section version={2}><div className="am-window">
    <div className="am-rail" role="group" aria-label="Choose a way into the Atlas">{GROUPS.map(g => <div key={g} className="am-rail-group"><span className="am-group-label">{g}</span><div>{CATEGORIES.filter(c => c.group === g).map(c => <CategoryButton key={c.id} c={c} active={category.id === c.id} pick={choice.pick} />)}</div></div>)}</div>
    <div className="am-body">
      <div className="am-scene"><MockMap category={category} chosen={chosen.key} choose={choice.choose} /></div>
      <div className="am-side">
        <h3 className="am-title">{category.title}</h3><p className="am-intro"><RefText text={category.intro} /></p>
        <ul className="am-names">{category.places.map(p => <li key={p.key}><button type="button" aria-pressed={p.key === chosen.key} onClick={() => choice.choose(p.key)}>{p.name}</button></li>)}</ul>
        <PlaceNote choice={choice} heading="h4" /><Caveat c={category} /><EnterAtlas small />
      </div>
    </div>
  </div></Section>;
}

const V3_INSET: Inset = { left: 252, right: 332 };
export function AtlasV3({ tone, copy }: Tone = {}) {
  const choice = useAtlasChoice(), { category } = choice;
  return <Section version={3} tone={tone} copy={copy}><div className="am-window">
    <div className="am-scene"><MockMap category={category} chosen={choice.chosen.key} choose={choice.choose} inset={V3_INSET} />
      <div className="am-over-left"><GroupedCategories choice={choice} /></div>
      <div className="am-over-right"><p className="am-intro"><RefText text={category.intro} /></p><PlaceNote choice={choice} /><Caveat c={category} /></div>
      <div className="am-over-top"><EnterAtlas small /></div>
    </div>
  </div></Section>;
}

export function AtlasV4() {
  const choice = useAtlasChoice(), { category, chosen } = choice, list = useRef<HTMLDivElement>(null);
  useEffect(() => { const box = list.current, open = box?.querySelector<HTMLElement>("li.open"); if (box && open) box.scrollTop = Math.max(0, open.offsetTop - box.offsetTop - 60); }, [chosen.key, category.id]);
  return <Section version={4}><div className="am-window">
    <div className="am-left"><GroupedCategories choice={choice} /><EnterAtlas small /></div>
    <div className="am-scene"><MockMap category={category} chosen={chosen.key} choose={choice.choose} /></div>
    <div className="am-side" ref={list}>
      <p className="am-intro"><RefText text={category.intro} /></p>
      <ol className="am-stops">{category.places.map((p, i) => <li key={p.key} className={p.key === chosen.key ? "open" : undefined}>
        <button type="button" aria-expanded={p.key === chosen.key} onClick={() => choice.choose(p.key)}><span className="am-num">{String(i + 1).padStart(2, "0")}</span>{p.name}</button>
        {p.key === chosen.key && <div className="am-stop-note"><p><RefText text={p.note} /></p>{p.uncertain && <p className="am-uncertain">Location uncertain: scholars propose more than one site.</p>}<StudyLink to={placeHref(p)}>Open in the Atlas<ArrowUpRight size={13} aria-hidden /></StudyLink></div>}
      </li>)}</ol>
      <Caveat c={category} />
    </div>
  </div></Section>;
}

export const ATLAS_VERSIONS = [AtlasV1, AtlasV2, AtlasV3, AtlasV4];
