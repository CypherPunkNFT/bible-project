// Section 02: the twenty-two letters, hanging from one rule as Psalm 119 counts them off, read from the right. Arrow keys follow the
// reading direction, so the left arrow goes to the next letter. A letter opens its record, with its stanza of the psalm.
import { useRef, useState, type KeyboardEvent } from "react";
import { D, findLens, H, inLens, percent, thousands } from "./model";
import { Cite, Head, ThreeParts } from "./parts";

const MOST = Math.max(...Object.values(H.counts.letterCounts));

export function Letters({ lensValue, picked, onLens, onOpen }: { lensValue: string | null; picked: string | null; onLens: (id: string) => void; onOpen: (key: string) => void }) {
  const lens = findLens(lensValue);
  const [roving, setRoving] = useState(0);
  const row = useRef<HTMLOListElement>(null);
  const move = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
    const to = event.key === "Home" ? 0 : event.key === "End" ? D.letters.length - 1 : index + step;
    if (!step && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = Math.max(0, Math.min(D.letters.length - 1, to));
    setRoving(next);
    row.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };
  return <>
    <Head letter="ב" num="02" kicker="Twenty-two letters" title={<>Twenty-two letters.<em> Psalm 119 counts them off.</em></>}
      lead={<>Each eight-verse stanza of Psalm 119 opens with the next letter, in order. Start at the right. The stroke under each letter shows how common it is in the Hebrew Bible.</>} />
    <ul className="hw-lenses" aria-label="Which letters to pick out">
      {D.lenses.map((l) => <li key={l.id}><button type="button" aria-pressed={l.id === lens.id} onClick={() => onLens(l.id)}>{l.label}</button></li>)}
    </ul>
    <p className="hw-lens-line" aria-live="polite">{lens.line}</p>
    <ol ref={row} className="hw-alphabet" dir="rtl" aria-label="The twenty-two letters, from the right">
      {D.letters.map((letter, i) => {
        const on = inLens(letter, lens.id), count = H.counts.letterCounts[letter.id];
        return <li key={letter.id} className={on ? "" : "off"}>
          <button type="button" dir="ltr" data-open={`letter:${letter.id}`} tabIndex={i === roving ? 0 : -1} aria-pressed={picked === letter.id} onClick={() => { setRoving(i); onOpen(`letter:${letter.id}`); }} onKeyDown={(e) => move(e, i)} aria-label={`${letter.name} · ${letter.sound} · ${thousands(count)} times`}>
            <span className="hw-glyph" lang="he" dir="rtl">{letter.glyph}{lens.id === "finals" && letter.final && <i> {letter.final}</i>}</span>
            <span className="hw-lname">{letter.name}</span>
            <span className="hw-lsound">{letter.sound}</span>
            <span className="hw-lbar" aria-hidden="true"><span style={{ width: `${percent(count, MOST)}%` }} /></span>
          </button>
        </li>;
      })}
    </ol>
    <p className="hw-caption">{D.sound.scheme}</p>
    <ThreeParts {...D.records.letters} />
    <Cite ids={["gkc", "stepTahot"]} />
  </>;
}
