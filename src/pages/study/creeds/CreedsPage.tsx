import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { StableTip } from "@/components/StableTip";
import { loadCreedsIndex } from "@/lib/data";
import { documentTypeLabel, type CreedCard, type CreedFamily } from "@/lib/creeds";
import { useAsync } from "@/lib/useAsync";
import { CreedFamilyArt } from "./CreedsArt";
import "./creeds.css";

/**
 * Where a year sits on the rail, as a percentage across it.
 *
 * The documents are nowhere near evenly spread: five of them are written before AD 100 and
 * twenty-three in the sixteenth century alone. A plain scale would stack most of the collection into
 * one unreadable smudge, so the rail is stretched where the documents actually are. Each pair below is
 * a year and the place it is drawn at; years between two pairs are spaced evenly within them.
 */
const RAIL_SCALE: [year: number, percent: number][] = [
  [-1500, 0],
  [100, 8],
  [500, 15],
  [1000, 22],
  [1500, 32],
  [1550, 46],
  [1600, 60],
  [1650, 72],
  [1700, 80],
  [1800, 90],
  [1900, 100],
];

function railPosition(year: number): number {
  const first = RAIL_SCALE[0];
  const last = RAIL_SCALE[RAIL_SCALE.length - 1];
  if (year <= first[0]) return first[1];
  if (year >= last[0]) return last[1];
  for (let step = 1; step < RAIL_SCALE.length; step++) {
    const [toYear, toPercent] = RAIL_SCALE[step];
    if (year > toYear) continue;
    const [fromYear, fromPercent] = RAIL_SCALE[step - 1];
    return fromPercent + ((year - fromYear) / (toYear - fromYear)) * (toPercent - fromPercent);
  }
  return last[1];
}

const RAIL_RESTING = (
  <span className="text-muted">The oldest is Israel's own creed; the newest is the First Vatican Council.</span>
);

function RailLine({ card, family }: { card: CreedCard; family: CreedFamily }) {
  return (
    <>
      <strong>{card.title}</strong> · {card.yearLabel} · {family.title}
    </>
  );
}

function TimeRail({ families, onPick }: { families: CreedFamily[]; onPick: (family: string) => void }) {
  const [shown, setShown] = useState<{ card: CreedCard; family: CreedFamily } | null>(null);
  const points = useMemo(
    () =>
      families
        .flatMap((family) => family.documents.map((card) => ({ card, family })))
        .filter((point) => typeof point.card.year === "number")
        .sort((a, b) => (a.card.year ?? 0) - (b.card.year ?? 0)),
    [families],
  );
  // The scale changes pace at each of these, so they are the honest places to label it.
  const marks = [
    { year: -1500, label: "1500 BC", minor: false },
    { year: 100, label: "AD 100", minor: true },
    { year: 500, label: "500", minor: true },
    { year: 1000, label: "1000", minor: false },
    { year: 1500, label: "1500", minor: false },
    { year: 1600, label: "1600", minor: true },
    { year: 1700, label: "1700", minor: true },
    { year: 1900, label: "1900", minor: false },
  ];
  return (
    <section className="creed-rail-section" aria-labelledby="creed-rail-title">
      <div className="creed-section-head">
        <span className="eyebrow">01 / Across three and a half thousand years</span>
        <h2 id="creed-rail-title">
          Every document, <em>in its own moment.</em>
        </h2>
        <p>
          One mark for each of the {points.length} documents that carry a date. Point at a mark to see what it is; choose
          it to open its family below.
        </p>
      </div>
      <div className="creed-rail">
        <div className="creed-rail-track" role="group" aria-label="The documents in time">
          {points.map((point) => (
            <button
              key={point.card.id}
              type="button"
              className={`creed-rail-mark ${shown?.card.id === point.card.id ? "shown" : ""}`}
              style={{ left: `${railPosition(point.card.year ?? 0)}%`, "--tone": `var(--${point.family.tone})` } as CSSProperties}
              onPointerEnter={() => setShown(point)}
              onPointerLeave={() => setShown(null)}
              onFocus={() => setShown(point)}
              onBlur={() => setShown(null)}
              onClick={() => onPick(point.family.id)}
            >
              <span className="sr-only">
                {point.card.title}, {point.card.yearLabel} — open {point.family.title}
              </span>
            </button>
          ))}
        </div>
        <div className="creed-rail-marks" aria-hidden="true">
          {marks.map((mark) => (
            <span key={mark.label} className={mark.minor ? "minor" : undefined} style={{ left: `${railPosition(mark.year)}%` }}>
              {mark.label}
            </span>
          ))}
        </div>
        <StableTip
          className="creed-rail-tip"
          show={shown ? <RailLine card={shown.card} family={shown.family} /> : RAIL_RESTING}
          options={[RAIL_RESTING, ...points.map((point) => <RailLine key={point.card.id} card={point.card} family={point.family} />)]}
        />
      </div>
    </section>
  );
}

