// One game on screen (design §9, screens 2-4): each place in turn on the map, the answer revealed with its verse, then
// the summary. The map stays mounted from place to place; if it cannot load, an error panel offers a retry.
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import { formatList, formatNumber, plural } from "@/lib/site-format";
import { useCurrentBible } from "@/lib/verses";
import { scorePin, type Game, type Question, type Result } from "./game";
import type { LonLat } from "./geo";
import { Countdown, ShareButton, Squares } from "./parts";
import { ERA_VIEWS, ROUND_LENGTH } from "./pools";
import { QuestMap } from "./QuestMap";
import { BAND_EMOJI, KM_PER_MILE, MAX_POINTS, bandFor } from "./scoring";
import { currentStreak, type Stats } from "./storage";
import { LEVEL_TEXT } from "./text";

interface Props {
  game: Game;
  /** Daily Five pins already confirmed (a resumed game starts after them). */
  resume: Result[];
  stats: Stats;
  now: Date;
  onConfirm: (result: Result) => void;
  onFinish: () => void;
  onAgain: () => void;
  onHome: () => void;
}

const distanceText = (km: number) => `${formatNumber(Math.round(km))} km (${formatNumber(Math.round(km / KM_PER_MILE))} mi)`;
const pointsText = (points: number) => plural(points, "{n} point", "{n} points");

export function Play({ game, resume, stats, now, onConfirm, onFinish, onAgain, onHome }: Props) {
  const [results, setResults] = useState<Result[]>(resume);
  const [index, setIndex] = useState(Math.min(resume.length, game.questions.length));
  const [pin, setPin] = useState<LonLat | null>(null);
  const [revealed, setRevealed] = useState<Result | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const total = results.reduce((sum, result) => sum + result.points, 0);

  if (index >= game.questions.length) return <Summary game={game} results={results} stats={stats} now={now} onAgain={onAgain} onHome={onHome} />;
  const question = game.questions[index];

  const confirm = () => {
    if (!pin || revealed) return;
    const result = scorePin(question, pin);
    setResults((done) => [...done, result]);
    setRevealed(result);
    setAnnouncement(`Your pin was ${distanceText(result.km)} from ${question.name}. ${pointsText(result.points)}.`);
    onConfirm(result);
  };
  const next = () => {
    setPin(null);
    setRevealed(null);
    setIndex(index + 1);
    if (index + 1 >= game.questions.length) onFinish();
  };

  return <div className="mq-play">
    <div className="mq-bar">
      <span>{`Place ${index + 1} of ${game.questions.length}`}</span>
      <h2 className="mq-name">{question.name}</h2>
      <span>{`Total ${formatNumber(total)}`}</span>
    </div>
    {game.widenedTo && index === 0 && <p className="mq-notice">{`That era has few places at ${LEVEL_TEXT[game.level].label} level, so this game also draws on ${LEVEL_TEXT[game.widenedTo].label} places.`}</p>}
    {mapFailed
      ? <div className="mq-error" role="alert">
          <p>The map couldn't load. Check the connection and try again.</p>
          <button type="button" className="mq-button mq-primary" onClick={() => { setMapFailed(false); setMapKey((k) => k + 1); }}>Retry</button>
          <Link className="mq-button" to="/games">All games</Link>
        </div>
      : <QuestMap key={mapKey} view={ERA_VIEWS[game.era]} viewKey={`${index}`} beginner={game.mode === "practice" && game.level === "beginner"}
          pin={pin} onPin={setPin} onFail={() => setMapFailed(true)} label={`Map. Drop a pin where ${question.name} stood.`}
          reveal={revealed ? { pin: revealed.pin, scored: revealed.site, others: question.sites.filter((site) => site !== revealed.site) } : null} />}
    {revealed
      ? <Reveal result={revealed} last={index + 1 >= game.questions.length} onNext={next} />
      : <div className="mq-actions">
          <p className="mq-hint">Tap or click the map to drop a pin, drag it to adjust, then confirm. With a keyboard, move the map and press Enter to pin the centre.</p>
          <button type="button" className="mq-button mq-primary" disabled={!pin || mapFailed} onClick={confirm}>Confirm</button>
        </div>}
    <p className="sr-only" aria-live="polite">{announcement}</p>
  </div>;
}

