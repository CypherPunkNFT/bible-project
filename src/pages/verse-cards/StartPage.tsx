// /verse-cards (design 5.3): a reference box, today's verse of the day and six well-known verses as quick choices, and a
// pointer to the reader. Choosing one opens its card page. A card link that could not be opened lands here with a note.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { cardKey, cardPagePath, refFromKey } from "@/lib/verse-card/links";
import { referenceOf } from "./load";
import { QUICK_KEYS } from "./quick";
import { readReference } from "./reference";
import { useTodayVerse } from "./today";

export function StartPage({ notice }: { notice?: string }) {
  const catalog = useCatalog();
  const navigate = useNavigate();
  const today = useTodayVerse();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const read = readReference(catalog, typed);
    if (read.ok) navigate(cardPagePath(cardKey(read.ref)));
    else setError(read.error);
  };
  return (
    <article className="vcp-page mx-auto max-w-4xl px-4 sm:px-6">
      <h1>Bible verse cards</h1>
      <p className="vcp-lede">Make a picture of a Bible verse to post or send, in the Berean Standard Bible. Every card links back to the verse.</p>
      {notice && <p className="vcp-notice" role="alert">{notice}</p>}
      <form className="vcp-find" onSubmit={submit}>
        <label htmlFor="vcp-reference">Type a verse, such as John 3:16 or Psalm 23:1–3</label>
        <div className="vcp-row">
          <input id="vcp-reference" type="text" value={typed} maxLength={80} autoComplete="off" onChange={(event) => { setTyped(event.target.value); setError(null); }}
            aria-invalid={error !== null} aria-describedby={error ? "vcp-reference-error" : undefined} />
          <button type="submit">Make a card</button>
        </div>
        {error && <p id="vcp-reference-error" className="vcp-error">{error}</p>}
      </form>
      <section aria-labelledby="vcp-quick-title" className="vcp-quick">
        <h2 id="vcp-quick-title">Or choose one</h2>
        <ul>
          {today && <li><Link to={cardPagePath(today.key)}><span className="vcp-today">Today's verse</span>{today.reference}</Link></li>}
          {QUICK_KEYS.map((key) => {
            const ref = refFromKey(key)!;
            return <li key={key}><Link to={cardPagePath(key)}>{referenceOf(catalog, ref)}</Link></li>;
          })}
        </ul>
      </section>
      <p className="vcp-reader">Or tap any verse while reading, then choose Make a verse card. <Link to="/read">Open the Bible</Link></p>
    </article>
  );
}
