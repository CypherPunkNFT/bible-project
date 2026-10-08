import { Fragment, useState, type CSSProperties, type ReactNode } from "react";
import { BOOK_TONE, bookName, chapterOf, markRuns, plural } from "./data";
import type { Apostle } from "./types";
import { Marked, RefLink, SecHead } from "./ui";

/**
 * 04 · One moment, several accounts: one moment of his story in each book's own KJV words, each account in its own
 * container (its book's colour, its own heading), so the comparison reads as several voices rather than one long column.
 * "Only here" underlines the words that just one account has.
 */
const words = (t: string) => t.toLowerCase().replace(/[^a-z\s'’-]/g, " ").split(/\s+/).filter((w) => w.length > 3);

/** A verse with his names marked and, when asked, the words only this account has underlined. */
function VerseText({ text, names, unique }: { text: string; names: string[]; unique?: (w: string) => boolean }) {
  if (!unique) return <Marked text={text} names={names} />;
  const parts: ReactNode[] = [];
  markRuns(text, names).forEach((r, ri) => {
    if (r.mark) { parts.push(<mark key={ri}>{/^[A-Za-z’']{4,}$/.test(r.t) && unique(r.t.toLowerCase()) ? <u>{r.t}</u> : r.t}</mark>); return; }
    let at = 0;
    for (const m of r.t.matchAll(/[A-Za-z’']{4,}/g)) {
      if (!unique(m[0].toLowerCase())) continue;
      if (m.index! > at) parts.push(r.t.slice(at, m.index));
      parts.push(<u key={`${ri}-${m.index}`}>{m[0]}</u>);
      at = m.index! + m[0].length;
    }
    if (at < r.t.length) parts.push(r.t.slice(at));
  });
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

export function AccountsSection({ d }: { d: Apostle }) {
  const [cur, setCur] = useState(0), [only, setOnly] = useState(false);
  if (!d.accounts.length) {
    const v = d.landing.line.v;
    return <section className="sec" data-sec="accounts">
      <SecHead num="04" kicker="Side by side" title="One moment, " em="several accounts" sub={`No moment of ${d.short}'s story is told by more than one book: Acts alone tells how he was chosen.`} />
      <div className="acc-one"><blockquote><p><Marked text={d.verses[v] ?? ""} names={d.names} /></p><footer><RefLink r={[v, v]} /> · KJV, the only account</footer></blockquote></div>
    </section>;
  }
  const a = d.accounts[cur], sets = a.cols.map((c) => new Set(c.verses.flatMap((v) => words(v.text))));
  return <section className="sec" data-sec="accounts">
    <SecHead num="04" kicker="Side by side" title="One moment, " em="several accounts"
      sub={`${plural(d.accounts.length, "moment")} of his story told by more than one book, each in its own words in the King James Version. His names are marked; switch on "only here" to underline the words that just one account has.`} />
    <div className="acc-tools"><div className="seg acc-pick" role="group" aria-label="Moment">{d.accounts.map((x, i) =>
      <button key={x.id} type="button" aria-pressed={i === cur} onClick={() => setCur(i)}>{x.title}<small>{x.cols.length}</small></button>)}</div>
      <label className="acc-only"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Only here</label></div>
    <div className="acc-cards" style={{ "--n": a.cols.length } as CSSProperties}>{a.cols.map((c, i) => {
      const name = bookName(c.book), unique = only ? (w: string) => sets.every((s, j) => j === i || !s.has(w)) : undefined;
      return <article key={`${a.id}-${i}`} className="acc-card" style={{ "--tone": BOOK_TONE(c.book) } as CSSProperties}><span className="acc-letter" aria-hidden="true">{name.replace(/^\d\s*/, "").slice(0, 1)}</span>
        <header>{c.label.includes("·") && <p className="kicker">{c.label.split("·").slice(1).join("·").trim()}</p>}<h3>{name}</h3>
          <p className="acc-ref">{c.spans.map((s, k) => <Fragment key={k}>{k > 0 && " · "}<RefLink r={s} /></Fragment>)}</p></header>
        <div className="acc-text">{c.verses.map((v) => <p key={v.id} className={c.mark === v.id ? "his" : undefined}><sup>{chapterOf(v.id).ch}:{chapterOf(v.id).v}</sup> <VerseText text={v.text} names={d.names} unique={unique} /></p>)}</div>
        <footer>{plural(c.verses.length, "verse")}{c.verses.length >= 12 ? ", the first 12 shown" : ""}</footer></article>;
    })}</div>
  </section>;
}
