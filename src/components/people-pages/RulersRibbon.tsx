import { useMemo, type CSSProperties } from "react";
import { cameFrom } from "@/lib/came-from";
import { formatYears } from "@/lib/eras";
import { rulerHref, type RulerSummary } from "@/lib/people-pages-index";
import type { Prophet } from "@/lib/study";
import { tone } from "@/lib/sections";
import { LANE_LABEL, VERDICT, glowFor, initials } from "./kinds";
import { prophetPositions, ribbonLayout } from "./ribbon-layout";
import { SlideLink } from "./SlideLink";
import { useStripPill } from "./use-strip-pill";

const RIVER_W = 3600, BANDS_H = 54, LABEL_H = 26, TRACK_H = 34, LANE_GAP = 10, PROPHET_H = 64;

const KIND_TONE = { writing: "prophets", prophet: "history", nt: "gospels", false: "apocrypha" } as const;

/** Rulers through time, across the page: era bands, a lane per throne, the verdict as a symbol at each bar's end. */
export function RulersRibbon({ rulers, prophets, focus, onFocus }: { rulers: RulerSummary[]; prophets?: Prophet[]; focus?: RulerSummary; onFocus: (r: RulerSummary) => void }) {
  const { scale, layout } = useMemo(() => ribbonLayout(rulers, RIVER_W), [rulers]);
  const here = focus && layout.bars.find((b) => b.ruler.id === focus.id);
  const pill = useStripPill(here ? (here.x0 + here.x1) / 2 / RIVER_W : 0.45);
  let top = BANDS_H;
  const laneTop = new Map<string, number>();
  for (const lane of layout.lanes) { laneTop.set(lane.id, top); top += LABEL_H + lane.tracks * TRACK_H + LANE_GAP; }
  const prophetTop = top;
  const height = top + (prophets ? PROPHET_H + 30 : 0) + 8;
  const middle = (r: RulerSummary) => { const bar = layout.bars.find((b) => b.ruler.id === r.id); return bar && (bar.x0 + bar.x1) / 2; };
  const eraMiddle = (era: string) => { const band = scale.bands.find((b) => b.id === era); return band && (band.x0 + band.x1) / 2; };
  const spots = prophets ? prophetPositions(prophets, rulers, middle, eraMiddle) : [];
  const back = cameFrom("Rulers through time");
  return <>
    {/* The lane names stay at the frame's left edge while the river scrolls under them. */}
    <div className="rg-frame-wrap">
    <div className="rg-lane-names" aria-hidden>{layout.lanes.map((lane) => <span key={lane.id} style={{ top: laneTop.get(lane.id) }}>{LANE_LABEL[lane.id]}</span>)}{prophets && <span style={{ top: prophetTop }}>The prophets</span>}</div>
    <div ref={pill.frame} className="rg-frame">
      <div className="rg-river" style={{ width: RIVER_W, height }} role="list" aria-label="Rulers in time order">
        {scale.bands.map((band, i) => <div key={band.id} className="rg-band" data-odd={i % 2 ? "" : undefined} style={{ left: band.x0, width: band.x1 - band.x0, "--era": `var(--${band.tone}-tab)` } as CSSProperties}>
          <span className="rg-band-label">{band.label}</span><span className="rg-band-dates">{band.dates}</span>
        </div>)}
        {layout.bars.map((bar) => {
          const r = bar.ruler, width = bar.x1 - bar.x0, fits = width > r.name.length * 7 + 22;
          return <SlideLink key={r.id} role="listitem" to={rulerHref(r.id)} state={back} className="rg-bar" data-focus={focus?.id === r.id ? "" : undefined} data-undated={bar.undated ? "" : undefined}
            style={{ left: bar.x0, width, top: (laneTop.get(bar.lane) ?? 0) + LABEL_H + bar.track * TRACK_H, "--lg": glowFor(r.kind, r.realm) } as CSSProperties}
            aria-label={`${r.name}, ${r.title}, ${r.reignText}${r.dates ? `, ${formatYears(r.dates.from, r.dates.to, r.dates.approx)}` : ""}, ${VERDICT[r.verdictTone].spoken}`}
            onMouseEnter={() => onFocus(r)} onFocus={() => onFocus(r)}>
            {fits && <span>{r.name}</span>}{r.verdictTone !== "none" && width > 14 && <i aria-hidden>{VERDICT[r.verdictTone].symbol}</i>}
          </SlideLink>;
        })}
        {prophets && <>
          {spots.map(({ prophet: p, x, row }) => <SlideLink key={p.id} to={`/people/${p.id}`} state={cameFrom("Rulers through time")} className="rg-medal" data-kind={p.kind}
            style={{ left: x, top: prophetTop + LABEL_H + row * 22, "--pm": tone(KIND_TONE[p.kind]).tab } as CSSProperties} aria-label={`${p.name}, prophet${p.king ? `, in the days of ${p.king}` : ""}`} title={p.name}>{initials(p.name)}</SlideLink>)}
        </>}
      </div>
    </div>
    </div>
    <div ref={pill.pill} className="pp-hpill" onPointerDown={pill.onPillDown} aria-hidden><span ref={pill.thumb} /></div>
  </>;
}
