import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/letters/LetterParts";
import type { Apostle } from "@/data/people-pages/types";
import { useApostle } from "@/lib/people-pages";
import { PEOPLE_PAGES, apostleFor, personPath } from "@/lib/people-pages-index";
import { CallingScene, Companions, JourneySection, StoryEnding, Writings } from "./ApostleSections";
import { ClaimList, EvidenceClaim, PeopleCitations } from "./Evidence";
import { GospelStrip } from "./GospelStrip";
import { APOSTLE_GLOW, pronouns } from "./kinds";
import { APOSTLES_GUIDE, lettersHref } from "./links";
import { PageTop, Sections } from "./PageFrame";
import { PassagesSection, QuestionsSection, SourcesSection } from "./PageSources";
import { AspectSwitch } from "./PersonEntry";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";
import { readyKey } from "./usePeoplePageSlide";
import "@/components/letters/letters.css";
import "./people-pages.css";

/** The hero gives the first sentence of a fact; the whole of it, with its verses, is under "Background". */
const firstSentence = (text?: string) => text?.split(/(?<=[.!?”])\s+(?=[A-Z“])/)[0];

/**
 * A mission page of the wider circle of the first church (/people/:id/mission: James and Jude, the Seven, Barnabas, Mark,
 * Paul's companions): the calling, any moments with Jesus, where they went, companions, how the story ends (Scripture
 * beside tradition) and links to the writings tied to them. The Twelve, Matthias and Paul have their own page
 * (src/components/apostle-page/ApostleMission.tsx).
 */
export function ApostlePage({ id }: { id: string }) {
  const state = useApostle(id);
  if (state.status === "missing") return <p className="lg-glass lg-muted">This apostle's page is still being prepared.</p>;
  if (state.status === "loading") return <div className="lg-glass" style={{ minHeight: 420 }} aria-busy="true" />;
  const apostle = state.item;
  const summary = apostleFor(apostle.id);
  const { their, them } = pronouns(summary?.sex);
  const sections = [
    { id: "pp-background", title: "Background", node: (apostle.home || apostle.trade || apostle.family.length > 0) && <Section id="pp-background" kicker="Background" title="Home, trade and family" lead={`What Scripture says of ${their} life before and beside the mission, each with its verses.`}>
      <div className="pp-cards">
        {apostle.home && <div className="pp-card"><p className="pp-label">From</p><EvidenceClaim claim={apostle.home} as="div" /></div>}
        {apostle.trade && <div className="pp-card"><p className="pp-label">Trade</p><EvidenceClaim claim={apostle.trade} as="div" /></div>}
        {apostle.family.length > 0 && <div className="pp-card"><p className="pp-label">Family</p><ClaimList claims={apostle.family} /></div>}
      </div>
    </Section> },
    { id: "pp-calling", title: "Calling", node: apostle.calling.length > 0 && <CallingScene apostle={apostle} /> },
    { id: "pp-gospels", title: "With Jesus", node: apostle.moments.length > 0 && <Section id="pp-gospels" kicker="With Jesus"
      title={`${their.charAt(0).toUpperCase()}${their.slice(1)} moments with Jesus`} lead="The Gospels in the order of events (the site's harmony). Each dot is an event that names him.">
      <GospelStrip apostle={apostle} />
    </Section> },
    { id: "pp-journey", title: their === "their" ? "Where they went" : "Where he went", node: (apostle.places.length > 0 || apostle.acts.length > 0) && <JourneySection apostle={apostle} their={their} /> },
    { id: "pp-companions", title: "Companions", node: apostle.companions.length > 0 && <Companions apostle={apostle} them={them} /> },
    { id: "pp-ending", title: "How it ends", node: <StoryEnding apostle={apostle} their={their} /> },
    { id: "pp-writings", title: "Writings", node: apostle.writings.length > 0 && <Writings apostle={apostle} tied={them} /> },
    { id: "pp-questions", title: "Questions", node: apostle.questions.length > 0 && <QuestionsSection questions={apostle.questions} /> },
    { id: "pp-passages", title: "Passages", node: <PassagesSection passages={apostle.passages} notSaid={apostle.notSaid} identifications={apostle.identifications} /> },
    { id: "pp-sources", title: "Sources", node: <SourcesSection citations={state.group.citations} /> },
  ];
  return <PeopleCitations citations={state.group.citations}>
    <div className="lg-page pp-page" style={{ "--lg": APOSTLE_GLOW } as CSSProperties} data-people-ready={readyKey({ kind: "special", id, aspect: "mission" })}>
      <PageTop id={apostle.id} name={apostle.name} page="The mission" fallback={APOSTLES_GUIDE} />
      <ApostleHero apostle={apostle} writingsLabel="Writings" />
      <Sections sections={sections} />
    </div>
  </PeopleCitations>;
}

function ApostleHero({ apostle, writingsLabel }: { apostle: Apostle; writingsLabel: string }) {
  const carried = useCarried();
  const order = [...PEOPLE_PAGES.apostles].sort((a, b) => a.order - b.order);
  const at = order.findIndex((a) => a.id === apostle.id);
  const before = at > 0 ? order[at - 1] : undefined, after = at >= 0 && at < order.length - 1 ? order[at + 1] : undefined;
  const summary = apostleFor(apostle.id);
  const writing = (w: Apostle["writings"][number]) => w.letters ? <Link key={w.title} to={lettersHref(w.letters)}>{w.title}</Link> : w.book ? <Link key={w.title} to={`/read/kjv/${w.book}/1`}>{w.title}</Link> : <span key={w.title}>{w.title}</span>;
  return <section className="lg-glass lg-hero pp-hero" aria-labelledby="pp-hero-title">
    <div className="pp-hero-head">
      <p className="lg-kicker">{apostle.title}{summary?.called ? ` · called in ${summary.called}` : ""}</p>
      <AspectSwitch id={apostle.id} name={apostle.name} current="mission" />
    </div>
    <h2 id="pp-hero-title">{apostle.name}.<em>{apostle.tagline}</em></h2>
    <dl className="pp-stats">
      <div className="pp-stat"><dt>Also called</dt><dd><small className="pp-fact">{apostle.otherNames.length ? apostle.otherNames.join(" · ") : "No other name"}</small></dd></div>
      <div className="pp-stat"><dt>From</dt><dd><small className="pp-fact">{firstSentence(apostle.home?.text) ?? "Scripture does not say"}</small></dd></div>
      <div className="pp-stat"><dt>Trade</dt><dd><small className="pp-fact">{firstSentence(apostle.trade?.text) ?? "Scripture does not say"}</small></dd></div>
      <div className="pp-stat" data-wide=""><dt>Family</dt><dd><small className="pp-fact">{apostle.family.length ? firstSentence(apostle.family[0].text) : "Scripture does not say"}</small></dd></div>
      <div className="pp-stat"><dt>{writingsLabel}</dt><dd>{apostle.writings.length ? apostle.writings.map((w, i) => <span key={w.title}>{i > 0 && " · "}{writing(w)}</span>) : "None"}</dd></div>
    </dl>
    <nav className="pp-strip-nav" aria-label="Other apostles, in the guide's order">
      {before ? <SlideLink to={personPath(before.id, "mission")} state={carried} rel="prev"><ArrowLeft size={16} aria-hidden />{before.name}</SlideLink> : <span />}
      {after ? <SlideLink to={personPath(after.id, "mission")} state={carried} rel="next">{after.name}<ArrowRight size={16} aria-hidden /></SlideLink> : <span />}
    </nav>
  </section>;
}
