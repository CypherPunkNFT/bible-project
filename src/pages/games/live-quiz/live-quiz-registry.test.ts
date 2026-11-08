// The live quiz's entry on the games hub (src/pages/games/registry.ts): kept apart from the game's own tests because
// it checks the hub's file.
import { GAMES } from "../registry";

it("lists the live quiz as live on the games hub, loading its leader page", () => {
  const entry = GAMES.find((game) => game.slug === "live-quiz");
  expect(entry?.status).toBe("live");
  expect(entry && "load" in entry && typeof entry.load).toBe("function");
});
