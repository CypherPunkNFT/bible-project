// A set's passages (design 5.2, item 4): "Verses for a card" first, because most visitors to a sympathy page are writing
// one, then "Passages to read". Each shows its Berean text as real page text, its reference linked to the reader, its note,
// any context note and the "For a believer" label. Card verses have "Use on card" and "Copy".
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { ShownSympathy } from "./useSympathyPassages";

export function BelieverLabel() {
  return <span className="sy-label" title="This verse speaks of a Christian's hope after death. Choose it knowingly.">For a believer</span>;
}

export function CopyVerseButton({ item }: { item: ShownSympathy }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(`${item.text} — ${item.reference} (BSB)`)
      .then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); })
      .catch((error: unknown) => console.warn(`sympathy: copying ${item.reference} to the clipboard failed`, error));
  };
  return (
    <button type="button" className="sy-small-button" onClick={copy} aria-label={`Copy ${item.reference}`}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? <span>Copied</span> : <span>Copy</span>}
    </button>
  );
}

function PassageItem({ item, onUse }: { item: ShownSympathy; onUse: (key: string) => void }) {
  const card = item.passage.role === "card";
  return (
    <li className="sy-passage">
      <div className="sy-passage-head">
        <span className="sy-reference-line">
          <a href={item.readHref} className="sy-reference">{item.reference}</a>
          {item.passage.believer && <BelieverLabel />}
        </span>
        {card && (
          <span className="sy-passage-actions">
            <button type="button" className="sy-small-button" onClick={() => onUse(item.key)} aria-label={`Use ${item.reference} on the card`}>
              <span>Use on card</span>
            </button>
            <CopyVerseButton item={item} />
          </span>
        )}
      </div>
      <blockquote className="scripture sy-text" lang="en">{item.text}</blockquote>
      <p className="sy-note">{item.passage.note}</p>
      {item.passage.context && <p className="sy-note sy-context"><strong>In context: </strong>{item.passage.context}</p>}
    </li>
  );
}

export function PassageList({ items, onUse, cardsTitle = "Verses for a card" }: { items: ShownSympathy[]; onUse: (key: string) => void; cardsTitle?: string }) {
  const id = "verses";
  const cards = items.filter((item) => item.passage.role === "card");
  const readings = items.filter((item) => item.passage.role !== "card");
  return <>
    <section className="sy-role" id={id} aria-labelledby={`${id}-cards`}>
      <h2 id={`${id}-cards`}>{cardsTitle}</h2>
      <ul className="sy-passages">{cards.map((item) => <PassageItem key={item.key} item={item} onUse={onUse} />)}</ul>
    </section>
    {readings.length > 0 && (
      <section className="sy-role" aria-labelledby={`${id}-readings`}>
        <h2 id={`${id}-readings`}>Passages to read</h2>
        <ul className="sy-passages">{readings.map((item) => <PassageItem key={item.key} item={item} onUse={onUse} />)}</ul>
      </section>
    )}
  </>;
}
