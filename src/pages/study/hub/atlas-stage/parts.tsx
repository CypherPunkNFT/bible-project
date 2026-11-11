import { useAtlasChoice } from "./parts.shared";
// The pieces of the study page's Atlas window, shared by the live window (AtlasStage) and the mock-ups that led to it
// (/study/atlas_mockup/1-4, /study/atlas_colors_mockup, owner 2026-11-06).
import { StudyLink } from "@/pages/study/hub/shared";
import { ArrowRight, ArrowUpRight, Map as MapIcon } from "lucide-react";
import { CATEGORIES, GROUPS, placeHref, type AtlasCategory } from "./atlas-data";
import "./atlas-stage.css";
import { RefText } from "./RefText";
export type Choice = ReturnType<typeof useAtlasChoice>;

export function CategoryButton({ c, active, pick, count = false }: { c: AtlasCategory; active: boolean; pick: (id: string) => void; count?: boolean }) {
  const Icon = c.icon;
  return <button type="button" className="am-cat" aria-pressed={active} onClick={() => pick(c.id)}>
    <Icon size={16} strokeWidth={1.5} aria-hidden /><span>{c.title}</span>{count && <small>{c.places.length}</small>}
  </button>;
}

export function GroupedCategories({ choice, count = false }: { choice: Choice; count?: boolean }) {
  return <div className="am-groups">{GROUPS.map(g => <div className="am-group" key={g} role="group" aria-label={g}>
    <p className="am-group-label">{g}</p>
    {CATEGORIES.filter(c => c.group === g).map(c => <CategoryButton key={c.id} c={c} active={choice.category.id === c.id} pick={choice.pick} count={count} />)}
  </div>)}</div>;
}

export function PlaceNote({ choice, heading = "h3" }: { choice: Choice; heading?: "h3" | "h4" }) {
  const H = heading, { chosen, category } = choice;
  return <div className="am-note" aria-live="polite">
    <H>{chosen.name}</H><p><RefText text={chosen.note} /></p>{chosen.uncertain && <p className="am-uncertain">Location uncertain: scholars propose more than one site.</p>}
    <div className="am-note-links"><StudyLink to={placeHref(chosen)}>Open in the Atlas<ArrowUpRight size={14} aria-hidden /></StudyLink><StudyLink to={category.href}>{category.title}<ArrowUpRight size={14} aria-hidden /></StudyLink></div>
  </div>;
}

export function EnterAtlas({ small = false }: { small?: boolean }) {
  return <StudyLink className={small ? "am-enter am-enter-small" : "am-enter"} to="/study/atlas"><MapIcon size={16} strokeWidth={1.5} aria-hidden /><span>Enter the full Atlas</span><ArrowRight size={16} aria-hidden /></StudyLink>;
}

export const Caveat = ({ c }: { c: AtlasCategory }) => c.caveat ? <p className="am-caveat">{c.caveat}</p> : null;
