// One game on screen (design §9, screens 2-4): each place in turn on the map, the answer revealed with its verse, then
// the summary. The round strip and the running total sit above the map, Confirm floats inside the map's frame, and
// the answer comes up as a sheet over the map (a panel beside it on a desktop) with the points counting up, so the
// line, the true site and the score are all in view at once. The map stays mounted from place to place; if it cannot
// load, an error panel offers a retry.
import { ExternalLink } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import { formatList, formatNumber, plural } from "@/lib/site-format";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useCurrentBible } from "@/lib/verses";
import { Confetti, FeedbackBand, ProgressTrail, trailMarks, useCountUp, useScrollTopOn } from "../kit";
import { BAND_CSS, BAND_MARK, BAND_TONE } from "./bands";
import { scorePin, type Game, type Question, type Result } from "./game";
import type { LonLat } from "./geo";
import { distanceText, pointsText, shapeOf } from "./words";
import { ERA_VIEWS } from "./pools";
import { QuestMap } from "./QuestMap";
import { BAND_EMOJI, MAX_POINTS, bandFor } from "./scoring";
import type { Stats } from "./storage";
import { Summary } from "./Summary";
import { LEVEL_TEXT } from "./text";
import { furtherAfield } from "./view";

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

/** Room for the answer card over the map: a panel on the left on a desktop, a sheet at the bottom on a phone. */
const DESKTOP_PADDING = { left: 420, top: 48, right: 48, bottom: 48 };
const PHONE_PADDING = { left: 32, top: 40, right: 32, bottom: 250 };

export function Play({ game, resume, stats, now, onConfirm, onFinish, onAgain, onHome }: Props) {
  const [results, setResults] = useState<Result[]>(resume);
  const [index, setIndex] = useState(Math.min(resume.length, game.questions.length));
  const [pin, setPin] = useState<LonLat | null>(null);
  const [revealed, setRevealed] = useState<Result | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);
  const [everPinned, setEverPinned] = useState(resume.length > 0);
  const wide = useMediaQuery("(min-width: 900px)");
  const over = index >= game.questions.length;
  useScrollTopOn(over);
  const total = results.reduce((sum, result) => sum + result.points, 0);

  if (over) return <Summary game={game} results={results} stats={stats} now={now} onAgain={onAgain} onHome={onHome} />;
  const question = game.questions[index];
  const marks = trailMarks(results.map((result) => BAND_MARK[bandFor(result.points)]), game.questions.length);
  const tones = results.map((result) => BAND_CSS[bandFor(result.points)]);

  const drop = (at: LonLat) => { setPin(at); setEverPinned(true); };
  const confirm = () => {
    if (!pin || revealed) return;
    const result = scorePin(question, pin);
    setResults((done) => [...done, result]);
    setRevealed(result);
    onConfirm(result);
  };
  const next = () => {
    setPin(null);
    setRevealed(null);
    setIndex(index + 1);
    if (index + 1 >= game.questions.length) onFinish();
  };
  const last = index + 1 >= game.questions.length;
  const afield = game.mode === "practice" && furtherAfield(question.sites, ERA_VIEWS[game.era]);

  return <div className="mq-play">
    <div className="mq-strip">
      <ProgressTrail className="mq-slots" marks={marks} tones={tones} size="1rem" label={`Place ${index + 1} of ${game.questions.length}`} />
      <Total total={total} gained={revealed?.points ?? 0} of={game.questions.length * MAX_POINTS} />
    </div>
    <div className="mq-name-row">
      <h2 className="mq-name">{question.name}</h2>
      {afield && <span className="mq-chip">Further afield: zoom out</span>}
    </div>
    {game.widenedTo && index === 0 && <p className="mq-notice">{`That era has few places at ${LEVEL_TEXT[game.level].label} level, so this game also draws on ${LEVEL_TEXT[game.widenedTo].label} places.`}</p>}
    {mapFailed
      ? <div className="mq-error" role="alert">
          <p>The map couldn't load. Check the connection and try again.</p>
          <button type="button" className="mq-button mq-primary" onClick={() => { setMapFailed(false); setMapKey((k) => k + 1); }}>Retry</button>
          <Link className="mq-button" to="/games">All games</Link>
        </div>
      : <div className={`mq-stage${revealed ? " is-revealed" : ""}`}>
          <QuestMap key={mapKey} view={ERA_VIEWS[game.era]} viewKey={`${index}`} beginner={game.mode === "practice" && game.level === "beginner"}
            pin={pin} onPin={drop} onFail={() => setMapFailed(true)} label={`Map. Drop a pin where ${question.name} stood. With a keyboard, move the map and press Enter to pin the centre.`}
            reveal={revealed ? shapeOf(revealed) : null} revealPadding={wide ? DESKTOP_PADDING : PHONE_PADDING} />
          {!revealed && <div className="mq-dock">
            {!everPinned && <p className="mq-hint">Tap the map to drop a pin, then drag it to adjust.</p>}
            <button type="button" className="mq-button mq-primary mq-confirm" disabled={!pin} onClick={confirm}>Confirm</button>
          </div>}
          <FeedbackBand className="mq-sheet" open={!!revealed} pinned="never" tone={revealed ? BAND_TONE[bandFor(revealed.points)] : null}
            verdict={revealed ? <Verdict result={revealed} /> : null}
            action={<button type="button" className="mq-button mq-primary mq-next" onClick={next}>{last ? "See your score" : "Next place"}</button>}>
            {revealed && <Reading question={revealed.question} />}
          </FeedbackBand>
        </div>}
  </div>;
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
  const bible = useCurrentBible();
  const { num, chapter, verse } = splitId(id);
  const code = bookByNum(catalog, num)?.code ?? "GEN";
  return <blockquote className="mq-verse">
    <Verse id={id} />
    <Link to={`/read/${bible.slug}/${code}/${chapter}?v=${verse}`}>{formatRange(catalog, id, id)}</Link>
  </blockquote>;
}
