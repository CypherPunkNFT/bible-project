// /games: the games hub, and each live game at its own address (/games/<slug>). The hub is a hero with the games-table
// drawing, then the games on four shelves (registry.ts SHELVES), each game a tile with its own picture (art/). A game not
// built yet is a "Coming soon" tile with its full picture and no link; its address returns here, as unpublished
// Resources sections do. Tiles sit between hairlines like the stations' doorways, never in boxes (the owner's call).
// Design: docs/features/games-hub/design.md. Styles: games.css (layout) and art/game-art.css (the drawings).
import { ArrowUpRight, Hourglass } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { StationStats } from "@/components/stations/Station";
import { lazyWithWords } from "@/lib/lazy-page";
import { plural } from "@/lib/site-format";
import { BLANK_ART, GameArtImage } from "./art";
import { HeroArt } from "./art/HeroArt";
import { AUDIENCE_LABELS, GAMES, SHELVES, gamePath, gamesForHub, isLive, shelfOf, type GameEntry, type Shelf } from "./registry";
import "./games.css";

// Made once, so a game's page is not reloaded on every render. App's Suspense shows "Loading…" while one loads.
const LIVE_PAGES = GAMES.filter(isLive).map((game) => ({ slug: game.slug, Page: lazyWithWords(game.load) }));

const pad = (n: number) => String(n).padStart(2, "0");

export default function GamesPage() {
  return <Routes>
    <Route index element={<GamesHub />} />
    {LIVE_PAGES.map(({ slug, Page }) => <Route key={slug} path={slug} element={<Page />} />)}
    <Route path="*" element={<Navigate replace to="/games" />} />
  </Routes>;
}

export interface ShelfOfGames { key: Shelf; title: string; text: string; games: GameEntry[] }

function GamesHub() {
  useEffect(() => { document.title = "Bible Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const games = gamesForHub();
  const live = games.filter(isLive).length;
  const forGroups = games.filter((game) => game.audiences.some((a) => a === "youth-group" || a === "church-night")).length;
  // Live games first within each shelf (gamesForHub's order); a shelf with no games is not drawn.
  const shelves: ShelfOfGames[] = SHELVES.map((shelf) => ({ ...shelf, games: games.filter((game) => shelfOf(game) === shelf.key) }))
    .filter((shelf) => shelf.games.length > 0);
  return <div className="st-page gm-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <p className="st-kick">Games</p>
        <h1>Bible games for<br /><span>every table and room.</span></h1>
        <p className="gm-lede">Quizzes, puzzles and party games from the Bible, to play alone, with the family at home, with a youth group or on a church night.</p>
        <StationStats items={[["Games", games.length], ["Ready to play", live], ["Coming soon", games.length - live], ["For groups", forGroups]]} />
        <nav className="gm-jump" aria-label="Kinds of game">
          {shelves.map((shelf) => <a key={shelf.key} href={`#shelf-${shelf.key}`}>{shelf.title}<span>{shelf.games.length}</span></a>)}
        </nav>
      </div>
      <div className="gm-hero-figure"><HeroArt /></div>
    </header>
    {shelves.map((shelf, i) => <ShelfSection key={shelf.key} shelf={shelf} index={i + 1} />)}
  </div>;
}

export function ShelfSection({ shelf, index }: { shelf: ShelfOfGames; index: number }) {
  const titleId = `shelf-${shelf.key}-title`;
  const live = shelf.games.filter(isLive).length;
  const ready = live === 0 ? "all coming soon" : live === shelf.games.length ? "all ready to play" : `${live} ready to play`;
  return <section className="gm-shelf" id={`shelf-${shelf.key}`} aria-labelledby={titleId}>
    <div className="gm-shelf-head">
      <span className="gm-shelf-num" aria-hidden="true">{pad(index)}</span>
      <div><h2 id={titleId}>{shelf.title}</h2><p>{shelf.text}</p></div>
      <span className="gm-shelf-count">{plural(shelf.games.length, "{n} game", "{n} games")} · {ready}</span>
    </div>
    <ul className="gm-grid" aria-label={shelf.title}>
      {shelf.games.map((game) => <li key={game.slug}><GameTile game={game} /></li>)}
    </ul>
  </section>;
}

export function GameTile({ game }: { game: GameEntry }) {
  const id = `game-${game.slug}`;
  const live = isLive(game);
  const art = game.art ?? BLANK_ART;
  const body = <>
    <div className="gm-art">
      <GameArtImage art={art} />
      {/* The badge repeats the footer for the eye, so screen readers hear it once, from the footer. */}
      <span className="gm-badge" aria-hidden="true">{live ? "Ready to play" : <><Hourglass size={11} />Coming soon</>}</span>
    </div>
    <div className="gm-text">
      <h3 id={id}>{game.title}</h3>
      <p>{game.description}</p>
      <ul className="gm-audiences" aria-label="Who it's for">
        {game.audiences.map((audience) => <li key={audience}>{AUDIENCE_LABELS[audience]}</li>)}
      </ul>
      <div className="gm-card-foot">{live ? <strong>Play<ArrowUpRight size={14} aria-hidden="true" /></strong> : <span>Coming soon</span>}</div>
    </div>
  </>;
  const style = { "--game": `var(--${art.tone})`, "--game-tab": `var(--${art.tone}-tab)`, "--game-tab-ink": `var(--${art.tone}-tab-ink)` } as CSSProperties;
  return live
    ? <Link to={gamePath(game)} className="gm-card" style={style} aria-labelledby={id}>{body}</Link>
    : <div className="gm-card" style={style} role="group" aria-disabled="true" aria-labelledby={id}>{body}</div>;
}
