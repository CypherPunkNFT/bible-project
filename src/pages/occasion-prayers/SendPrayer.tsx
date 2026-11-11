// Copy and Send under a prayer (design 6.1). Send opens a plain message the visitor sees before sending: an optional
// opening line, the prayer with the name typed for this send only, and the link. The name lives in this component's
// state and nowhere else: never saved, never in the address, never sent to the site.
import { useId, useState } from "react";
import {
  cleanName, copyText, emailHref, NAME_MAX, NAME_TOKEN, OPENINGS, prayerMessage, textHref, type Opening, type PrayerCard,
} from "./message";
import { useCopy } from "./useCopy";

/** The prayer as it will be sent, with the typed name drawn translate="no" so a name like "Grace" stays as typed. */
function Preview({ message, name }: { message: string; name: string }) {
  const cleaned = cleanName(name);
  if (!cleaned) return <pre className="op-preview">{message}</pre>;
  const parts = message.split(cleaned);
  return (
    <pre className="op-preview">
      {parts.map((part, index) => (
        <span key={index}>{part}{index < parts.length - 1 && <span translate="no">{cleaned}</span>}</span>
      ))}
    </pre>
  );
}

const OPENING_LABELS: Record<Opening, string> = { praying: OPENINGS.praying, prayed: OPENINGS.prayed, none: "No opening line" };

export function SendPrayer({ card, forSomeone = false, onPrint }: { card: PrayerCard; forSomeone?: boolean; onPrint?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [opening, setOpening] = useState<Opening>(forSomeone ? "praying" : "none");
  const { copy, status, manual } = useCopy();
  const id = useId();
  const typedName = forSomeone ? name : "";
  const message = prayerMessage(card, { name: typedName, opening });
  const share = async () => {
    try { await navigator.share({ text: message }); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) void copy(message); }
  };
  return (
    <div className="op-send">
      <div className="op-actions">
        <button type="button" onClick={() => void copy(copyText(card))}>Copy</button>
        <button type="button" aria-expanded={open} aria-controls={`${id}-send`} onClick={() => setOpen((value) => !value)}>
          {forSomeone ? "Send to them" : "Send"}
        </button>
        {onPrint && <button type="button" onClick={onPrint}>Print this prayer</button>}
      </div>
      {open && (
        <div className="op-message" id={`${id}-send`}>
          {forSomeone && (
            <label className="op-name">
              Their name (optional)
              <input type="text" maxLength={NAME_MAX} autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          )}
          {forSomeone && !cleanName(name) && card.text.includes(NAME_TOKEN) && (
            <p className="op-hint">Add their name here, or fill it in before you send.</p>
          )}
          <fieldset className="op-opening">
            <legend>Opening line</legend>
            {(Object.keys(OPENING_LABELS) as Opening[]).map((key) => (
              <label key={key}>
                <input type="radio" name={`${id}-opening`} checked={opening === key} onChange={() => setOpening(key)} />
                {OPENING_LABELS[key]}
              </label>
            ))}
          </fieldset>
          <Preview message={message} name={typedName} />
          <div className="op-actions">
            {typeof navigator.share === "function" && <button type="button" onClick={() => void share()}>Share…</button>}
            <button type="button" onClick={() => void copy(message)}>Copy message</button>
            <a href={emailHref(message)}>Email</a>
            <a className="op-text-message" href={textHref(message)}>Text message</a>
          </div>
        </div>
      )}
      {manual}
      <span className="op-status" role="status">{status}</span>
    </div>
  );
}
