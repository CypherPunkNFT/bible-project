import { ArrowRight, Crown, Landmark, Route, Scale, Shield } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { formatYears } from "@/lib/eras";
import { apostleFor, personPath, rulerFor, type Aspect } from "@/lib/people-pages-index";
import { APOSTLE_GLOW, aspectLabel, glowFor, pageHeading, pronouns } from "./kinds";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";
// The role colours (judge, disciple) are the People catalogue's, shared by these pages.
import "@/components/study/people-catalog.css";
import "./people-pages.css";

type Sex = "M" | "F" | "G" | "";

/** Arrow keys move between the two halves of the switch (each half is an ordinary link). */
function arrowKeys(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")];
  const at = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (at < 0) return;
  event.preventDefault();
  links[(at + (event.key === "ArrowRight" ? 1 : links.length - 1)) % links.length].focus();
}

/** "The person | The reign": which of a person's two pages this is, one click from the other. Null when there is none. */
export function AspectSwitch({ id, name, current }: { id: string; name: string; current?: Aspect }) {
  const carried = useCarried();
  const ruler = rulerFor(id), apostle = apostleFor(id);
  const aspect: Aspect | undefined = ruler ? "rule" : apostle ? "mission" : undefined;
  if (!aspect) return null;
  const pageId = (ruler ?? apostle)!.id;
  const glow = ruler ? glowFor(ruler.kind, ruler.realm) : APOSTLE_GLOW;
  return <nav className="pp-switch" aria-label={`Pages about ${name}`} style={{ "--lg": glow } as CSSProperties} onKeyDown={arrowKeys}>
    <SlideLink to={personPath(pageId)} state={carried} aria-current={!current ? "page" : undefined}>The person</SlideLink>
    <SlideLink to={personPath(pageId, aspect)} state={carried} aria-current={current ? "page" : undefined}>{ruler ? aspectLabel(ruler) : "The mission"}</SlideLink>
  </nav>;
}

const RULER_ICON = { judge: Scale, leader: Shield, governor: Landmark, herod: Landmark, roman: Landmark } as const;

/**
 * The large gold glass card on a person page that opens their reign or mission (PRESENTATION.md §2.2): "Explore his
 * reign", "her reign", "her time as queen", "his governorship", "his rule", "his mission" ("their mission" for a page
 * about a couple). His or her comes from the person's own record.
 */
export function EntryCard({ id, sex }: { id: string; sex: Sex }) {
  const carried = useCarried();
  const ruler = rulerFor(id), apostle = apostleFor(id);
  if (!ruler && !apostle) return null;
  const { their } = pronouns(apostle?.sex === "G" ? "G" : sex);
  if (ruler) {
    const Icon = RULER_ICON[ruler.kind as keyof typeof RULER_ICON] ?? Crown;
    const when = ruler.dates ? formatYears(ruler.dates.from, ruler.dates.to, ruler.dates.approx) : "";
    const heading = pageHeading(ruler, sex);
    return <SlideLink to={personPath(ruler.id, "rule")} state={carried} className="pp-entry" style={{ "--lg": glowFor(ruler.kind, ruler.realm) } as CSSProperties}>
      <Icon className="pp-entry-icon" size={48} strokeWidth={1.25} aria-hidden />
      <span className="pp-entry-kicker">{ruler.title}{when && ` · ${when}`}</span>
      <span className="pp-entry-line">{ruler.tagline}</span>
      <span className="pp-entry-cta">Explore {heading === "The reign" ? `${their} reign` : heading.charAt(0).toLowerCase() + heading.slice(1)}<ArrowRight size={18} aria-hidden /></span>
    </SlideLink>;
  }
  return <SlideLink to={personPath(apostle!.id, "mission")} state={carried} className="pp-entry" style={{ "--lg": APOSTLE_GLOW } as CSSProperties}>
    <Route className="pp-entry-icon" size={48} strokeWidth={1.25} aria-hidden />
    <span className="pp-entry-kicker">{apostle!.title}{apostle!.called && ` · called in ${apostle!.called}`}</span>
    <span className="pp-entry-line">{apostle!.tagline}</span>
    <span className="pp-entry-cta">Explore {their} mission<ArrowRight size={18} aria-hidden /></span>
  </SlideLink>;
}
