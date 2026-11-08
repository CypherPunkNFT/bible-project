// "Send as a message" (design 6.2): the visitor's own words, the verse and a link to a quiet card page, sent from their own
// phone or email. Nothing goes through the site: it sends nothing itself, holds no addresses and has no server part.
import { useMemo, useRef, useState } from "react";
import { Field } from "./Field";
import { buildMessage, cardPath, mailtoHref, MESSAGE_LIMIT, smsBodyHref, type MessageCard } from "./message";

const isPhone = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches;

export function MessageTab({ card, disabledReason }: { card: Omit<MessageCard, "message"> | null; disabledReason: string | null }) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const box = useRef<HTMLTextAreaElement | null>(null);
  const text = useMemo(() => (card ? buildMessage({ ...card, message }) : ""), [card, message]);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const phone = useMemo(isPhone, []);

  const share = () => {
    navigator.share({ text }).catch((error: unknown) => {
      // A cancelled share sheet is not an error and shows nothing.
      if (error instanceof Error && error.name === "AbortError") return;
      console.warn("sympathy: the share sheet failed; offering the message to copy instead", error);
      setManual(true);
    });
  };
  const copy = () => {
    const writing = navigator.clipboard?.writeText(text);
    if (!writing) { setManual(true); return; }
    writing.then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); }).catch((error: unknown) => {
      console.warn("sympathy: copying the message to the clipboard failed; showing it to copy by hand", error);
      setManual(true);
      window.setTimeout(() => box.current?.select(), 0);
    });
  };

  return (
    <div className="sy-tab-body">
      <Field label="Your message (optional)" value={message} limit={MESSAGE_LIMIT} onChange={setMessage} multiline />
      <div className="sy-field">
        <span className="sy-field-label" id="sy-message-preview-label">What will be sent</span>
        <textarea ref={box} className="sy-message-preview" readOnly value={text} rows={7} aria-labelledby="sy-message-preview-label" translate="no" dir="auto" />
        {manual && <small className="sy-notice" role="status">Press and hold to copy, or select the text and copy it.</small>}
      </div>
      {disabledReason ? <p className="sy-notice" role="status">{disabledReason}</p> : (
        <div className="sy-send-row">
          {canShare && <button type="button" className="sy-button" onClick={share}>Share…</button>}
          <button type="button" className="sy-button" onClick={copy}>{copied ? <span>Copied</span> : <span>Copy message</span>}</button>
          <a className="sy-button" href={mailtoHref(text)}>Email</a>
          {phone && <a className="sy-button" href={smsBodyHref(text)}>Text message</a>}
          {card && <a className="sy-button sy-button-quiet" href={cardPath(card.key, card.style)} target="_blank" rel="noopener">Preview the card</a>}
        </div>
      )}
      <p className="sy-small-print">The link carries only the verse and the style, never your words or anyone's name. The site sends nothing and keeps nothing.</p>
    </div>
  );
}
