// The record sheet: one letter, one word in a line, one noun form or one verb. It opens from the right, the same way as on every study,
// and closes on Escape. The grammar lines are STEP Bible's own, shown unchanged and named as theirs.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { caseById, caseOfSlot, D, G, percent, thousands, type Letter, type Opened } from "./model";
import { Mixed, Quote } from "./parts";

function Grammar({ code, gloss, sound }: { code: string; gloss: string; sound: string }) {
  const note = G.codes[code];
  return <dl className="ng-facts">
    <div><dt>STEP Bible's sound</dt><dd>{sound}</dd></div>
    <div><dt>STEP Bible's gloss</dt><dd>{gloss}</dd></div>
    <div><dt>STEP Bible's grammar code</dt><dd>{code}</dd></div>
    {note && <div><dt>STEP Bible's note on it</dt><dd>{note.parse}. {note.plain}.</dd></div>}
  </dl>;
}

function LetterRecord({ letter }: { letter: Letter }) {
  const data = G.letters[letter.id], count = G.counts.letters[letter.id];
  return <>
    <p className="ng-kicker">Letter {D.letters.indexOf(letter) + 1} of 24</p>
    <h2 tabIndex={-1}>{letter.name}</h2>
    <p className="ng-sheet-glyph" lang="grc">{letter.upper} {letter.lower}{letter.final && <span> {letter.final}</span>}</p>
    <dl className="ng-facts">
      <div><dt>Sound here</dt><dd>{letter.sound}</dd></div>
      {letter.lookslike && <div><dt>Do not read it as</dt><dd>English {letter.lookslike}, which it looks like</dd></div>}
      {letter.note && <div><dt>Note</dt><dd><Mixed text={letter.note} /></dd></div>}
      <div><dt>In the text counted</dt><dd>{thousands(count)} of {thousands(G.counts.lettersTotal)} letters, about {percent(count, G.counts.lettersTotal)}%</dd></div>
    </dl>
    <p className="ng-kicker ng-kicker-gap">A word in its verse</p>
    <p className="ng-sheet-word" lang="grc">{letter.word.form}</p>
    <p className="ng-sheet-line">Said <b>{letter.word.say}</b> in this page's scheme. It means {letter.word.means}.</p>
    <Quote label={data.label} />
  </>;
}

function WordRecord({ opened }: { opened: Extract<Opened, { type: "word" }> }) {
  const { line, word } = opened, job = word.k ? caseById.get(word.k) : undefined;
  return <>
    <p className="ng-kicker">{line.label}, word {opened.index + 1}</p>
    <h2 tabIndex={-1}>{word.t}</h2>
    <p className="ng-sheet-word" lang="grc">{word.g}</p>
    {job && <p className="ng-sheet-line">Its job here: <b>{job.plain}</b>. {job.name}.</p>}
    <Grammar code={word.c} gloss={word.e} sound={word.t} />
    <p className="ng-sheet-line">To look a word up by its number, see <Link to="/study/strongs-numbers">Strong's numbers</Link>.</p>
  </>;
}

function CellRecord({ opened }: { opened: Extract<Opened, { type: "cell" }> }) {
  const { noun, slot, cell } = opened, job = caseOfSlot(slot);
  return <>
    <p className="ng-kicker">{noun.name} · {job.name} · {slot[1] === "S" ? "one" : "many"}</p>
    <h2 tabIndex={-1}>{job.plain}</h2>
    <p className="ng-sheet-word" lang="grc">{cell.form}</p>
    <p className="ng-sheet-line">{cell.count === cell.all ? `All ${thousands(cell.all)} of the words with this job and number are spelled this way.` : `${thousands(cell.count)} of the ${thousands(cell.all)} words with this job and number are spelled this way.`} {job.line} In this verse it stands as <span lang="grc" className="ng-gk">{cell.shown}</span>.</p>
    <Quote label={cell.label} />
  </>;
}

function FormRecord({ opened }: { opened: Extract<Opened, { type: "form" }> }) {
  const { item, data } = opened;
  return <>
    <p className="ng-kicker">A verb in its verse</p>
    <h2 tabIndex={-1}>“{item.phrase}”</h2>
    <p className="ng-sheet-word" lang="grc">{item.form}</p>
    <p className="ng-sheet-line">{item.note}</p>
    <Grammar code={data.code} gloss={data.gloss} sound={data.sound} />
    <Quote label={data.label} />
  </>;
}

export function GreekSheet({ opened, onClose }: { opened: Opened | null; onClose: () => void }) {
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onClose]);
  const label = opened?.type === "letter" ? opened.letter.name : "Record";
  return <SlidePanel open={Boolean(opened)} onClose={onClose} label={label} closeLabel="Close this record">
    {opened?.type === "letter" && <LetterRecord letter={opened.letter} />}
    {opened?.type === "word" && <WordRecord opened={opened} />}
    {opened?.type === "cell" && <CellRecord opened={opened} />}
    {opened?.type === "form" && <FormRecord opened={opened} />}
  </SlidePanel>;
}