function DocumentCard({ card, tone }: { card: CreedCard; tone: string }) {
  return (
    <li className="creed-card" style={{ "--tone": `var(--${tone})` } as CSSProperties}>
      <Link to={`/study/creeds/${card.id}`}>
        <div className="creed-card-top">
          <span>{documentTypeLabel(card.documentType)}</span>
          <span className="creed-card-year">{card.yearLabel}</span>
        </div>
        <h3>{card.title}</h3>
        {card.tradition ? <p className="creed-card-tradition">{card.tradition}</p> : null}
        <dl className="creed-card-figures">
          <div>
            <dt>{card.documentType === "catechism" ? "Questions" : "Sections"}</dt>
            <dd>{card.sections.toLocaleString("en-US")}</dd>
          </div>
          <div>
            <dt>Proof-texts</dt>
            <dd>{card.references.toLocaleString("en-US")}</dd>
          </div>
          {card.quotations > 0 && (
            <div>
              <dt>Quoted in the Berean text</dt>
              <dd>{card.quotations.toLocaleString("en-US")}</dd>
            </div>
          )}
        </dl>
        <span className="creed-card-open">
          Read it <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

export default function CreedsPage() {
  const index = useAsync(loadCreedsIndex, "creeds-index");
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const collection = useRef<HTMLDivElement>(null);
  const doors = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    document.title = "Catechisms & Creeds · Study · Bible Project";
    return () => {
      document.title = "Bible Project";
    };
  }, []);

  if (index.status === "loading") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <p className="animate-pulse font-serif text-muted">Loading the creeds…</p>
      </div>
    );
  }
  if (index.status === "error") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <StudyBackLink />
        <h1 className="mt-4 font-serif text-3xl font-semibold">Catechisms &amp; Creeds</h1>
        <p className="mt-3 text-muted">This collection could not be loaded. Please try again.</p>
      </div>
    );
  }

  const { families, counts, scripture, sources } = index.value;
  const asked = params.get("family");
  const family = families.find((candidate) => candidate.id === asked) ?? families[0];

  const found = query.trim()
    ? families
        .flatMap((candidate) => candidate.documents.map((card) => ({ card, family: candidate })))
        .filter(
          (point) =>
            point.card.title.toLowerCase().includes(query.trim().toLowerCase()) ||
            (point.card.tradition ?? "").toLowerCase().includes(query.trim().toLowerCase()),
        )
    : [];

  const pick = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("family", id);
    setParams(next);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      collection.current?.animate(
        [
          { opacity: 0.35, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 240, easing: "ease-out" },
      );
    }
  };

  return (
    <div className="creeds-page">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16">
        <header className="creed-intro">
          <StudyBackLink />
          <p className="eyebrow">God &amp; Christian Faith · Catechisms &amp; Creeds</p>
          <h1>
            The faith, <em>said out loud.</em>
          </h1>
          <p className="creed-lead">
            For as long as there have been Christians, they have written down what they believe — in creeds short enough
            to say together, in confessions that settled an argument, and in catechisms that taught a child one question
            at a time. Here are {counts.documents} of them in full, from Israel's own creed to the First Vatican Council.
          </p>
          <dl className="creed-figures">
            <div>
              <dt>Documents</dt>
              <dd>{counts.documents}</dd>
            </div>
            <div>
              <dt>Catechisms</dt>
              <dd>{counts.catechisms}</dd>
            </div>
            <div>
              <dt>Questions &amp; sections</dt>
              <dd>{counts.sections.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt>Scripture proof-texts</dt>
              <dd>{counts.references.toLocaleString("en-US")}</dd>
            </div>
          </dl>
          <p className="creed-scripture-note">
            Scripture is shown in the <strong>{scripture.title}</strong>, a modern translation given to the public domain
            in 2023. Where one of these documents quotes a verse, that quotation is given in the Berean wording wherever
            it could be matched word for word — {counts.quotations.toLocaleString("en-US")} places in all. Where it could
            not, the document keeps its own older wording and the page says so, rather than guessing.
          </p>
        </header>

        <TimeRail families={families} onPick={pick} />

        <section className="creed-families-section" aria-labelledby="creed-families-title">
          <div className="creed-section-head">
            <span className="eyebrow">02 / Twelve shelves</span>
            <h2 id="creed-families-title">
              Choose a tradition. <em>Open its shelf.</em>
            </h2>
            <p>Each shelf opens in place, below. The documents inside are in the order they were written.</p>
          </div>

          <label className="creed-search">
            <span className="sr-only">Search every creed, confession and catechism</span>
            <input
              type="search"
              value={query}
              placeholder="Search by name or tradition"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {query.trim() ? (
            <div className="creed-found" aria-live="polite">
              <p>
                {found.length === 0
                  ? "Nothing of that name here."
                  : `${found.length} ${found.length === 1 ? "document" : "documents"}`}
              </p>
              <ul>
                {found.map((point) => (
                  <li key={point.card.id}>
                    <Link to={`/study/creeds/${point.card.id}`}>
                      <strong>{point.card.title}</strong>
                      <span>
                        {point.card.yearLabel} · {point.family.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="creed-doors" role="group" aria-label="Families of documents">
            {families.map((candidate, position) => (
              <button
                key={candidate.id}
                ref={(element) => {
                  doors.current[position] = element;
                }}
                type="button"
                className={`creed-door ${candidate.id === family.id ? "selected" : ""}`}
                style={{ "--tone": `var(--${candidate.tone})` } as CSSProperties}
                aria-expanded={candidate.id === family.id}
                aria-controls="creed-shelf"
                onClick={() => pick(candidate.id)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (position + 1) % families.length
                      : event.key === "ArrowLeft"
                        ? (position + families.length - 1) % families.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? families.length - 1
                            : null;
                  if (next !== null) {
                    event.preventDefault();
                    doors.current[next]?.focus();
                  }
                }}
              >
                <CreedFamilyArt kind={candidate.art} />
                <strong>{candidate.title}</strong>
                <small>
                  {candidate.documents.length} · {candidate.span}
                </small>
              </button>
            ))}
          </div>

          <div ref={collection} className="creed-shelf" id="creed-shelf" style={{ "--tone": `var(--${family.tone})` } as CSSProperties}>
            <div className="creed-shelf-head">
              <h3>{family.title}</h3>
              <p>{family.lead}</p>
            </div>
            <ul className="creed-cards">
              {family.documents.map((card) => (
                <DocumentCard key={card.id} card={card} tone={family.tone} />
              ))}
            </ul>
          </div>
        </section>

        <footer className="creed-credits">
          <h2>Where these texts come from</h2>
          <ul>
            {sources.map((source) => (
              <li key={source.slug}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
                <span>
                  {source.publisher ? `${source.publisher} · ` : ""}
                  {source.licence}
                </span>
              </li>
            ))}
            <li>
              <a href={scripture.home ?? "https://berean.bible/"} target="_blank" rel="noopener noreferrer">
                {scripture.title}
              </a>
              <span>{scripture.licence}</span>
            </li>
          </ul>
          <p>
            Every source, with its licence and checksum, is listed in the project's own source register. The documents
            themselves are historic texts, long out of copyright; the editions they were transcribed from are credited
            above and on each document's own page.
          </p>
        </footer>
      </div>
    </div>
  );
}
