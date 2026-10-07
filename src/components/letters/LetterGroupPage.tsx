/// <reference types="vite/client" /> // for import.meta.glob below
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import { studyRefLink } from "@/lib/study";
import type { LetterGroup } from "@/data/letters/types";
import { CanonLanes } from "./CanonLanes";
import { FlowChart } from "./FlowChart";
import { CompareLetters } from "./CompareLetters";
import { BetterLadder, OpenQuestions, SourcesList, WordBars, WordConstellation } from "./LetterBlocks";
import { LetterMap } from "./LetterMap";
import { CitationProvider, ClaimText, Refs, Section } from "./LetterParts";
import { LetterShape } from "./LetterShape";
import { ParallelRibbon } from "./ParallelRibbon";
import { PeopleCards } from "./PeopleCards";
import { TimelineStrip } from "./TimelineStrip";
import "./letters.css";

// One JSON file per group, generated from the research dossiers (src/data/letters/README in types.ts).
const FILES = import.meta.glob<{ default: LetterGroup }>("/src/data/letters/*.json");

/** The order of each page's signature visuals, by the ids in its data file; anything not listed follows after. */
const SIGNATURE: Record<LetterGroup["id"], string[]> = {
  "paul-letters": ["map:journeys", "timeline:pauls-life", "network:romans-16", "parallel:ephesians-colossians", "timeline:onesimus", "network:prison-letters", "network:companions"],
  hebrews: ["flow:ot-sources", "ladder:better", "timeline:hall-of-faith", "parallel:day-of-atonement", "parallel:melchizedek", "map:all"],
  "general-letters": ["parallel:jude-second-peter", "parallel:james-sermon", "map:all", "parallel:james-first-peter", "network:jesus-family"],
  "john-letters": ["words:constellation", "parallel:gospel-bridge", "parallel:second-first", "network:third-john", "timeline:three-witnesses", "map:all"],
};

/** The pair each page's comparison opens with. */
const COMPARE_START: Record<LetterGroup["id"], [string, string]> = {
  "paul-letters": ["ROM", "GAL"], hebrews: ["HEB", "ROM"], "general-letters": ["JUD", "2PE"], "john-letters": ["1JN", "2JN"],
};

function useGroup(id: LetterGroup["id"]) {
  const [state, setState] = useState<{ id: string; group?: LetterGroup; missing?: boolean }>({ id });
  useEffect(() => {
    const load = FILES[`/src/data/letters/${id}.json`];
    if (!load) { setState({ id, missing: true }); return; }
    let live = true;
    void load().then((module) => { if (live) setState({ id, group: module.default }); });
    return () => { live = false; };
  }, [id]);
  return state.id === id ? state : { id };
}

export function LetterGroupPage({ groupId }: { groupId: LetterGroup["id"] }) {
  const { group, missing } = useGroup(groupId);
  const [code, setCode] = useState<string>("");
  if (missing) return <p className="lg-glass lg-muted">This page's content is still being prepared.</p>;
  if (!group) return <div className="lg-glass" style={{ minHeight: 420 }} aria-busy="true" />;
  const letter = group.letters.find((l) => l.code === code) ?? group.letters[0];
  return <CitationProvider citations={group.citations}>
    <div className="lg-page" style={{ "--lg": `var(--${group.color})` } as CSSProperties}>
      <Hero group={group} selected={letter.code} onSelect={setCode} />
      <LetterCard group={group} code={letter.code} />
      <Signature group={group} />
      <Section kicker="Side by side" title="Compare any two letters" lead="Choose any two of the 21 letters. Each ribbon joins a verse in one to a verse in the other, wherever readers have linked them.">
        <CompareLetters initial={COMPARE_START[group.id]} curated={group.parallels} />
      </Section>
      <Section kicker="Shape" title={group.letters.length > 1 ? "How each letter is built" : "How the letter is built"} lead="Every bar is as long as its letter, cut at the section headings. The chosen letter's outline sits beneath.">
        <LetterShape letters={group.letters} selected={letter.code} onSelect={setCode} />
      </Section>
      <Section kicker="Words" title={`The words ${group.letters.length > 1 ? "these letters lean on" : "it leans on"}`} lead="Greek key words, counted in the text behind the KJV. The strip under a bar shows which chapters the word lives in.">
        {group.letters.length > 1 && <WordConstellation letters={group.letters} />}
        <p className="lg-subhead" style={{ marginTop: group.letters.length > 1 ? "1.5rem" : 0 }}>{letter.name}</p>
        <WordBars words={letter.words} />
      </Section>
      <PeopleAndPlaces group={group} code={letter.code} />
      <OldTestament group={group} code={letter.code} />
      {group.questions.length > 0 && <Section kicker="Open questions" title="Where readers have differed" lead="Each answer is shown with the people who held it. This page does not choose between them.">
        <OpenQuestions questions={group.questions} />
      </Section>}
      {group.canon.length > 0 && <Section kicker="Acceptance" title={group.letters.length > 1 ? "Acceptance of these letters over time" : "Acceptance of the letter over time"} lead="How the early church quoted, doubted and finally accepted each letter, witness by witness."><CanonLanes events={group.canon} letters={group.letters} /></Section>}
      <Section kicker="Sources" title="Where this page comes from" lead="Public-domain works and the biblical text itself. Numbers in the text point here.">
        <SourcesList citations={group.citations} />
      </Section>
    </div>
  </CitationProvider>;
}

