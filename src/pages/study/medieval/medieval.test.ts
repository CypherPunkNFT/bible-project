import { bsbWords } from "@/lib/bsb-for-tests";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STUDY_BRANCHES } from "@/pages/study/hub/collections";
import { communion, DEFAULT_EVENT, DEFAULT_STEP, findEvent, findStep, pictureShown, SPLIT, splitPlace, splitRungs, witnessSides } from "./model";
import { notesById, parseChecked, plainText } from "@/pages/study/check-notes/checked";
import { ageShare, articleArc, axisPlace, D, DEFAULT_PART, DEFAULT_ROUND, DEFAULT_SPOT, DEFAULT_STATION, DEFAULT_YEAR, findField, findOpened, findPair, findPart, findRound, findSpot, findStation, laneOffset, MIRROR, mirrorLayout, MV, panDrop, parseYear, PLAN_STOPS, readerHref, readingTag, sourceById, sourceCounts, stationMark, stationState, threadPath, verseByLabel, writtenLag, YEAR_FROM, YEAR_TO } from "./model";

const IMAGE_BUDGET = 150_000;
const SET_BUDGET = 1_000_000;
const RECORD_BUDGET = 120_000;
const DATA_BUDGET = 40_000;
const RECORD = "content/academic-research/33-the-medieval-church.json";
const EXTERNAL = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i;
const HREF = "/study/the-medieval-church";
const BAD = ["__proto__", "constructor", "toString", "pair:__proto__", "pair:nope", "pair:", "", "<script>"];

describe("The medieval church: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("ACT", 2, 41)).toBe("/read/bsb/ACT/2?hl=41-41");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of BAD) {
      expect(findOpened(bad)).toBeNull();
      expect(findField(bad)).toBeNull();
      expect(findStation(bad).id).toBe(DEFAULT_STATION);
      expect(findRound(bad).id).toBe(DEFAULT_ROUND);
      expect(findPart(bad).id).toBe(DEFAULT_PART);
      expect(findSpot(bad).id).toBe(DEFAULT_SPOT);
      expect(findStep(bad).id).toBe(DEFAULT_STEP);
      expect(findEvent(bad).id).toBe(DEFAULT_EVENT);
      expect(findPair(bad, null).id).toBe("dictatus");
    }
    expect(findOpened(null)).toBeNull();
  });
  it("opens each pair only by its own key", () => {
    for (const p of D.pairs) expect(findOpened(`pair:${p.id}`)).toEqual(p);
    expect(findOpened("temples")).toBeNull();
  });
  it("reads a year only from three or four digits, held inside the period", () => {
    for (const bad of ["abc", "1e9", "-5", "", "Infinity", "12", "12345", "1000.5", null]) expect(parseYear(bad), String(bad)).toBe(DEFAULT_YEAR);
    expect(parseYear("100")).toBe(YEAR_FROM);
    expect(parseYear("9999")).toBe(YEAR_TO);
    expect(parseYear("1215")).toBe(1215);
  });
  it("lets the field win when the address asks for a pair the field hides", () => {
    const school = findField("school");
    expect(findPair("temples", school).field).toBe("school");
    expect(findPair("aristotle", school).id).toBe("aristotle");
    expect(findPair("temples", null).id).toBe("temples");
    for (const field of D.fields) expect(findPair(null, field).field).toBe(field.id);
  });
  it("gives a range three states, so a range is never read as a point", () => {
    const uppsala = D.stations.find((s) => s.id === "uppsala")!;
    expect(stationState(uppsala, 800)).toBe("before");
    expect(stationState(uppsala, 830)).toBe("during");
    expect(stationState(uppsala, 1100)).toBe("during");
    expect(stationState(uppsala, 1101)).toBe("after");
  });
  it("never says a story was written after the events when it was written during them", () => {
    for (const id of ["saxony-land", "uppsala", "jelling"]) expect(writtenLag(D.stations.find((s) => s.id === id)!), id).toBe("written while this was under way");
    for (const s of D.stations) {
      if (s.written > s.to) expect(writtenLag(s), s.id).toMatch(/^written about \d*[05] years after$/);
      expect(s.written, s.id).toBeGreaterThanOrEqual(s.from);
    }
    expect(writtenLag({ to: 506, written: 590 })).toBe("written about 85 years after");
  });
  it("says what was read of every status it uses, and counts them all", () => {
    expect(new Set(D.sources.map((s) => readingTag(s.status)))).toEqual(new Set(["read", "part read", "reported second-hand", "located, not read"]));
    const counts = sourceCounts(D.sources);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(D.sources.length);
  });
});

