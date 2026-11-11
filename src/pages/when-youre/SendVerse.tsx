import { useEffect, useRef, useState } from "react";
import { emailHref, textHref, verseMessage, verseText, type VerseCardDescription } from "./message";

export function SendVerse({ card }: { card: VerseCardDescription }) {
  const [sending, setSending] = useState(false);
  const [manual, setManual] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const message = verseMessage(card);
  const urgent = ["abused", "thinking-of-suicide"].includes(card.page);
  useEffect(() => { if (manual) { textarea.current?.focus(); textarea.current?.select(); } }, [manual]);
  const copy = async (text: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
    } catch { setManual(text); }
  };
  const share = async () => {
    try { await navigator.share({ title: "A verse for you", text: message }); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setManual(message); }
  };
  return <div className="wy-send">
    <button type="button" onClick={() => void copy(verseText(card))}>Copy</button>
    <button type="button" aria-expanded={sending} onClick={() => setSending((value) => !value)}>{urgent ? "Send this to a friend" : "Send to someone"}</button>
    {sending && <div className="wy-message">
      {card.page === "abused" && <p>Sending or copying this link can reveal this subject in messages and link previews. Choose what is safe for you.</p>}
      <pre>{message}</pre>
      {typeof navigator.share === "function" && <button type="button" onClick={() => void share()}>Share…</button>}
      <button type="button" onClick={() => void copy(message)}>Copy message</button>
      <a href={emailHref(message)}>Email</a>
      <a className="wy-text-message" href={textHref(message)}>Text message</a>
    </div>}
    {manual !== null && <label>Press and hold to copy<textarea ref={textarea} readOnly value={manual} /></label>}
    <span role="status">{status}</span>
  </div>;
}
