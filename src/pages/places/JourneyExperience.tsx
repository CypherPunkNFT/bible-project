import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StreetAtlasMap } from "@/components/atlas/StreetAtlasMap";
import { projectPlace, type MapPlace } from "@/components/atlas/projection";
import type { Citation, LetterGroup, Span } from "@/data/letters/types";
import { useCatalog } from "@/lib/catalog";
import { loadPlaces } from "@/lib/data";
import { formatRange, sectionOfNum, splitId } from "@/lib/refs";
import { studyRefLink } from "@/lib/study";
import type { SectionId } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { buildPaulJourney, type JourneyChapter, type JourneyStop, type StopLayer } from "./paul-journey";
import "./journey.css";

// The Letters study's data is large, so it loads only when Paul's journey is opened.
const loadPaul = () => import("@/data/letters/paul-letters.json").then((module) => buildPaulJourney(module.default as unknown as LetterGroup));

const LAYER: Record<StopLayer, string> = { scripture: "Named in Scripture", proposed: "Proposed by scholars", tradition: "Later tradition" };
const years = (chapter: JourneyChapter) => chapter.years ? `AD ${chapter.years[0]}${chapter.years[1] !== chapter.years[0] ? `–${chapter.years[1]}` : ""}` : "";

/** Paul's journey on the atlas: chapters, the route on the map, and each stop with its passages (Story or Letters lens). */
export function JourneyExperience({ lens }: { lens: "story" | "letters" }) {
  const journey = useAsync(loadPaul, "paul-journey");
  const raw = useAsync(loadPlaces, "places");
  const catalog = useCatalog();
  const [search, setSearch] = useSearchParams();
  const chapters = journey.status === "ready" ? (lens === "letters" ? journey.value.letters : journey.value.story) : [];
  const chapter = chapters.find((c) => c.id === search.get("chapter")) ?? chapters[0];
  const stopNumber = Number(search.get("stop") ?? 0);
  const stop = chapter && stopNumber >= 1 && stopNumber <= chapter.stops.length ? chapter.stops[stopNumber - 1] : null;

  const placesById = useMemo(() => {
    if (raw.status !== "ready") return new Map<string, MapPlace>();
    return new Map(raw.value.map((place) => {
      const [x, y] = projectPlace(place);
      const counts = new Map<SectionId, number>();
      place.verses.forEach((id) => { const section = sectionOfNum(catalog, splitId(id).num); counts.set(section, (counts.get(section) ?? 0) + 1); });
      return [place.id, { ...place, x, y, section: [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "history" }];
    }));
  }, [raw, catalog]);
  const shown = useMemo(() => [...new Map((chapter?.stops ?? []).flatMap((s) => placesById.get(s.placeId) ?? []).map((p) => [p.id, p])).values()], [chapter, placesById]);
  const route = useMemo(() => {
    if (!chapter?.route) return [];
    const points = chapter.stops.flatMap((s) => { const p = placesById.get(s.placeId); return p ? [[p.lon, p.lat] as [number, number]] : []; });
    return points.filter((point, i) => i === 0 || point[0] !== points[i - 1][0] || point[1] !== points[i - 1][1]);
  }, [chapter, placesById]);

  const go = (chapterId: string, number: number) => {
    const next = new URLSearchParams(search);
    next.set("chapter", chapterId);
    if (number) next.set("stop", String(number)); else next.delete("stop");
    setSearch(next, { replace: true });
  };
  if (journey.status === "error" || raw.status === "error") return <p className="journey-status" role="alert">The journey could not load. Refresh to try again.</p>;
  if (journey.status === "loading" || raw.status === "loading" || !chapter) return <p className="journey-status" role="status">Loading Paul's journey…</p>;
  const citations = journey.value.citations;
  const index = chapters.indexOf(chapter);
  const nextChapter = chapters[index + 1];
  const forward = () => (stopNumber < chapter.stops.length ? go(chapter.id, stopNumber + 1) : nextChapter && go(nextChapter.id, 0));
  const back = () => (stopNumber > 0 ? go(chapter.id, stopNumber - 1) : index > 0 && go(chapters[index - 1].id, chapters[index - 1].stops.length));

  return <section className="journey" aria-label={lens === "letters" ? "Paul's letters on the map" : "Paul's journey"}>
    <div className="journey-chapters" role="group" aria-label="Chapters">
      {chapters.map((c, i) => <button key={c.id} type="button" aria-pressed={c.id === chapter.id} onClick={() => go(c.id, 0)}>
        <span>{String(i + 1).padStart(2, "0")}</span><strong>{c.title}</strong>{c.years && <small>{years(c)}</small>}
      </button>)}
    </div>
    <div className="journey-stage">
      <div className="journey-map">
        <StreetAtlasMap places={shown} selected={stop ? placesById.get(stop.placeId) ?? null : null} route={route} cluster={false} flyZoom={7} frameFirst frameMaxZoom={6} onSelect={(place) => go(chapter.id, chapter.stops.findIndex((s) => s.placeId === place.id) + 1)} />
      </div>
      <aside className="journey-panel" aria-live="polite">
        {stop ? <StopView stop={stop} number={stopNumber} total={chapter.stops.length} chapter={chapter} citations={citations} />
          : <ChapterView chapter={chapter} datingCites={journey.value.datingCites} citations={citations} onStop={(n) => go(chapter.id, n)} />}
        <div className="journey-steps">
          <button type="button" onClick={back} disabled={index === 0 && stopNumber === 0}><ArrowLeft size={15} aria-hidden /> Back</button>
          {stop && <button type="button" className="journey-overview" onClick={() => go(chapter.id, 0)}>All stops</button>}
          <button type="button" onClick={forward} disabled={!nextChapter && stopNumber === chapter.stops.length}>
            {stopNumber === 0 ? "Begin" : stopNumber < chapter.stops.length ? "Next stop" : nextChapter ? `Next: ${nextChapter.title}` : "Next"} <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </aside>
    </div>
    <ul className="journey-key" aria-label="How to read the journey">
      <li><i className="journey-key-scripture" />Places and passages: {lens === "letters" ? "named in the letters" : "named in Acts and Paul's letters"}</li>
      {chapter.route && <li><i className="journey-key-route" />Dashed line: the way between stops is reconstructed. Scripture names the places, not the roads</li>}
      <li><i className="journey-key-proposed" />Proposed by scholars: the text does not say</li>
      <li><i className="journey-key-tradition" />Later tradition: told by writers after the New Testament</li>
      {lens === "story" && <li>Years are scholars' dating; the Bible gives none</li>}
    </ul>
  </section>;
}

function ChapterView({ chapter, datingCites, citations, onStop }: { chapter: JourneyChapter; datingCites: string[]; citations: Citation[]; onStop: (n: number) => void }) {
  const dating = [...new Set([...chapter.cites, ...datingCites])];
  return <div className="journey-chapter">
    <p className="places-kicker">{years(chapter) || "Paul's letters"}</p>
    <h3>{chapter.title}</h3>
    <p>{chapter.summary}</p>
    {chapter.years && <p className="journey-dating">Dating: <Sources ids={dating} citations={citations} />. None of these years is stated in the Bible.</p>}
    <ol className="journey-stops">{chapter.stops.map((s, i) => <li key={`${s.placeId}-${i}`}>
      <button type="button" onClick={() => onStop(i + 1)}><span>{i + 1}</span>{s.name}{s.layer !== "scripture" && <em className={`journey-layer journey-layer-${s.layer}`}>{LAYER[s.layer]}</em>}</button>
    </li>)}</ol>
  </div>;
}

function StopView({ stop, number, total, chapter, citations }: { stop: JourneyStop; number: number; total: number; chapter: JourneyChapter; citations: Citation[] }) {
  return <div className="journey-stop">
    <p className="places-kicker">{chapter.title} · stop {number} of {total}</p>
    <h3>{stop.name}</h3>
    <span className={`journey-layer journey-layer-${stop.layer}`}>{LAYER[stop.layer]}</span>
    {stop.note && stop.note !== stop.name && <p>{stop.note}</p>}
    {stop.refs.length > 0 && <p className="journey-refs"><BookOpen size={15} aria-hidden /><Passages refs={stop.refs} /></p>}
    {stop.layer === "tradition" && stop.refs.length > 0 && <p className="journey-dating">The passage is Scripture; this event and its place are told by later writers, not by the passage.</p>}
    {stop.cites.length > 0 && <p className="journey-dating">{stop.layer === "tradition" ? "Told by" : "Sources"}: <Sources ids={stop.cites} citations={citations} /></p>}
  </div>;
}

function Passages({ refs }: { refs: Span[] }) {
  const catalog = useCatalog();
  return <span>{refs.map((span) => <Link key={span.join("-")} to={studyRefLink(catalog, span)}>{formatRange(catalog, span[0], span[1])}</Link>)}</span>;
}

function Sources({ ids, citations }: { ids: string[]; citations: Citation[] }) {
  const found = ids.flatMap((id) => citations.find((c) => c.id === id) ?? []);
  return <>{found.map((c, i) => <span key={c.id}>{i > 0 && "; "}<a href={c.url} target="_blank" rel="noreferrer">{c.author.replace(/\s*\(.*\)$/, "")}, <cite>{c.title.replace(/\s*\(.*\)$/, "")}</cite> ({c.year})</a></span>)}</>;
}
