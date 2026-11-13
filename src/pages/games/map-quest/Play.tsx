// One game on screen (design §9, screens 2-4): each place in turn on the map, the answer revealed with its verse, then
// the summary. The round strip and the running total sit above the map, Confirm floats inside the map's frame, and
// the answer comes up as a sheet over the map (a panel beside it on a desktop) with the points counting up, so the
// line, the true site and the score are all in view at once. The map stays mounted from place to place; if it cannot
// load, an error panel offers a retry. Beside Confirm, Hint draws a circle that holds the place (hints.ts), up to the
// level's number of circles, each one costing HINT_COST points off the place. A clock above the map runs on each
// place (clock.ts) and takes points off as it goes. On a wide screen the round sits on the site's left margin with the
// Scripture panel (every verse naming the place) on the right; on a narrower one the panel comes under the map.
import { ExternalLink, Lightbulb, Timer } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import { formatList, formatNumber, plural } from "@/lib/site-format";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Confetti, FeedbackBand, ProgressTrail, TimerBar, trailMarks, useCountUp, useScrollTopOn } from "../kit";
import { BAND_CSS, BAND_MARK, BAND_TONE } from "./bands";
import { TIME_LIMIT_SECONDS, secondsBetween, timePenalty } from "./clock";
import { scorePin, type Game, type Question, type Result } from "./game";
import type { LonLat } from "./geo";
import { HINT_COST, HINTS_BY_LEVEL, hintCircles } from "./hints";
import { distanceText, pointsText, shapeOf } from "./words";
import { ERA_VIEWS } from "./pools";
import { QuestMap } from "./QuestMap";
import { BAND_EMOJI, MAX_POINTS, bandFor } from "./scoring";
import { useReaderHref } from "./reader-href";
import { ScripturePanel } from "./ScripturePanel";
import type { Playing, Stats } from "./storage";
import { Summary } from "./Summary";
import { LEVEL_TEXT } from "./text";
import { furtherAfield } from "./view";

interface Props {
  game: Game;
  /** Daily Five pins already confirmed (a resumed game starts after them). */
  resume: Result[];
  /** The saved hints and clock of the first place still to play (a resumed Daily Five), else null. */
  playing: Playing | null;
  stats: Stats;
  now: Date;
  onConfirm: (result: Result) => void;
  /** A place's clock started: its id and the time (ms). */
  onStart: (id: string, at: number) => void;
  /** A hint circle was taken: the place's id and how many it now has. */
  onHint: (id: string, used: number) => void;
  onFinish: () => void;
  onAgain: () => void;
  onHome: () => void;
}

/** Room for the answer card over the map: a panel on the left on a desktop, a sheet at the bottom on a phone. */
const DESKTOP_PADDING = { left: 420, top: 48, right: 48, bottom: 48 };
const PHONE_PADDING = { left: 32, top: 40, right: 32, bottom: 250 };

const TICK_MS = 250;

