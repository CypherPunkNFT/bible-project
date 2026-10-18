// 02 · Hymns through the Bible. The Preachers page's "teachers through the Bible" with hymn books in the left list, a ring
// of 66 spokes (one per book of the Bible, as long as the chosen hymn book's hymns on it), and the hymns on the chosen
// book in the right panel, each opening its own page. Hymn books carry one date each, so there is no year slider
// (approved mock-up: design/hymn-directions/collection/through.js).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Library } from "lucide-react";
import { OutsideScroll } from "@/components/OutsideScroll";
import { bookIndexOf, chapterOf, hymnHref, type HymnCollection, type HymnEntry, type HymnGroup } from "@/lib/hymns";
import { SectionHead } from "@/pages/teachers/shared/Frame";
import { SECTION_LABEL } from "@/pages/teachers/preachers/bible/model";
import { centreInStrip } from "@/pages/teachers/preachers/bible/words";
import { BOOKS, R0, R1, SpokeAnimator, angle, labelAt, niceStep, point, radiusOf, wedge } from "@/pages/teachers/preachers/through/geometry";
import { chapterLabel, formatNumber, groupsById, passageHref, plural, tone } from "./model";
import "@/pages/teachers/preachers/through.css";

// The scale stops at 50 hymns (owner, 2026-10-17: one book "drowns out everything else"). A book with more reaches the
// edge and gets a dashed tip; its real count still shows in the centre and in the list.
const CAP = 50;
const STEP = (Math.PI * 2) / BOOKS;
const DISC: Record<string, string> = { psalms: "PI", hss: "HS", divine: "DS", newton: "JN", cowper: "WC" };
const MOVES: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

interface Shelf { id: string; group: HymnGroup | null; byBook: HymnEntry[][]; totals: number[]; works: number; all: number; max: number; bookCount: number; top: number }

function buildShelves(collection: HymnCollection) {
  const { books, groups, hymns } = collection;
  const finish = (id: string, group: HymnGroup | null, byBook: HymnEntry[][], all: number): Shelf => {
    const totals = byBook.map((l) => l.length), max = Math.max(...totals);
    return { id, group, byBook, totals, works: totals.reduce((a, b) => a + b, 0), all, max, bookCount: totals.filter(Boolean).length, top: totals.indexOf(max) };
  };
  const shelves = groups.map((g) => {
    const byBook = books.map((): HymnEntry[] => []);
    for (const h of hymns) if (h.g === g.id && h.v) byBook[bookIndexOf(h.v)].push(h);
    return finish(g.id, g, byBook, hymns.filter((h) => h.g === g.id).length);
  });
  const everyone = finish("all", null, books.map((_, b) => shelves.flatMap((s) => s.byBook[b]).sort((x, y) => x.v - y.v)), hymns.length);
  return { shelves, everyone, byId: new Map([everyone, ...shelves].map((s) => [s.id, s])) };
}

