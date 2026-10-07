import { useMemo, type CSSProperties } from "react";
import { cameFrom } from "@/lib/came-from";
import { formatYears } from "@/lib/eras";
import { rulerHref, type RulerSummary } from "@/lib/people-pages-index";
import { VERDICT, glowFor } from "./kinds";
import { WORLD_LANES, ribbonLayout } from "./ribbon-layout";
import { SlideLink } from "./SlideLink";
import type { StripBar } from "./strip-layout";

const EXTENT = 3000, MIN_H = 24, GAP = 2;

/** Where each lane sits across a phone screen: the world stage (Egypt, Aram, Assyria, Babylon, Persia, the other
 *  nations, and Rome's emperors and officials) one narrow column at the left; Israel | Judah side by side; everyone
 *  else (judges, the united kingdom, governors, the Herods) one wide column beside it, before and after the two kingdoms. */
const COLUMN: Record<string, [number, number]> = { world: [12.5, 36], israel: [37.5, 68.5], judah: [69.5, 100] };
const keyOf = (bar: StripBar) => (WORLD_LANES.includes(bar.lane) || bar.ruler.kind === "roman" ? "world" : COLUMN[bar.lane] ? bar.lane : "full");
const columnOf = (bar: StripBar): [number, number] => COLUMN[keyOf(bar)] ?? [37.5, 100];

/**
 * Bars at their time, but never shorter than a readable name, one after another in each column: a short reign (or a
 * shared one, a co-regency) pushes the next one down a little. On a phone the column is read in order, not measured.
 */
function stack(bars: StripBar[]) {
  const placed: (StripBar & { y0: number; y1: number })[] = [];
  const last = new Map<string, number>();
  for (const bar of [...bars].sort((a, b) => a.x0 - b.x0)) {
    const minHeight = MIN_H;
    // A wide bar waits for both kingdoms' columns, and they wait for the wide one above them; the world stage runs on its own.
    const key = keyOf(bar);
    const after = key === "full" ? ["full", "israel", "judah"] : key === "world" ? ["world"] : [key, "full"];
    const y0 = Math.max(bar.x0, ...after.map((k) => (last.get(k) ?? -Infinity) + GAP));
    const y1 = Math.max(bar.x1 + (y0 - bar.x0), y0 + minHeight);
    last.set(key, y1);
    placed.push({ ...bar, y0, y1 });
  }
  return placed;
}

/** Rulers through time down a phone screen (PRESENTATION.md §5.1): time runs down, Israel and Judah as two columns. */
export function RulersColumn({ rulers, focus, onFocus }: { rulers: RulerSummary[]; focus?: RulerSummary; onFocus: (r: RulerSummary) => void }) {
  const { scale, layout } = useMemo(() => ribbonLayout(rulers, EXTENT, true), [rulers]);
  const bars = useMemo(() => stack(layout.bars), [layout]);
  const height = Math.max(EXTENT, ...bars.map((b) => b.y1)) + 10;
  const back = cameFrom("Rulers through time");
  return <>
  <p className="rg-column-key">Time runs down the page. The narrow left column is the <strong>world stage</strong>: Egypt, Aram, Assyria, Babylon, Persia, the other nations and Rome. In the two kingdoms, <strong>Israel</strong> is the middle column and <strong>Judah</strong> the right.</p>
  <div className="rg-column" style={{ height }} role="list" aria-label="Rulers in time order, earliest at the top">
    {scale.bands.map((band) => <div key={band.id} className="rg-vband" style={{ top: band.x0, height: band.x1 - band.x0, "--era": `var(--${band.tone}-tab)` } as CSSProperties}>
      <span>{band.label} · {band.dates}</span>
    </div>)}
    {bars.map((bar) => {
      const r = bar.ruler, [from, to] = columnOf(bar), width = to - from;
      return <SlideLink key={r.id} role="listitem" to={rulerHref(r.id)} state={back} className="rg-vbar" data-lane={bar.lane} data-world={keyOf(bar) === "world" ? "" : undefined} data-focus={focus?.id === r.id ? "" : undefined} data-undated={bar.undated ? "" : undefined}
        style={{ top: bar.y0, height: bar.y1 - bar.y0, left: `${from}%`, width: `calc(${width}% - 2px)`, "--lg": glowFor(r.kind, r.realm) } as CSSProperties}
        aria-label={`${r.name}, ${r.title}, ${r.reignText}${r.dates ? `, ${formatYears(r.dates.from, r.dates.to, r.dates.approx)}` : ""}, ${VERDICT[r.verdictTone].spoken}`}
        onFocus={() => onFocus(r)} onMouseEnter={() => onFocus(r)}>
        <span>{r.name}</span>{r.verdictTone !== "none" && <i aria-hidden>{VERDICT[r.verdictTone].symbol}</i>}
      </SlideLink>;
    })}
  </div>
  </>;
}
