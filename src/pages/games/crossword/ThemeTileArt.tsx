// Bible crossword: the start screen's theme tiles drawn like What came first?'s (owner, 2026-11-12: "make the cross
// puzzle more like these cards"). Each theme's own line drawing (ThemeIcons.tsx) stands in the hub's faint arched
// window (../art/game-art.css), in the tile's book colour. Decorative: the tile's label names it.
import { TileArch } from "../art/tiles";
import "../art/game-art.css";
import { ThemeIcon } from "./ThemeIcons";

/** The 24-unit drawing scaled into the 120×80 arch, centred, its stroke kept at the hub's weight. */
export function ThemeTileArt({ id }: { id: string }) {
  return <svg className="ga-art cw-tile-art" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <TileArch />
    <svg x={39} y={22} width={42} height={42} viewBox="0 0 24 24" overflow="visible"><ThemeIcon id={id} /></svg>
  </svg>;
}
