// /games_mockup: the games hub with shelf doors under the hero in place of the pill links, like the study hub's subject
// doors, and only the chosen shelf's games under them (owner, 2026-11-11: "must also do the same for games"). Hero,
// shelves and tiles are the real page's own (src/pages/games/GamesPage.tsx); only the doors are new. No MOCK-UP tag: a
// mock-up shows only the real page. The hero is tighter so the doors show without scrolling (owner, 2026-11-11).
import { useSearchParams } from "react-router-dom";
import { StationStats } from "@/components/stations/Station";
import { HubDoors } from "@/components/hub-doors/HubDoors";
import { selectedDoor } from "@/components/hub-doors/door-parts";
import { HeroArt } from "@/pages/games/art/HeroArt";
import { DOOR_ART, DOOR_TONES } from "@/pages/games/art/doors";
import { ShelfSection, type ShelfOfGames } from "@/pages/games/GamesPage";
import { SHELVES, gamesForHub, isLive, shelfOf } from "@/pages/games/registry";
import "@/pages/games/games.css";

export default function GamesMockupPage() {
  const [params] = useSearchParams();
  const games = gamesForHub();
  const live = games.filter(isLive).length;
  const forGroups = games.filter((game) => game.audiences.some((a) => a === "youth-group" || a === "church-night")).length;
  const shelves: ShelfOfGames[] = SHELVES.map((shelf) => ({ ...shelf, games: games.filter((game) => shelfOf(game) === shelf.key) }))
    .filter((shelf) => shelf.games.length > 0);
  const selected = selectedDoor(params.get("shelf"), shelves.map((shelf) => shelf.key));
  const index = shelves.findIndex((shelf) => shelf.key === selected);
  return <div className="st-page gm-page hub-doors-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <p className="st-kick">Games</p>
        <h1>Bible games for<br /><span>every table and room.</span></h1>
        <p className="gm-lede">Quizzes, puzzles and party games from the Bible, to play alone, with the family at home, with a youth group or on a church night.</p>
        <StationStats items={[["Games", games.length], ["Ready to play", live], ["Coming soon", games.length - live], ["For groups", forGroups]]} />
      </div>
      <div className="gm-hero-figure"><HeroArt /></div>
    </header>
    <HubDoors param="shelf" label="Kinds of game" controls={`shelf-${selected}`} selected={selected}
      doors={shelves.map((shelf) => ({ key: shelf.key, title: shelf.title, tone: DOOR_TONES[shelf.key], count: shelf.games.length, art: DOOR_ART[shelf.key] }))} />
    <ShelfSection key={selected} shelf={shelves[index]} index={index + 1} />
  </div>;
}
