import { bsbWords } from "@/lib/bsb-for-tests";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { D, DEFAULT_TASK, findOpened, findTask, HH, pictureById, readerHref, readingTag, scaleById, sourceById, verseByLabel } from "./model";

const IMAGE_BUDGET = 150_000;
const SET_BUDGET = 1_000_000;
const EXTERNAL = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i;

describe("Home and household study: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("JOS", 7, 16)).toBe("/read/bsb/JOS/7?hl=16-16");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of ["__proto__", "constructor", "room:__proto__", "object:nope", "room:", "", "<script>"]) {
      expect(findOpened(bad)).toBeNull();
      expect(findTask(bad).id).toBe(DEFAULT_TASK);
    }
    expect(findOpened(null)).toBeNull();
    expect(findTask(null).id).toBe(DEFAULT_TASK);
  });
  it("opens each room and object by its own key, and one kind cannot open as the other", () => {
    for (const room of D.rooms) expect(findOpened(`room:${room.id}`)).toEqual({ type: "room", room });
    for (const object of D.objects) expect(findOpened(`object:${object.id}`)).toEqual({ type: "object", object });
    expect(findOpened("object:door")).toBeNull();
    expect(findOpened("room:pot")).toBeNull();
  });
  it("says what was read of every status it uses", () => {
    expect(new Set(D.sources.map((s) => readingTag(s.status)))).toEqual(new Set(["read", "part read", "reported second-hand", "located, not read"]));
  });
});

describe("Home and household study: its research record", () => {
  it("cites only sources it lists, each saying what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(10);
    const cited = [...D.rooms.flatMap((r) => r.sources), ...D.claims.flatMap((c) => c.sources), ...D.sizes.map((s) => s.source),
      ...D.tasks.flatMap((t) => Object.values(t.marks).map((m) => m!.source)), ...D.ladders.flatMap((l) => l.steps.map((s) => s.source))];
    for (const id of cited) expect(sourceById.has(id), id).toBe(true);
  });
  it("links outside the site only by https, and inside the site only to a local path", () => {
    for (const s of D.sources) expect(s.url.startsWith("/") ? /^\/(?!\/)/.test(s.url) : EXTERNAL.test(s.url), s.id).toBe(true);
    for (const p of D.pictures) {
      expect(EXTERNAL.test(p.href), p.id).toBe(true);
      expect(EXTERNAL.test(p.licenceUrl), p.id).toBe(true);
    }
  });
  it("has a Berean verse for every label the page uses", () => {
    const used = [...D.rooms.flatMap((r) => r.verses), ...D.tasks.flatMap((t) => t.verses), ...D.objects.flatMap((o) => o.verses),
      ...D.ladders.flatMap((l) => l.steps.map((s) => s.verse)), ...D.kin.rings.map((r) => r.verse), ...D.claims.flatMap((c) => c.verses),
      "Joshua 7:14", "Judges 6:15", "Exodus 12:4", "Amos 3:15", "Amos 5:11", "Isaiah 5:8"];
    for (const label of used) expect(bsbWords(verseByLabel.get(label)!).length, label).toBeGreaterThan(10);
  });
  it("marks every room and task with one of the three kinds, and places only places it has", () => {
    const places = new Set(D.places.map((p) => p.id));
    for (const room of D.rooms) expect(scaleById.has(room.kind), room.id).toBe(true);
    expect(D.rooms).toHaveLength(6);
    expect(D.tasks).toHaveLength(8);
    for (const task of D.tasks) {
      expect(Object.keys(task.marks).length, task.id).toBeGreaterThan(0);
      for (const [place, mark] of Object.entries(task.marks)) {
        expect(places.has(place), `${task.id} ${place}`).toBe(true);
        expect(scaleById.has(mark!.kind), `${task.id} ${place}`).toBe(true);
      }
    }
  });
  it("shows the task where the sources disagree as disagreeing", () => {
    const eat = findTask("eat");
    expect(eat.disagree).toBeTruthy();
    expect(Object.keys(eat.marks).sort()).toEqual(["middle", "upper"]);
  });
  it("gives each test exactly one supported answer", () => {
    expect(D.claims).toHaveLength(3);
    for (const claim of D.claims) expect(claim.test.options.filter((o) => o.right), claim.id).toHaveLength(1);
  });
  it("keeps the facts the page leans on", () => {
    expect(D.words.find((w) => w.id === "bread")?.count).toBe(297);
    expect(HH.breadTags).toBeGreaterThan(280);
    expect(HH.breadTags).toBeLessThan(310);
    expect(D.kin.rings.map((r) => r.word)).toEqual(["Tribe", "Clan", "Family", "Man"]);
    expect(bsbWords(verseByLabel.get("Joshua 7:18")!)).toContain("Achan");
    expect(bsbWords(verseByLabel.get("Judges 6:15")!)).toContain("my father");
  });
  it("names the thesis it could not open as located, not read", () => {
    expect(sourceById.get("wilson")?.status).toBe("located");
    expect(sourceById.get("stager")?.status).toBe("located");
  });
});

describe("Home and household study: its pictures", () => {
  it("credits each one with a licence and a link", () => {
    for (const p of D.pictures) {
      for (const field of [p.credit, p.licence, p.licenceUrl, p.href, p.retrieved, p.alt]) expect(field.length, p.id).toBeGreaterThan(2);
      expect(["CC0", "Public domain"], p.id).toContain(p.licence);
    }
    for (const o of D.objects) expect(pictureById.has(o.picture), o.id).toBe(true);
  });
  it("keeps every file in the public folder, small, and within the set's budget", () => {
    let total = 0;
    for (const p of D.pictures) {
      const path = resolve(process.cwd(), "public", p.src.replace(/^\//, ""));
      expect(existsSync(path), p.src).toBe(true);
      const { size } = statSync(path);
      expect(size, p.src).toBeLessThanOrEqual(IMAGE_BUDGET);
      total += size;
    }
    expect(total).toBeLessThanOrEqual(SET_BUDGET);
  });
});
