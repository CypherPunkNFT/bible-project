// Memory card match: the end of a board (design section 10). Solo play shows moves, time, stars and any new record;
// pass and play ranks the players. Then every pair on the board with its key verse, looked up in the reader's current
// Bible (src/lib/verses.ts: the data holds verse ids only), a link to the passage and, where there is one, the person.
import { Star } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { plural } from "@/lib/site-format";
import { useVerseTable } from "@/lib/verses";
import type { PairsFile } from "./deal";
import { formatTime, isSolo, pairCount, ranking, stars, winnerLine, type GameState } from "./game";

export interface RecordNews { newMoves: boolean; newTime: boolean }

interface SummaryProps { data: PairsFile; game: GameState; news: RecordNews | null; onAgain: () => void; onChange: () => void }

export function Summary({ data, game, news, onAgain, onChange }: SummaryProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const pairs = useMemo(() => {
    const byId = new Map(data.pairs.map((pair) => [pair.id, pair]));
    return [...new Set(game.cards.map((card) => card.pair))].map((id) => byId.get(id)!);
  }, [data, game.cards]);
  const verseIds = useMemo(() => pairs.map((pair) => pair.keyVerseId), [pairs]);
  const verses = useVerseTable(verseIds);
  const solo = isSolo(game);
  const count = pairCount(game);
  const earned = stars(game.moves, count);

  return <section className="mm-summary" aria-labelledby="mm-summary-title">
    <h2 id="mm-summary-title" ref={heading} tabIndex={-1}>
      {solo ? `All ${count} pairs in ${game.moves} moves · ${formatTime(game.elapsedMs)}` : winnerLine(ranking(game))}
    </h2>
    {solo ? <>
      <p className="mm-stars">
        <span aria-hidden="true">{[1, 2, 3].map((n) => <Star key={n} size={22} className={n <= earned ? "is-on" : undefined} />)}</span>
        <span>{plural(earned, "{n} star", "{n} stars")}</span>
      </p>
      {news?.newMoves && <p className="mm-record">{`New best: ${plural(game.moves, "{n} move", "{n} moves")}`}</p>}
      {news?.newTime && <p className="mm-record">{`New best time: ${formatTime(game.elapsedMs)}`}</p>}
    </> : <ol className="mm-ranking">
      {ranking(game).map((standing, n) => <li key={standing.name + n}>
        <span className="mm-place">{standing.place}</span> {`${standing.name}: ${plural(standing.pairs, "{n} pair", "{n} pairs")}`}
      </li>)}
    </ol>}
    <h3 className="mm-stories-title">The stories</h3>
    <ul className="mm-stories">
      {pairs.map((pair) => {
        const character = data.characters[pair.who];
        const quote = verses?.table[pair.keyVerseId];
        return <li key={pair.id}>
          <p className="mm-story-pair"><strong>{character.label}</strong> — {pair.story}</p>
          {character.parable && <p className="mm-parable">In a parable Jesus told</p>}
          {quote ? <blockquote><p>“{quote}”</p><footer>{pair.keyVerse}</footer></blockquote>
            : <p className="mm-key-ref">{pair.keyVerse}</p>}
          <p className="mm-story-links">
            <Link to={pair.readerHref}>{`Read ${pair.ref}`}</Link>
            {character.href && <Link to={character.href}>{`About ${character.label}`}</Link>}
          </p>
        </li>;
      })}
    </ul>
    <div className="mm-actions">
      <button type="button" className="mm-primary" onClick={onAgain}>Play again</button>
      <button type="button" className="mm-secondary" onClick={onChange}>Change game</button>
    </div>
  </section>;
}
