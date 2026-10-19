// The Hymns card's drawing on Study (owner-approved mock-up: design/hymns-card-directions-2/, first entry, 2026-10-18):
// the 150 psalms round a disc like the grooves of a record, each mark as long as the hymns sung on that psalm, and an arm
// that turns from psalm to psalm. The read-out beside it shows the psalm and its hymn only once the arm has settled.
// The disc is placed by measurement: as large as the space above the card's title allows (×1.2), a little below and left
// of that space's centre, with the read-out centred in the space to its right.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PSALM_HYMN_COUNTS, PSALTER_STOPS, type PsalterStop } from "./hymns-card-data";

const CX = 110, CY = 103, INNER = 58, REACH = 40, TICK_CAP = 26, ARM = INNER + TICK_CAP + 6, EDGE = ARM + 4;
const CLEAR = 14, GROW = 1.2, SHIFT_LEFT = 24, SHIFT_DOWN = 24, READ_COLUMN_REM = 13;
const angleOf = (psalm: number) => (psalm - 0.5) * 2.4; // degrees clockwise from the top
const MAX = Math.max(...PSALM_HYMN_COUNTS);
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TICKS = PSALM_HYMN_COUNTS.map((n, i) => {
  const a = (angleOf(i + 1) - 90) * Math.PI / 180, len = Math.min(TICK_CAP, n ? 4 + (n / MAX) * REACH : 2);
  return { psalm: i + 1, x1: CX + INNER * Math.cos(a), y1: CY + INNER * Math.sin(a), x2: CX + (INNER + len) * Math.cos(a), y2: CY + (INNER + len) * Math.sin(a),
    opacity: n ? 0.32 + 0.6 * n / MAX : 0.14 };
});

export function HymnsCardArt() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const read = useRef<HTMLDivElement>(null);
  const [stop, setStop] = useState<PsalterStop>(PSALTER_STOPS.find((s) => s.psalm === 90) ?? PSALTER_STOPS[0]);
  const [armPsalm, setArmPsalm] = useState(stop.psalm);
  const [turned, setTurned] = useState(angleOf(stop.psalm));
  const [shown, setShown] = useState(true);

  // Place the disc and the read-out from the card's own measured layout.
  useLayoutEffect(() => {
    const art = root.current, disc = svg.current, out = read.current, card = root.current?.closest(".study-resource");
    if (!art || !disc || !out || !card) return;
    const place = () => {
      const title = card.querySelector("h2"), eyebrow = card.querySelector(".study-card-top");
      if (!title || !eyebrow) return;
      const box = art.getBoundingClientRect(), t = title.getBoundingClientRect(), e = eyebrow.getBoundingClientRect();
      const column = READ_COLUMN_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const zone = { left: box.left, right: box.right - column - CLEAR, top: e.bottom + CLEAR, bottom: t.top - CLEAR };
      const size = Math.max(0, Math.min(zone.right - zone.left, zone.bottom - zone.top)) * GROW;
      const left = (zone.left + zone.right) / 2 - size / 2 - box.left - SHIFT_LEFT, top = t.top - size - box.top + SHIFT_DOWN;
      Object.assign(disc.style, { width: `${size}px`, height: `${size}px`, left: `${left}px`, top: `${top}px` });
      const room = box.width - (left + size);
      out.style.left = `${left + size + (room - out.offsetWidth) / 2}px`;
      out.style.top = `${(box.height - out.offsetHeight) / 2}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(card);
    let live = true;
    document.fonts.ready.then(() => { if (live) place(); }, (error: unknown) => console.warn("Hymns card: fonts did not report ready", error));
    return () => { live = false; observer.disconnect(); };
  }, []);

  // The cycle: the arm turns (always clockwise); halfway round the read-out fades out, stays blank about 0.1 s, and the new
  // psalm and its hymn fade in, fully shown just before the arm lands (owner, 2026-10-18: never changes before the arm
  // moves, never blank after it arrives, blank for 0.1 s).
  useEffect(() => {
    if (reduced()) return;
    let live = true;
    (async () => {
      let i = PSALTER_STOPS.findIndex((s) => s.psalm === stop.psalm), angle = angleOf(stop.psalm);
      while (live) {
        await wait(3300);
        if (!live) return;
        i = (i + 1) % PSALTER_STOPS.length;
        const next = PSALTER_STOPS[i];
        angle += ((angleOf(next.psalm) - (angle % 360)) + 360) % 360;
        setTurned(angle); setArmPsalm(next.psalm);
        await wait(450);
        if (!live) return;
        setShown(false);
        await wait(300);
        if (!live) return;
        setStop(next); setShown(true);
      }
    })();
    return () => { live = false; };
    // The cycle runs once for the card's life; it carries its own position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = PSALM_HYMN_COUNTS[stop.psalm - 1];
  return <div ref={root} className="study-art study-hymns-art" aria-hidden="true">
    <svg ref={svg} viewBox={`${CX - EDGE} ${CY - EDGE} ${EDGE * 2} ${EDGE * 2}`} className="study-hymns-disc">
      {[24, 29, 34, 39, 44, 49, 54].map((r) => <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="currentColor" strokeOpacity={r === 54 ? 0.3 : 0.12} />)}
      <circle cx={CX} cy={CY} r={34} fill="currentColor" fillOpacity={0.13} />
      <text x={CX} y={CY - 3} textAnchor="middle" fontSize={11} letterSpacing={1.2} fill="var(--muted)" style={{ fontFamily: "var(--font-sans)" }}>PSALMS</text>
      <text x={CX} y={CY + 13} textAnchor="middle" fontSize={9.5} fill="var(--muted)" style={{ fontFamily: "var(--font-sans)" }}>Watts · 1719</text>
      {TICKS.map((t) => <line key={t.psalm} className={t.psalm === armPsalm ? "on" : undefined} x1={t.x1.toFixed(1)} y1={t.y1.toFixed(1)} x2={t.x2.toFixed(1)} y2={t.y2.toFixed(1)}
        stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" opacity={t.psalm === armPsalm ? 1 : t.opacity.toFixed(2)} />)}
      <g className="study-hymns-arm" style={{ transform: `rotate(${turned}deg)` }}>
        <path d={`M${CX} ${CY - 20} V${CY - ARM}`} stroke="var(--ink)" strokeWidth={1.2} strokeLinecap="round" />
        <circle cx={CX} cy={CY - ARM} r={2.6} fill="var(--ink)" />
      </g>
      <circle cx={CX} cy={CY} r={2.4} fill="var(--ink)" />
    </svg>
    <div ref={read} className={`study-hymns-read${shown ? "" : " swap"}`}>
      <small>Psalm</small>
      <div className="num"><b>{stop.psalm}</b><span>{count} {count === 1 ? "hymn" : "hymns"} sung on it</span></div>
      <q>{stop.line}</q>
      <p>{stop.author} · {stop.year}</p>
    </div>
  </div>;
}
