import { useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Letter } from "@/data/letters/types";
import { ClaimText } from "../LetterParts";
import { dates } from "./builders";
import { GROUP_TONE, type GroupKey, type LettersData } from "./data";

const chipTone = (tone: string) => ({ "--chip": `var(--${tone})` }) as CSSProperties;

function Pick({ letter, chosen, choose, label, tone }: { letter: Letter; chosen: Letter; choose: (code: string) => void; label?: string; tone: string }) {
  return <button type="button" className="lb-chip" style={chipTone(tone)} aria-pressed={letter.code === chosen.code} onClick={() => choose(letter.code)}>{label ?? letter.name}</button>;
}

/**
 * Paul's four groups as a figures bar that is also the letter picker: each group's widest date range, its letters, its
 * size, and (behind the ⓘ) what the group is.
 */
export function GroupsBar({ data, group, chosen, choose }: { data: LettersData; group: GroupKey; chosen: Letter; choose: (code: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const g = data.groups[group], tone = GROUP_TONE[group];
  return <dl className="lb-figures lb-bar">{(g.groupings ?? []).map((grouping) => {
    const ls = g.letters.filter((l) => grouping.letters.includes(l.code)); // the Bible's order within the group
    const from = Math.min(...ls.map((l) => l.date.from ?? Infinity)), to = Math.max(...ls.map((l) => l.date.to ?? -Infinity));
    return <div key={grouping.label}>
      <dt>{grouping.label}<button type="button" className="lb-info" aria-pressed={open === grouping.label} aria-label={`What are the ${grouping.label.toLowerCase()}?`}
        onClick={() => setOpen(open === grouping.label ? null : grouping.label)}>i</button></dt>
      <small>{ls.length} letters · {ls.reduce((s, l) => s + l.verses, 0).toLocaleString("en-US")} verses</small>
      <dd>AD {from}–{to}</dd>
      <div className="lb-chips">{ls.map((l) => <Pick key={l.code} letter={l} chosen={chosen} choose={choose} tone={tone} />)}</div>
      {open === grouping.label && <div className="lb-note"><ClaimText claim={grouping.claim} as="div" /></div>}
    </div>;
  })}</dl>;
}

/** One column per letter (James–Jude, John): its dates, its length, and the button that makes "Inside" follow it. */
export function LettersBar({ data, group, chosen, choose }: { data: LettersData; group: GroupKey; chosen: Letter; choose: (code: string) => void }) {
  return <dl className="lb-figures lb-bar">{data.groups[group].letters.map((l) => <div key={l.code}>
    <dt>{l.name}</dt><small>{l.verses} verses</small><dd>{dates(l)}</dd>
    <div className="lb-chips"><Pick letter={l} chosen={chosen} choose={choose} label={`Inside ${l.name}`} tone={GROUP_TONE[group]} /></div>
  </div>)}</dl>;
}

/** One column per letter (James–Jude) whose button opens that letter's deeper look, where every letter has its own card. */
export function LettersLinkBar({ data, group, to }: { data: LettersData; group: GroupKey; to: (code: string) => { path: string; label: string } }) {
  const { search } = useLocation();
  return <dl className="lb-figures lb-bar">{data.groups[group].letters.map((l) => { const target = to(l.code);
    return <div key={l.code}>
      <dt>{l.name}</dt><small>{l.verses} verses</small><dd>{dates(l)}</dd>
      <div className="lb-chips"><Link className="lb-chip" style={chipTone(GROUP_TONE[group])} to={`${target.path}${search}`}>{target.label}</Link></div>
    </div>; })}</dl>;
}

/** Four figures in the same bar style (Hebrews, and the four ways in). */
export function FiguresBar({ items }: { items: [ReactNode, ReactNode, ReactNode][] }) {
  return <dl className="lb-figures lb-bar">{items.map(([dt, small, dd], i) => <div key={i}><dt>{dt}</dt><small>{small}</small><dd>{dd}</dd></div>)}</dl>;
}