function Hero({ group, selected, onSelect }: { group: LetterGroup; selected: string; onSelect: (code: string) => void }) {
  const verses = group.letters.reduce((s, l) => s + l.verses, 0);
  const greek = group.letters.reduce((s, l) => s + (l.greekWords ?? 0), 0);
  const from = Math.min(...group.letters.map((l) => l.date.from ?? Infinity)), to = Math.max(...group.letters.map((l) => l.date.to ?? -Infinity));
  const chip = (c: string) => { const l = group.letters.find((x) => x.code === c); return l && <button key={c} type="button" className="lg-chip" aria-pressed={c === selected} onClick={() => onSelect(c)}>{l.name}</button>; };
  return <section className="lg-glass lg-hero" aria-labelledby="lg-hero-title">
    <p className="lg-kicker">New Testament letters</p>
    <h2 id="lg-hero-title">{group.title}</h2>
    <p className="lg-tagline">{group.tagline}</p>
    <div className="lg-stats">
      <div className="lg-stat"><b>{group.letters.length}</b><span>{group.letters.length === 1 ? "letter" : "letters"}</span></div>
      <div className="lg-stat"><b>{verses.toLocaleString("en-US")}</b><span>verses</span></div>
      {greek > 0 && <div className="lg-stat"><b>{greek.toLocaleString("en-US")}</b><span>Greek words</span></div>}
      {Number.isFinite(from) && Number.isFinite(to) && <div className="lg-stat"><b>{from}–{to}</b><span>AD · the widest range proposed</span></div>}
    </div>
    {group.groupings?.length ? <div style={{ marginTop: "1.25rem", display: "grid", gap: ".6rem" }}>{group.groupings.map((g) => <div key={g.label}>
      <p className="lg-subhead" style={{ marginBottom: ".35rem" }}>{g.label}<span title={g.claim.text}> ⓘ</span></p><div className="lg-chips" style={{ marginTop: 0 }}>{g.letters.map(chip)}</div>
    </div>)}</div> : <div className="lg-chips">{group.letters.map((l) => chip(l.code))}</div>}
    <div className="lg-intro">{group.intro.map((c, i) => <ClaimText key={i} claim={c} />)}</div>
  </section>;
}

function LetterCard({ group, code }: { group: LetterGroup; code: string }) {
  const catalog = useCatalog();
  const letter = group.letters.find((l) => l.code === code)!;
  const fact = (label: string, body: ReactNode) => <div className="lg-fact"><dt>{label}</dt><dd>{body}</dd></div>;
  return <Section kicker={`${letter.name} · ${letter.verses} verses`} title={`${letter.name} at a glance`}>
    <dl className="lg-facts">
      {fact("Written by", <ClaimText claim={letter.author} as="span" />)}
      {fact("To", <ClaimText claim={letter.recipients} as="span" />)}
      {fact("Written from", <ClaimText claim={letter.writtenFrom} as="span" />)}
      {fact("When", <ClaimText claim={letter.date} as="span" />)}
    </dl>
    <div className="lg-fact" style={{ marginTop: "1rem", borderRadius: 14, border: "1px solid var(--lg-line)" }}><dt>Why it was written</dt><dd><ClaimText claim={letter.occasion} as="span" /></dd></div>
    <div className="lg-two">
      <div><p className="lg-subhead">Key verses</p><ul className="lg-list">{letter.keyVerses.map((k) => <li key={k.span.join("-")}>
        <Link to={studyRefLink(catalog, k.span)} style={{ color: "var(--lg)", fontWeight: 600 }}>{formatRange(catalog, k.span[0], k.span[1])}</Link> <span className="lg-muted">— {k.why}</span></li>)}</ul></div>
      <div><p className="lg-subhead">Themes</p><ul className="lg-list">{letter.themes.map((t, i) => <li key={i}><ClaimText claim={t} as="span" /></li>)}</ul></div>
    </div>
  </Section>;
}

