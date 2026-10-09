// /resources/life, as the owner approved it (design/help-for-life-directions, direction E, 2026-10-08): the crisis strip
// first; the title with its words and four numbers, still-waters line art beside it; the national lines as a directory;
// then each researched city (only cities with verified: true) with its USA map, sourced facts and its own map of places;
// and how the list is made. No section links: this page stands on its own. Every word and number comes from the data.
import { MessageSquareText, Phone } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import type { Help, LifeData } from "@/data/resources";
import { dialable, smsHref } from "./contact-links";
import { CitySection } from "./life/CitySection";
import { hasCityFiles, kindOf, kindsIn, listOf, wayOf } from "./life/format";
import { NationalLines } from "./life/NationalLines";
import { StillWaters } from "./life/StillWaters";
import { RESOURCE_SECTIONS, sectionBySlug } from "./sections";
import "./life/life.css";

/** The two lines the crisis strip carries; the Crisis list leaves them out, as they already lead the page (owner, 2026-10-08). */
const IN_STRIP = { danger: "emergency-911", crisis: "988-lifeline" };
const answersAlways = (e?: Help) => /24\s*\/\s*7/.test(e?.hours ?? "");

function CrisisStrip({ groups }: { groups: LifeData["groups"] }) {
  const all = groups.flatMap((g) => g.entries);
  const danger = all.find((e) => e.id === IN_STRIP.danger), crisis = all.find((e) => e.id === IN_STRIP.crisis);
  const ways = (e: Help | undefined, number: string, way: "call" | "text") => !!e?.contact.some((c) => wayOf(c.kind) === way && dialable(c.value) === number);
  const call911 = ways(danger, "911", "call"), call988 = ways(crisis, "988", "call"), text988 = ways(crisis, "988", "text");
  if (!call911 && !call988 && !text988) return null;
  return <aside className="lf-crisis" aria-label="Help right now">
    {call911 && <p><span>In danger now?</span><a href="tel:911"><Phone size={18} strokeWidth={1.6} aria-hidden="true" />Call 911</a></p>}
    {(call988 || text988) && <p><span>Thinking of suicide or in crisis?</span>
      {call988 && <a href="tel:988"><Phone size={18} strokeWidth={1.6} aria-hidden="true" />Call 988</a>}
      {call988 && text988 && <span>or</span>}
      {text988 && <a href={smsHref("988")}><MessageSquareText size={18} strokeWidth={1.6} aria-hidden="true" />Text 988</a>}</p>}
    {call911 && answersAlways(danger) && (call988 || text988) && answersAlways(crisis) && <p className="lf-crisis-note">Both answer 24 hours a day.</p>}
  </aside>;
}

export default function LifePage({ data }: { data: LifeData }) {
  const info = sectionBySlug("life");
  useEffect(() => { document.title = `${info.title} · Resources · Bible Project`; return () => { document.title = "Bible Project"; }; }, [info.title]);
  const groups = data.groups.map((g) => (g.id === "crisis" ? { ...g, entries: g.entries.filter((e) => e.id !== IN_STRIP.danger && e.id !== IN_STRIP.crisis) } : g));
  const national = data.groups.reduce((n, g) => n + g.entries.length, 0);
  // Only verified cities, and only once their map and facts have been built (scripts/build-jax-map.py).
  const cities = data.cities.filter((c) => c.verified === true && c.entries.length > 0).flatMap((c) => (hasCityFiles(c.id) ? [{ ...c, id: c.id }] : []));
  const places = cities.reduce((n, c) => n + c.entries.length, 0), lines = cities.reduce((n, c) => n + (c.lines?.length ?? 0), 0);
  const helpsWith = listOf([...new Set(cities.flatMap((c) => kindsIn(c).map(([k]) => kindOf(k).short.toLowerCase())))]);
  const stats: [string, string | number][] = [["National lines", national], ...(cities.length ? [["Places", places], ["Local lines", lines]] as [string, number][] : []), ["Checked", data.checked]];
  // "Help" plain, "for life" set apart in the page's title colour (owner, 2026-10-08).
  const titleWords = info.title.split(" "), lastWords = titleWords.splice(1).join(" ");
  return <div className="lf-page mx-auto max-w-7xl px-4 sm:px-6" style={{ "--door": `var(--${info.color})` } as CSSProperties}>
    <CrisisStrip groups={data.groups} />
    <header className="lf-hero">
      <div>
        <p className="lf-kick">Resources · {String(RESOURCE_SECTIONS.indexOf(info) + 1).padStart(2, "0")}</p>
        <h1>{titleWords.join(" ")} <em>{lastWords}</em></h1>
        <p className="lf-lead">Free national lines for the hardest moments{cities.length ? `, and places in ${listOf(cities.map((c) => c.name))} that help with ${helpsWith}` : ""}. Every number can be tapped to call or text.</p>
        <dl className="lf-stats">{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === "number" ? value.toLocaleString("en-US") : value}</dd></div>)}</dl>
      </div>
      <StillWaters />
    </header>
    <NationalLines groups={groups} />
    {cities.map((c) => <CitySection key={c.id} city={c} checked={data.checked} />)}
  </div>;
}
