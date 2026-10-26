// "Every subject runs through every door" (mock-up B): one lane per subject, one column per door, one point per title
// under every door it serves. Pointing at a point names it on the line beneath, which never changes height
// (StableTip); choosing a series draws its route across the doors.
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { StableTip } from "@/components/StableTip";
import type { Division, Title } from "@/data/resources/learning-catalogue";
import { AudienceArt, TrackGlyph } from "./Art";
import { type Back, facts, makerOf, plural, titleUrl, toneOf } from "./model";
import { SecHead, Status } from "./parts";


/** A cell's points in lines of at most fit: as few lines as fit, shared out evenly, the longer lines first (13 is 5, 4, 4). */
function linesOf<T>(items: T[], fit: number): T[][] {
  const count = Math.ceil(items.length / fit), base = Math.floor(items.length / count), extra = items.length % count;
  const lines: T[][] = [];
  for (let i = 0, at = 0; i < count; i++) { const size = base + (i < extra ? 1 : 0); lines.push(items.slice(at, at + size)); at += size; }
  return lines;
}

// A point is 16 px with a 4 px gap; a cell keeps .4rem clear on each side; never more than six across.
const POINT = 20, GAP = 4, SIDE = 6.4 * 2, MOST = 6;

function TitleHint({ division, t }: { division: Division; t: Title }) {
  if (t.open) return <><b>{t.title}</b> · {makerOf(t.open)}<br />{division.kind[t.kind].name} · {division.track[t.track].name} · {t.open.rights.licence}{" "}
    <span className="muted">Open it for the files and the credit to give.</span></>;
  return <><b>{t.title}</b> · {t.sub}<br />{facts(division, t)} · {division.track[t.track].name} · <Status title={t} />{" "}
    <span className="muted">{t.record ? "Open it to see the pages and download." : `Built from: ${t.builtFrom.map((b) => b.title).join("; ")}`}</span></>;
}

export function SubjectLanes({ division, num, back }: { division: Division; num: string; back: Back }) {
  const [series, setSeries] = useState<string | null>(null);
  const [pointed, setPointed] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<{ d: string; x: number; y: number } | null>(null);
  const [fit, setFit] = useState(MOST);

  // How many points fit across one cell at this width: every door's column is the same width.
  useLayoutEffect(() => {
    const measure = () => {
      const cell = grid.current?.querySelector<HTMLElement>(".cell");
      if (cell) setFit(Math.max(1, Math.min(MOST, Math.floor((cell.clientWidth - SIDE + GAP) / POINT))));
    };
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, []);

  const base = <>{plural(division.titles.length, "title")} across {division.tracks.length} subjects. <span className="muted">A title made for more than one door appears under each of them.</span></>;
  const seriesLine = (id: string) => { const s = division.seriesById[id]; return <><b>{s.name}</b> · {s.type}. {s.line}</>; };
  const options = [base, ...division.series.map((s) => seriesLine(s.id)), ...division.titles.map((t) => <TitleHint key={t.id} division={division} t={t} />)];
  const show = pointed ? <TitleHint division={division} t={division.title[pointed]} /> : series ? seriesLine(series) : base;

  // The route joins the series' points under their own doors, in order.
  const draw = useCallback(() => {
    const g = grid.current;
    if (!g || !series) { setRoute(null); return; }
    const box = g.getBoundingClientRect();
    const pts = division.inSeries(series).map((t) => g.querySelector<HTMLElement>(`.lm-pt[data-id="${t.id}"][data-home="true"]`)).filter((el): el is HTMLElement => el !== null)
      .map((el) => { const r = el.getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; });
    if (!pts.length) { setRoute(null); return; }
    const d = pts.map(([x, y], i) => { if (!i) return `M${x} ${y}`; const [px, py] = pts[i - 1], mx = (px + x) / 2; return `C${mx} ${py} ${mx} ${y} ${x} ${y}`; }).join(" ");
    setRoute({ d, x: pts[0][0], y: pts[0][1] });
  }, [series, division]);
  // Drawn again when the points move into new lines.
  useLayoutEffect(() => { draw(); addEventListener("resize", draw); return () => removeEventListener("resize", draw); }, [draw, fit]);

  const inSeries = (t: Title) => !series || t.series.some((s) => s.id === series);
  return <section className="lm-sec" aria-labelledby="lm-lanes-title">
    <SecHead num={num} id="lm-lanes-title" title={<>Every subject <em>runs through every door</em></>}
      lead={`One lane for each subject, one point for each title, under every door it serves. Point at one to read it${division.series.length ? "; choose a series to see its route" : ""}.`} />
    {division.series.length > 0 && <div className="lm-lanes-tools" role="group" aria-label="Series"><span className="lab">Series</span>
      {division.series.map((s) => <button key={s.id} type="button" className="lm-chip" aria-pressed={series === s.id} onClick={() => setSeries(series === s.id ? null : s.id)}>{s.name}</button>)}
    </div>}
    <div className="lm-lanes-scroll"><div className="lm-lanes shelf" ref={grid} onPointerLeave={() => setPointed(null)}>
      <span className="lm-corner" />
      {division.audiences.map((a) => <span key={a.id} className={`colh${a.setting ? " setting" : ""}`} style={toneOf(a)}><AudienceArt name={a.art} />{a.name}</span>)}
      {division.tracks.map((track) => <div key={track.id} className="lm-lane-row">
        <span className="rowh"><TrackGlyph track={track.id} size={18} />{track.name}</span>
        {division.audiences.map((a) => { const here = division.forAudience(a.id).filter((t) => t.track === track.id);
          return <span key={a.id} className={`cell${a.setting ? " setting" : ""}`}>
          {here.length > 0 && linesOf(here, fit).map((line, i) => <span key={i} className="lm-pt-line">{line.map((t) => <Link key={t.id} className={`lm-pt ${t.status}${inSeries(t) ? "" : " dim"}`} to={titleUrl(t.id)} state={{ from: back }}
            data-id={t.id} data-home={t.audience === a.id} style={toneOf(division.audience[t.audience])} aria-label={t.title}
            onPointerEnter={() => setPointed(t.id)} onFocus={() => setPointed(t.id)} onBlur={() => setPointed(null)} />)}</span>)}
        </span>; })}
      </div>)}
      <svg className="lm-route" aria-hidden="true">{route && <><path d={route.d} /><text x={route.x + 12} y={route.y - 12}>{series ? division.seriesById[series].name : ""}</text></>}</svg>
    </div></div>
    <StableTip className="lm-hint lm-lanes-hint" options={options} show={show} />
  </section>;
}