describe("The medieval church: the mirror line", () => {
  it("draws every mark inside the drawing, both ways round", () => {
    for (const orientation of ["wide", "tall"] as const) {
      const { cross, start, end } = MIRROR[orientation], layout = mirrorLayout(orientation);
      for (const marks of [layout.declared, layout.followed]) {
        expect(marks.size).toBe(D.pairs.length);
        for (const [id, mark] of marks) {
          expect(laneOffset(mark.lane) + MIRROR.radius, `${orientation} ${id}`).toBeLessThan(cross);
          expect(mark.start, id).toBeGreaterThanOrEqual(start);
          expect(mark.end, id).toBeLessThanOrEqual(end);
        }
      }
      for (const p of D.pairs) expect(threadPath(p.id, layout, orientation), p.id).not.toContain("NaN");
    }
  });
  it("keeps the marks on one side from touching, however many fall in one year", () => {
    for (const orientation of ["wide", "tall"] as const) {
      const layout = mirrorLayout(orientation);
      for (const marks of [layout.declared, layout.followed]) {
        const list = [...marks.values()];
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
          const apart = Math.hypot(list[i].middle - list[j].middle, laneOffset(list[i].lane) - laneOffset(list[j].lane));
          expect(apart, `${orientation} ${i} ${j}`).toBeGreaterThanOrEqual(MIRROR.radius * 2);
        }
      }
    }
  });
  it("places a mark at its stated years and moves none along the line", () => {
    const layout = mirrorLayout("wide"), lateran = D.pairs.filter((p) => p.declared.from === 1215).map((p) => layout.declared.get(p.id)!);
    expect(lateran.length).toBeGreaterThanOrEqual(4);
    for (const mark of lateran) expect(mark.start).toBe(axisPlace(1215, "wide"));
    expect(new Set(lateran.map((m) => m.lane)).size).toBe(lateran.length);
  });
  it("draws as dashed only the pairs this study merely set side by side, and says so of the first", () => {
    expect(D.pairs.filter((p) => p.link === "beside").map((p) => p.id)).toEqual(["temples", "simon", "rouen", "lambeth"]);
    expect(D.pairs.find((p) => p.id === "temples")?.limit).toContain("nothing connects them");
  });
  it("keeps each pair's dates running forward, in its field", () => {
    for (const p of D.pairs) {
      expect(p.declared.from, p.id).toBeLessThanOrEqual(p.followed.from);
      expect(p.declared.from, p.id).toBeLessThanOrEqual(p.declared.to);
      expect(p.followed.from, p.id).toBeLessThanOrEqual(p.followed.to);
      expect(sourceById.has(p.declared.source), p.id).toBe(true);
      expect(sourceById.has(p.followed.source), p.id).toBe(true);
      for (const side of [p.declared, p.followed]) expect(side.quote || side.what, `${p.id}: a side says nothing`).toBeTruthy();
    }
  });
});

describe("The medieval church: the map, the balance and the plan", () => {
  it("puts every mark on the map, far enough apart to tell at phone width", () => {
    const { width, height } = MV.coast, marks = D.stations.map((s) => stationMark(s).mark);
    for (const [x, y] of marks) { expect(x).toBeGreaterThan(14); expect(x).toBeLessThan(width - 14); expect(y).toBeGreaterThan(14); expect(y).toBeLessThan(height - 14); }
    for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) {
      expect(Math.hypot(marks[i][0] - marks[j][0], marks[i][1] - marks[j][1]), `${D.stations[i].id} ${D.stations[j].id}`).toBeGreaterThanOrEqual(27);
    }
  });
  it("says Poland's mark stands for the country, and no one else's", () => {
    expect(D.stations.filter((s) => !s.placed).map((s) => s.id)).toEqual(["poland"]);
    expect(D.stations.find((s) => s.id === "poland")?.limit).toContain("not a known spot");
  });
  it("uses a shape for force that cannot be read as a cross", () => {
    expect(D.ways.map((w) => w.shape)).toEqual(["book", "crown", "scroll", "blade"]);
  });
  it("gives every round a judgement stated in words, with a reason and a limit, and adds nothing up", () => {
    for (const r of D.rounds) { expect(r.why.length, r.id).toBeGreaterThan(10); expect(r.limit.length, r.id).toBeGreaterThan(10); }
    expect(D.roundsNote).toContain("Nothing here adds up to a score");
    expect(panDrop("level").left).toBeCloseTo(0);
    expect(panDrop("pope").left).toBeGreaterThan(0);
    expect(panDrop("king").right).toBeGreaterThan(0);
  });
  it("has a place on the plan for each of the six stops", () => {
    expect(D.parish.stations.map((s) => s.id)).toEqual(Object.keys(PLAN_STOPS));
  });
  it("ties each reply to its objection both ways, and draws the arc", () => {
    for (const p of D.article.parts) if (p.answeredBy) {
      expect(D.article.parts.find((q) => q.id === p.answeredBy)?.answers, p.id).toBe(p.id);
      expect(articleArc(p.id, p.answeredBy), p.id).toMatch(/^M46 /);
    }
  });
  it("draws the ages to scale, and marks what the statute does not name as worked back", () => {
    const steps = new Map(D.ladder.steps.map((s) => [s.id, s]));
    expect(steps.get("lecture-arts")).toMatchObject({ from: 20, inferred: false });
    expect(steps.get("lecture-theology")).toMatchObject({ from: 35, inferred: false });
    expect(steps.get("hear-arts")?.inferred).toBe(true);
    expect(steps.get("study-theology")?.inferred).toBe(true);
    for (const s of D.ladder.steps) { expect(ageShare(s.from), s.id).toBeGreaterThanOrEqual(0); expect(ageShare(s.to), s.id).toBeLessThanOrEqual(1); }
  });
});

