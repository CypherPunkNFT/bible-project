// Section 01: one real verse, hanging from a ruled line, read from the right. The reader peels it down to letters and builds it back,
// and each word answers with its sound and STEP Bible's gloss. The layers are worked out from the page's own text, not stored.
import { useId, useState } from "react";
import { D, findLayer, findLine, H, LAYERS, peel, type Layer } from "./model";
import { Cite, Figure, He, Head, Quote, ThreeParts } from "./parts";

function Word({ text, sound, gloss, chosen, onChoose }: { text: string; sound: string; gloss: string; chosen: boolean; onChoose: () => void }) {
  return <button type="button" lang="he" dir="rtl" className={`hw-word${chosen ? " chosen" : ""}`} aria-pressed={chosen} aria-label={`${sound}: ${gloss}`} onClick={onChoose}>{text}</button>;
}

export function Layers({ lineValue, layerValue, onParam }: { lineValue: string | null; layerValue: string | null; onParam: (name: string, value: string | null) => void }) {
  const line = findLine(lineValue), layer = findLayer(layerValue);
  const [picked, setPicked] = useState<{ line: string; index: number } | null>(null);
  const name = useId();
  const words = H.lines[line.id].words;
  const chosen = picked?.line === line.id ? picked.index : null;
  const about = LAYERS.find((l) => l.id === layer)!;
  return <>
    <Head letter="א" num="01" kicker="Peel the line" title={<>Consonants on the line.<em> Everything else around them.</em></>}
      lead="Choose a verse. Take its marks away, and put them back. Then press a word to hear how it is said." />
    <div className="hw-linepick" role="group" aria-label="Choose a verse">
      {D.lines.map((l) => <button key={l.id} type="button" aria-pressed={l.id === line.id} onClick={() => onParam("line", l.id)}>{l.label}</button>)}
    </div>
    <div className="hw-sheet">
      <p className="hw-dir" aria-hidden="true"><span>←</span> Read this way</p>
      <p className="hw-line" dir="rtl" lang="he">
        {words.map((word, i) => <Word key={`${line.id}-${i}`} text={peel(word.he, layer)} sound={line.words[i].sound} gloss={word.gloss} chosen={chosen === i} onChoose={() => setPicked(chosen === i ? null : { line: line.id, index: i })} />)}
      </p>
      <p className="hw-wordnote" aria-live="polite">{chosen === null ? "Press a word." : <><b>{line.words[chosen].sound}</b> · STEP Bible's gloss, word for word: <i>{words[chosen].gloss}</i></>}</p>
    </div>
    <fieldset className="hw-layers">
      <legend className="hw-kicker">How much of the page</legend>
      {LAYERS.map((l) => <label key={l.id} className={l.id === layer ? "chosen" : ""}>
        <input type="radio" name={name} checked={l.id === layer} onChange={() => onParam("layer", l.id as Layer)} /><span>{l.label}</span>
      </label>)}
      <p className="hw-layer-line">{about.line}</p>
    </fieldset>
    <Quote label={line.label} />
    <div className="hw-witnesses"><Figure id="nash" /><Figure id="leningrad" /></div>
    <p className="hw-para">Who marked the points and accents, and when, is the subject of a planned study on the Masoretes and the Hebrew text. Here they are simply what is on the page. The word <He>{peel(H.lines["gen1-1"].words[1].he, "points")}</He> stands with its points or without them, and the page's question stays the same.</p>
    <ThreeParts {...D.records.layers} />
    <Cite ids={["leningrad", "nash", "stepTahot", "gkc"]} />
  </>;
}
