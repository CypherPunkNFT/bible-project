// Bible crossword: the start screen's theme tiles drawn like What came first?'s (owner, 2026-11-12: "make the cross
// puzzle more like these cards"). Each theme's own line drawing (ThemeIcons.tsx) stands in the hub's faint arched
// window (../art/game-art.css), in the tile's book colour. Decorative: the tile's label names it.
import { P } from "../art/parts";
import "../art/game-art.css";
import { ThemeIcon } from "./ThemeIcons";

/** One of the site's book-colour tones (src/index.css) per tile, spread so neighbours differ in rows of six and three. */
export const TILE_TONES: Record<string, string> = {
  whole: "epistles", beginnings: "poetry", exodus: "history", kingdom: "revelation", wisdom: "acts", prophets: "prophets",
  jesus: "gospels", church: "epistles", people: "poetry", places: "history", verses: "revelation", book: "prophets",
};

/** The 24-unit drawing scaled into the 120×80 arch, centred, its stroke kept at the hub's weight. */
export function ThemeTileArt({ id }: { id: string }) {
  return <svg className="ga-art cw-tile-art" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <path className="ga-arch" d="M30 74V40A30 30 0 0 1 90 40V74Z" />
    <path className="ga-arch-line" d="M34 74V41A26 26 0 0 1 86 41V74" />
    <P d="M12 74H108" c="ga-f" />
    <svg x={39} y={22} width={42} height={42} viewBox="0 0 24 24" overflow="visible"><ThemeIcon id={id} /></svg>
  </svg>;
}