export function Play({ game, resume, playing, stats, now, onConfirm, onStart, onHint, onFinish, onAgain, onHome }: Props) {
  const [results, setResults] = useState<Result[]>(resume);
  const [index, setIndex] = useState(Math.min(resume.length, game.questions.length));
  const [pin, setPin] = useState<LonLat | null>(null);
  const [revealed, setRevealed] = useState<Result | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);
  const [everPinned, setEverPinned] = useState(resume.length > 0);
  const [hintsUsed, setHintsUsed] = useState(playing?.used ?? 0);
  const [startedAt, setStartedAt] = useState(() => playing?.startedAt ?? Date.now());
  const [clockNow, setClockNow] = useState(Date.now);
  // The Daily Five draws the same circles for everyone; any other game draws fresh ones each time it is played.
  const [hintSeed] = useState(() => (game.mode === "daily" ? `daily-${game.n}` : `${game.mode}-${Math.random()}`));
  const wide = useMediaQuery("(min-width: 900px)");
  const over = index >= game.questions.length;
  useScrollTopOn(over);
  const total = results.reduce((sum, result) => sum + result.points, 0);
  const current = game.questions[Math.min(index, game.questions.length - 1)];
  const allHints = useMemo(() => hintCircles(current.sites[0], ERA_VIEWS[game.era], game.level, `${hintSeed}:${current.id}`), [current, game.era, game.level, hintSeed]);
  const shownHints = useMemo(() => (revealed ? [] : allHints.slice(0, hintsUsed)), [allHints, hintsUsed, revealed]);
  // Each place's clock: saved as it starts (the Daily Five keeps a running one through a reload), ticking until Confirm.
  useEffect(() => { if (!over) onStart(current.id, startedAt); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (over || revealed) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [over, revealed]);

  if (over) return <Summary game={game} results={results} stats={stats} now={now} onAgain={onAgain} onHome={onHome} />;
  const question = game.questions[index];
  const marks = trailMarks(results.map((result) => BAND_MARK[bandFor(result.points)]), game.questions.length);
  const tones = results.map((result) => BAND_CSS[bandFor(result.points)]);

  const drop = (at: LonLat) => { setPin(at); setEverPinned(true); };
  const confirm = () => {
    if (!pin || revealed) return;
    const result = scorePin(question, pin, { hints: hintsUsed, seconds: secondsBetween(startedAt, Date.now()), level: game.level });
    setResults((done) => [...done, result]);
    setRevealed(result);
    onConfirm(result);
  };
  const takeHint = () => {
    if (revealed || hintsUsed >= allHints.length) return;
    setHintsUsed(hintsUsed + 1);
    onHint(question.id, hintsUsed + 1);
  };
  const next = () => {
    setPin(null);
    setHintsUsed(0);
    setStartedAt(Date.now());
    setClockNow(Date.now());
    setRevealed(null);
    setIndex(index + 1);
    if (index + 1 >= game.questions.length) onFinish();
  };
  const last = index + 1 >= game.questions.length;
  const afield = game.mode === "practice" && furtherAfield(question.sites, ERA_VIEWS[game.era]);

  const seconds = revealed ? revealed.seconds : secondsBetween(startedAt, clockNow);

  return <div className="mq-play">
    <div className="mq-round-head">
    <div className="mq-strip">
      <ProgressTrail className="mq-slots" marks={marks} tones={tones} size="1rem" label={`Place ${index + 1} of ${game.questions.length}`} />
      <RoundClock seconds={seconds} level={game.level} />
      <Total total={total} gained={revealed?.points ?? 0} of={game.questions.length * MAX_POINTS} />
    </div>
    <div className="mq-name-row">
      <h2 className="mq-name">{question.name}</h2>
      {afield && <span className="mq-chip">Further afield: zoom out</span>}
    </div>
    {game.widenedTo && index === 0 && <p className="mq-notice">{`That era has few places at ${LEVEL_TEXT[game.level].label} level, so this game also draws on ${LEVEL_TEXT[game.widenedTo].label} places.`}</p>}
    </div>
    {mapFailed
      ? <div className="mq-error" role="alert">
          <p>The map couldn't load. Check the connection and try again.</p>
          <button type="button" className="mq-button mq-primary" onClick={() => { setMapFailed(false); setMapKey((k) => k + 1); }}>Retry</button>
          <Link className="mq-button" to="/games">All games</Link>
        </div>
      : <div className={`mq-stage${revealed ? " is-revealed" : ""}`}>
          <QuestMap key={mapKey} view={ERA_VIEWS[game.era]} viewKey={`${index}`} beginner={game.mode === "practice" && game.level === "beginner"} asked={question.id}
            pin={pin} onPin={drop} hints={shownHints} onFail={() => setMapFailed(true)} label={`Map. Drop a pin where ${question.name} stood. With a keyboard, move the map and press Enter to pin the centre.`}
            reveal={revealed ? shapeOf(revealed) : null} revealPadding={wide ? DESKTOP_PADDING : PHONE_PADDING} />
          {!revealed && <div className="mq-dock">
            {!everPinned && <p className="mq-hint">Tap the map to drop a pin, then drag it to adjust.</p>}
            {hintsUsed < allHints.length && <HintButton used={hintsUsed} of={HINTS_BY_LEVEL[game.level]} onTake={takeHint} />}
            <button type="button" className="mq-button mq-primary mq-confirm" disabled={!pin} onClick={confirm}>Confirm</button>
          </div>}
          <FeedbackBand className="mq-sheet" open={!!revealed} pinned="never" tone={revealed ? BAND_TONE[bandFor(revealed.points)] : null}
            verdict={revealed ? <Verdict result={revealed} /> : null}
            action={<button type="button" className="mq-button mq-primary mq-next" onClick={next}>{last ? "See your score" : "Next place"}</button>}>
            {revealed && <Reading question={revealed.question} />}
          </FeedbackBand>
        </div>}
    <ScripturePanel placeId={question.id} />
  </div>;
}

/** The place's clock: a bar draining over the level's time, the seconds left, and the points it has taken so far. */
function RoundClock({ seconds, level }: { seconds: number; level: Game["level"] }) {
  const limit = TIME_LIMIT_SECONDS[level];
  const left = Math.max(0, limit - seconds);
  const off = timePenalty(seconds, level);
  return <div className="mq-clock">
    <TimerBar className="mq-clock-bar" secondsLeft={left} total={limit} warnAt={10} stamp="Time!"
      label={plural(left, "{n} second left on the clock", "{n} seconds left on the clock")} />
    <span className={`mq-clock-off${off > 0 ? " is-on" : ""}`} aria-live="off">{plural(-off, "{n} point", "{n} points")}</span>
  </div>;
}

