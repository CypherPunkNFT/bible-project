import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { useSideScroll } from "./useSideScroll";
import { Link } from "react-router-dom";
import { RefLink } from "@/components/study/StudyParts";
import { cameFrom } from "@/lib/came-from";
import { tone, type Tone } from "@/lib/sections";
import type { Prophet } from "@/lib/study";
import "./prophets-mockup.css";

/**
 * MOCK-UP (owner, 2026-10-07): a more illustrative prophets view. A river of time across the eras with every prophet as
 * a medallion, the kings they served on a ribbon beneath, a preview panel, and the sixteen prophetic books as a shelf.
 * Pointing at a prophet previews them; clicking opens their own page.
 */

const ERAS: { id: string; label: string; dates: string }[] = [
  { id: "Egypt and Wilderness", label: "Exodus & wilderness", dates: "c. 1450–1400 BC" },
  { id: "Judges", label: "The judges", dates: "c. 1380–1050 BC" },
  { id: "United Monarchy", label: "United kingdom", dates: "c. 1050–930 BC" },
  { id: "Divided Monarchy", label: "Two kingdoms", dates: "930–586 BC" },
  { id: "Exile and Return", label: "Exile & return", dates: "586–430 BC" },
  { id: "New Testament", label: "New Testament", dates: "AD 1–60" },
];
const KIND_TONE: Record<Prophet["kind"], Tone> = { writing: "prophets", prophet: "history", nt: "gospels", false: "apocrypha" };
const KIND_LABEL: Record<Prophet["kind"], string> = { writing: "Wrote a book", prophet: "Prophet", nt: "New Testament", false: "False prophet" };
/** Chapters in each prophetic book, for the shelf's spines. */
const CHAPTERS: Record<string, number> = { ISA: 66, JER: 52, EZK: 48, DAN: 12, HOS: 14, JOL: 3, AMO: 9, OBA: 1, JON: 4, MIC: 7, NAM: 3, HAB: 3, ZEP: 3, HAG: 2, ZEC: 14, MAL: 4 };
const BOOK_ORDER = Object.keys(CHAPTERS);
const LANES = [0, 2, 1, 3];

const initials = (name: string) => name.replace(/[^A-Za-z]/g, "").slice(0, 2);
const roleOf = (p: Prophet) => (p.kind === "false" ? (p.sex === "Female" ? "False prophetess" : "False prophet") : p.sex === "Female" ? "Prophetess" : "Prophet");
const back = () => cameFrom("Prophets through time");

