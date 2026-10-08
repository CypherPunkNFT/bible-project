import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LetterMap } from "@/components/letters/LetterMap";
import { Section } from "@/components/letters/LetterParts";
import type { MapLayer } from "@/data/letters/types";
import type { PersonRef, Prophet } from "@/data/people-pages/types";
import { useCatalog } from "@/lib/catalog";
import { rulerFor, rulerHref } from "@/lib/people-pages-index";
import { loadPlaces } from "@/lib/data";
import { useCachedLoad } from "@/lib/people-pages";
import { ClaimList, EvidenceClaim, QuoteText } from "./Evidence";
import { personHref } from "./links";
import { placeLayers } from "./map-layers";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";

/**
 * The sections of a prophet's page (/people/:id/word) that are theirs alone: the call, the kings they stood before,
 * the message, the words to people and nations (with a map), the signs and what Scripture says came of the word.
 * The book, the companions and the ending are in ProphetBook.tsx and ApostleSections.tsx.
 */

export function PersonLink({ person }: { person: PersonRef }) {
  const carried = useCarried();
  if (!person.personId) return <>{person.name}</>;
  return <SlideLink to={personHref(person.personId)} state={carried} className="underline decoration-[var(--lg-line)] underline-offset-2 hover:text-[var(--lg)]">{person.name}</SlideLink>;
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const countWord = (n: number) => WORDS[n] ?? String(n);

/** How the word first came: one chip per account, the account quoted; then how it kept coming. */
export function CallSection({ prophet, them, he }: { prophet: Prophet; them: string; he: string }) {
  const [chosen, setChosen] = useState(0);
  const places = useCachedLoad("places", loadPlaces);
  const { call, how } = prophet;
  if (!call.length && !how.length) return null;
  const account = call.length ? call[Math.min(chosen, call.length - 1)] : undefined;
  // A prophet Scripture says was not sent has no call; the page tells how they spoke, in the text's words.
  const notSent = prophet.kind === "false";
  const place = account?.placeId && places.status === "ready" ? places.value.find((p) => p.id === account.placeId) : undefined;
  return <Section id="pp-call" kicker="The call" title={call.length > 1 ? `Called, as ${countWord(call.length)} accounts tell it` : call.length ? "How the word first came" : notSent ? `How ${he} spoke` : "How the word came"}
    lead={place ? `At ${place.name}.` : call.length ? undefined : notSent ? `Scripture records no call for ${them}; it tells how ${he} spoke.` : `Scripture gives no call scene for ${them}; it tells how the word came.`}>
    {call.length > 1 && <div className="lg-chips" style={{ marginTop: 0, marginBottom: "1rem" }} role="group" aria-label="Accounts">
      {call.map((c, i) => <button key={c.label + i} type="button" className="lg-chip" aria-pressed={i === chosen} onClick={() => setChosen(i)}>{c.label}</button>)}
    </div>}
    {account && <>
      {call.length === 1 && <p className="pp-label">{account.label}</p>}
      <QuoteText quote={account.quote} />
      <div style={{ marginTop: ".75rem" }}><EvidenceClaim claim={account.claim} as="div" /></div>
    </>}
    {how.length > 0 && <div className={account ? "pp-divider-top" : undefined}>
      {account && <p className="pp-label">How the word kept coming</p>}
      <ClaimList claims={how} />
    </div>}
  </Section>;
}

/** Before the kings: a card for each ruler, with the words that passed between them; each opens the ruler's reign. */
export function KingsSection({ prophet, title }: { prophet: Prophet; title: string }) {
  const carried = useCarried();
  if (!prophet.kings.length) return null;
  // One card per ruler; a ruler met more than once (Hezekiah in Isaiah) carries each exchange in turn.
  const byRuler = new Map<string, Prophet["kings"]>();
  for (const k of prophet.kings) { const key = k.person.personId ?? k.person.name; byRuler.set(key, [...(byRuler.get(key) ?? []), k]); }
  const groups = [...byRuler.values()];
  const kings = prophet.kings.every((k) => k.person.personId && rulerFor(k.person.personId)?.kind === "king");
  return <Section id="pp-kings" kicker={title} title={groups.length === 1 ? `Before ${groups[0][0].person.name}` : `Before ${countWord(groups.length)} ${kings ? "kings" : "rulers"}`}
    lead="Each ruler in whose days the word came, with what passed between them. A ruler with a page of their own opens it.">
    <div className="pp-cards">{groups.map((meetings) => {
      const first = meetings[0];
      const ruler = first.person.personId ? rulerFor(first.person.personId) : undefined;
      return <article key={first.person.personId ?? first.person.name} className="pp-card pp-king">
        <p className="lg-kicker">{ruler?.title ?? "Ruler"}</p>
        <h4>{ruler ? <SlideLink to={rulerHref(ruler.id)} state={carried}>{first.person.name}</SlideLink> : <PersonLink person={first.person} />}</h4>
        {meetings.map((k, i) => <div key={i} className={i > 0 ? "pp-king-again" : undefined}>
          {k.quote && <QuoteText quote={k.quote} className="pp-quote-small" />}
          <div style={{ marginTop: ".5rem" }}><EvidenceClaim claim={k.claim} as="div" /></div>
        </div>)}
        {ruler && <SlideLink className="pp-link" style={{ marginTop: ".6rem" }} to={rulerHref(ruler.id)} state={carried}>{["king", "queen", "foreign"].includes(ruler.kind) ? "Open the reign" : "Open the rule page"} <ArrowRight size={14} aria-hidden /></SlideLink>}
      </article>;
    })}</div>
  </Section>;
}

/** The message in its main themes, each with its key verses and quotations word for word. */
export function MessageSection({ prophet, kicker, title, lead }: { prophet: Prophet; kicker: string; title: string; lead: string }) {
  if (!prophet.message.length) return null;
  return <Section id="pp-message" kicker={kicker} title={title} lead={lead}>
    <ol className="pp-themes">{prophet.message.map((m, i) => <li key={m.theme + i} className="pp-card">
      <p className="pp-theme-n" aria-hidden>{String(i + 1).padStart(2, "0")}</p>
      <h4>{m.theme}</h4>
      <EvidenceClaim claim={m.claim} as="div" />
      {m.quotes?.map((quote) => <QuoteText key={quote.span.join("-")} quote={quote} className="pp-quote-small" />)}
    </li>)}</ol>
  </Section>;
}

const SIGN_LABEL: Record<Prophet["signs"][number]["kind"], string> = { wonder: "Wonder", "sign-act": "Sign-act", vision: "Vision", other: "Sign" };

/** The map layers for the page: where the word was sent, where the signs were, and the places in the story. */
function mapLayers(prophet: Prophet, their: string): MapLayer[] {
  const words = prophet.words.filter((w) => w.placeId).map((w) => ({ name: w.to, placeId: w.placeId!, refs: [w.quote.span] }));
  const signs = prophet.signs.filter((s) => s.placeId).map((s) => ({ name: s.label, placeId: s.placeId!, refs: s.claim.refs }));
  return [
    ...(words.length ? [{ id: "words", title: "Where the word was sent", stops: words, claim: { text: "" } }] : []),
    ...(signs.length ? [{ id: "signs", title: "Signs", stops: signs, claim: { text: "" } }] : []),
    ...placeLayers(prophet.places, `Places in ${their} story`),
  ];
}

/** "The word to …": the sayings addressed to people and nations, beside a map of the places they were sent. */
export function WordsSection({ prophet, their }: { prophet: Prophet; their: string }) {
  const [focus, setFocus] = useState<string | undefined>();
  const [pointed, setPointed] = useState<string | undefined>();
  // One pin alone makes an empty map: then the places are listed by name only.
  const mapped = mapLayers(prophet, their);
  const layers = new Set(mapped.flatMap((l) => l.stops.map((s) => s.placeId))).size > 1 ? mapped : [];
  if (!prophet.words.length && !layers.length && !prophet.places.length) return null;
  const sayings = prophet.words.length > 0;
  return <Section id="pp-words" kicker={sayings ? "The word to …" : "Places"} title={sayings ? "To whom the word was spoken" : `Where ${their} story happened`}
    lead={sayings ? "Each saying quoted word for word, with whom it was for. Point at one to find its place on the map." : "Places named in Scripture; places known only from tradition are dashed pins."}>
    {layers.length > 0 && <LetterMap layers={layers} title={`${prophet.name}: places`} displayWidth={900} focus={focus} onActive={setPointed} />}
    {sayings && <ul className="pp-cards pp-words" style={{ marginTop: layers.length ? "1rem" : 0 }}>{prophet.words.map((w, i) => <li key={w.to + i} className="pp-card" data-lit={w.placeId && w.placeId === pointed ? "" : undefined}
      onMouseEnter={() => setFocus(w.placeId)} onMouseLeave={() => setFocus(undefined)} onFocus={() => setFocus(w.placeId)} onBlur={() => setFocus(undefined)}>
      <p className="lg-kicker">To {w.person ? <PersonLink person={{ ...w.person, name: w.to }} /> : w.to}</p>
      <QuoteText quote={w.quote} className="pp-quote-small" />
      {w.claim && <div style={{ marginTop: ".5rem" }}><EvidenceClaim claim={w.claim} as="div" /></div>}
    </li>)}</ul>}
    {(!sayings || !layers.length) && prophet.places.length > 0 && <PlaceList prophet={prophet} their={their} />}
  </Section>;
}

function PlaceList({ prophet, their }: { prophet: Prophet; their: string }) {
  return <ul className="pp-places" aria-label={`Places in ${their} story`}>{prophet.places.map((p) => <li key={p.name} data-tradition={p.tradition ? "" : undefined}>
    <strong>{p.name}</strong>{p.tradition && <small> · tradition</small>}{!p.placeId && <small> · no map pin</small>}{p.note && <small> · {p.note}</small>}
  </li>)}</ul>;
}

/** Signs, wonders and sign-acts, as the text tells them. */
export function SignsSection({ prophet }: { prophet: Prophet }) {
  if (!prophet.signs.length) return null;
  const acts = prophet.signs.filter((s) => s.kind === "sign-act").length;
  return <Section id="pp-signs" kicker="Signs" title={acts && acts === prophet.signs.length ? "The word acted out" : "Signs and wonders"} lead="As the text tells them, each with its verses. Sign-acts are things the prophet was told to do as a living message.">
    <ul className="pp-cards">{prophet.signs.map((s, i) => <li key={s.label + i} className="pp-card pp-sign" data-kind={s.kind}>
      <p className="lg-kicker">{SIGN_LABEL[s.kind]}</p>
      <h4>{s.label}</h4>
      <EvidenceClaim claim={s.claim} as="div" />
    </li>)}</ul>
  </Section>;
}

/** What came of the word: only where Scripture itself reports it, the word beside the report. Never our own verdict. */
export function FulfilmentSection({ prophet, kicker, title }: { prophet: Prophet; kicker: string; title: string }) {
  if (!prophet.fulfilment.length) return null;
  return <Section id="pp-fulfilment" kicker={kicker} title={title} lead="Only where Scripture itself says the word came to pass, or the New Testament says it was fulfilled. The page adds no verdict of its own.">
    <ol className="pp-fulfil">{prophet.fulfilment.map((f, i) => <li key={i}>
      <div><p className="pp-label">The word</p><EvidenceClaim claim={f.word} as="div" /></div>
      <span className="pp-fulfil-arrow" aria-hidden><ArrowRight size={18} /></span>
      <div><p className="pp-label">Scripture reports</p><EvidenceClaim claim={f.reported} as="div" /></div>
    </li>)}</ol>
  </Section>;
}

/** The books that bear the name, as links into the reader (the hero's "Books" figure). */
export function BookLinks({ codes }: { codes: string[] }) {
  const catalog = useCatalog();
  if (!codes.length) return null;
  return <>{codes.map((code, i) => {
    const book = catalog.books.find((b) => b.code === code);
    return <span key={code}>{i > 0 && " · "}<Link to={`/read/kjv/${code}/1`} style={{ whiteSpace: "nowrap" }}>{book?.name ?? code}<BookOpen size={13} aria-hidden style={{ display: "inline", marginLeft: ".3rem", verticalAlign: "-1px" }} /></Link></span>;
  })}</>;
}

export function ReadLink({ code, name }: { code: string; name: string }) {
  return <Link className="pp-link" to={`/read/kjv/${code}/1`}>Read {name} <ArrowUpRight size={14} aria-hidden /></Link>;
}