describe("The medieval church: its research record", () => {
  it("was built from this record: the generated data is not stale", () => {
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), RECORD))).digest("hex")).toBe(MV.recordHash);
  });
  it("cites only sources it lists, each saying what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(5);
    const cited = [...D.pairs, ...D.stations, ...D.rounds, ...D.parish.stations, ...D.claims, ...D.split.steps, ...D.crusade.events, D.crusade.debate].flatMap((item) => item.sources);
    for (const id of cited) expect(sourceById.has(id), id).toBe(true);
  });
  it("links outside the site only by https", () => {
    for (const s of D.sources) if (s.id !== "scripture") expect(EXTERNAL.test(s.url), s.id).toBe(true);
    for (const p of D.pictures) {
      expect(EXTERNAL.test(p.href), p.id).toBe(true);
      expect(EXTERNAL.test(p.licenceUrl), p.id).toBe(true);
    }
  });
  it("has a Berean text for every verse it lists, and uses each of them", () => {
    const used = new Set([D.missionStand.verse, ...(D.powersStand.verses ?? []), ...D.rounds.map((r) => r.verse), ...D.article.parts.map((p) => p.verse), ...D.parish.stations.flatMap((s) => s.standVerses ?? []), ...(D.split.stand.verses ?? []), ...(D.crusade.stand.verses ?? []), ...D.crusade.events.map((e) => e.verse)].filter(Boolean));
    for (const { label } of D.verses) {
      expect(used.has(label), label).toBe(true);
      expect(bsbWords(verseByLabel.get(label)!).length, label).toBeGreaterThan(10);
    }
  });
  it("gives each test exactly one supported answer", () => {
    expect(D.claims).toHaveLength(4);
    for (const claim of D.claims) expect(claim.test.options.filter((o) => o.right), claim.id).toHaveLength(1);
  });
  it("marks the site's own word on baptism and the Supper, and defines its word for the rite", () => {
    const stops = new Map(D.parish.stations.map((s) => [s.id, s]));
    expect(stops.get("font")?.stand).toContain("immersion of a believer");
    expect(stops.get("altar")?.stand).toContain("symbolic act of remembrance");
    expect(D.confusedWords.find((w) => w.word === "Baptised and believing")?.note).toContain("reports the medieval rite");
    expect(D.powersStand.text).toContain("A free church in a free state");
  });
  it("hands its neighbours' subjects over", () => {
    const out = D.boundaries.out.join(" ");
    for (const neighbour of ["The early church", "The Reformation and the awakenings", "How the church has read the Bible", "Baptist history", "Jews and Christians"]) expect(out, neighbour).toContain(neighbour);
    expect(D.boundaries.in).toContain("451");
    for (const old of ["Traditions: shared roots", "crusades to the Holy Land and the inquisition have no study"]) expect(out, old).not.toContain(old);
    expect(D.stations.map((s) => s.id)).not.toContain("kyiv");
  });
  it("stays within the budgets for the record and the generated data", () => {
    expect(statSync(resolve(process.cwd(), RECORD)).size).toBeLessThanOrEqual(RECORD_BUDGET);
    expect(statSync(resolve(process.cwd(), "src/pages/study/medieval/medieval-data.json")).size).toBeLessThanOrEqual(DATA_BUDGET);
  });
});

