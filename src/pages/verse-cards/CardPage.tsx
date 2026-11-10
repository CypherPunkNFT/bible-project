// /verse-cards/:key (design 5.2): the card in the link's design, the verse as text with a way into the reader, and the
// share panel to make your own. The size of the big card follows the reader's screen, not the sender's choice. A key that
// is not a card, or a verse the Berean does not have, opens the start page with a note.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CardCanvas } from "@/components/verse-card/CardCanvas";
import { CardSharePanel } from "@/components/verse-card/CardSharePanel";
import { useCatalog } from "@/lib/catalog";
import { CHOSEN_BIBLE } from "@/lib/last-read";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cardKey, cardPagePath, cardPageUrl, lookFromQuery, readerPath, refFromKey, type CardRef } from "@/lib/verse-card/links";
import { DEFAULT_LOOK } from "@/lib/verse-card/looks";
import { MAX_TEXT, type CardSpec } from "@/lib/verse-card/spec";
import { joinVerses, loadPassage, type Passage, type PassageState } from "./load";
import { StartPage } from "./StartPage";

export function CardPage() {
  const { key = "" } = useParams();
  const ref = refFromKey(key);
  const [search, setSearch] = useSearchParams();
  const look = lookFromQuery(search.get("look"));
  const catalog = useCatalog();
  const [state, setState] = useState<PassageState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const refKey = ref ? cardKey(ref) : "";
  useEffect(() => {
    const wanted = refFromKey(refKey);
    if (!wanted) return;
    let current = true;
    setState({ status: "loading" });
    loadPassage(catalog, wanted)
      .then((loaded) => { if (current) setState(loaded); })
      .catch((error: unknown) => { console.error(`verse cards: ${refKey} could not be loaded`, error); if (current) setState({ status: "error" }); });
    return () => { current = false; };
  }, [catalog, refKey, attempt]);

  if (!ref) return <StartPage notice="We couldn't find that verse. Type it below, or choose one." />;
  if (state.status === "missing") return <StartPage notice={`The Berean Standard Bible has no verse ${state.reference}.`} />;
  return (
    <article className="vcp-page mx-auto max-w-5xl px-4 sm:px-6">
      {state.status === "loading" && <p className="vcp-wait">Opening the Berean Standard Bible…</p>}
      {state.status === "error" && <p className="vcp-notice" role="alert">
        This verse could not be loaded. Check your connection.{" "}
        <button type="button" className="vcp-link" onClick={() => setAttempt((count) => count + 1)}>Try again</button>
      </p>}
      {state.status === "ready" && <CardView passage={state.passage} trimmed={state.trimmed} look={look}
        onLook={(next) => setSearch(next === DEFAULT_LOOK ? {} : { look: next }, { replace: true })} />}
    </article>
  );
}

function CardView({ passage, trimmed, look, onLook }: { passage: Passage; trimmed: boolean; look: string; onLook: (look: string) => void }) {
  const key = cardKey(passage.ref);
  const wide = useMediaQuery("(min-width: 768px)");
  const spec = useMemo<CardSpec>(() => ({
    passage: { text: passage.text, reference: passage.reference, book: passage.ref.book },
    link: cardPageUrl(key, look),
    look: lookFromQuery(look),
  }), [passage, key, look]);
  const chapter = `${passage.reference.replace(/:.*$/, "")}`;
  return (
    <>
      <p className="vcp-kicker">Verse card</p>
      <h1>{passage.reference}</h1>
      {trimmed && <p className="vcp-notice">Those verses are more than one card can hold, so this card shows the first verse. Add more below, up to what fits.</p>}
      <CardCanvas spec={spec} size={wide ? "square" : "portrait"} className="vcp-card" />
      <blockquote className="vcp-text scripture" lang="en" translate="no">{passage.text}</blockquote>
      <p className="vcp-source">
        <span>{`${passage.reference} · Berean Standard Bible`}</span>
        <Link to={readerPath(passage.ref)} state={CHOSEN_BIBLE}>{`Read ${chapter}`}</Link>
      </p>
      <ExtendButtons passage={passage} look={look} />
      <section aria-labelledby="vcp-make-title" className="vcp-make">
        <h2 id="vcp-make-title">Make your own card of this verse</h2>
        <CardSharePanel spec={spec} allowLine linkForLook={(choice) => cardPageUrl(key, choice)} onLookChange={onLook} />
        <p className="vcp-privacy">Cards are drawn on your device. Nothing you type is sent or saved.</p>
      </section>
    </>
  );
}

/** Add the verse before and Add the verse after, inside the chapter and up to what one card can hold. */
function ExtendButtons({ passage, look }: { passage: Passage; look: string }) {
  const navigate = useNavigate();
  const { ref, verses } = passage;
  const numbers = [...verses.keys()].sort((a, b) => a - b);
  const before = numbers.filter((verse) => verse < ref.first).pop();
  const after = numbers.find((verse) => verse > ref.last);
  const holds = (next: CardRef) => joinVerses(verses, next.first, next.last).length <= MAX_TEXT;
  const go = (next: CardRef) => navigate(cardPagePath(cardKey(next), look), { replace: true });
  const earlier = before === undefined ? null : { ...ref, first: before };
  const later = after === undefined ? null : { ...ref, last: after };
  const full = (earlier && !holds(earlier)) || (later && !holds(later));
  return (
    <div className="vcp-extend">
      <button type="button" disabled={!earlier || !holds(earlier)} onClick={() => earlier && go(earlier)}>Add the verse before</button>
      <button type="button" disabled={!later || !holds(later)} onClick={() => later && go(later)}>Add the verse after</button>
      {full && <span className="vcp-full">That is as much as a card can hold.</span>}
    </div>
  );
}
