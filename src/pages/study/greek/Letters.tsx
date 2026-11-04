// Section 02: the twenty-four letters, sorted by how a reader of English meets them, or in Greek order. Each opens its record, with a word
// from John or Romans. Then the small marks, and six words to say before pressing to check.
import { useState } from "react";
import { D, findView, G, thousands, VIEWS, type Letter } from "./model";
import { Cite, Gk, Head, Mixed, ThreeParts, VerseLink } from "./parts";

function LetterButton({ letter, picked, onOpen }: { letter: Letter; picked: string | null; onOpen: (key: string) => void }) {
  const key = `letter:${letter.id}`;
  return <li><button type="button" data-open={key} aria-pressed={picked === letter.id} onClick={() => onOpen(key)} aria-label={`${letter.name} · ${letter.sound} · ${thousands(G.counts.letters[letter.id])} times`}>
    <span lang="grc" className="ng-glyph">{letter.lower}{letter.final && <i>{letter.final}</i>}<small>{letter.upper}</small></span>
    <span className="ng-lname">{letter.name}</span>
    <span className="ng-lsound">{letter.lookslike ? `looks like ${letter.lookslike}, sounds ${letter.sound}` : letter.sound}</span>
  </button></li>;
}

function SayIt({ item }: { item: (typeof D.practice)[number] }) {
  const [shown, setShown] = useState(false);
  return <li><button type="button" aria-expanded={shown} onClick={() => setShown(!shown)}><Gk big>{item.form}</Gk><span className="ng-say">{shown ? item.say : "Say it, then press"}</span></button>
    <small><VerseLink label={`${item.code === "JHN" ? "John" : "Romans"} ${item.chapter}:${item.verse}`} /></small></li>;
}

export function Letters({ viewValue, picked, onView, onOpen }: { viewValue: string | null; picked: string | null; onView: (id: string) => void; onOpen: (key: string) => void }) {
  const view = findView(viewValue);
  return <>
    <Head title={<>Twenty-four letters.<em> You already know many.</em></>}
      lead="Greek gave Latin, and through it English, much of its alphabet, so most of these are old acquaintances. The ones to watch are the false friends." />
    <ul className="ng-picks" aria-label="How to sort the letters">{VIEWS.map((v) => <li key={v.id}><button type="button" aria-pressed={v.id === view} onClick={() => onView(v.id)}>{v.label}</button></li>)}</ul>
    {view === "order"
      ? <ol className="ng-letters" aria-label="The twenty-four letters, in Greek order">{D.letters.map((l) => <LetterButton key={l.id} letter={l} picked={picked} onOpen={onOpen} />)}</ol>
      : D.letterGroups.map((group) => { const letters = D.letters.filter((l) => l.group === group.id); return <div key={group.id} className="ng-group">
        <p className="ng-group-head"><b>{group.label}</b> ({letters.length}) · {group.line}</p>
        <ul className="ng-letters" aria-label={group.label}>{letters.map((l) => <LetterButton key={l.id} letter={l} picked={picked} onOpen={onOpen} />)}</ul>
      </div>; })}
    <p className="ng-caption">{D.sound.scheme} {D.sound.noAudio}</p>
    <h3 className="ng-sub">The small marks</h3>
    <dl className="ng-marks">{D.marks.map((m) => <div key={m.id}><dt><Gk big>{m.glyph}</Gk>{m.name}</dt><dd><Mixed text={m.line} /></dd></div>)}</dl>
    <h3 className="ng-sub">Say these</h3>
    <ul className="ng-practice">{D.practice.map((item) => <SayIt key={item.form} item={item} />)}</ul>
    <ThreeParts {...D.records.letters} />
    <Cite ids={["stepTagnt", "allen"]} />
  </>;
}