function Ring({ collection, shelf, selected, onSelect }: { collection: HymnCollection; shelf: Shelf; selected: number; onSelect: (b: number) => void }) {
  const { books } = collection;
  const [hover, setHover] = useState(-1);
  const svgRef = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const animator = useRef<SpokeAnimator | null>(null);
  const scaleMax = Math.min(shelf.max, CAP), capped = shelf.max > CAP;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const spokes = new SpokeAnimator(paths.current);
    animator.current = spokes;
    const firstGrow = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { firstGrow.disconnect(); spokes.grow(); } }, { threshold: 0.2 });
    firstGrow.observe(svg);
    return () => { firstGrow.disconnect(); spokes.stop(); animator.current = null; };
  }, []);
  useEffect(() => {
    animator.current?.setGoals(Float32Array.from(shelf.totals, (t) => Math.sqrt(Math.min(t, scaleMax) / scaleMax)));
  }, [shelf, scaleMax]);

  const guides = [capped ? CAP / 2 : niceStep(scaleMax), scaleMax].filter(Boolean).map((v) => ({ v, r: radiusOf(Math.sqrt(v / scaleMax)) }));
  const over = shelf.totals.flatMap((t, b) => (t > CAP ? [b] : []));
  const labelled = shelf.totals.map((t, b) => [t, b]).filter(([t]) => t).sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, b]) => b);
  const centre = hover >= 0 ? hover : selected;
  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const move = MOVES[event.key];
    if (move) { event.preventDefault(); onSelect(selected + move); }
  }
  return <svg ref={svgRef} className="thr-ring" viewBox="-330 -330 660 660" role="img" tabIndex={0} onKeyDown={onKeyDown}
    aria-label="Hymns by book of the Bible. Use the left and right arrow keys to move between books.">
    <g className="thr-guides" key={`g-${shelf.id}`}>{guides.map(({ v, r }) => <g key={v}>
      <circle r={r.toFixed(1)} className="thr-guide" />
      <text className="thr-guide-label" x="0" textAnchor="middle" y={(r + 11).toFixed(1)}>{formatNumber(v)}{capped && v === scaleMax ? "+" : ""}</text></g>)}</g>
    <g className="thr-spokes" onPointerLeave={() => setHover(-1)}>{books.map((book, b) =>
      <path key={book.code} ref={(el) => { paths.current[b] = el; }} fill={`var(--${book.section})`} d={wedge(b, R0)}
        className={[shelf.totals[b] ? "" : "thr-zero", b === selected ? "thr-on" : ""].join(" ").trim() || undefined}
        onPointerEnter={() => setHover(b)} onClick={() => onSelect(b)}>
        <title>{`${book.name}: ${plural(shelf.totals[b], "hymn")}`}</title></path>)}</g>
    <g className="thr-labels" key={`l-${shelf.id}`}>{labelled.map((b) => {
      if (!over.includes(b)) { const at = labelAt(b); return <text key={b} className="thr-label" transform={at.transform} textAnchor={at.anchor} dominantBaseline="middle">{books[b].name}</text>; }
      // A book past the cap: its label stands further out, beyond the dashed tip.
      const a = angle(b) + STEP / 2, deg = (a * 180) / Math.PI, flip = Math.cos(a) < 0;
      return <text key={b} className="thr-label" transform={`translate(${point(R1 + 30, a).replace(" ", ",")}) rotate(${flip ? deg + 180 : deg})`} textAnchor={flip ? "end" : "start"} dominantBaseline="middle">{books[b].name}</text>;
    })}
    {over.map((b) => { const a = angle(b) + STEP / 2; return <path key={`over-${b}`} className="thr-over" d={`M${point(R1 + 4, a)} L${point(R1 + 22, a)}`} />; })}</g>
    <circle r={R0 - 6} className="thr-hole" />
    <text className="thr-big" y="-2" textAnchor="middle">{formatNumber(shelf.totals[centre])}</text>
    <text className="thr-small" y="22" textAnchor="middle">{books[centre].name}</text>
  </svg>;
}

function HymnItem({ collection, hymn, group }: { collection: HymnCollection; hymn: HymnEntry; group: HymnGroup | undefined }) {
  const book = collection.books[bookIndexOf(hymn.v)];
  const bits = [
    <Link key="ref" className="thr-ref" to={passageHref(collection.books, hymn)} title={`Read ${chapterLabel(book, chapterOf(hymn.v))} on this site`}><BookOpen size={12} strokeWidth={1.5} aria-hidden />{hymn.r}</Link>,
    group ? <span key="g" className="thr-who-tag" style={tone(group.tone)}>{group.short}</span> : null,
    <span key="y">{hymn.y}</span>,
    hymn.m ? <span key="m">metre {hymn.m.replace(/,/g, ".")}</span> : null,
  ].filter(Boolean);
  return <li className="thr-item"><Link className="thr-work" to={hymnHref(hymn.id)}>{hymn.t}</Link>
    <p className="thr-meta">{bits.flatMap((bit, i) => (i ? [<span key={`sep-${i}`} className="thr-sep">·</span>, bit] : [bit]))}</p>
    <Link className="thr-go" to={hymnHref(hymn.id)}>Open the hymn<ArrowRight size={12} strokeWidth={1.5} aria-hidden /></Link></li>;
}

