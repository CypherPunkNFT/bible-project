// The record sheet: a reference's verses in the reader's Bible, or one witness's record. It opens from the right, the same way as
// on every study, and closes on Escape. A witness is restated, never quoted, until the editor has read the translation.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { plural } from "@/lib/site-format";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { plainText } from "@/pages/study/check-notes/checked";
import { isLost, readerHref, versesOf, viaEusebius, type Opened, type Witness } from "./model";
import { Text, ThreeParts } from "./parts";

function VerseRecord({ refKey }: { refKey: string }) {
  const verses = versesOf(refKey), href = readerHref(refKey);
  return <>
    <p className="nb-kicker nb-sheet-when"><BibleName /> · {plural(verses.length, "one verse", "{n} verses")}</p>
    <h2>{refKey}</h2>
    <div className="nb-sheet-verses">{verses.map(({ label, verse }, i) => {
      const chapterTurn = i > 0 && verses[i - 1].verse.chapter !== verse.chapter;
      return <p key={label}>{(i === 0 || chapterTurn) && verses.length > 1 && <b className="nb-sheet-ch">{label.replace(/:\d+$/, "")}</b>}<sup>{verse.verse}</sup><VerseAt verse={verse} /></p>;
    })}</div>
    {href && <p className="nb-readit"><Link to={href}>Read it in the Bible reader →</Link></p>}
  </>;
}

/** Each line written whole, so the translator has the sentence and not its pieces. */
function witnessLine(lost: boolean, kept: boolean): string {
  if (lost) return kept ? "Early witness · own work lost · kept in Eusebius" : "Early witness · own work lost";
  return kept ? "Early witness · own words survive · kept in Eusebius" : "Early witness · own words survive";
}

function WitnessRecord({ witness }: { witness: Witness }) {
  return <>
    <p className="nb-kicker nb-sheet-when">{witnessLine(isLost(witness), viaEusebius(witness))}</p>
    <h2>{plainText(witness.who)}</h2>
    <p className="nb-sidehead">When</p><p className="nb-para"><Text text={witness.when} /></p>
    <p className="nb-sidehead">Where the words are found</p><p className="nb-para"><Text text={witness.where} /></p>
    <ThreeParts evidence={witness.evidence} inference={witness.inference} limit={witness.limit} />
    <p className="nb-caption">Restated from a translation named in the sources, not quoted; the translation was located for this study, not read.</p>
  </>;
}

export function RecordSheet({ opened, onClose }: { opened: Opened | null; onClose: () => void }) {
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onClose]);
  const label = !opened ? "Record" : opened.kind === "verse" ? opened.key : plainText(opened.witness.who);
  return <SlidePanel open={Boolean(opened)} onClose={onClose} label={label} closeLabel="Close this record">
    {opened?.kind === "verse" && <VerseRecord refKey={opened.key} />}
    {opened?.kind === "witness" && <WitnessRecord witness={opened.witness} />}
  </SlidePanel>;
}
