// One written prayer (design 5.2 items 4–5): its label, the prayer in Literata, Copy / Send / Print, and under it
// "Rooted in Scripture": each verse in full as real page text, its reference linked to the reader, and a context note
// where the verse is often misread.
import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { Occasion, WrittenPrayer } from "@/data/occasion-prayers";
import type { ShownSympathy } from "@/pages/sympathy/useSympathyPassages";
import { NAME_TOKEN, prayerCard, verseCopy } from "./message";
import type { PrayerSheetData } from "./PrintPrayer";
import { SendPrayer } from "./SendPrayer";
import { useCopy } from "./useCopy";

/** The prayer's words, with "[name]" drawn as a soft placeholder. */
export function PrayerWords({ text }: { text: string }) {
  const parts = text.split(NAME_TOKEN);
  return (
    <p className="op-prayer-text">
      {parts.map((part, index) => (
        <Fragment key={index}>{part}{index < parts.length - 1 && <span className="op-name-token">{NAME_TOKEN}</span>}</Fragment>
      ))}
    </p>
  );
}

function Verse({ verse, id }: { verse: ShownSympathy; id: string }) {
  const { copy, status, manual } = useCopy();
  return (
    <li id={id} className="op-root">
      <blockquote className="scripture" lang="en">{verse.text}</blockquote>
      <div className="op-reference">
        <Link to={verse.readHref}>{verse.reference}</Link>
        <button type="button" className="op-small" onClick={() => void copy(verseCopy(verse))}>Copy verse</button>
        <span className="op-status" role="status">{status}</span>
      </div>
      <p className="op-note">{verse.passage.note}</p>
      {verse.passage.context && <p className="op-context">{verse.passage.context}</p>}
      {manual}
    </li>
  );
}

export type VerseState = { status: "loading" } | { status: "error"; retry: () => void } | { status: "ready"; verses: ShownSympathy[] };

export function RootedIn({ state, anchors, titleId, title = "Rooted in Scripture" }: { state: VerseState; anchors: string[]; titleId: string; title?: string }) {
  return (
    <section className="op-rooted" aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      {state.status === "loading" && <div className="op-loading" role="status">Loading the verses…</div>}
      {state.status === "error" && (
        <div className="op-load-error" role="alert">The verses could not be loaded. <button type="button" onClick={state.retry}>Retry verses</button></div>
      )}
      {state.status === "ready" && <ul>{state.verses.map((verse, index) => <Verse key={anchors[index]} id={anchors[index]} verse={verse} />)}</ul>}
    </section>
  );
}

interface PanelProps {
  occasion: Occasion;
  prayer: WrittenPrayer;
  featured: boolean;
  verses: VerseState;
  anchors: string[];
  onPrint?: (sheet: PrayerSheetData) => void;
}

export function PrayerPanel({ occasion, prayer, featured, verses, anchors, onPrint }: PanelProps) {
  const shown = verses.status === "ready" ? verses.verses : [];
  const card = prayerCard(occasion, prayer, shown.map((verse) => verse.reference));
  const print = onPrint && verses.status === "ready"
    ? () => onPrint({ heading: occasion.heading, label: prayer.label, text: prayer.text, verses: shown, crown: false })
    : undefined;
  return (
    <section id={prayer.id} className={`op-prayer${featured ? " op-featured" : ""}`} aria-labelledby={`${prayer.id}-title`}>
      <div className="op-panel">
        <h2 id={`${prayer.id}-title`}>{prayer.label}</h2>
        <PrayerWords text={prayer.text} />
        <SendPrayer card={card} forSomeone={Boolean(prayer.forSomeone)} onPrint={print} />
      </div>
      <RootedIn state={verses} anchors={anchors} titleId={`${prayer.id}-rooted`} />
    </section>
  );
}
