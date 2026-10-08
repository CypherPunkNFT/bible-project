import { ArrowRight, Crown, Landmark, Route, Scale, ScrollText, Shield } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { formatYears } from "@/lib/eras";
import { personPath, specialPagesOf, type Aspect, type SpecialPage } from "@/lib/people-pages-index";
import { aspectLabel, pageGlow, pageHeading, prophetCalled, prophetEraBand, pronouns } from "./kinds";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";
// The role colours (judge, disciple) are the People catalogue's, shared by these pages.
import "@/components/study/people-catalog.css";
import "./people-pages.css";

type Sex = "M" | "F" | "G" | "";

/** Arrow keys move between the parts of the switch (each half is an ordinary link). */
function arrowKeys(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")];
  const at = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (at < 0) return;
  event.preventDefault();
  links[(at + (event.key === "ArrowRight" ? 1 : links.length - 1)) % links.length].focus();
}

/** The switch's words for a page: "The reign" (or "As judge" …), "The mission", "The word". */
const switchLabel = (page: SpecialPage) => (page.aspect === "rule" ? aspectLabel(page.summary) : page.aspect === "mission" ? "The mission" : "The word");

/**
 * "The person | The reign | The word": every page about this person, one click from each other (Moses, Samuel and
 * Deborah have three). Null when there is no special page.
 */
export function AspectSwitch({ id, name, current }: { id: string; name: string; current?: Aspect }) {
  const carried = useCarried();
  const pages = specialPagesOf(id);
  if (!pages.length) return null;
  const glow = pageGlow(pages.find((page) => page.aspect === current) ?? pages[0]);
  return <nav className="pp-switch" data-count={pages.length + 1} aria-label={`Pages about ${name}`} style={{ "--lg": glow } as CSSProperties} onKeyDown={arrowKeys}>
    <SlideLink to={personPath(pages[0].id)} state={carried} aria-current={!current ? "page" : undefined}>The person</SlideLink>
    {pages.map((page) => <SlideLink key={page.aspect} to={personPath(page.id, page.aspect)} state={carried} aria-current={current === page.aspect ? "page" : undefined}>{switchLabel(page)}</SlideLink>)}
  </nav>;
}

const RULER_ICON = { judge: Scale, leader: Shield, governor: Landmark, herod: Landmark, roman: Landmark } as const;

/**
 * The large glass card on a person page that opens their reign, mission or word (PRESENTATION.md §2.2): "Explore his
 * reign", "her time as judge", "his mission", "the word". A person with two pages (Moses, Samuel, Deborah) gets one
 * smaller card for each, stacked. His or her comes from the person's own record.
 */
export function EntryCard({ id, sex }: { id: string; sex: Sex }) {
  const pages = specialPagesOf(id);
  if (!pages.length) return null;
  if (pages.length === 1) return <PageCard page={pages[0]} sex={sex} />;
  return <div className="pp-entries">{pages.map((page) => <PageCard key={page.aspect} page={page} sex={sex} compact />)}</div>;
}

function PageCard({ page, sex, compact }: { page: SpecialPage; sex: Sex; compact?: boolean }) {
  const carried = useCarried();
  const iconSize = compact ? 34 : 48;
  const common = { to: personPath(page.id, page.aspect), state: carried, className: "pp-entry", "data-compact": compact ? "" : undefined, style: { "--lg": pageGlow(page) } as CSSProperties };
  if (page.aspect === "rule") {
    const ruler = page.summary;
    const Icon = RULER_ICON[ruler.kind as keyof typeof RULER_ICON] ?? Crown;
    const { their } = pronouns(sex);
    const when = ruler.dates ? formatYears(ruler.dates.from, ruler.dates.to, ruler.dates.approx) : "";
    const heading = pageHeading(ruler, sex);
    return <SlideLink {...common}>
      <Icon className="pp-entry-icon" size={iconSize} strokeWidth={1.25} aria-hidden />
      <span className="pp-entry-kicker">{ruler.title}{when && ` · ${when}`}</span>
      <span className="pp-entry-line">{ruler.tagline}</span>
      <span className="pp-entry-cta">Explore {heading === "The reign" ? `${their} reign` : heading.charAt(0).toLowerCase() + heading.slice(1)}<ArrowRight size={18} aria-hidden /></span>
    </SlideLink>;
  }
  if (page.aspect === "mission") {
    const apostle = page.summary;
    const { their } = pronouns(apostle.sex === "G" ? "G" : sex);
    return <SlideLink {...common}>
      <Route className="pp-entry-icon" size={iconSize} strokeWidth={1.25} aria-hidden />
      <span className="pp-entry-kicker">{apostle.title}{apostle.called && ` · called in ${apostle.called}`}</span>
      <span className="pp-entry-line">{apostle.tagline}</span>
      <span className="pp-entry-cta">Explore {their} mission<ArrowRight size={18} aria-hidden /></span>
    </SlideLink>;
  }
  const prophet = page.summary;
  const era = prophetEraBand(prophet.era);
  return <SlideLink {...common}>
    <ScrollText className="pp-entry-icon" size={iconSize} strokeWidth={1.25} aria-hidden />
    <span className="pp-entry-kicker">{prophet.kind === "false" || prophet.kind === "nt" ? `The word · ${era.label}` : `${prophetCalled(prophet.kind, prophet.sex || sex)} · ${era.label}`}</span>
    <span className="pp-entry-line">{prophet.kind === "false" ? prophet.title : prophet.tagline}</span>
    <span className="pp-entry-cta">Explore the word<ArrowRight size={18} aria-hidden /></span>
  </SlideLink>;
}
