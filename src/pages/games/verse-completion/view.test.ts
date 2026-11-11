import { describe, expect, it } from "vitest";
import { keyIsTaken, landDelayMs, perfectRound, roundTrail, shownVerdict, trailMarkFor, typedReach } from "./view";
import type { Done } from "./storage";

const card = (stars: 0 | 1 | 2 | 3, status: Done["status"] = "answered"): Done => ({ id: `p${stars}`, status, stars, accuracy: stars * 30 });

describe("the trail", () => {
  it("marks three stars right, one or two part, none or skipped wrong", () => {
    expect(trailMarkFor(card(3))).toBe("right");
    expect(trailMarkFor(card(2))).toBe("part");
    expect(trailMarkFor(card(1))).toBe("part");
    expect(trailMarkFor(card(0))).toBe("wrong");
    expect(trailMarkFor(card(0, "skipped"))).toBe("wrong");
  });
  it("draws every dealt card, the next one current, the rest empty", () => {
    expect(roundTrail([card(3), card(0)], 4)).toEqual(["right", "wrong", "current", "empty"]);
    expect(roundTrail([card(3)], 1)).toEqual(["right"]);
    expect(roundTrail([], 3)).toEqual(["current", "empty", "empty"]);
  });
});

describe("the round's moments", () => {
  it("is perfect only when every answered card has three stars", () => {
    expect(perfectRound([card(3), card(3)])).toBe(true);
    expect(perfectRound([card(3), card(3, "skipped")])).toBe(true);
    expect(perfectRound([card(3), card(2)])).toBe(false);
    expect(perfectRound([])).toBe(false);
    expect(perfectRound([card(0, "skipped")])).toBe(false);
  });
  it("lands words a tenth of a second apart and never later than 1.8 seconds", () => {
    expect(landDelayMs(0)).toBe(0);
    expect(landDelayMs(5)).toBe(500);
    expect(landDelayMs(40)).toBe(1800);
  });
});

describe("typed results", () => {
  it("shows a hinted word as shown, whatever the matcher wrote", () => {
    expect(shownVerdict({ verdict: "wrong", credit: 0, typed: "save" }, 2, new Set([2]))).toBe("shown");
    expect(shownVerdict({ verdict: "wrong", credit: 0, typed: "save" }, 2, new Set([1]))).toBe("wrong");
    expect(shownVerdict({ verdict: "exact", credit: 1 }, 0, undefined)).toBe("exact");
  });
  it("counts the dashes a typed answer has reached", () => {
    expect(typedReach("", 5)).toBe(0);
    expect(typedReach("  the Lord  is ", 5)).toBe(3);
    expect(typedReach("a b c d e f g", 5)).toBe(5);
  });
});

describe("the word keys", () => {
  it("leave a form field and an open dialog alone", () => {
    const input = document.createElement("textarea");
    document.body.append(input);
    expect(keyIsTaken(input)).toBe(true);
    expect(keyIsTaken(document.body)).toBe(false);
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.append(dialog);
    expect(keyIsTaken(document.body)).toBe(true);
    input.remove(); dialog.remove();
  });
});