/** The page's own visuals, in the order chosen for its group; unlisted items in the data follow. */
function Signature({ group }: { group: LetterGroup }) {
  const order = SIGNATURE[group.id] ?? [];
  const blocks: { key: string; node: ReactNode }[] = [];
  const used = new Set<string>();
  const take = (key: string) => { used.add(key); };
  for (const key of order) {
    const [kind, id] = key.split(":");
    if (kind === "map" && group.maps.length) { group.maps.forEach((m) => take(`map:${m.id}`)); blocks.push({ key, node: <Section kicker="Map" title={id === "journeys" ? "Paul's journeys and the letters' destinations" : group.maps.length === 1 ? group.maps[0].title : "Where these letters went"}><LetterMap layers={group.maps} title={`${group.title}: map`} /></Section> }); }
    if (kind === "words" && group.letters.length > 1) continue; // the constellation sits in the Words section
    const item = findItem(group, kind, id);
    if (item) { take(key); blocks.push({ key, node: renderItem(kind, item) }); }
  }
  for (const [kind, list] of [["parallel", group.parallels], ["timeline", group.timelines], ["network", group.networks], ["ladder", group.ladders]] as const)
    for (const item of list) if (!used.has(`${kind}:${item.id}`)) blocks.push({ key: `${kind}:${item.id}`, node: renderItem(kind, item) });
  return <>{blocks.map((b) => <div key={b.key}>{b.node}</div>)}</>;
}

function findItem(group: LetterGroup, kind: string, id: string) {
  const list = { parallel: group.parallels, timeline: group.timelines, network: group.networks, flow: group.flows, ladder: group.ladders }[kind] as { id: string }[] | undefined;
  return list?.find((item) => item.id === id);
}

function renderItem(kind: string, item: unknown): ReactNode {
  switch (kind) {
    case "parallel": { const p = item as LetterGroup["parallels"][number]; return <Section kicker="Side by side" title={p.title}><ParallelRibbon parallel={p} /></Section>; }
    case "timeline": { const t = item as LetterGroup["timelines"][number]; return <Section kicker="Timeline" title={t.title}><TimelineStrip timeline={t} /></Section>; }
    case "network": { const n = item as LetterGroup["networks"][number]; return <Section kicker="People" title={n.title} lead="Choose a person to see who they were and where else Scripture names them."><PeopleCards network={n} /></Section>; }
    case "flow": { const f = item as LetterGroup["flows"][number]; return <Section kicker="Old Testament" title={f.title}><FlowChart flow={f} /></Section>; }
    case "ladder": { const l = item as LetterGroup["ladders"][number]; return <Section kicker="The argument" title={l.title}><BetterLadder ladder={l} /></Section>; }
    default: return null;
  }
}

function PeopleAndPlaces({ group, code }: { group: LetterGroup; code: string }) {
  const letter = group.letters.find((l) => l.code === code)!;
  const pins = letter.places.filter((p) => p.placeId);
  if (!letter.people.length && !letter.places.length) return null;
  return <Section kicker="People and places" title={`Who and where in ${letter.name}`}>
    <div className="lg-two">
      <div><p className="lg-subhead">People named ({letter.people.length})</p><ul className="lg-list">{letter.people.map((p) => <li key={p.name}><strong>{p.name}</strong>{p.note && <span className="lg-muted"> — {p.note}</span>}<Refs refs={p.refs} limit={3} /></li>)}</ul></div>
      <div><p className="lg-subhead">Places named ({letter.places.length})</p>
        {pins.length > 0 && <LetterMap title={`Places in ${letter.name}`} displayWidth={560} layers={[{ id: `places-${letter.code}`, title: letter.name, stops: pins.map((p) => ({ name: p.implied ? `${p.name} (implied)` : p.name, placeId: p.placeId!, refs: p.refs })), claim: { text: "" } }]} />}
        <ul className="lg-list" style={{ marginTop: ".75rem" }}>{letter.places.map((p) => <li key={p.name}><strong>{p.name}</strong>{p.implied && <span className="lg-muted"> (implied, not named)</span>}{p.note && <span className="lg-muted"> — {p.note}</span>}<Refs refs={p.refs} limit={3} /></li>)}</ul>
      </div>
    </div>
  </Section>;
}

function OldTestament({ group, code }: { group: LetterGroup; code: string }) {
  const catalog = useCatalog();
  const letter = group.letters.find((l) => l.code === code)!;
  const flow = group.id === "hebrews" ? undefined : group.flows.find((f) => f.id === "ot-sources");
  if (!letter.otQuotes.length && !flow) return null;
  return <Section kicker="Old Testament" title={`The Old Testament behind ${letter.name}`} lead={`${letter.otQuotes.length} Old Testament quotations in ${letter.name}, each linked to the passage it comes from.`}>
    {flow && <FlowChart flow={flow} />}
    {letter.otQuotes.length > 0 && <ul className="lg-list" style={{ marginTop: flow ? "1.25rem" : 0, columns: "2 22rem", columnGap: "2rem", display: "block" }}>
      {letter.otQuotes.map((q) => <li key={`${q.at[0]}-${q.from[0]}`} style={{ breakInside: "avoid", marginBottom: ".5rem" }}>
        <Link to={studyRefLink(catalog, q.at)} style={{ color: "var(--lg)" }}>{formatRange(catalog, q.at[0], q.at[1])}</Link> <span className="lg-muted">quotes</span>{" "}
        <Link to={studyRefLink(catalog, q.from)}>{formatRange(catalog, q.from[0], q.from[1])}</Link>{q.note && <span className="lg-muted"> — {q.note}</span>}
      </li>)}
    </ul>}
  </Section>;
}
