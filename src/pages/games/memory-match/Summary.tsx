// Memory card match: the end of a board (design section 10; redesign from docs/visual-audits/memory-match.md, items 5
// and 6). Solo play: the heading, the stars dropping in one at a time, the moves counting up with the time, a "New best"
// ribbon with one gold burst, and Play again / Change game right under. Pass and play: the winner's line with a crown,
// then each player's line with the pile of pairs they took. Then the stories: every pair on the board with its key
// verse, looked up in the reader's current Bible (src/lib/verses.ts: the data holds verse ids only), a link to the
// passage and, where there is one, the person.
import { Crown, Star } from "lucide-react";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { formatList, plural } from "@/lib/site-format";
import { useVerseTable } from "@/lib/verses";
import { Confetti, NewBestRibbon, ResultPanel, ScoreCountUp, WinnerLine, teamTone } from "../kit";
import { toneColor } from "./tones";
import type { Version } from "./versions";
import type { PairsFile } from "./deal";
import { formatTime, isSolo, pairCount, ranking, stars, winnerLine, type GameState } from "./game";

export interface RecordNews { newMoves: boolean; newTime: boolean }

interface SummaryProps {
  data: PairsFile; version: Version; game: GameState; news: RecordNews | null; onAgain: () => void; onChange: () => void;
}

export function Summary({ data, version, game, news, onAgain, onChange }: SummaryProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const pairs = useMemo(() => {
    const byId = new Map(data.pairs.map((pair) => [pair.id, pair]));
    return [...new Set(game.cards.map((card) => card.pair))].map((id) => byId.get(id)!);
  }, [data, game.cards]);
  const toneOf = useMemo(() => new Map(pairs.map((pair, n) => [pair.id, n])), [pairs]);
  const verseIds = useMemo(() => pairs.map((pair) => pair.keyVerseId), [pairs]);
  const verses = useVerseTable(verseIds);
  const solo = isSolo(game);
  const count = pairCount(game);
  const earned = stars(game.moves, count);
  const standings = ranking(game);
  const winners = standings.filter((s) => s.place === 1);
  const record = !!(news?.newMoves || news?.newTime);
  /** The pairs each player took, by player index, in the order found. */
  const piles = game.players.map((_, player) =>
    game.found.filter((id) => game.matched[game.cards.findIndex((card) => card.pair === id && card.kind === "who")] === player));

  const head = <>
    <h2 id="mm-summary-title" ref={heading} tabIndex={-1}>
      {solo ? `All ${count} pairs in ${game.moves} moves · ${formatTime(game.elapsedMs)}` : winnerLine(standings)}
    </h2>
    {solo ? <>
      <p className="mm-stars">
        <span className="mm-stars__row" aria-hidden="true">
          {[1, 2, 3].map((n) => <Star key={n} size={30} className={n <= earned ? "is-on" : undefined} style={{ "--i": n } as CSSProperties} />)}
        </span>
        <span className="mm-stars__words">{plural(earned, "{n} star", "{n} stars")}</span>
      </p>
      <div className="mm-figures">
        <div className="mm-figure">
          <ScoreCountUp className="mm-figure__number" value={game.moves} label={plural(game.moves, "{n} move", "{n} moves")} />
          <span className="mm-figure__label" aria-hidden="true">{plural(game.moves, "move", "moves")}</span>
        </div>
        <div className="mm-figure">
          <span className="mm-figure__number mm-figure__time">{formatTime(game.elapsedMs)}</span>
          <span className="mm-figure__label">time</span>
        </div>
      </div>
      <div className="mm-record-row">
        <NewBestRibbon when={record}>{news?.newMoves ? "New best" : "New best time"}</NewBestRibbon>
        <Confetti when={record} count={28} reach={140} />
      </div>
      {news?.newMoves && <p className="mm-record">{`New best: ${plural(game.moves, "{n} move", "{n} moves")}`}</p>}
      {news?.newTime && <p className="mm-record">{`New best time: ${formatTime(game.elapsedMs)}`}</p>}
    </> : <>
      <WinnerLine className="mm-winner" name={formatList(winners.map((w) => w.name))}>
        <Crown className="mm-crown" size={28} aria-hidden="true" />
      </WinnerLine>
      <ol className="mm-ranking">
        {standings.map((standing) => {
          const player = game.players.indexOf(standing.name);
          return <li key={standing.name + player} style={{ "--team": teamTone(player) } as CSSProperties}>
            <span className="mm-place">{standing.place}</span>
            <span className="mm-ranking__name">{standing.name}</span>
            <span className="mm-ranking__pairs">{plural(standing.pairs, "{n} pair", "{n} pairs")}</span>
            <span className="mm-pile" aria-hidden="true">
              {piles[player]?.map((id) => <span key={id} className="mm-pile__card" style={{ "--pair": toneColor(toneOf.get(id) ?? 0) } as CSSProperties} />)}
            </span>
          </li>;
        })}
      </ol>
    </>}
  </>;

  const actions = <>
    <button type="button" className="mm-primary" onClick={onAgain}>Play again</button>
    <button type="button" className="mm-secondary" onClick={onChange}>Change game</button>
  </>;

  const reading = <>
    <h3 className="mm-stories-title">{version.reading}</h3>
    <ul className="mm-stories">
      {pairs.map((pair, n) => {
        const character = data.characters[pair.who];
        const quote = verses?.table[pair.keyVerseId];
        return <li key={pair.id} style={{ "--pair": toneColor(n), "--i": n } as CSSProperties}>
          {/* A verse's two halves are the verse itself, quoted whole below. */}
          {version.key !== "verses" && <p className="mm-story-pair"><strong>{character.label}</strong> — {pair.story}</p>}
          {character.parable && <p className="mm-parable">In a parable Jesus told</p>}
          {quote ? <blockquote><p>“{quote}”</p><footer>{pair.keyVerse}</footer></blockquote>
            : <p className="mm-key-ref">{pair.keyVerse}</p>}
          <p className="mm-story-links">
            <Link to={pair.readerHref}>{`Read ${pair.ref}`}</Link>
            {character.href && version.aboutLink && <Link to={character.href}>{version.aboutLink(character.label)}</Link>}
          </p>
        </li>;
      })}
    </ul>
  </>;

  return <section className="mm-summary" aria-labelledby="mm-summary-title">
    <ResultPanel actions={actions} reading={reading}>{head}</ResultPanel>
  </section>;
}
