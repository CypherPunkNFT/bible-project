// One item of any kind (design 3.3, 5.2): its kind label, the words (Scripture and older texts in English with lang="en"),
// glosses and notes, the buttons Copy, Send (two items only) and Print, and under a written blessing "Rooted in
// Scripture": each verse in full as real page text, its reference linked to the reader, and any context note.
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { DEATH_NOTE, NAME_TOKEN, OLDER_TEXTS, olderCredit, type BlessingItem, type BlessingPage, type OlderText } from "@/data/home-blessings";
import type { ShownSympathy } from "@/pages/sympathy/useSympathyPassages";
import { copyText, sendable, verseCopy } from "./message";
import { NO_PRINT_LINE, PrintChooser } from "./PrintChooser";
import { SendPanel } from "./SendPanel";
import type { BlessingPrint } from "./useBlessingPrint";
import { useCopy } from "./useCopy";

export type VerseState = { status: "loading" } | { status: "error"; retry: () => void } | { status: "ready"; verses: ReadonlyMap<unknown, ShownSympathy> };

/** The words with "[name]" drawn as a soft placeholder, keeping a rhyme's line breaks. */
export function WrittenWords({ text }: { text: string }) {
  const parts = text.split(NAME_TOKEN);
  return (
    <p className="hb-words hb-written">
      {parts.map((part, index) => <Fragment key={index}>{part}{index < parts.length - 1 && <span className="hb-name-token">{NAME_TOKEN}</span>}</Fragment>)}
    </p>
  );
}

export function OlderLines({ lines }: { lines: string[] }) {
  return (
    <blockquote className="hb-words hb-older" lang="en">
      {lines.map((line, index) => (line === "" ? <span key={index} className="hb-stanza" aria-hidden="true" /> : <span key={index} className="hb-line">{line}</span>))}
    </blockquote>
  );
}

function Glosses({ text }: { text: OlderText }) {
  if (!text.glosses?.length) return null;
  return (
    <dl className="hb-glosses">
      {text.glosses.map((gloss) => <div key={gloss.word}><dt lang="en">{gloss.word}</dt><dd>{gloss.meaning}</dd></div>)}
    </dl>
  );
}

export function VerseItem({ verse, id }: { verse: ShownSympathy; id: string }) {
  const { copy, status, manual } = useCopy();
  return (
    <li id={id} className="hb-root">
      <blockquote className="scripture" lang="en">{verse.text}</blockquote>
      <div className="hb-reference">
        <Link to={verse.readHref}>{verse.reference}</Link>
        <button type="button" className="hb-small" onClick={() => void copy(verseCopy(verse))}>Copy verse</button>
        <span className="hb-status" role="status">{status}</span>
      </div>
      <p className="hb-note">{verse.passage.note}</p>
      {verse.passage.context && <p className="hb-context">{verse.passage.context}</p>}
      {manual}
    </li>
  );
}

export function RootedIn({ state, passages, anchors, titleId }: { state: VerseState; passages: unknown[]; anchors: string[]; titleId: string }) {
  return (
    <section className="hb-rooted" aria-labelledby={titleId}>
      <h3 id={titleId}>Rooted in Scripture</h3>
      {state.status === "loading" && <div className="hb-loading" role="status">Loading the verses…</div>}
      {state.status === "error" && <div className="hb-load-error" role="alert">The verses could not be loaded. <button type="button" onClick={state.retry}>Retry verses</button></div>}
      {state.status === "ready" && (
        <ul>{passages.map((passage, index) => { const verse = state.verses.get(passage); return verse ? <VerseItem key={anchors[index]} id={anchors[index]} verse={verse} /> : null; })}</ul>
      )}
    </section>
  );
}

function OlderBody({ text }: { text: OlderText }) {
  return (
    <>
      <OlderLines lines={text.lines} />
      <p className="hb-credit">{olderCredit(text)}</p>
      <Glosses text={text} />
      {text.note && <p className="hb-context">{text.note}</p>}
      {text.extraLines && (
        <div className="hb-extra">
          <h4>{text.extraLines.label}</h4>
          <OlderLines lines={text.extraLines.lines} />
          <p className="hb-context">{DEATH_NOTE}</p>
        </div>
      )}
      <p className="hb-source">{text.source}.</p>
    </>
  );
}

interface PanelProps {
  page: BlessingPage;
  item: BlessingItem;
  featured: boolean;
  verses: VerseState;
  reference: string;
  roots: string[];
  printer: BlessingPrint;
}

const KIND_LABEL = { written: "Written for Bible Guide", "fill-in": "A card to fill in", scripture: "Scripture · Berean Standard Bible" } as const;

export function ItemPanel({ page, item, featured, verses, reference, roots, printer }: PanelProps) {
  const [printing, setPrinting] = useState(false);
  const [sending, setSending] = useState(false);
  const { copy, status, manual } = useCopy();
  const ready = verses.status === "ready" ? verses.verses : null;
  const verse = item.kind === "scripture" ? ready?.get(item.passage) : undefined;
  const older = item.kind === "older" ? OLDER_TEXTS[item.id] : null;
  const heading = older ? older.title : item.kind === "scripture" ? reference : item.label;
  const canAct = item.kind !== "scripture" || Boolean(verse);
  const printableHere = item.layouts.length > 0;
  return (
    <section id={item.id} className={`hb-item hb-${item.kind}${featured ? " hb-featured" : ""}`} aria-labelledby={`${item.id}-title`}>
      <div className="hb-panel">
        <p className="hb-kind">{item.kind === "older" ? item.label : KIND_LABEL[item.kind]}</p>
        <h2 id={`${item.id}-title`}>{heading}</h2>
        {item.kind === "written" && <WrittenWords text={item.text} />}
        {older && <OlderBody text={older} />}
        {item.kind === "scripture" && (verse
          ? <><blockquote className="hb-words scripture" lang="en">{verse.text}</blockquote>{item.setting && <p className="hb-setting">{item.setting}</p>}{item.passage.context && <p className="hb-context">{item.passage.context}</p>}</>
          : <div className="hb-loading" role="status">{verses.status === "error" ? "The verse could not be loaded." : "Loading the verse…"}</div>)}
        {item.kind === "fill-in" && <ol className="hb-prompts">{item.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol>}
        {item.kind === "fill-in" && <p className="hb-hint">For children about 6 to 11 to fill in by hand and keep by the bed.</p>}
        <div className="hb-actions">
          {item.kind !== "fill-in" && <button type="button" disabled={!canAct} onClick={() => void copy(copyText(page, item, verse))}>Copy</button>}
          {sendable(item) && <button type="button" disabled={!canAct} aria-expanded={sending} onClick={() => setSending((value) => !value)}>Send</button>}
          {printableHere && printer.printable && <button type="button" disabled={!canAct} aria-expanded={printing} onClick={() => setPrinting((value) => !value)}>Print…</button>}
          <span className="hb-status" role="status">{status}</span>
        </div>
        {printableHere && !printer.printable && <p className="hb-hint">{NO_PRINT_LINE}</p>}
        {manual}
        {sending && canAct && <SendPanel page={page} item={item} verse={verse} copy={copy} />}
        {printing && canAct && ready && <PrintChooser page={page} item={item} verses={ready} printer={printer} />}
      </div>
      {(item.kind === "written" || item.kind === "fill-in") && <RootedIn state={verses} passages={item.rootedIn} anchors={roots} titleId={`${item.id}-rooted`} />}
    </section>
  );
}
