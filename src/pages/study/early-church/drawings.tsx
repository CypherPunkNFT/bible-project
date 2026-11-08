// The early church's drawings, in one thin line: the opening's folded letter and council bench under one arch, and the case's eight
// drawers, each drawn as the kind of writing it holds. Illustrative forms only: no real letter, codex or seal is traced, and no
// person is drawn.
import type { ReactNode } from "react";

const MINI: Record<string, ReactNode> = {
  // A letter folded for a messenger, tied with a cord.
  "after-apostles": <><path d="M12 20h40v26H12Z" /><path d="M12 20l20 13 20-13" /><path d="M32 33v13M26 46c2-4 10-4 12 0" opacity=".7" /><path d="M18 40h8M38 40h8" opacity=".5" /></>,
  // Three links of a chain and an open shackle.
  martyrs: <><ellipse cx="18" cy="32" rx="9" ry="5.5" /><ellipse cx="32" cy="32" rx="5" ry="8" /><ellipse cx="46" cy="32" rx="9" ry="5.5" /><path d="M55 32c4 0 6 3 6 7s-3 7-7 7" opacity=".7" /></>,
  // A rolled defence held out towards an empty throne.
  defenders: <><path d="M40 18h12v16H40M40 34v16M52 34v16M38 34h16M40 18c0-4 12-4 12 0" /><path d="M8 34h22" /><ellipse cx="8" cy="34" rx="2.5" ry="5" /><ellipse cx="30" cy="34" rx="2.5" ry="5" /><path d="M12 31h14M12 37h10" opacity=".5" /></>,
  // A small codex with two clasps.
  teachers: <><path d="M16 16h28l4 4v28H20l-4-4Z" /><path d="M16 16v28M44 16v28h4" opacity=".6" /><path d="M48 26h4M48 38h4" /><path d="M23 24h16M23 29h12" opacity=".5" /></>,
  // An imperial letter with a wax seal on a cord.
  constantine: <><path d="M14 12h32v30H14Z" /><path d="M19 19h22M19 24h22M19 29h16" opacity=".55" /><path d="M30 42v6" /><circle cx="30" cy="52" r="5" /><path d="M28 51l2 2 2-3" opacity=".7" /></>,
  // A reed hut in the desert, with one palm.
  desert: <><path d="M14 48c0-12 8-20 16-20s16 8 16 20" /><path d="M20 48V36M26 48V31M34 48V31M40 48V36" opacity=".55" /><path d="M6 48c10-3 42-3 52 0" /><path d="M52 46V22M52 22c-6-2-9 1-10 4M52 22c6-3 9 0 10 3M52 22c-2-5-6-6-9-5" opacity=".75" /></>,
  // A council's curved bench around a book on a stand.
  councils: <><path d="M8 44c0-14 11-24 24-24s24 10 24 24" /><path d="M14 44c0-10 8-18 18-18s18 8 18 18" opacity=".6" /><path d="M26 38h12l-2 4h-8Z" /><path d="M32 42v8M27 50h10" /></>,
  // An open book and a reed pen.
  augustine: <><path d="M10 22c8-3 15-3 22 2 7-5 14-5 22-2v24c-8-3-15-3-22 2-7-5-14-5-22-2Z" /><path d="M32 24v24" opacity=".6" /><path d="M15 29h12M15 34h10M37 29h12M37 34h9" opacity=".5" /><path d="M44 14 56 4" /></>,
};

export function DrawerArt({ id }: { id: string }) {
  return <svg className="ek-mini" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {MINI[id] ?? <circle cx="32" cy="32" r="14" />}
  </svg>;
}

/** The opening drawing: a folded letter and a council's bench under one arch, in the circle and orbit every study's opening uses. */
export function Hero() {
  return <figure className="ek-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of a round arch on two columns. Under it, a letter folded and tied with a cord rests above the curved stone bench of a council, with a book on a stand at its centre.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="ek-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <g opacity=".85">
        <path d="M108 318V176c0-51 41-92 92-92s92 41 92 92v142" />
        <path d="M124 318V178c0-42 34-76 76-76s76 34 76 76v140" opacity=".55" />
        <path d="M100 176h24M276 176h24M100 318h40M260 318h40" />
        <path d="M200 84v-8M196 80h8" opacity=".6" />
      </g>
      <g transform="translate(200 172)">
        <path d="M-50-30H50v52H-50Z" fill="currentColor" fillOpacity=".07" />
        <path d="M-50-30 0 4 50-30" />
        <path d="M0 4v18M-14 22c4-8 24-8 28 0" opacity=".7" />
        <path d="M-40 10h22M18 10h22M-40 16h16" strokeDasharray="5 2 2 2" opacity=".5" />
      </g>
      <g transform="translate(200 300)">
        <path d="M-78 0c0-34 35-58 78-58S78-34 78 0" fill="currentColor" fillOpacity=".05" />
        <path d="M-62 0c0-26 28-44 62-44S62-26 62 0" opacity=".6" />
        <path d="M-46 0c0-18 20-30 46-30S46-18 46 0" opacity=".4" />
        <path d="M-12-18H12l-3 6H-9Z" /><path d="M0-12V0" />
        <path d="M-90 0H90" />
      </g>
      <path className="ek-spark" d="M84 110v14M77 117h14" /><path className="ek-spark ek-spark-b" d="M318 262v12M312 268h12" />
    </svg>
    <figcaption><span>Written in prison.</span><span>Settled in council.</span><small>Illustrative forms · not facsimiles</small></figcaption>
  </figure>;
}
