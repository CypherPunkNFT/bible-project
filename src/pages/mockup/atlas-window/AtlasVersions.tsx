// Four condensed Atlas windows for the study page, each with the nine categories and tripled places (owner, 2026-11-06).
// 1 Grouped index: the map with the chosen place in a strip under it, a grouped list of the nine beside it.
// 2 Category rail: the nine across the top, the map, the category's places listed beside it.
// 3 Map stage: the map full width, the nine and the chosen place laid over it.
// 4 Three columns: the nine, the map, the category's numbered places.
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Map as MapIcon } from "lucide-react";
import { StudyLink } from "@/pages/study/hub/shared";
import { CATEGORIES, GROUPS, placeHref, type AtlasCategory, type AtlasPlace } from "./atlas-mock-data";
import { MockMap, type Inset } from "./MockMap";
import "./atlas-mock.css";

const firstPlace = (c: AtlasCategory) => (c.places.find(p => p.key === "Jerusalem") ?? c.places[0]).key;

function useAtlasChoice() {
  const [categoryId, setCategoryId] = useState("map");
  const category = CATEGORIES.find(c => c.id === categoryId)!;
  const [chosenKey, setChosenKey] = useState(firstPlace(category));
  const chosen: AtlasPlace = category.places.find(p => p.key === chosenKey) ?? category.places[0];
  const pick = (id: string) => { const next = CATEGORIES.find(c => c.id === id)!; setCategoryId(id); setChosenKey(firstPlace(next)); };
  return { category, chosen, pick, choose: setChosenKey };
}
type Choice = ReturnType<typeof useAtlasChoice>;

function Section({ version, children }: { version: number; children: React.ReactNode }) {
  return <section className={`hub-section atlas-section in-doors am-section am-v${version}`} id="world" aria-label="The Atlas">{children}</section>;
}

function CategoryButton({ c, active, pick, count = false }: { c: AtlasCategory; active: boolean; pick: (id: string) => void; count?: boolean }) {
  const Icon = c.icon;
  return <button type="button" className="am-cat" aria-pressed={active} onClick={() => pick(c.id)}>
    <Icon size={16} strokeWidth={1.5} aria-hidden /><span>{c.title}</span>{count && <small>{c.places.length}</small>}
  </button>;
}

function GroupedCategories({ choice, count = false }: { choice: Choice; count?: boolean }) {
  return <div className="am-groups">{GROUPS.map(g => <div className="am-group" key={g} role="group" aria-label={g}>
    <p className="am-group-label">{g}</p>
    {CATEGORIES.filter(c => c.group === g).map(c => <CategoryButton key={c.id} c={c} active={choice.category.id === c.id} pick={choice.pick} count={count} />)}
  </div>)}</div>;
}

function PlaceNote({ choice, heading = "h3" }: { choice: Choice; heading?: "h3" | "h4" }) {
  const H = heading, { chosen, category } = choice;
  return <div className="am-note" aria-live="polite">
    <H>{chosen.name}</H><p>{chosen.note}</p>
    <div className="am-note-links"><StudyLink to={placeHref(chosen)}>Open in the Atlas<ArrowUpRight size={14} aria-hidden /></StudyLink><StudyLink to={category.href}>{category.title}<ArrowUpRight size={14} aria-hidden /></StudyLink></div>
  </div>;
}

function EnterAtlas({ small = false }: { small?: boolean }) {
  return <StudyLink className={small ? "am-enter am-enter-small" : "am-enter"} to="/study/atlas"><MapIcon size={16} strokeWidth={1.5} aria-hidden /><span>Enter the full Atlas</span><ArrowRight size={16} aria-hidden /></StudyLink>;
}

const Kicker = ({ c }: { c: AtlasCategory }) => <div className="am-kicker"><span>{c.title.toUpperCase()}</span><span>{c.places.length} places</span></div>;
const Caveat = ({ c }: { c: AtlasCategory }) => c.caveat ? <p className="am-caveat">{c.caveat}</p> : null;

