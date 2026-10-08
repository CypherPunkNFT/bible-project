// The landing of the Learning division (approved mock-up E, from B): "Choose a door." Seven line-art doors (arches for
// the five ages, square doorways for the two settings), each drawing on a slow loop; a line beneath that says what is
// behind the door pointed at and never changes height (StableTip); and the division's figures as one quiet bar.
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { StableTip } from "@/components/StableTip";
import type { Audience, Division } from "@/data/resources/learning-catalogue";
import { AudienceArt } from "./Art";
import { doorUrl, plural, toneOf } from "./model";

/** An arch for an age, a lintel doorway for a setting. viewBox 100 x 160, stretched to the door. */
function DoorFrame({ setting }: { setting?: boolean }) {
  const ns = "non-scaling-stroke";
  return setting
    ? <svg className="frame" viewBox="0 0 100 160" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <path className="fill" d="M14 160 V30 H86 V160 Z" stroke="none" /><path d="M6 160 V22 H94 V160" vectorEffect={ns} /><path d="M14 160 V30 H86 V160" opacity={0.5} vectorEffect={ns} />
      <path d="M2 22 H98 M2 16 H98" vectorEffect={ns} /><path d="M0 160 H100" vectorEffect={ns} />
    </svg>
    : <svg className="frame" viewBox="0 0 100 160" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
      <path className="fill" d="M14 160 V54 A36 36 0 0 1 86 54 V160 Z" stroke="none" /><path d="M6 160 V52 A44 44 0 0 1 94 52 V160" vectorEffect={ns} /><path d="M14 160 V54 A36 36 0 0 1 86 54 V160" opacity={0.5} vectorEffect={ns} />
      <path d="M45 9 L50 4 L55 9" vectorEffect={ns} /><path d="M0 160 H100" vectorEffect={ns} />
    </svg>;
}

function Door({ audience: a, count, chosen, onChoose, onPoint }: { audience: Audience; count: number; chosen: boolean; onChoose: (id: string) => void; onPoint: (id: string | null) => void }) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onChoose(a.id);
  };
  return <a className={`lm-door${a.setting ? " setting" : ""}${chosen ? " is-chosen" : ""}`} href={doorUrl(a.id)} data-aud={a.id} style={toneOf(a)} aria-expanded={chosen}
    onClick={click} onPointerEnter={() => onPoint(a.id)} onPointerLeave={() => onPoint(null)}>
    <span className="lm-arch"><DoorFrame setting={a.setting} /><span className="cnt">{count}<small>titles</small></span><AudienceArt name={a.art} /></span>
    <b>{a.name}</b><small>{a.setting ? a.age : `Ages ${a.age}`}</small>
  </a>;
}

function doorHint(division: Division, a: Audience) {
  const items = division.forAudience(a.id), kinds = [...new Set(items.map((t) => division.kind[t.kind].plural.toLowerCase()))];
  return <><b>{a.name}{a.setting ? "" : `, ${a.age}`}.</b> {a.line} <span className="muted">{plural(items.length, "title")}: {kinds.slice(0, 4).join(", ")}{kinds.length > 4 ? " and more" : ""}.</span></>;
}
function restLine(division: Division, age: string | null) {
  return age ? <><b>{division.audience[age].name}</b> is open below. <span className="muted">Choose another door to slide to its stack, or this one again to close it.</span></>
    : "Choose a door to open its stack.";
}

export function Doors({ division, age, onChoose }: { division: Division; age: string | null; onChoose: (id: string) => void }) {
  const [pointed, setPointed] = useState<string | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const ids = division.audiences.map((a) => a.id);
  // The line under the doors holds every sentence it can say, so it keeps one height (owner, 2026-10-08).
  const options = [restLine(division, null), ...ids.map((id) => restLine(division, id)), ...division.audiences.map((a) => doorHint(division, a))];
  const show = pointed ? doorHint(division, division.audience[pointed]) : restLine(division, age);

  // On a phone the doors are a sideways row: bring the chosen one to the middle of it.
  useEffect(() => {
    const el = row.current, door = el?.querySelector<HTMLElement>(".lm-door.is-chosen");
    if (!el || !door || el.scrollWidth <= el.clientWidth) return;
    const shift = door.getBoundingClientRect().left - el.getBoundingClientRect().left;
    el.scrollTo({ left: el.scrollLeft + shift - (el.clientWidth - door.offsetWidth) / 2, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [age]);

  const ages = division.audiences.filter((a) => !a.setting), settings = division.audiences.filter((a) => a.setting);
  return <section className={`lm-land${age ? " is-open" : ""}`} aria-labelledby="lm-land-title">
    <div className="lm-sky" aria-hidden="true" />
    <div className="lm-land-head">
      <p className="lm-kicker">Resources · Learning materials</p>
      <h1 id="lm-land-title">Choose <em>a door.</em></h1>
      <p>Five doors by age and two for those who use them together. Open one to see its stack, every title written from the site’s reviewed pages.</p>
    </div>
    <div className={`lm-doors${age ? " has-chosen" : ""}`} ref={row} role="group" aria-label="Choose a reader">
      {[...ages, ...settings].map((a) => <Door key={a.id} audience={a} count={division.forAudience(a.id).length} chosen={a.id === age} onChoose={onChoose} onPoint={setPointed} />)}
    </div>
    <StableTip className="lm-hint lm-door-hint" options={options} show={show} />
    <div className="lm-bar">
      <div><b>{division.ready.length}</b><span>Ready to print</span></div><div><b>{division.planned.length}</b><span>Planned</span></div>
      <div><b>{division.tracks.length}</b><span>Subjects</span></div><div><b>{division.series.length}</b><span>Series</span></div><div><b>2</b><span>Paper sizes</span></div>
    </div>
  </section>;
}