function Reveal({ result, last, onNext }: { result: Result; last: boolean; onNext: () => void }) {
  const { question } = result;
  const band = bandFor(result.points);
  return <section className="mq-reveal" aria-label="The answer">
    <div className="mq-result">
      <span className={`mq-band mq-band-${band}`} aria-hidden="true">{BAND_EMOJI[band]}</span>
      <div>
        <strong>{question.name}</strong>
        <p>{`${distanceText(result.km)} away, ${pointsText(result.points)}`}</p>
      </div>
    </div>
    {question.sites.length > 1 && <p className="mq-sites">{plural(question.sites.length, "Scholars propose {n} site.", "Scholars propose {n} sites. You were scored against the nearest.")}</p>}
    {question.siteNames && <p className="mq-sites">{`Proposed sites: ${formatList(question.siteNames)}.`}</p>}
    {question.note && <p className="mq-note">{question.note}</p>}
    <RevealVerse id={question.verse} />
    <p className="mq-mentions">{plural(question.verseCount, "Mentioned in {n} verse", "Mentioned in {n} verses")}</p>
    <div className="mq-reveal-links">
      {question.atlas && <a href={`/study/atlas/map?place=${encodeURIComponent(question.id)}`} target="_blank" rel="noopener noreferrer">
        <span>Open in atlas</span><ExternalLink size={13} aria-hidden="true" />
      </a>}
      <button type="button" className="mq-button mq-primary" onClick={onNext} autoFocus>{last ? "See your score" : "Next place"}</button>
    </div>
  </section>;
}

function RevealVerse({ id }: { id: number }) {
  const catalog = useCatalog();
  const bible = useCurrentBible();
  const { num, chapter, verse } = splitId(id);
  const code = bookByNum(catalog, num)?.code ?? "GEN";
  return <blockquote className="mq-verse">
    <Verse id={id} />
    <Link to={`/read/${bible.slug}/${code}/${chapter}?v=${verse}`}>{formatRange(catalog, id, id)}</Link>
  </blockquote>;
}

function Summary({ game, results, stats, now, onAgain, onHome }: { game: Game; results: Result[]; stats: Stats; now: Date; onAgain: () => void; onHome: () => void }) {
  const total = results.reduce((sum, result) => sum + result.points, 0);
  const points = results.map((result) => result.points);
  const n = game.n ?? 0;
  return <section className="mq-summary" aria-labelledby="mq-summary-title">
    <h2 id="mq-summary-title">{`${formatNumber(total)} of ${formatNumber(ROUND_LENGTH * MAX_POINTS)} points`}</h2>
    <Squares points={points} />
    <ol className="mq-rows">
      {results.map((result) => <SummaryRow key={result.question.id} question={result.question} result={result} />)}
    </ol>
    {game.mode === "daily"
      ? <div className="mq-summary-daily">
          <ShareButton n={n} points={points} />
          <p>{plural(currentStreak(stats, n), "Streak: {n} day", "Streak: {n} days")}</p>
          <Countdown now={now} />
          <button type="button" className="mq-button" onClick={onHome}>Back to the game home</button>
        </div>
      : <div className="mq-summary-actions">
          <button type="button" className="mq-button mq-primary" onClick={onAgain}>Play again</button>
          <button type="button" className="mq-button" onClick={onHome}>Change settings</button>
        </div>}
  </section>;
}

function SummaryRow({ question, result }: { question: Question; result: Result }) {
  const band = bandFor(result.points);
  return <li>
    <span aria-hidden="true">{BAND_EMOJI[band]}</span>
    <strong>{question.name}</strong>
    <span>{distanceText(result.km)}</span>
    <span>{pointsText(result.points)}</span>
  </li>;
}
