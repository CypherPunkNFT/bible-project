import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Section } from "@/components/letters/LetterParts";
import type { Prophet } from "@/data/people-pages/types";
import { useProphet } from "@/lib/people-pages";
import { personPath, prophetFor, prophetsOfEra, rulerFor, rulerHref } from "@/lib/people-pages-index";
import { StoryEnding } from "./ApostleSections";
import { EvidenceClaim, PeopleCitations } from "./Evidence";
import { prophetCalled, prophetEraBand, prophetGlow, pronouns } from "./kinds";
import { PROPHETS_GUIDE } from "./links";
import { PageTop, Sections } from "./PageFrame";
import { PassagesSection, QuestionsSection, SourcesSection } from "./PageSources";
import { AspectSwitch } from "./PersonEntry";
import { BookSection } from "./ProphetBook";
import { BookLinks, CallSection, FulfilmentSection, KingsSection, MessageSection, PersonLink, SignsSection, WordsSection } from "./ProphetSections";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";
import { readyKey } from "./usePeoplePageSlide";
import "@/components/letters/letters.css";
import "./people-pages.css";
import "./prophet-page.css";

type Sex = "M" | "F" | "G" | "";

/** The hero gives the first sentence of a claim; the whole of it, with its verses, is further down. */
const firstSentence = (text?: string) => text?.split(/(?<=[.!?”])\s+(?=[A-Z“])/)[0];
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * A prophet's page (/people/:id/word, Research/People/PROPHETS.md): how the word came, the kings they stood before,
 * the message, the words to people and nations, the signs, what Scripture says came of the word, the book, the
 * companions and opponents, how the story ends, then the open questions, every passage and the sources. Sections
 * with nothing to show are left out. Prophets Scripture says were not sent (kind "false") are titled in the text's
 * own words; the singers' message is their songs.
 */
export function ProphetPage({ id, sex }: { id: string; sex: Sex }) {
  const state = useProphet(id);
  const summary = prophetFor(id);
  if (!summary || state.status === "missing") return <p className="lg-glass lg-muted">This prophet's page is still being prepared.</p>;
  if (state.status === "loading") return <div className="lg-glass" style={{ minHeight: 420 }} aria-busy="true" />;
  const prophet = state.item;
  const { their, them } = pronouns(summary.sex || sex);
  const notSent = prophet.kind === "false";
  const singer = prophet.kind === "singer";
  const he = summary.sex === "F" ? "she" : summary.sex === "G" ? "they" : "he";
  const sections = [
    { id: "pp-call", title: "The call", node: <CallSection prophet={prophet} them={them} he={he} /> },
    { id: "pp-kings", title: prophet.era === "nt" ? "Before the rulers" : "Before the kings", node: <KingsSection prophet={prophet} title={prophet.era === "nt" ? "Before the rulers" : "Before the kings"} /> },
    { id: "pp-message", title: notSent ? "The word given" : singer ? "The songs" : "The message", node: notSent
      ? <MessageSection prophet={prophet} kicker="The word given" title={`What ${he} prophesied`} lead="Told exactly as the text tells it, quoted word for word." />
      : singer ? <MessageSection prophet={prophet} kicker="The songs" title={`What ${he === "they" ? "they" : he} sang`} lead="Their songs and what they prophesied with them, each with its verses." />
      : <MessageSection prophet={prophet} kicker="The message" title="The word in its main themes" lead="In our own words, each theme with its key verses; the sayings quoted word for word from the King James text." /> },
    { id: "pp-words", title: prophet.words.length ? "The word to …" : "Places", node: <WordsSection prophet={prophet} their={their} /> },
    { id: "pp-signs", title: "Signs", node: <SignsSection prophet={prophet} /> },
    { id: "pp-fulfilment", title: notSent ? "The answer" : "What came of it", node: <FulfilmentSection prophet={prophet} kicker={notSent ? "The answer given" : "What came of the word"} title={notSent ? "The answer, and what came of it" : "As Scripture reports it"} /> },
    { id: "pp-book", title: prophet.books.length > 1 ? "The books" : "The book", node: <BookSection prophet={prophet} singer={singer} /> },
    { id: "pp-companions", title: "Companions", node: <Companions prophet={prophet} them={them} /> },
    { id: "pp-ending", title: "How it ends", node: <StoryEnding apostle={prophet} their={their} /> },
    { id: "pp-questions", title: "Questions", node: <QuestionsSection questions={prophet.questions} /> },
    { id: "pp-passages", title: "Passages", node: <PassagesSection passages={prophet.passages} notSaid={prophet.notSaid} /> },
    { id: "pp-sources", title: "Sources", node: <SourcesSection citations={state.group.citations} /> },
  ];
  return <PeopleCitations citations={state.group.citations}>
    <div className="lg-page pp-page pp-word" data-kind={prophet.kind} style={{ "--lg": prophetGlow(prophet.kind) } as CSSProperties} data-people-ready={readyKey({ kind: "special", id, aspect: "word" })}>
      <PageTop id={prophet.id} name={prophet.name} page="The word" fallback={PROPHETS_GUIDE} />
      <ProphetHero prophet={prophet} sex={summary.sex || sex} />
      <Sections sections={sections.filter((s) => hasContent(s.id, prophet))} />
    </div>
  </PeopleCitations>;
}

