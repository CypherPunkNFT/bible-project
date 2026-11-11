// The printable card: the name, one spelling per script (the Bible's where there is one, otherwise by sound), its
// meaning line and the note that it is approximate. Printed with the life-event print module (the sheet is drawn into
// its own container on <body> and only it prints). The card's faces are asked for with a sample letter before the
// print dialog opens: the hidden card would otherwise never load them, and each face only loads for its own letters.
import { useState } from "react";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { canPrint, defaultPaper, usePrintSheet } from "@/pages/life-events/print-sheet";
import type { Cards, Spelling } from "./bible-spelling";

const FACES: readonly [string, string][] = [
  ['400 1em "Noto Serif Hebrew"', "א"],
  ['400 1em "Noto Sans Syriac"', "ܐ"],
  ['400 1em "Literata Variable"', "α"],
];

async function loadFaces(): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts) return;
  try {
    await Promise.all(FACES.map(([face, sample]) => fonts.load(face, sample)));
  } catch (error) {
    console.warn("name-in-hebrew: a font did not load before printing; printing with what loaded", error);
  }
}

/** The spelling a card prints: Scripture's own if there is one, otherwise the first. */
const best = (spellings: readonly Spelling[]) => spellings.find((spelling) => spelling.kind !== "sound") ?? spellings[0];

export function PrintButton({ name, cards, meaning }: { name: string; cards: Cards; meaning: string }) {
  const [printable] = useState(() => canPrint());
  const { print } = usePrintSheet(defaultPaper(), "0.6in");
  const [busy, setBusy] = useState(false);
  if (!printable) return null;
  const hebrew = best(cards.hebrew);
  const greek = best(cards.greek);
  const aramaic = best(cards.aramaic);
  const onPrint = () => {
    setBusy(true);
    void loadFaces().then(() => { setBusy(false); print(); });
  };
  return <>
    <button type="button" className="nh-print" onClick={onPrint} disabled={busy}>Print a card</button>
    <PrintPortal label="Your name in Hebrew, Greek and Aramaic">
      <div className="nh-sheet">
        <p className="nh-sheet-name" translate="no">{name}</p>
        {meaning && <p className="nh-sheet-meaning">{meaning}</p>}
        <dl>
          {hebrew && <><dt>Hebrew</dt><dd lang="he" dir="rtl" translate="no">{hebrew.text}</dd></>}
          {greek && <><dt>Greek</dt><dd lang="grc" translate="no">{greek.text}</dd></>}
          {aramaic && <><dt>Aramaic</dt><dd lang="syc" dir="rtl" translate="no" className="nh-sheet-syriac">{aramaic.syriac ?? aramaic.text}</dd></>}
        </dl>
        <p className="nh-sheet-note">Spellings by sound are approximate. bibleguide.io</p>
      </div>
    </PrintPortal>
  </>;
}