export function AtlasV1() {
  const choice = useAtlasChoice(), { category } = choice;
  return <Section version={1}><div className="am-window">
    <div className="am-scene"><Kicker c={category} /><MockMap category={category} chosen={choice.chosen.key} choose={choice.choose} /><div className="am-strip"><PlaceNote choice={choice} /><Caveat c={category} /></div></div>
    <div className="am-side"><p className="eyebrow">The Atlas</p><GroupedCategories choice={choice} count /><EnterAtlas /></div>
  </div></Section>;
}

export function AtlasV2() {
  const choice = useAtlasChoice(), { category, chosen } = choice;
  return <Section version={2}><div className="am-window">
    <div className="am-rail" role="group" aria-label="Choose a way into the Atlas">{GROUPS.map(g => <div key={g} className="am-rail-group"><span className="am-group-label">{g}</span><div>{CATEGORIES.filter(c => c.group === g).map(c => <CategoryButton key={c.id} c={c} active={category.id === c.id} pick={choice.pick} />)}</div></div>)}</div>
    <div className="am-body">
      <div className="am-scene"><MockMap category={category} chosen={chosen.key} choose={choice.choose} /></div>
      <div className="am-side">
        <h3 className="am-title">{category.title}</h3><p className="am-intro">{category.intro}</p>
        <ul className="am-names">{category.places.map(p => <li key={p.key}><button type="button" aria-pressed={p.key === chosen.key} onClick={() => choice.choose(p.key)}>{p.name}</button></li>)}</ul>
        <PlaceNote choice={choice} heading="h4" /><Caveat c={category} /><EnterAtlas small />
      </div>
    </div>
  </div></Section>;
}

const V3_INSET: Inset = { left: 252, right: 332 };
export function AtlasV3() {
  const choice = useAtlasChoice(), { category } = choice;
  return <Section version={3}><div className="am-window">
    <div className="am-scene"><MockMap category={category} chosen={choice.chosen.key} choose={choice.choose} inset={V3_INSET} />
      <div className="am-over-left"><p className="eyebrow">The Atlas</p><GroupedCategories choice={choice} /></div>
      <div className="am-over-right"><p className="am-intro">{category.intro}</p><PlaceNote choice={choice} /><Caveat c={category} /></div>
      <div className="am-over-top"><EnterAtlas small /></div>
    </div>
  </div></Section>;
}

export function AtlasV4() {
  const choice = useAtlasChoice(), { category, chosen } = choice, list = useRef<HTMLDivElement>(null);
  useEffect(() => { const box = list.current, open = box?.querySelector<HTMLElement>("li.open"); if (box && open) box.scrollTop = Math.max(0, open.offsetTop - box.offsetTop - 60); }, [chosen.key, category.id]);
  return <Section version={4}><div className="am-window">
    <div className="am-left"><p className="eyebrow">The Atlas</p><GroupedCategories choice={choice} /><EnterAtlas small /></div>
    <div className="am-scene"><Kicker c={category} /><MockMap category={category} chosen={chosen.key} choose={choice.choose} /></div>
    <div className="am-side" ref={list}>
      <p className="am-intro">{category.intro}</p>
      <ol className="am-stops">{category.places.map((p, i) => <li key={p.key} className={p.key === chosen.key ? "open" : undefined}>
        <button type="button" aria-expanded={p.key === chosen.key} onClick={() => choice.choose(p.key)}><span className="am-num">{String(i + 1).padStart(2, "0")}</span>{p.name}</button>
        {p.key === chosen.key && <div className="am-stop-note"><p>{p.note}</p><StudyLink to={placeHref(p)}>Open in the Atlas<ArrowUpRight size={13} aria-hidden /></StudyLink></div>}
      </li>)}</ol>
      <Caveat c={category} />
    </div>
  </div></Section>;
}

export const ATLAS_VERSIONS = [AtlasV1, AtlasV2, AtlasV3, AtlasV4];
