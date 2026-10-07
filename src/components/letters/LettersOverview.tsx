/// <reference types="vite/client" /> // for import.meta.glob below
import { useEffect, useState, type CSSProperties } from "react";
import type { KeyWord, Letter, LetterGroup, LettersOverview as Overview, MapLayer, Network, Timeline } from "@/data/letters/types";
import { selectStudySection } from "@/components/study/study-view";
import { CanonLanes } from "./CanonLanes";
import { CompareLetters } from "./CompareLetters";
import { FlowChart } from "./FlowChart";
import { OpenQuestions, SourcesList, WordConstellation } from "./LetterBlocks";
import { LetterMap } from "./LetterMap";
import { CitationProvider, ClaimText, Refs, Section } from "./LetterParts";
import { LetterShape } from "./LetterShape";
import { PeopleCards } from "./PeopleCards";
import { ThemeCards } from "./ThemeCards";
import { TimelineStrip } from "./TimelineStrip";
import "./letters.css";

const FILES = import.meta.glob<{ default: LetterGroup | Overview }>("/src/data/letters/*.json");
const GROUP_IDS: LetterGroup["id"][] = ["paul-letters", "hebrews", "general-letters", "john-letters"];

/** The four group files and the overview file, loaded together. */
function useAll() {
  const [state, setState] = useState<{ groups: LetterGroup[]; overview?: Overview } | null>(null);
  useEffect(() => {
    let live = true;
    const load = (id: string) => FILES[`/src/data/letters/${id}.json`]?.().then((m) => m.default);
    void Promise.all([...GROUP_IDS.map(load), load("overview")]).then((files) => {
      if (!live) return;
      setState({ groups: files.slice(0, 4).filter(Boolean) as LetterGroup[], overview: files[4] as Overview | undefined });
    });
    return () => { live = false; };
  }, []);
  return state;
}

/** Each group's words summed by Strong's number, as one column per group for the constellation. */
function groupWords(group: LetterGroup): Letter {
  const sums = new Map<string, KeyWord>();
  for (const w of group.letters.flatMap((l) => l.words)) {
    const prev = sums.get(w.strongs);
    sums.set(w.strongs, prev ? { ...prev, count: prev.count + w.count } : { ...w, byChapter: undefined, note: undefined });
  }
  return { ...group.letters[0], code: group.id, name: group.title, words: [...sums.values()] };
}

/**
 * The opening of the Letters study: what all 21 letters share — when and where they went, how long they are, how an
 * ancient letter was built, the hands that wrote and carried them, the people and themes that cross the groups, their
 * words and their Old Testament, how they were gathered, and how the church received them.
 */
