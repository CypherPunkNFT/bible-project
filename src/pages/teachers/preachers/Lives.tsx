// 04 · Who was alive at the same time (approved mock-up: design/authors-directions/teachers/lives.js): every life as a
// line on one 1500–today axis, a year cursor (drag, arrow keys, play), the people alive in that year listed with their
// city, and a small map of where they were. Starts at 1660; the only automatic motion is one short sweep the first time
// the section scrolls into view. The canvas runs as a small engine (lives/chart.ts) so moving the cursor never
// re-renders the chart; React draws the side panel, which changes only when the whole year does.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useThemeVersion } from "@/lib/theme";
import { SectionHead } from "../shared/Frame";
import { FAMILIES, familyOf, lifeLabel } from "../shared/people";
import { usePreachers } from "./context";
import { LivesChart } from "./lives/chart";
import { observeWidth, onFirstView } from "./lives/common";
import { FloatingTip, type TipHandle } from "./lives/FloatingTip";
import { LivesSide } from "./lives/LivesSide";
import { END, OPEN_YEAR, START, type Mode } from "./lives/model";
import "./Lives.css";

const MODES: [Mode, string][] = [["birth", "By birth"], ["family", "By tradition"]];

function PlayIcon({ playing }: { playing: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {playing ? <><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></> : <path d="M7 4.5v15l13-7.5z" />}
  </svg>;
}

export function Lives() {
  const { data, openProfile } = usePreachers();
  const people = data.people;
  const fams = useMemo(() => people.map(familyOf), [people]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const chartBox = useRef<HTMLDivElement>(null);
  const tip = useRef<TipHandle>(null);
  const engine = useRef<LivesChart | null>(null);
  const [year, setYear] = useState(OPEN_YEAR);
  const [hover, setHover] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>("birth");
  const [pinned, setPinned] = useState<string | null>(null);
  const [tipFor, setTipFor] = useState(-1);
  const themeVersion = useThemeVersion();

  useEffect(() => {
    const el = canvas.current, box = chartBox.current;
    if (!el || !box) return;
    const chart = new LivesChart(el, people, {
      year: setYear,
      hover: setHover,
      playing: setPlaying,
      open: (i) => { tip.current?.hide(); openProfile(people[i].id, el); },
      tip: (i, x, y) => { if (i < 0) tip.current?.hide(); else { setTipFor(i); tip.current?.move(x, y); } },
    });
    engine.current = chart;
    chart.resize(Math.round(box.getBoundingClientRect().width));
    const stopWidth = observeWidth(box, (w) => chart.resize(w));
    const stopSweep = onFirstView(box, 0.3, () => chart.sweep());
    let live = true;
    void document.fonts?.ready.then(() => { if (live) chart.measureNames(); });
    const hideTip = () => tip.current?.hide();
    window.addEventListener("scroll", hideTip, { passive: true });
    return () => {
      live = false;
      stopWidth();
      stopSweep();
      window.removeEventListener("scroll", hideTip);
      chart.destroy();
      engine.current = null;
    };
  }, [people, openProfile]);

  useEffect(() => { if (themeVersion) engine.current?.recolor(); }, [themeVersion]);

  const chooseMode = (next: Mode) => { setMode(next); engine.current?.setMode(next); };
  const pinFamily = (key: string) => { const next = pinned === key ? null : key; setPinned(next); engine.current?.setPinnedFamily(next); };
  const shownFams = FAMILIES.filter((f) => fams.some((x) => x.key === f.key));
  const tipPerson = tipFor >= 0 ? people[tipFor] : null;

  return <>
    <SectionHead num="04" kicker="Five centuries of lives" title={<>Who was alive <em>at the same time?</em></>}
      line="Every line is one teacher's life, coloured by tradition. Drag across the chart, use the arrow keys or press play: those alive in that year light up, and the map shows where each was living. Click a line to meet that teacher." />
    <div className="life-card">
      <div className="life-tools">
        <button type="button" className="life-round life-play" aria-pressed={playing} aria-label={playing ? "Pause" : "Play through the years"}
          onClick={() => engine.current?.togglePlay()}><PlayIcon playing={playing} /></button>
        <span className="life-lab">Order</span>
        <div className="life-seg" role="group" aria-label="Order the lives">
          {MODES.map(([key, label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => chooseMode(key)}>{label}</button>)}
        </div>
      </div>
      <div className="life-grid">
        <div className="life-chart-col">
          <div className="life-chart" ref={chartBox}>
            <canvas ref={canvas} tabIndex={0} role="slider" aria-label="Year" aria-valuemin={START} aria-valuemax={END} />
          </div>
          <div className="life-legend" role="group" aria-label="Traditions" 
            onPointerOver={(e) => engine.current?.setFamily((e.target as Element).closest<HTMLElement>("[data-fam]")?.dataset.fam ?? null)}
            onPointerLeave={() => engine.current?.setFamily(null)}>
            {shownFams.map((f) => <button key={f.key} type="button" className="life-chip" aria-pressed={pinned === f.key} data-fam={f.key}
              style={{ "--tone": `var(${f.tone})` } as CSSProperties} onClick={() => pinFamily(f.key)}>
              <i className="life-dot" />{f.label}<small>{fams.filter((x) => x.key === f.key).length}</small>
            </button>)}
          </div>
        </div>
        <LivesSide people={people} views={data.views} year={year} hover={hover}
          onHover={(i) => engine.current?.setHover(i)}
          onOpen={(i, origin) => { tip.current?.hide(); openProfile(people[i].id, origin); }} />
      </div>
    </div>
    <FloatingTip ref={tip} className="life-tip">
      {tipPerson && <><b>{tipPerson.name}</b><small>{lifeLabel(tipPerson)} · {fams[tipFor].label}<br />Click for their profile</small></>}
    </FloatingTip>
  </>;
}