describe("The medieval church: its pictures", () => {
  it("credits each one with a licence and a link", () => {
    for (const p of D.pictures) {
      for (const field of [p.credit, p.licence, p.licenceUrl, p.href, p.retrieved, p.alt]) expect(field.length, p.id).toBeGreaterThan(2);
      expect(p.width, p.id).toBeGreaterThan(0);
    }
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

describe("The medieval church: where it sits", () => {
  it("is a card in its field, promoted as a full study", () => {
    const area = STUDY_BRANCHES.academic.areas.find((a) => a.id === "church")!;
    expect(area.items.find((i) => i.href === HREF)?.kind).toBe("Study");
    const cards = readFileSync(resolve(process.cwd(), "src/pages/study/hub/AcademicCards.tsx"), "utf-8");
    expect(cards).toContain(`'${HREF}'`);
    expect(cards).toContain(`href==='${HREF}'`);
  });
  it("has its route", () => {
    expect(readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf-8")).toContain(`path="${HREF}"`);
  });
});

describe("The medieval church: East and West", () => {
  it("runs its seven steps in order from 451, with Lyon and Florence as unions", () => {
    expect(D.split.steps.map((s) => s.id)).toEqual(["chalcedon", "acacius", "photius", "sentences", "sack", "lyon", "florence"]);
    expect(D.split.steps[0].year).toBe(451);
    for (const id of ["lyon", "florence"]) expect(D.split.steps.find((s) => s.id === id)?.kind).toBe("union");
    for (const s of D.split.steps) expect(s.year <= s.to, s.id).toBe(true);
  });
  it("draws a gap in communion only where the record dates a break, and fades the rungs between 1054 and 1204", () => {
    expect(communion(470)).toBe("yes");
    expect(communion(500)).toBe("no");
    expect(communion(700)).toBe("yes");
    expect(communion(865)).toBe("no");
    expect(communion(1100)).toBe("faint");
    expect(communion(1300)).toBe("no");
    expect(splitRungs().some((r) => r.state === "faint")).toBe(true);
  });
  it("places every step inside the drawing, both ways round", () => {
    for (const orientation of ["wide", "tall"] as const) {
      const { start, end } = SPLIT[orientation];
      for (const s of D.split.steps) {
        expect(splitPlace(s.year, orientation)).toBeGreaterThanOrEqual(start);
        expect(splitPlace(s.to, orientation)).toBeLessThanOrEqual(end);
      }
    }
  });
});

describe("The medieval church: crusade and inquisition", () => {
  it("keeps every event inside 451 to 1350, each with a witness from a side it names", () => {
    const sides = new Set(D.crusade.sides.map((s) => s.id));
    for (const e of D.crusade.events) {
      expect(e.year >= 451 && e.to <= 1350 && e.year <= e.to, e.id).toBe(true);
      expect(e.witnesses.length, e.id).toBeGreaterThan(0);
      for (const w of e.witnesses) {
        expect(sides.has(w.side), `${e.id} ${w.side}`).toBe(true);
        expect(w.written, `${e.id} ${w.who}`).toBeGreaterThanOrEqual(e.year);
      }
    }
    expect(witnessSides(D.crusade.events.find((e) => e.id === "jerusalem")!)).toEqual(new Set(["latin", "muslim", "jewish"]));
  });
  it("reports violence by more than one side, and gives the historians' disagreement", () => {
    const ids = D.crusade.events.map((e) => e.id);
    for (const id of ["rhineland", "jerusalem", "hattin", "beziers", "avignonet", "extirpanda", "gui"]) expect(ids, id).toContain(id);
    expect(D.crusade.debate.text).toContain("Historians disagree");
    expect(D.crusade.stand.text).toContain("Lord of the conscience");
  });
});

describe("The medieval church: check notes", () => {
  const strings = (value: unknown, path = ""): [string, string][] => {
    if (typeof value === "string") return [[path, value]];
    if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
    if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => (k === "checkNotes" ? [] : strings(v, `${path}.${k}`)));
    return [];
  };
  const notes = notesById(D.checkNotes);
  it("has a note for every marker and a marker for every note, at the note's own path", () => {
    const seen = new Map<string, string>();
    for (const [path, text] of strings(D)) for (const seg of parseChecked(text)) if (seg.kind === "check") seen.set(seg.id, path);
    expect([...seen.keys()].sort()).toEqual([...notes.keys()].sort());
    for (const [id, path] of seen) expect(notes.get(id)?.path, id).toBe(path);
    expect(notes.size).toBe(16);
  });
  it("leaves every new note open, numbered from c1, with its words the marked words", () => {
    [...notes.values()].forEach((note, i) => {
      expect(note.id).toBe(`c${i + 1}`);
      expect(note.status).toBe("open");
      expect(note.before).toBe(note.after);
    });
  });
  it("never leaves marker syntax once the markers are read, and keeps markers out of controls and quotations", () => {
    for (const [path, text] of strings(D)) {
      expect(plainText(text), path).not.toMatch(/\{\{|\}\}/);
      if (/^\.(fields|ways|pictures|sources|verses|article)|\.test\./.test(path)) expect(text, path).not.toContain("{{check");
    }
  });
  it("hides a picture whose licence or credit is still open", () => {
    expect(pictureShown({ licence: "open", credit: "x" })).toBe(false);
    expect(pictureShown({ licence: "CC0", credit: "Open" })).toBe(false);
    for (const p of D.pictures) expect(pictureShown(p), p.id).toBe(true);
  });
});
