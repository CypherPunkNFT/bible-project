// The drawn verse: its words from the Berean Standard Bible, its reference opening the reader there (shaded, and in the
// Berean even when the site is in another language: CHOSEN_BIBLE), and Copy and Share. Share uses the phone's own
// share sheet where there is one; elsewhere it copies the verse with a link back to it. Where copying is refused, the
// text is shown to copy by hand.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BOOK_NUMBERS } from "@/data/life-events/types";
import { CHOSEN_BIBLE } from "@/lib/last-read";
import { verseCardPath } from "@/lib/verse-card/links";
import { BIBLE } from "./load";
import type { VerseRef } from "./pick";
import { verseLink, verseMessage, verseText } from "./share";

export type VerseState = { status: "loading" } | { status: "ready"; text: string } | { status: "missing" } | { status: "error" };

/** The reader at this verse, shaded: /read/bsb/JHN/3?hl=16. */
const readerHref = (ref: VerseRef) => `/read/${BIBLE}/${ref.code}/${ref.chapter}?hl=${ref.verse}`;

export function VerseCard({ verse, reference, state, onRetry }: {
  verse: VerseRef; reference: string; state: VerseState; onRetry: () => void;
}) {
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const cardPath = verseCardPath(BOOK_NUMBERS[verse.code] ?? 0, verse.chapter, verse.verse);
  useEffect(() => { setStatus(""); setManual(null); }, [reference]);
  useEffect(() => { if (manual) { textarea.current?.focus(); textarea.current?.select(); } }, [manual]);

  const copy = async (text: string, done: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setStatus(done);
    } catch { setManual(text); }
  };
  const share = async (text: string) => {
    const message = verseMessage(text, reference, verse);
    if (typeof navigator.share !== "function") return copy(message, "Copied, with a link back to this verse");
    try { await navigator.share({ title: reference, text: verseText(text, reference), url: verseLink(verse) }); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setManual(message); }
  };

  return (
    <figure className="rv-card" aria-busy={state.status === "loading"}>
      {state.status === "ready" && <blockquote className="scripture rv-text" lang="en" translate="no">{state.text}</blockquote>}
      {state.status === "loading" && <p className="rv-wait">Opening the Berean Standard Bible…</p>}
      {state.status === "missing" && <p className="rv-problem">{`The Berean Standard Bible has no verse ${reference}. Ask for another verse below.`}</p>}
      {state.status === "error" && <p className="rv-problem">
        This verse could not be loaded. Check your connection.{" "}
        <button type="button" className="rv-link" onClick={onRetry}>Try again</button>
      </p>}
      <figcaption>
        <Link to={readerHref(verse)} state={CHOSEN_BIBLE} className="rv-ref">{reference}</Link>
        <span className="rv-version">Berean Standard Bible</span>
      </figcaption>
      {state.status === "ready" && <div className="rv-actions">
        <button type="button" onClick={() => void copy(verseText(state.text, reference), "Copied")}>Copy</button>
        <button type="button" onClick={() => void share(state.text)}>Share</button>
        {cardPath && <Link to={cardPath} className="rv-link">Make a card of this verse</Link>}
        <span role="status">{status}</span>
      </div>}
      {manual !== null && <label className="rv-manual">Press and hold to copy<textarea ref={textarea} readOnly value={manual} /></label>}
    </figure>
  );
}
