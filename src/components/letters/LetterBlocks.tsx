import { useState } from "react";
import type { Citation, KeyWord, Ladder, Letter, OpenQuestion } from "@/data/letters/types";
import { ClaimText, Refs } from "./LetterParts";
import { useWordVerses } from "./letter-hooks";
import { StableTip } from "@/components/StableTip";

const starResting = <span className="lg-muted">Choose a star to see every verse where that word stands behind the text.</span>;

/** One letter's key Greek words as glowing bars, each with a strip showing which chapters it lives in. */
export function WordBars({ words }: { words: KeyWord[] }) {
  if (!words.length) return <p className="lg-muted">No key-word counts for this letter yet.</p>;
  const sorted = [...words].sort((a, b) => b.count - a.count);
  const most = sorted[0].count || 1;
  return <div className="lg-words">
    {sorted.map((w) => {
      const peak = Math.max(1, ...(w.byChapter ?? [0]));
      return <div key={w.strongs + w.gloss} className="lg-word">
        <div className="lg-word-name"><b>{w.greek}</b> <span className="lg-muted">{w.translit}</span><small>“{w.gloss}” · {w.strongs}{w.note ? ` · ${w.note}` : ""}</small></div>
        <div>
          <div className="lg-word-track"><div className="lg-word-fill" style={{ width: `${(w.count / most) * 100}%` }} /></div>
          {w.byChapter && w.byChapter.length > 1 && <div className="lg-word-strip" aria-label={`By chapter: ${w.byChapter.join(", ")}`}>
            {w.byChapter.map((n, i) => <i key={i} title={`Chapter ${i + 1}: ${n}`} style={{ opacity: n ? 0.15 + 0.85 * (n / peak) : 0.06 }} />)}
          </div>}
        </div>
        <b style={{ fontFamily: "ui-monospace, monospace" }}>{w.count}</b>
      </div>;
    })}
  </div>;
}

/**
 * Several letters' words as a constellation grid: a row per word (matched by Strong's number), a column per letter
 * (or per group, with `columns` listing each group's letters), each star sized by how often the word appears.
 * Choosing a star lists every verse where that Greek word stands behind the text, like references in the Atlas.
 */
export function WordConstellation({ letters, columns }: { letters: Letter[]; columns?: Record<string, string[]> }) {
  const [hover, setHover] = useState<string | null>(null);
  const [chosen, setChosen] = useState<{ word: KeyWord; column: Letter; count: number } | null>(null);
  const rows = new Map<string, { word: KeyWord; counts: Map<string, number> }>();
  for (const letter of letters) for (const w of letter.words) {
    const row = rows.get(w.strongs) ?? { word: w, counts: new Map() };
    row.counts.set(letter.code, w.count);
    rows.set(w.strongs, row);
  }
  const list = [...rows.values()].sort((a, b) => Math.max(...b.counts.values()) - Math.max(...a.counts.values())).slice(0, 14);
  const most = Math.max(1, ...list.flatMap((r) => [...r.counts.values()]));
  const W = 1000, LEFT = 260, ROW = 40, colW = (W - LEFT - 20) / letters.length;
  const height = 40 + list.length * ROW;
  return <div>
    <div className="lg-figure">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`Key words across ${letters.map((l) => l.name).join(", ")}. Choose a star to list its verses.`}>
        {letters.map((l, i) => <text key={l.code} x={LEFT + colW * (i + 0.5)} y={18} textAnchor="middle" className="lg-svg-strong">{l.name}</text>)}
        {list.map((row, r) => {
          const y = 44 + r * ROW;
          const lit = !hover || hover === row.word.strongs;
          return <g key={row.word.strongs} opacity={lit ? 1 : 0.3} onMouseEnter={() => setHover(row.word.strongs)} onMouseLeave={() => setHover(null)}>
            <text x={0} y={y - 2} className="lg-svg-strong">{row.word.gloss.length > 30 ? `${row.word.gloss.slice(0, 28)}…` : row.word.gloss}</text>
            <text x={0} y={y + 12} className="lg-svg-text">{row.word.greek} {row.word.translit} · {row.word.strongs}</text>
            <line x1={LEFT} x2={W - 20} y1={y} y2={y} stroke="var(--lg-line)" strokeDasharray="1 5" />
            {letters.map((l, i) => {
              const n = row.counts.get(l.code) ?? 0;
              if (!n) return null;
              const on = chosen?.word.strongs === row.word.strongs && chosen.column.code === l.code;
              const cx = LEFT + colW * (i + 0.5), r0 = 3 + 13 * Math.sqrt(n / most);
              return <g key={l.code} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-pressed={on}
                aria-label={`${row.word.gloss} in ${l.name}: ${n}. Show the verses.`}
                onClick={() => setChosen({ word: row.word, column: l, count: n })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setChosen({ word: row.word, column: l, count: n }); } }}>
                {on && <circle cx={cx} cy={y} r={r0 + 6} fill="none" stroke="var(--lg)" strokeWidth={1.5} className="lg-glow" />}
                <circle cx={cx} cy={y} r={r0} fill="var(--lg)" opacity={on ? 1 : 0.75} className="lg-glow" />
                <text x={cx + r0 + 5} y={y + 4} className="lg-svg-text">{n}</text>
              </g>;
            })}
          </g>;
        })}
      </svg>
    </div>
    {chosen ? <WordVerses word={chosen.word} label={chosen.column.name} count={chosen.count} codes={columns?.[chosen.column.code] ?? [chosen.column.code]} onClose={() => setChosen(null)} />
      : <StableTip show={starResting} options={[starResting]} />}
  </div>;
}

