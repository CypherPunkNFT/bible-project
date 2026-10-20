// The face of the study (approved mock-up D: js/landing.js): breadcrumb, the one-line title with its italic line, two
// paragraphs that say whose contents page this is and walk the reader through the page, the drawing of the gathering,
// what "canon" means with each tradition's count, one row of figures counted from the research file, and the chapters.
import type { CSSProperties } from "react";
import { StudyTrail } from "@/components/study/StudyTrail";
import { D } from "./model";

// Rows of writing as short ragged strokes.
function lines(x: number, y: number, width: number, rows: number, gap: number, opts: { right?: boolean; dash?: string } = {}) {
  return Array.from({ length: rows }, (_, r) => {
    const w = width - ((r * 7 + x) % 11) - (r === rows - 1 ? width * 0.4 : 0);
    return <path key={`${x}-${r}`} d={`M${(opts.right ? x + width - w : x).toFixed(1)} ${(y + r * gap).toFixed(1)}h${w.toFixed(1)}`}
      strokeDasharray={opts.dash ?? "6 2 3 1.5"} opacity={(0.34 + (r % 4) * 0.12).toFixed(2)} />;
  });
}
const SCROLL_DASH = { right: true, dash: "4 1.5 7 1.5" };

/** A scroll and an open codex (forms only, no manuscript reproduced) feed a list leaf; each entry's mark keeps changing
 *  between the three ways a writer can place the same book. */
function Gathering() {
  return <figure className="ms-hero-art cn-hero-art" aria-hidden="true"><svg viewBox="0 0 420 330">
    <ellipse className="ms-orbit" cx="214" cy="170" rx="196" ry="128" />
    <ellipse className="ms-orbit ms-orbit-2" cx="214" cy="170" rx="160" ry="150" transform="rotate(-18 214 170)" />
    <path className="hv-thread" d="M150 128Q232 92 288 108M168 236Q236 250 288 226" />
    <g className="ms-scroll"><g transform="rotate(-10 120 100)">
      <path className="mh-sheet" d="M52 56 H192 V146 H52Z" />
      <path className="ms-roll" d="M38 52 h14 v98 h-14 a7 4 0 0 1 0 -8 v-82 a7 4 0 0 1 0 -8Z M192 52 h14 a7 4 0 0 1 0 8 v82 a7 4 0 0 1 0 8 h-14Z" />
      <ellipse className="ms-roll-end" cx="45" cy="52" rx="7" ry="3.5" /><ellipse className="ms-roll-end" cx="199" cy="52" rx="7" ry="3.5" />
      <g className="ms-ink">{lines(62, 70, 36, 10, 7, SCROLL_DASH)}{lines(106, 70, 36, 10, 7, SCROLL_DASH)}{lines(150, 70, 34, 10, 7, SCROLL_DASH)}</g>
    </g></g>
    <g className="ms-leaf"><g transform="rotate(-3 150 240)">
      <path className="mh-sheet" d="M150 196c-22-9-56-12-96-7v96c40-5 74-2 96 7 22-9 56-12 96-7v-96c-40-5-74-2-96 7z" />
      <path className="mh-sheet-front" d="M150 196v96" stroke="currentColor" strokeOpacity=".45" />
      <g className="ms-ink">{lines(66, 210, 32, 9, 8)}{lines(104, 210, 36, 9, 8)}{lines(160, 210, 36, 9, 8)}{lines(202, 210, 32, 9, 8)}</g>
    </g></g>
    <g className="cg-list"><g transform="rotate(4 330 180)">
      <path className="mh-sheet mh-sheet-front" d="M282 76h96v196h-96z" />
      <path className="cg-rule" d="M292 94h76" />
      {Array.from({ length: 9 }, (_, i) => {
        const y = 112 + i * 17;
        return <g key={i} className="cg-row" style={{ "--i": i } as CSSProperties}><circle className="cg-mark" cx="300" cy={y} r="4.2" /><path className="cg-entry" d={`M312 ${y}h${46 - ((i * 13) % 17)}`} /></g>;
      })}
      <path className="cg-rule" d="M292 268h40" />
    </g></g>
    <path className="ms-mark" d="M28 52h10m-5-5v10M384 296h10m-5-5v10M372 40h8m-4-4v8" />
  </svg>
    <span className="ms-art-top">Copied · read · listed</span>
    <span className="ms-art-note"><i></i>One writing, three placings.<br /><span>Canonical · instruction · not named.</span></span>
  </figure>;
}

const COUNTS = [
  ["Jewish · Tanakh", "24", "Torah, Prophets and Writings"],
  ["Protestant · Westminster", "66", "39 Old Testament + 27 New"],
  ["Roman Catholic", "73", "46 Old Testament + 27 New"],
  ["Eastern Orthodox", "More", "adds Tobit, Judith, Wisdom, Sirach, Maccabees and others"],
  ["Ethiopian Orthodox", "81", "46 Old Testament + 35 New"],
] as const;

const FIGURES = [
  ["Records", D.records.length, "texts, objects and decisions"],
  ["Kinds of evidence", D.evidenceKinds.length, "not five steps every book climbed"],
  ["Periods", D.eras.length, "from inherited writings to confessions"],
  ["Span", "132 BC – 1647", "Sirach's translator to Westminster"],
  ["Traditions", D.traditions.length, "compared side by side, none the default"],
  ["Writings traced", D.comparisonRows.length, "rows in the comparison"],
  ["Sources", D.sources.length, "each one linked where it is used"],
] as const;

const CHAPTERS = [["evidence", "Read the evidence"], ["timeline", "Enter the timeline"], ["investigations", "Examine the boundaries"], ["compare", "Compare traditions"]] as const;

export function Landing() {
  return <>
    <div className="hc-intro ms-intro cn-intro-d">
      <div>
        <StudyTrail area="texts" /><p className="cn-eyebrow">Collections · communities · centuries</p>
        <h1>The canon takes shape<em>Gathered, read, listed</em></h1>
        <p className="cn-lead">The writing stays the same. The claim changes.</p>
        <p className="hc-lede">Before the Bible had a table of contents, there were communities of readers. Jews and Christians copied writings by hand, read them aloud in worship and quoted them in argument. Over centuries, some drew up lists of the books they held to be Scripture, and those lists did not all agree.</p>
        <p className="hc-lede">This page follows that process through what survives: the manuscripts themselves, the writers who quoted and recommended books, and the councils and confessions that finally named them. Each list belongs to a place, a time and a conversation, and each piece of evidence can show only so much.</p>
      </div>
      <Gathering />
    </div>
    <div className="cn-canon"><div><p className="kicker">First, what “canon” means</p>
      <p>The word comes from the Greek <i>kanōn</i>, a measuring rod or rule. Said of Scripture, a canon is <strong>the list of books a community receives as its Bible</strong>. There is more than one such list, and they still differ today.</p>
      <p className="cn-caption">The 24 and the 39 are the same Hebrew books, counted and grouped differently.</p></div>
      <dl className="cn-counts">{COUNTS.map(([who, n, what]) => <div key={who}><dt>{who}</dt><dd>{n}</dd><small>{what}</small></div>)}</dl>
    </div>
    <dl className="ms-figures">{FIGURES.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <nav className="cn-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