/** Sections with nothing to show are left out of the page and of the jump chips. */
function hasContent(id: string, p: Prophet): boolean {
  switch (id) {
    case "pp-call": return p.call.length + p.how.length > 0;
    case "pp-kings": return p.kings.length > 0;
    case "pp-message": return p.message.length > 0;
    case "pp-words": return p.words.length + p.places.length > 0 || new Set(p.signs.map((s) => s.placeId).filter(Boolean)).size > 1;
    case "pp-signs": return p.signs.length > 0;
    case "pp-fulfilment": return p.fulfilment.length > 0;
    case "pp-book": return p.books.length > 0;
    case "pp-companions": return p.companions.length > 0;
    case "pp-ending": return p.ending.scripture.length + p.ending.tradition.length > 0;
    case "pp-questions": return p.questions.length > 0;
    case "pp-passages": return p.passages.length + p.notSaid.length > 0;
    default: return true;
  }
}

/** The word at a glance: name, the line under it, five figures, and the prophets before and after in the era. */
function ProphetHero({ prophet, sex }: { prophet: Prophet; sex: Sex }) {
  const carried = useCarried();
  const era = prophetEraBand(prophet.era);
  const line = prophetsOfEra(prophet.era);
  const at = line.findIndex((p) => p.id === prophet.id);
  const before = at > 0 ? line[at - 1] : undefined, after = at >= 0 && at < line.length - 1 ? line[at + 1] : undefined;
  const notSent = prophet.kind === "false";
  // The New Testament prophets and those Scripture says were not sent are named by the page's title, in the text's own
  // words (Luke never calls Simeon a prophet); the others by what Scripture calls them.
  const inTheirWords = notSent || prophet.kind === "nt";
  const called = prophetCalled(prophet.kind, sex);
  const how = prophet.call[0]?.label ?? firstSentence(prophet.how[0]?.text);
  // The hero names each ruler short ("Jehoahaz", not "Jehoahaz (Shallum)"); the cards below give the full names.
  const shortName = (name: string) => name.split(/ \(|, /)[0];
  // A ruler met more than once (Hezekiah three times in Isaiah) is named once.
  const rulers = prophet.kings.filter((k, i) => prophet.kings.findIndex((o) => (o.person.personId ?? o.person.name) === (k.person.personId ?? k.person.name)) === i);
  return <section className="lg-glass lg-hero pp-hero" aria-labelledby="pp-hero-title">
    <div className="pp-hero-head">
      <p className="lg-kicker">{inTheirWords ? era.label : `${prophet.title} · ${era.label}`}</p>
      <AspectSwitch id={prophet.id} name={prophet.name} current="word" />
    </div>
    <h2 id="pp-hero-title">{prophet.name}.<em>{prophet.tagline}</em></h2>
    {prophet.otherNames?.length ? <div className="pp-badges"><span className="pp-badge">Also called {prophet.otherNames.join(", ")}</span></div> : null}
    <dl className="pp-stats">
      <div className="pp-stat" data-not-sent={notSent ? "" : undefined}><dt>{inTheirWords ? "Scripture says" : "Scripture calls"}</dt><dd>{inTheirWords ? <small className="pp-said">{prophet.title}</small> : called}</dd></div>
      <div className="pp-stat"><dt>Era</dt><dd>{era.label}<small>{era.dates}</small></dd></div>
      <div className="pp-stat" data-wide=""><dt>In the days of</dt><dd data-many={rulers.length > 3 ? "" : undefined}>{rulers.length ? rulers.map((k, i) => <span key={k.person.name + i}>{i > 0 && " · "}{k.person.personId && rulerFor(k.person.personId)
        ? <SlideLink to={rulerHref(k.person.personId)} state={carried}>{shortName(k.person.name)}</SlideLink> : <PersonLink person={{ ...k.person, name: shortName(k.person.name) }} />}</span>) : <small className="pp-fact">No ruler named beside {pronouns(sex).them}</small>}</dd></div>
      <div className="pp-stat"><dt>{prophet.books.length > 1 ? "Books" : "Book"}</dt><dd>{prophet.books.length ? <BookLinks codes={prophet.books.map((b) => b.code)} /> : <small className="pp-fact">None bears the name</small>}</dd></div>
      <div className="pp-stat"><dt>{notSent ? `How ${sex === "F" ? "she" : sex === "G" ? "they" : "he"} spoke` : "How the word came"}</dt><dd><small className="pp-fact">{how ?? "Scripture does not say"}</small></dd></div>
    </dl>
    {line.length > 1 && <nav className="pp-strip-nav" aria-label={`Other prophets of ${era.label}, in story order`}>
      {before ? <SlideLink to={personPath(before.id, "word")} state={carried} rel="prev"><ArrowLeft size={16} aria-hidden />{before.name}</SlideLink> : <span />}
      <span className="pp-strip-count">{at + 1} of {line.length} · {era.label}</span>
      {after ? <SlideLink to={personPath(after.id, "word")} state={carried} rel="next">{after.name}<ArrowRight size={16} aria-hidden /></SlideLink> : <span />}
    </nav>}
  </section>;
}

/** Disciples, servants, scribes and opponents, each with what Scripture says passed between them. */
function Companions({ prophet, them }: { prophet: Prophet; them: string }) {
  if (!prophet.companions.length) return null;
  return <Section id="pp-companions" kicker="Companions and opponents" title={`Who stood with ${them}, and against ${them}`} lead="Each with what Scripture says passed between them. A name with a page of its own opens it.">
    <ul className="pp-cards">{prophet.companions.map((c, i) => <li key={c.person.name + i} className="pp-card">
      <h4><PersonLink person={c.person} /></h4>
      {c.person.note && <p>{capital(c.person.note)}</p>}
      <div style={{ marginTop: ".4rem" }}><EvidenceClaim claim={c.claim} as="div" /></div>
    </li>)}</ul>
  </Section>;
}