function WordVerses({ word, label, count, codes, onClose }: { word: KeyWord; label: string; count: number; codes: string[]; onClose: () => void }) {
  const verses = useWordVerses(codes, word.strongs);
  const [all, setAll] = useState(false);
  return <div className="lg-word-panel" aria-live="polite">
    <div className="lg-word-panel-head">
      <div><b className="lg-word-greek">{word.greek}</b> <span className="lg-muted">{word.translit} · {word.strongs}</span>
        <p>“{word.gloss}” in <strong>{label}</strong> · used {count} times{verses ? ` in ${verses.length} ${verses.length === 1 ? "verse" : "verses"}` : ""}{word.note ? ` · ${word.note}` : ""}</p></div>
      <button type="button" className="lg-dialog-close" onClick={onClose} aria-label="Close">×</button>
    </div>
    {verses === undefined ? <p className="lg-muted">Finding the verses…</p>
      : <><p className="lg-subhead" style={{ marginTop: ".75rem" }}>The verses, where the KJV text is tagged with this Greek word</p>
        <Refs refs={all ? verses : verses.slice(0, 40)} limit={all ? verses.length : 40} />
        {verses.length > 40 && !all && <button type="button" className="lg-tab" style={{ marginLeft: ".5rem" }} onClick={() => setAll(true)}>Show all {verses.length}</button>}</>}
  </div>;
}

export function BetterLadder({ ladder }: { ladder: Ladder }) {
  return <div>
    <ol className="lg-ladder">{ladder.steps.map((step) => <li key={step.label} className="lg-rung">
      <strong>{step.label}</strong><p>{step.better}{step.note ? ` — ${step.note}` : ""}<Refs refs={step.refs} /></p>
    </li>)}</ol>
    <ClaimText claim={ladder.claim} className="lg-caption" />
  </div>;
}

/** Disputed questions as tabs; each answer is a card with who held it and why. No verdicts. */
export function OpenQuestions({ questions, letter }: { questions: OpenQuestion[]; letter?: string }) {
  const relevant = letter ? questions.filter((q) => !q.letters.length || q.letters.includes(letter)) : questions;
  const [chosen, setChosen] = useState(0);
  const question = relevant[Math.min(chosen, relevant.length - 1)];
  if (!question) return <p className="lg-muted">No open questions recorded for this letter.</p>;
  return <div>
    <div className="lg-tabs" role="group" aria-label="Questions">{relevant.map((q, i) => <button key={q.id} type="button" className="lg-tab" aria-pressed={q === question} onClick={() => setChosen(i)}>{q.question}</button>)}</div>
    <div className="lg-views">{question.views.map((view) => <article key={view.label} className="lg-view">
      <h4>{view.label}</h4>{view.holders && <p className="lg-holders">{view.holders}</p>}<ClaimText claim={view.argument} />
    </article>)}</div>
  </div>;
}

export function SourcesList({ citations }: { citations: Citation[] }) {
  return <ol className="lg-sources">{citations.map((c) => <li key={c.id} id={`lg-source-${c.id}`}>
    {c.author}, <a href={c.url} target="_blank" rel="noreferrer"><cite>{c.title}</cite></a> ({c.year}){c.where ? `, ${c.where}` : ""}.
  </li>)}</ol>;
}