export function ProphetsMockup({ prophets, kingId }: { prophets: Prophet[]; kingId: (name: string) => string | undefined }) {
  const eras = ERAS.filter((era) => prophets.some((p) => p.era === era.id));
  // Each era is as wide as its prophets need (a minimum for the short ones); prophets spread evenly inside it.
  const layout = useMemo(() => {
    const widths = eras.map((era) => Math.max(7, prophets.filter((p) => p.era === era.id).length));
    const total = widths.reduce((a, b) => a + b, 0);
    let start = 0;
    const bands = eras.map((era, i) => { const band = { ...era, left: (start / total) * 100, width: (widths[i] / total) * 100 }; start += widths[i]; return band; });
    // Bands are drawn on the same 1.5%…98.5% scale as the prophets.
    const drawn = bands.map((band) => ({ ...band, left: 1.5 + band.left * .97, width: band.width * .97 }));
    const placed = bands.flatMap((band) => {
      const here = prophets.filter((p) => p.era === band.id);
      return here.map((p, i) => ({ prophet: p, x: 1.5 + (band.left + ((i + .5) / here.length) * band.width) * .97, lane: LANES[i % LANES.length] }));
    });
    // One tick per run of prophets under the same king, placed under the middle of them.
    const kings: { name: string; x: number; xs: number[] }[] = [];
    for (const spot of placed) {
      const last = kings[kings.length - 1];
      if (spot.prophet.king && last?.name === spot.prophet.king) last.xs.push(spot.x);
      else if (spot.prophet.king) kings.push({ name: spot.prophet.king, x: 0, xs: [spot.x] });
    }
    for (const king of kings) king.x = king.xs.reduce((a, b) => a + b, 0) / king.xs.length;
    return { bands: drawn, placed, kings };
  }, [eras, prophets]);
  const side = useSideScroll();
  const [focus, setFocus] = useState<Prophet>(() => prophets.find((p) => p.name === "Isaiah") ?? prophets[0]);
  const order = layout.placed.map((spot) => spot.prophet);
  const step = (by: number) => setFocus(order[(order.indexOf(focus) + by + order.length) % order.length]);
  const writers = BOOK_ORDER.flatMap((code) => prophets.filter((p) => p.book === code).slice(0, 1));
  const count = (kind: Prophet["kind"]) => prophets.filter((p) => p.kind === kind).length;

  return <section ref={side.anchor} className="pm" aria-labelledby="pm-title">
    <header className="pm-head">
      <h2 id="pm-title">Voices through <em>time.</em></h2>
      <p>From Moses to the church in Acts: every prophet Scripture names, on the river of its history, with the kings they stood before.</p>
      <dl className="pm-figures">
        <div><dt>Prophets</dt><dd>{prophets.length}</dd></div>
        <div style={{ "--pm": tone("prophets").tab } as CSSProperties}><dt>Wrote a book</dt><dd>{count("writing")}</dd></div>
        <div><dt>Prophetesses</dt><dd>{prophets.filter((p) => p.sex === "Female").length}</dd></div>
        <div style={{ "--pm": tone("gospels").tab } as CSSProperties}><dt>New Testament</dt><dd>{count("nt")}</dd></div>
        <div style={{ "--pm": tone("apocrypha").tab } as CSSProperties}><dt>False prophets</dt><dd>{count("false")}</dd></div>
      </dl>
    </header>

    {/* The page's scroll travels through the river once the section reaches its stop (useSideScroll). */}
    <div ref={side.box} className="pm-river-scroll">
      <div className="pm-river" role="list" aria-label="Prophets in time order">
        {layout.bands.map((band, i) => <div key={band.id} className="pm-band" data-odd={i % 2 ? "" : undefined} style={{ left: `${band.left}%`, width: `${band.width}%` }}>
          <span className="pm-band-label">{band.label}</span><span className="pm-band-dates">{band.dates}</span>
        </div>)}
        <div className="pm-axis" aria-hidden />
        {layout.placed.map(({ prophet: p, x, lane }) => <div key={p.id} role="listitem" className="pm-spot" style={{ left: `${x}%`, "--lane": lane, "--pm": tone(KIND_TONE[p.kind]).tab } as CSSProperties}>
          <span className="pm-stem" aria-hidden />
          <Link to={`/people/${p.id}`} state={back()} className="pm-medal" data-kind={p.kind} data-focus={focus.id === p.id ? "" : undefined}
            onMouseEnter={() => setFocus(p)} onFocus={() => setFocus(p)} aria-label={`${p.name}, ${roleOf(p)}${p.king ? `, in the days of ${p.king}` : ""}`}>
            {initials(p.name)}{p.book && <BookOpen className="pm-medal-book" size={11} aria-hidden />}
          </Link>
          <span className="pm-name" aria-hidden>{p.name}</span>
        </div>)}
        {layout.kings.map((king, i) => {
          const id = kingId(king.name);
          return <div key={`${king.name}-${king.x}`} className="pm-king" style={{ left: `${king.x}%`, "--row": i % 3 } as CSSProperties}>
            <span className="pm-king-tick" aria-hidden />
            {id ? <Link to={`/people/${id}`} state={back()}>{king.name}</Link> : <span>{king.name}</span>}
          </div>;
        })}
      </div>
    </div>
    <div ref={side.pill} className="pm-pill" onPointerDown={side.onPillDown} aria-hidden><span ref={side.thumb} className="pm-pill-thumb" /></div>


    <article className="pm-panel" style={{ "--pm": tone(KIND_TONE[focus.kind]).tab } as CSSProperties} aria-live="polite">
      <span className="pm-panel-medal" data-kind={focus.kind} aria-hidden>{initials(focus.name)}</span>
      <div className="pm-panel-body">
        <p className="pm-kicker">{roleOf(focus)} · {KIND_LABEL[focus.kind]} · {ERAS.find((era) => era.id === focus.era)?.label}</p>
        <h3>{focus.name}</h3>
        {focus.brief && <p className="pm-panel-brief">{focus.brief}</p>}
        <p className="pm-panel-when">
          {focus.king ? <>{focus.king === "Moses" || focus.king === "the judges" || focus.king === "the exile" ? "In the time of " : "In the days of "}
            {kingId(focus.king) ? <Link to={`/people/${kingId(focus.king)}`} state={back()}>{focus.king}</Link> : focus.king}</> : "Not dated by any king in Scripture"}
          {focus.anchor && <> · <RefLink span={focus.anchor} /></>}
        </p>
        <div className="pm-panel-actions">
          <Link to={`/people/${focus.id}`} state={back()} className="pm-button">Open {focus.name}’s page <ArrowUpRight size={15} aria-hidden /></Link>
          {focus.book && <Link to={`/read/kjv/${focus.book}/1`} className="pm-button pm-button-quiet">Read the book <BookOpen size={15} aria-hidden /></Link>}
        </div>
      </div>
      <div className="pm-panel-step">
        <button type="button" onClick={() => step(-1)} aria-label="Previous prophet in time"><ArrowLeft size={16} /></button>
        <span>{order.indexOf(focus) + 1} / {order.length}</span>
        <button type="button" onClick={() => step(1)} aria-label="Next prophet in time"><ArrowRight size={16} /></button>
      </div>
    </article>

    <section className="pm-shelf" aria-labelledby="pm-shelf-title">
      <div className="pm-shelf-head"><h3 id="pm-shelf-title">The sixteen who wrote</h3><p>Isaiah to Malachi, each spine as tall as its book is long. Point at one; click to meet the prophet.</p></div>
      <ol className="pm-books">
        {writers.map((p, i) => <li key={p.id} style={{ "--h": `${7.5 + CHAPTERS[p.book!] * .12}rem`, "--pm": tone(i < 4 ? "prophets" : "poetry").tab } as CSSProperties}>
          <Link to={`/people/${p.id}`} state={back()} onMouseEnter={() => setFocus(p)} onFocus={() => setFocus(p)} title={`${p.name} · ${CHAPTERS[p.book!]} chapters${p.king ? ` · in the days of ${p.king}` : ""}`}>
            <span>{p.name}</span><small>{CHAPTERS[p.book!]}</small>
          </Link>
        </li>)}
      </ol>
      <p className="pm-shelf-foot"><span><i style={{ background: tone("prophets").tab }} />The major prophets</span><span><i style={{ background: tone("poetry").tab }} />The twelve</span></p>
    </section>
  </section>;
}
