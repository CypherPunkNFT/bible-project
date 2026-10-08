// The smaller pieces of "Teachers through the Bible": the teacher list (the war-table rail), the fold-out of teachers
// with no Bible texts, the heading above the ring, and the year slider with its play button.
import { memo, type CSSProperties, type MouseEvent } from "react";
import { Library } from "lucide-react";
import type { Person } from "@/data/teachers/pages-types";
import { familyOf, formatNumber, lifeLabel } from "../../shared/people";
import { plural } from "../bible/words";
import { exactYear, initials, listName, type ThroughModel, type Timeline, type Track } from "./model";

const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;
type Open = (id: string, origin: Element) => void;

interface RailProps { model: ThroughModel; chosen: string; onChoose: (id: string, item: HTMLElement) => void; onOpen: Open }

export const Rail = memo(function Rail({ model, chosen, onChoose, onOpen }: RailProps) {
  return <div className="thr-side">
    <nav className="thr-rail" aria-label="Choose a teacher">
      <p className="thr-rail-head"><span>Teachers</span><span>Works on Bible texts</span></p>
      {[model.everyone, ...model.teachers].map((t) => {
        const p = t.person;
        return <button key={t.id} type="button" className="thr-t" aria-pressed={t.id === chosen} style={tone(p ? familyOf(p).tone : "--accent")}
          onClick={(e: MouseEvent<HTMLButtonElement>) => onChoose(t.id, e.currentTarget)}>
          <span className="thr-disc">{p ? initials(p.name) : <Library size={16} strokeWidth={1.5} aria-hidden />}</span>
          <span className="thr-t-text"><span className="thr-full">{p ? listName(p.name) : "Everyone"}</span><span className="thr-short">{p ? p.short : "Everyone"}</span>
            <small>{p ? `${lifeLabel(p)} · ${familyOf(p).label}` : `${model.teachers.length} teachers, summed`}</small></span>
          <b>{formatNumber(t.works)}</b></button>;
      })}
    </nav>
    <Quiet people={model.quiet} onOpen={onOpen} />
  </div>;
});

function Quiet({ people, onOpen }: { people: Person[]; onOpen: Open }) {
  if (!people.length) return null;
  return <details className="thr-quiet"><summary>{people.length} more teachers have no Bible texts recorded yet</summary>
    <p>Their works in the library do not name a main Bible text, so they have no ring. Choose a name for their profile.</p>
    <div className="slim-scroll">{people.map((p) => <button key={p.id} type="button" onClick={(e) => onOpen(p.id, e.currentTarget)}>{p.name}</button>)}</div></details>;
}

export function Who({ model, track, onOpen }: { model: ThroughModel; track: Track; onOpen: Open }) {
  const p = track.person;
  if (!p) return <div className="thr-who"><p className="kicker">Every teacher, summed</p><h3>Everyone</h3>
    <p>{plural(track.works, "work")} on a Bible text by {model.teachers.length} teachers, across {plural(track.bookCount, "book")}.</p></div>;
  const family = familyOf(p);
  return <div className="thr-who">
    <p className="kicker" style={tone(family.tone)}>{family.label} · {lifeLabel(p)}</p>
    <h3><button type="button" className="thr-name" style={tone(family.tone)} onClick={(e) => onOpen(p.id, e.currentTarget)}>{p.name}</button></h3>
    <p>{plural(track.works, "work")} on a Bible text, across {plural(track.bookCount, "book")}.</p></div>;
}

function PlayIcon({ playing }: { playing: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path d={playing ? "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" : "M7 4.5v15l12-7.5z"} fill="currentColor" /></svg>;
}

interface YearsProps { track: Track; timeline: Timeline | null; year: number; playing: boolean; reason: string; onPlay: () => void; onYear: (year: number) => void }

export function Years({ track, timeline, year, playing, reason, onPlay, onYear }: YearsProps) {
  const limited = timeline !== null && year < timeline.all;
  const soFar = limited ? track.dated.filter((w) => (exactYear(w) ?? Infinity) <= year).length : track.works;
  return <div className="thr-years-slot">
    <div className="thr-years" hidden={!timeline}>
      <button type="button" className={`thr-play${playing ? " thr-on" : ""}`} aria-label={playing ? "Pause" : "Play through the years"} onClick={onPlay}><PlayIcon playing={playing} /></button>
      <input type="range" className="thr-range" step="1" aria-label="Show works up to year" min={timeline?.first ?? 0} max={timeline?.all ?? 0}
        value={timeline ? Math.min(year, timeline.all) : 0} onChange={(e) => onYear(Number(e.target.value))} />
      <output className="thr-readout">{limited ? <><b>{year}</b> {formatNumber(soFar)} dated so far</> : <><b>All</b> {formatNumber(track.works)} works</>}</output>
    </div>
    <p className="thr-years-note" hidden={Boolean(timeline)}>{reason}</p>
  </div>;
}
