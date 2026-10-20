// "Where the lists were made" (approved mock-up D: js/map.js): the records on one map of the Mediterranean, Westminster to
// Babylonia, placed only as precisely as each record names its place: a city as a point, a region as a soft area, a
// disputed place with a dashed ring and a question mark. Records that name no place stand in a tray beside the map.
// Choose a period to light up its records; then the note on what changed over time.
import { useState, type CSSProperties } from "react";
import { SectionHead } from "@/pages/study/manuscripts/parts";
import { CN, D, ERA_SPANS, name, records, tone, type CanonRecord } from "./model";
import { Bridge } from "./parts";
import { Say, sayHandlers } from "./Timeline";

const [bx, by, bw, bh] = CN.map.box;
// Hand-placed labels where points crowd (Caesarea, Qumran and Roman Palestine sit within a few miles on this scale).
const LABEL: Record<string, [number, number, "start" | "middle" | "end"]> = {
  eusebius: [-10, -8, "end"], qumran: [8, 10, "start"], mishnah: [0, -34, "middle"], athanasius: [-8, 14, "end"], sirach: [0, 26, "middle"],
  justin: [8, -6, "start"], muratorian: [8, 12, "start"], carthage: [8, -4, "start"], augustine: [-4, 34, "middle"], irenaeus: [8, 4, "start"],
  trent: [8, -4, "start"], westminster: [8, 4, "start"], peshitta: [0, -30, "middle"], bava: [20, -30, "middle"],
};
const place = (r: CanonRecord) => CN.places[r.id];
const ON_MAP = records.filter((r) => place(r).kind !== "none");
const OFF_MAP = records.filter((r) => place(r).kind === "none");
// Regions first, so the soft areas lie under the points.
const MARKS = [...ON_MAP.filter((r) => place(r).kind === "region"), ...ON_MAP.filter((r) => place(r).kind !== "region")];
const LAND = ([] as string[]).concat(CN.map.d).join(" ");

function Mark({ r, dim }: { r: CanonRecord; dim: boolean }) {
  const p = place(r), x = (p.x ?? 0) - bx, y = (p.y ?? 0) - by, [dx, dy, anchor] = LABEL[r.id] ?? [8, 4, "start"];
  return <g className={`mp-mark mp-${p.kind}${dim ? " mp-dim" : ""}`} data-open={r.id} data-era={r.era} style={{ "--tone": tone(r.id) } as CSSProperties}
    tabIndex={0} role="button" aria-label={`${name(r.id)}, ${r.date}, ${p.label}`}>
    {p.kind === "region" ? <ellipse className="mp-area" cx={x} cy={y} rx="44" ry="24" />
      : p.kind === "disputed" ? <circle className="mp-ring" cx={x} cy={y} r="9" />
        : <><circle className="mp-dot" cx={x} cy={y} r="4.6" /><circle className="mp-halo" cx={x} cy={y} r="9" /></>}
    <text x={x + dx} y={y + dy} textAnchor={anchor}>{name(r.id)}{p.kind === "disputed" ? "?" : ""}</text>
  </g>;
}

export function Places({ num }: { num: string }) {
  const [era, setEra] = useState("all");
  const [said, setSaid] = useState<string | null>(null);
  const dim = (r: CanonRecord) => era !== "all" && String(r.era) !== era;
  return <>
    <SectionHead num={num} kicker="Where the lists were made" title={<>Now put each witness back in <em>its own place</em></>}
      lead="Eighteen records, each placed only as precisely as it names its own place. Choose a period, or open any record." />
    <div className="ct-sort mp-eras" role="radiogroup" aria-label="Periods">
      <button type="button" role="radio" aria-checked={era === "all"} onClick={() => setEra("all")}>All periods</button>
      {D.eras.map((label, i) => <button key={label} type="button" role="radio" aria-checked={era === String(i)} title={ERA_SPANS[i]} onClick={() => setEra(String(i))}>{label}</button>)}
    </div>
    <div className="mp" {...sayHandlers(setSaid)}>
      <figure className="mp-map"><svg viewBox={`0 0 ${bw} ${bh}`} role="group" aria-label="Map of where the records were made">
        <g transform={`translate(${-bx} ${-by})`}><path className="mp-land" d={LAND} /></g>
        <g className="mp-marks">{MARKS.map((r) => <Mark key={r.id} r={r} dim={dim(r)} />)}</g>
      </svg><figcaption>Land outlines: Natural Earth (public domain). A soft area marks a region the record names, not a boundary.</figcaption></figure>
      <aside className="mp-tray"><p className="kicker">Place not given</p><p className="mp-tray-line">These records name no place, or say it is uncertain. They are listed, not guessed.</p>
        {OFF_MAP.map((r) => <button key={r.id} type="button" className={`mp-off${dim(r) ? " mp-dim" : ""}`} data-open={r.id} data-era={r.era} style={{ "--tone": tone(r.id) } as CSSProperties}>
          <small>{r.date}</small><b>{name(r.id)}</b><span>{place(r).label}</span></button>)}
        <p className="mp-key"><span><i className="mp-k-dot"></i>A named city or site</span><span><i className="mp-k-area"></i>A named region</span><span><i className="mp-k-ring"></i>Place disputed</span></p></aside>
    </div>
    <Say id={said} />
    <Bridge />
  </>;
}
