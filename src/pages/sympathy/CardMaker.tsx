// "Send comfort": the card maker on every set page and the hub (design 6.1). Choose a verse and a style, then one of four
// ways to send: a message, a folded card, memorial cards or a display print. Copying the words for a shop-bought card is
// the "Copy" button on each verse. The verse and style become a plain card description (design 6.5).
import { useEffect, useMemo, useState } from "react";
import { DISPLAY_MAX } from "@/pages/life-events/passage";
import { CARD_STYLES, type CardStyle } from "./message";
import { MessageTab } from "./MessageTab";
import { Ornament } from "./Ornament";
import { BelieverLabel } from "./PassageList";
import { PrintPanel } from "./PrintPanel";
import type { ShownSympathy } from "./useSympathyPassages";

type Tab = "message" | "folded" | "memorial" | "display";

const TABS: { id: Tab; label: string }[] = [
  { id: "message", label: "Send as a message" },
  { id: "folded", label: "Print a card" },
  { id: "memorial", label: "Memorial cards" },
  { id: "display", label: "Display print" },
];

const WHAT: Record<Tab, string> = {
  message: "A message for your own text, email or chat app: your words, the verse, and a link to a quiet card page made for them.",
  folded: "One sheet, folded twice into a card with a front, an inside and a back. Fits an A2 or C6 envelope.",
  memorial: "Four cards on one sheet, to cut out and hand to guests at a service: a name, the dates and a verse.",
  display: "One passage, large, for a memorial table or beside a photograph.",
};

const LATER_HINT = "Often better a few weeks on: a verse of future joy can sting in the first days.";
// The label the passage lists show (PassageList.tsx), kept a text of its own in the verse list so the page translator can swap it.
const FOR_A_BELIEVER = "For a believer";
const phoneScreen = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches;

interface CardMakerProps {
  /** Tells the print portals of different pages apart. */
  label: string;
  passages: ShownSympathy[] | null;
  failed: boolean;
  defaults: { heading: string; inside: string };
  /** The passage a "Use on card" button chose, with a counter so choosing the same one twice still applies. */
  chosen: { key: string; count: number } | null;
}

export function CardMaker({ label, passages, failed, defaults, chosen }: CardMakerProps) {
  const [tab, setTab] = useState<Tab>(() => (phoneScreen() ? "message" : "folded"));
  const [style, setStyle] = useState<CardStyle>("plain");
  const [verseKey, setVerseKey] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const cardVerses = useMemo(() => (passages ?? []).filter((item) => item.passage.role === "card"), [passages]);
  const offered = useMemo(() => (tab === "display" ? (passages ?? []).filter((item) => item.text.length <= DISPLAY_MAX) : cardVerses), [tab, passages, cardVerses]);
  const selected = offered.find((item) => item.key === verseKey) ?? null;

  // A verse the current tab cannot take falls back to the page's default card verse, and says so (design 7.4).
  useEffect(() => {
    if (!passages || selected) return;
    const fallback = offered.find((item) => item.key === cardVerses[0]?.key) ?? offered[0];
    if (!fallback) return;
    if (verseKey) setNotice(`That passage is too long for this card, so it now uses ${fallback.reference}.`);
    setVerseKey(fallback.key);
  }, [passages, selected, offered, cardVerses, verseKey]);

  useEffect(() => {
    if (!chosen) return;
    setVerseKey(chosen.key);
    setNotice("");
  }, [chosen]);

  const verse = selected ?? null;
  const disabledReason = failed ? "The verses could not be loaded, so there is nothing to send yet. Use Retry above." : !passages ? "Waiting for the verses…" : null;

  return (
    <section className="sy-maker" id="card-maker" aria-labelledby={`${label}-maker-title`}>
      <h2 id={`${label}-maker-title`}>Send comfort</h2>
      <div className="sy-maker-choices">
        <label className="sy-field">
          <span className="sy-field-label">Verse</span>
          <select value={verse?.key ?? ""} onChange={(changed) => { setNotice(""); setVerseKey(changed.target.value); }} disabled={!offered.length}>
            {offered.map((item) => <option key={item.key} value={item.key}>{item.passage.believer ? [item.reference, " (", FOR_A_BELIEVER, ")"] : item.reference}</option>)}
          </select>
        </label>
        {notice && <p className="sy-notice" role="status">{notice}</p>}
        {verse && (
          <div className="sy-chosen-verse">
            <p className="scripture" lang="en">{verse.text}</p>
            <p className="sy-chosen-ref"><span>{verse.reference}</span>{verse.passage.believer && <BelieverLabel />}</p>
            {verse.passage.later && <p className="sy-hint">{LATER_HINT}</p>}
            {verse.passage.hint && <p className="sy-hint">{verse.passage.hint}</p>}
          </div>
        )}
        <fieldset className="sy-choice sy-styles">
          <legend>Style</legend>
          {CARD_STYLES.map((item) => (
            <label key={item.id} className={style === item.id ? "sy-chosen" : undefined} title={item.what}>
              <input type="radio" name={`sy-style-${label}`} value={item.id} checked={style === item.id} onChange={() => setStyle(item.id)} />
              <Ornament style={item.id} colour="currentColor" width={44} />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className="sy-tabs" role="tablist" aria-label="How to send">
        {TABS.map((item) => (
          <button key={item.id} type="button" role="tab" id={`${label}-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`${label}-panel`}
            className={tab === item.id ? "sy-tab sy-tab-on" : "sy-tab"} onClick={() => { setNotice(""); setTab(item.id); }}>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="sy-tab-panel" role="tabpanel" id={`${label}-panel`} aria-labelledby={`${label}-tab-${tab}`}>
        <p className="sy-tab-what">{WHAT[tab]}</p>
        {tab === "message" ? (
          <MessageTab card={verse ? { key: verse.key, text: verse.text, reference: verse.reference, style } : null} disabledReason={disabledReason} />
        ) : (
          <PrintPanel format={tab} label={label} style={style} defaults={defaults} disabledReason={disabledReason}
            verse={verse ? { key: verse.key, text: verse.text, reference: verse.reference } : null}
            seconds={cardVerses.filter((item) => item.key !== verse?.key).map((item) => ({ key: item.key, text: item.text, reference: item.reference }))} />
        )}
      </div>
    </section>
  );
}
