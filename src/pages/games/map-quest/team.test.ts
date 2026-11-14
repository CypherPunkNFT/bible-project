// Map quest as a team game (docs/features/team-play/design.md, section 5 and Review 3, 13-15): the round as data.
import type { HostRoom } from "../team-play/host";
import { seeded } from "../kit";
import {
  addPin, newTeamRound, nextPlace, PLACE_SECONDS, placeResults, questionsOf, readPin, readyToReveal, reveal, standings, startPlace, teamView,
} from "./team";

const room: HostRoom = { code: "48213", token: "tok", teams: [{ id: "t1", name: "Lions", state: "open" }, { id: "t2", name: "Eagles", state: "open" }, { id: "t3", name: "Bears", state: "open" }] };
const NOW = 1_000_000;

function started() {
  const round = newTeamRound(room, "beginner", "all", seeded(7));
  return startPlace(round, 0, NOW);
}

describe("a team round of Map quest", () => {
  it("draws five places and starts the first place's countdown", () => {
    const round = started();
    expect(round.ids).toHaveLength(5);
    expect(questionsOf(round)).toHaveLength(5);
    expect(round).toMatchObject({ phase: "place", index: 0, deadline: NOW + PLACE_SECONDS * 1000 });
  });

  it("reveals when every team has pinned, a team without a phone included (it pins on the big screen), or when time is up", () => {
    let round = started();
    const site = questionsOf(round)[0].sites[0];
    round = addPin(addPin(round, "t1", 0, site), "t2", 0, [site[0] + 1, site[1]]);
    expect(readyToReveal(round, NOW + 1000)).toBe(false); // Bears have no phone: the big screen pins for them
    round = addPin(round, "t3", 0, [site[0], site[1] + 1]);
    expect(readyToReveal(round, NOW + 1000)).toBe(true);
    expect(readyToReveal(started(), NOW + PLACE_SECONDS * 1000)).toBe(true);
  });

  it("ignores the expected list of a round saved before every team was expected", () => {
    const old = { ...addPin(started(), "t1", 0, [35, 31]), expected: ["t1"] } as ReturnType<typeof started>;
    expect(readyToReveal(old, NOW + 1000)).toBe(false);
  });

  it("ignores a pin for another place, after the reveal, or from a team not in the game (Review 3)", () => {
    const round = started();
    const site = questionsOf(round)[0].sites[0];
    expect(addPin(round, "t1", 1, site)).toBe(round);
    expect(addPin(round, "t9", 0, site)).toBe(round);
    const shown = reveal(addPin(round, "t1", 0, site));
    expect(addPin(shown, "t2", 0, site)).toBe(shown);
  });

  it("scores each team with the game's own scoring, a missing pin scoring nothing, and keeps standings", () => {
    let round = started();
    const site = questionsOf(round)[0].sites[0];
    round = reveal(addPin(addPin(round, "t1", 0, site), "t2", 0, [site[0] + 2, site[1]]));
    const results = placeResults(round, 0);
    expect(results[0]).toMatchObject({ id: "t1", points: 1000 });
    expect(results[1].points).toBeGreaterThan(0);
    expect(results[1].points).toBeLessThan(1000);
    expect(results[2]).toMatchObject({ id: "t3", pin: null, points: 0 });
    expect(standings(round).map((row) => [row.id, row.place])).toEqual([["t1", 1], ["t2", 2], ["t3", 3]]);
    const view = teamView(round, "t1", NOW);
    expect(view).toMatchObject({ phase: "reveal", result: { points: 1000 }, standing: { place: 1, of: 3, score: 1000 } });
  });

  it("moves through the five places to the end", () => {
    let round = started();
    for (let n = 0; n < 5; n++) {
      round = nextPlace(reveal(round), NOW + n);
    }
    expect(round.phase).toBe("done");
  });

  it("tells a phone only its own pin and the time left, never the answer before the reveal", () => {
    const round = addPin(started(), "t2", 0, [35, 31]);
    const view = teamView(round, "t2", NOW + 10_000);
    expect(view).toMatchObject({ phase: "place", pin: [35, 31], msLeft: (PLACE_SECONDS - 10) * 1000, result: null, standing: null });
    expect(teamView(round, "t1", NOW).pin).toBeNull();
    expect(JSON.stringify(view)).not.toContain(String(questionsOf(round)[0].sites[0][0]));
  });

  it("reads only well-formed pins", () => {
    expect(readPin({ pin: [35.4, 31.8], place: 2 })).toEqual({ pin: [35.4, 31.8], place: 2 });
    for (const bad of [null, { pin: [200, 1], place: 0 }, { pin: [1], place: 0 }, { pin: ["1", 2], place: 0 }, { pin: [1, 2] }]) expect(readPin(bad)).toBeNull();
  });
});