/** Hint: its cost on the button, and a dot for each circle still to take (shown only while one is left). */
function HintButton({ used, of, onTake }: { used: number; of: number; onTake: () => void }) {
  const left = of - used;
  return <button type="button" className="mq-button mq-lamp" onClick={onTake}
    aria-label={plural(left, "Hint: draw a circle that holds the place, 150 points off. {n} hint left.", "Hint: draw a circle that holds the place, 150 points off. {n} hints left.")}>
    <Lightbulb size={16} aria-hidden="true" />
    <span>Hint</span>
    <span className="mq-lamp-cost" aria-hidden="true">{plural(-HINT_COST, "{n} point", "{n} points")}</span>
    {of > 1 && <span className="mq-lamp-dots" aria-hidden="true">{Array.from({ length: of }, (_, i) => <i key={i} className={i < used ? "is-used" : undefined} />)}</span>}
  </button>;
}

/** The running total as a bar that grows and a number that counts up from the last total. */
function Total({ total, gained, of }: { total: number; gained: number; of: number }) {
  const shown = useCountUp(total, 900, total - gained);
  return <div className="mq-total" role="img" aria-label={`Total ${formatNumber(total)}`}>
    <span className="mq-total-label" aria-hidden="true">Total</span>
    <span className="mq-total-n" aria-hidden="true">{formatNumber(shown)}</span>
    <span className="mq-bar" aria-hidden="true"><span className="mq-bar-fill mq-bar-fill--total" style={{ transform: `scaleX(${Math.min(1, total / of)})` }} /></span>
  </div>;
}

/** The verdict in the sheet: the band's mark, the name, the distance, the points counting up over a filling bar. */
function Verdict({ result }: { result: Result }) {
  const band = bandFor(result.points);
  const shown = useCountUp(result.points, 900);
  const bullseye = band === "bullseye";
  return <div className={`mq-verdict mq-verdict-${band}`}>
    <span className="mq-band" aria-hidden="true">{BAND_EMOJI[band]}<Confetti when={bullseye} count={18} reach={90} /></span>
    <div className="mq-verdict-words">
      <strong className="mq-verdict-name">{result.question.name}</strong>
      <span className="mq-verdict-line">{`${distanceText(result.km)} away, ${pointsText(result.points)}`}</span>
      {result.hints > 0 && <span className="mq-verdict-line mq-verdict-hints">
        <Lightbulb size={13} aria-hidden="true" />
        <span>{plural(result.hints, "{n} hint used", "{n} hints used")}</span>
        <span>{plural(-result.hints * HINT_COST, "{n} point", "{n} points")}</span>
      </span>}
      {result.timeOff > 0 && <span className="mq-verdict-line mq-verdict-hints">
        <Timer size={13} aria-hidden="true" />
        <span>{plural(result.seconds, "{n} second", "{n} seconds")}</span>
        <span>{plural(-result.timeOff, "{n} point", "{n} points")}</span>
      </span>}
    </div>
    <span className="mq-points" aria-hidden="true">{formatNumber(shown)}</span>
    <span className="mq-bar mq-bar--points" aria-hidden="true" style={{ "--mq-band": BAND_CSS[band] } as CSSProperties}>
      <span className="mq-bar-fill" style={{ transform: `scaleX(${result.points / MAX_POINTS})` }} />
    </span>
  </div>;
}

/** The reading under the verdict: the sites, the verse, the mention count and the atlas link. */
function Reading({ question }: { question: Question }) {
  return <div className="mq-reading">
    {question.sites.length > 1 && <p className="mq-sites">{plural(question.sites.length, "Scholars propose {n} site.", "Scholars propose {n} sites. You were scored against the nearest.")}</p>}
    {question.siteNames && <p className="mq-sites">{`Proposed sites: ${formatList(question.siteNames)}.`}</p>}
    {question.note && <p className="mq-note">{question.note}</p>}
    <RevealVerse id={question.verse} />
    <p className="mq-mentions">{plural(question.verseCount, "Mentioned in {n} verse", "Mentioned in {n} verses")}</p>
    {question.atlas && <a className="mq-atlas" href={`/study/atlas/map?place=${encodeURIComponent(question.id)}`} target="_blank" rel="noopener noreferrer">
      <span>Open in atlas</span><ExternalLink size={13} aria-hidden="true" />
    </a>}
  </div>;
}

function RevealVerse({ id }: { id: number }) {
  const catalog = useCatalog();
  const href = useReaderHref();
  return <blockquote className="mq-verse">
    <Verse id={id} />
    <Link to={href(id)}>{formatRange(catalog, id, id)}</Link>
  </blockquote>;
}