export function Through({ collection }: { collection: HymnCollection }) {
  const { books } = collection;
  const model = useMemo(() => buildShelves(collection), [collection]);
  const groups = useMemo(() => groupsById(collection), [collection]);
  const [chosen, setChosen] = useState("all");
  const shelf = model.byId.get(chosen) ?? model.everyone;
  const [selected, setSelected] = useState(model.everyone.top);

  function choose(id: string, item: HTMLElement) {
    const next = model.byId.get(id);
    if (!next) throw new Error(`Hymns through the Bible: unknown hymn book "${id}"; expected "all" or one of the collection's books`);
    setChosen(id);
    setSelected((b) => (next.totals[b] ? b : next.top));
    centreInStrip(item);
  }

  const book = books[selected], entries = shelf.byBook[selected];
  const items: JSX.Element[] = [];
  let lastChapter = 0;
  for (const h of entries) {
    const chapter = chapterOf(h.v);
    if (chapter !== lastChapter) items.push(<li key={`ch-${chapter}`} className="thr-chapter">{chapterLabel(book, chapter)}</li>);
    lastChapter = chapter;
    items.push(<HymnItem key={h.id} collection={collection} hymn={h} group={groups.get(h.g)} />);
  }

  return <div className="thr" style={tone("--poetry")}>
    <SectionHead num="02" kicker="Book by book" title={<>Hymns <em>through</em> the Bible</>}
      line="Choose a hymn book. Each spoke is one book of the Bible, as long as the number of its hymns on it. Choose a spoke to open those hymns." />
    <div className="thr-layout">
      <div className="thr-side">
        <nav className="thr-rail" aria-label="Choose a hymn book">
          <p className="thr-rail-head"><span>Hymn books</span><span>Hymns on a chapter</span></p>
          {[model.everyone, ...model.shelves].map((s) => {
            const g = s.group;
            return <button key={s.id} type="button" className="thr-t" aria-pressed={s.id === chosen} style={tone(g ? g.tone : "--accent")} onClick={(e) => choose(s.id, e.currentTarget)}>
              <span className="thr-disc">{g ? DISC[g.id] : <Library size={16} strokeWidth={1.5} aria-hidden />}</span>
              <span className="thr-t-text"><span className="thr-full">{g ? g.label.replace("Olney Hymns · ", "") : "Every hymn"}</span><span className="thr-short">{g ? g.short : "Every hymn"}</span>
                <small>{g ? `${g.year} · ${g.id === "newton" || g.id === "cowper" ? "Olney Hymns" : g.who}` : `${model.shelves.length} books and hands, together`}</small></span>
              <b>{formatNumber(s.works)}</b></button>;
          })}
        </nav>
        <details className="thr-quiet"><summary>{formatNumber(model.everyone.all - model.everyone.works)} more hymns are on a subject, not a chapter</summary>
          <p>Their books give them a subject (the love of God, the Lord's Supper, a funeral) rather than a passage, so they have no spoke. They are listed in the catalogue below.</p></details>
      </div>
      <div className="thr-ringcard" style={tone(shelf.group ? shelf.group.tone : "--accent")}>
        <div className="thr-who">{shelf.group
          ? <><p className="kicker" style={tone(shelf.group.tone)}>{shelf.group.year} · {shelf.group.who}</p><h3>{shelf.group.label}</h3>
            <p>{plural(shelf.works, "hymn")} on a chapter, across {plural(shelf.bookCount, "book")} of the Bible; {plural(shelf.all - shelf.works, "more hymn")} on a subject.</p></>
          : <><p className="kicker">Every hymn, together</p><h3>Every hymn</h3>
            <p>{plural(shelf.works, "hymn")} on a chapter in {model.shelves.length} hymn books and hands, across {plural(shelf.bookCount, "book")} of the Bible.</p></>}</div>
        <Ring collection={collection} shelf={shelf} selected={selected} onSelect={(b) => setSelected((b + BOOKS) % BOOKS)} />
      </div>
      <aside className="thr-book hy-thr-book" style={tone(`--${book.section}`)}>
        <div className="thr-book-head"><p className="kicker">{SECTION_LABEL[book.section]}</p><h3>{book.name}</h3>
          <p className="thr-book-sub">{plural(entries.length, "hymn")} · {shelf.group ? shelf.group.short : "every hymn book"}</p></div>
        <OutsideScroll label={`Hymns on ${book.name}`} className="thr-scroll" resetKey={`${chosen}-${selected}`}>
          <ol className="thr-list">{items.length ? items : <li className="thr-empty">No hymn on {book.name} in {shelf.group ? shelf.group.short : "any of these books"}.</li>}</ol>
        </OutsideScroll>
      </aside>
    </div>
  </div>;
}