export function LettersOverview() {
  const all = useAll();
  if (!all) return <div className="lg-glass" style={{ minHeight: 420 }} aria-busy="true" />;
  const { groups, overview } = all;
  const letters = groups.flatMap((g) => g.letters);
  const groupOf = (code: string) => groups.find((g) => g.letters.some((l) => l.code === code));
  const open = (code: string) => { const g = groupOf(code); if (g) selectStudySection("letters", g.id); };
  const verses = letters.reduce((s, l) => s + l.verses, 0);

  const timeline: Timeline = {
    id: "all-letters", title: "When the letters were written", axis: "years",
    events: letters.filter((l) => l.date.from && l.date.to).map((l) => ({ label: l.name, from: l.date.from!, to: l.date.to!, letter: l.code })),
    claim: { text: "Each bar spans the widest range of dates the sources on that letter's page propose. No letter states its own date; open a letter's page for the views and who held them." },
  };
  const destinations: MapLayer[] = groups.flatMap((g) => g.maps.filter((m) => !m.route && /destination|provinces|ephesus/.test(m.id)).slice(0, 1)
    .map((m) => ({ ...m, title: g.title, claim: { text: "" } })));
  const flow = {
    id: "all-ot", title: "The Old Testament behind the letters",
    links: groups.flatMap((g) => g.flows.filter((f) => f.id === "ot-sources").flatMap((f) => f.links.map((l) => ({ ...l, target: g.title })))),
    claim: { text: "Every Old Testament passage the letters quote, traced from the book it comes from to the letters that quote it. The Psalms, Isaiah and the books of Moses carry most of the weight. John's letters quote no Old Testament passage; their one band is 1 John's allusion to Cain (Genesis 4:8). Each group's page explains how its quotations were counted." },
  };
  const merged = new Map<string, (typeof flow.links)[number]>();
  for (const l of flow.links) { const k = `${l.source}→${l.target}`; const p = merged.get(k); merged.set(k, p ? { ...p, value: p.value + l.value, refs: [...(p.refs ?? []), ...(l.refs ?? [])] } : l); }
  flow.links = [...merged.values()];
  const crossing: Network | undefined = overview?.sharedPeople.length ? {
    id: "shared-people", title: "People who cross the groups",
    nodes: [...overview.sharedPeople.map((p, i) => ({ id: `p${i}`, label: p.name, note: p.claim.text, refs: p.claim.refs, personId: p.personId })),
      ...letters.map((l) => ({ id: l.code, label: l.name, group: "letter" }))],
    edges: overview.sharedPeople.flatMap((p, i) => p.letters.map((code) => ({ from: `p${i}`, to: code }))),
    claim: { text: "" },
  } : undefined;

  return <CitationProvider citations={overview?.citations ?? []}>
    <div className="lg-page" style={{ "--lg": "var(--epistles)" } as CSSProperties}>
      <section className="lg-glass lg-hero" aria-labelledby="lg-overview-title">
        <p className="lg-kicker">Twenty-one letters</p>
        <h2 id="lg-overview-title">{overview?.title ?? "The letters of the New Testament"}</h2>
        {overview && <p className="lg-tagline">{overview.tagline}</p>}
        <div className="lg-stats">
          <div className="lg-stat"><b>{letters.length}</b><span>letters</span></div>
          <div className="lg-stat"><b>{verses.toLocaleString("en-US")}</b><span>verses</span></div>
          <div className="lg-stat"><b>{groups.length}</b><span>groups</span></div>
          <div className="lg-stat"><b>{Math.min(...letters.map((l) => l.date.from ?? Infinity))}–{Math.max(...letters.map((l) => l.date.to ?? -Infinity))}</b><span>AD · widest range proposed</span></div>
        </div>
        <div className="lg-chips">{groups.map((g) => <button key={g.id} type="button" className="lg-chip" style={{ "--lg": `var(--${g.color})` } as CSSProperties} onClick={() => selectStudySection("letters", g.id)}>{g.title} →</button>)}</div>
        {overview && <div className="lg-intro">{overview.intro.map((c, i) => <ClaimText key={i} claim={c} />)}</div>}
      </section>

      <Section kicker="Time" title={timeline.title}><TimelineStrip timeline={timeline} /></Section>
      {destinations.length > 0 && <Section kicker="Map" title="Where the letters went" lead="Toggle a group to see the places its letters were sent."><LetterMap layers={destinations} title="Where the letters went" /></Section>}
      <Section kicker="Shape" title="All twenty-one, side by side" lead="Each bar is as long as its letter. Choose a name to open its group's page.">
        <LetterShape letters={letters} selected="" onSelect={open} outline={false} />
      </Section>

      {overview && overview.letterForm.length > 0 && <Section kicker="Form" title="How an ancient letter was built" lead="The New Testament letters follow the shape of letters of their day. Each part, with examples.">
        <ol className="lg-form">{overview.letterForm.map((part, i) => <li key={part.part}><span className="lg-form-step">{i + 1}</span><strong>{part.part}</strong><ClaimText claim={part.claim} /><Refs refs={part.examples} limit={6} /></li>)}</ol>
      </Section>}
      {overview && overview.hands.length > 0 && <Section kicker="Hands" title="Who wrote them down and who carried them" lead="Secretaries, couriers, co-senders, and the places the writer took the pen himself.">
        <div className="lg-hands">{(["secretary", "carrier", "co-sender", "own-hand"] as const).map((role) => {
          const list = overview.hands.filter((h) => h.role === role);
          return list.length > 0 && <div key={role}><p className="lg-subhead">{({ secretary: "Secretaries", carrier: "Carriers", "co-sender": "Co-senders", "own-hand": "In the writer's own hand" } as const)[role]}</p>
            <ul className="lg-list">{list.map((h, i) => <li key={i}><strong>{h.name}</strong> <span className="lg-muted">· {groupOf(h.letter)?.letters.find((l) => l.code === h.letter)?.name ?? h.letter}{h.note ? ` — ${h.note}` : ""}</span><Refs refs={h.refs} limit={3} /></li>)}</ul></div>;
        })}</div>
      </Section>}
      {overview && overview.letterLinks.length > 0 && <Section kicker="Letters about letters" title="Where one letter mentions another">
        <ul className="lg-links">{overview.letterLinks.map((l, i) => <li key={i}><span className="lg-link-ends"><b>{l.from}</b> → <b>{l.to}</b></span><span className="lg-muted">{l.label}</span><ClaimText claim={l.claim} /></li>)}</ul>
      </Section>}
      {crossing && <Section kicker="People" title="People who cross the groups" lead="Choose a person to see who they were and where else Scripture names them."><PeopleCards network={crossing} /></Section>}
      {overview && overview.themes.length > 0 && <Section kicker="Themes" title="What the groups share" lead="Ten threads that run through more than one group of letters. Open one to follow it.">
        <ThemeCards themes={overview.themes} letterName={(c) => letters.find((l) => l.code === c)?.name ?? c} openLetter={open} />
      </Section>}
      <Section kicker="Words" title="The words each group leans on" lead="Each group's key Greek words added together; a bigger star means more uses. Choose a star to see every verse behind it.">
        <WordConstellation letters={groups.map(groupWords)} columns={Object.fromEntries(groups.map((g) => [g.id, g.letters.map((l) => l.code)]))} />
      </Section>
      {flow.links.length > 0 && <Section kicker="Old Testament" title={flow.title} lead="The letters were written by readers of Israel's Scriptures. Point at a book to see where the letters quote it; click it to keep the passages open."><FlowChart flow={flow} /></Section>}
      <Section kicker="Side by side" title="Compare any two letters" lead="Choose any two of the 21 letters. Each ribbon joins a verse in one to a verse in the other, wherever readers have linked them.">
        <CompareLetters initial={["GAL", "JAS"]} curated={groups.flatMap((g) => g.parallels)} />
      </Section>
      {overview && overview.collection.length > 0 && <Section kicker="Collection" title="How the letters were gathered and ordered"><div className="lg-intro" style={{ marginTop: 0 }}>{overview.collection.map((c, i) => <ClaimText key={i} claim={c} />)}</div></Section>}
      {overview && overview.questions.length > 0 && <Section kicker="Open questions" title="Where readers have differed" lead="Each answer is shown with the people who held it. This page does not choose between them."><OpenQuestions questions={overview.questions} /></Section>}
      {overview && overview.canon.length > 0 && <Section kicker="Acceptance" title="Acceptance of the letters over time" lead="Witness by witness, from the first quotations to the church councils: when each letter was used, doubted and accepted."><CanonLanes events={overview.canon} letters={letters} /></Section>}
      {overview && <Section kicker="Sources" title="Where this page comes from" lead="Public-domain works and the biblical text itself. Each group's page lists its own sources."><SourcesList citations={overview.citations} /></Section>}
    </div>
  </CitationProvider>;
}
