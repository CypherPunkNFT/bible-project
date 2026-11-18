// Hot seat: a player's name as it was typed. It is the player's own word, never page text, so the page translator
// leaves it alone (a player called Ruth stays Ruth on the Arabic page, not the Bible's Ruth in Arabic), and it is held
// apart from the line around it, so an English name reads the right way inside Arabic. The names the game gives
// ("Player 2") are page words, translated like any other.
import { formatList } from "@/lib/site-format";

const GIVEN = /^Player \d+$/;
const typed = (name: string) => !GIVEN.test(name);

export function PlayerName({ name }: { name: string }) {
  return <bdi translate={typed(name) ? "no" : undefined}>{name}</bdi>;
}

/** Several names joined as the site's language joins a list ("Ruth and Boaz"), left alone if any of them was typed. */
export function PlayerNames({ names }: { names: readonly string[] }) {
  return <bdi translate={names.some(typed) ? "no" : undefined}>{formatList(names)}</bdi>;
}
