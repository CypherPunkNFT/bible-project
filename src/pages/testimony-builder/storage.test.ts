// The draft in storage and in files (design §4 and §9): rebuilt from damaged, hostile and oversized data, unknown ids
// dropped, a newer version shown and not written, blocked and full storage, the draft file's shape and its refusals.
import { afterEach, describe, expect, it, vi } from "vitest";
import { LONG_LIMIT, NAME_LIMIT } from "./questions";
import { FILE_KIND, MAX_FILE_BYTES, STORAGE_KEY, VERSION, answeredCount, browserStore, cleanAnswer, clearStored, cutTo, draftFileName, draftFileText, readAnswers, readDraftFile, readOpen, readStored, writeOpen, writeStored } from "./storage";
import { questionById } from "./questions";

afterEach(() => { localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });

const began = questionById("began")!;
const name = questionById("name")!;

describe("rebuilding answers", () => {
  it("walks the known ids only and keeps strings that say something", () => {
    const read = readAnswers({ began: "Home.", nothing: "x", name: 12, title: "   ", __proto__: { scene: "polluted" }, constructor: "c" });
    expect(read).toEqual({ began: "Home." });
    expect(Object.keys(read)).toEqual(["began"]);
  });

  it("reads nothing from an array, a string or null", () => {
    expect(readAnswers(["Home."])).toEqual({});
    expect(readAnswers("Home.")).toEqual({});
    expect(readAnswers(null)).toEqual({});
  });

  it("removes control characters, keeps newlines and tabs, and normalises CRLF", () => {
    const typed = ["a", String.fromCharCode(0), "b", String.fromCharCode(7), "c\r\nd\te", String.fromCharCode(0x202e), "f"].join("");
    expect(cleanAnswer(began, typed)).toBe("abc\nd\tef");
  });

  it("cuts to the limit without splitting an emoji, and a line answer loses its newlines", () => {
    const long = "x".repeat(LONG_LIMIT + 5);
    expect(cleanAnswer(began, long)).toHaveLength(LONG_LIMIT);
    const emoji = "y".repeat(LONG_LIMIT - 1) + "😀";
    expect(cleanAnswer(began, emoji)).toBe("y".repeat(LONG_LIMIT - 1));
    expect(cutTo("ab", 5)).toBe("ab");
    expect(cleanAnswer(name, "  Lucas\nSmith\n ")).toBe("Lucas Smith");
    expect(cleanAnswer(name, "n".repeat(NAME_LIMIT + 3))).toHaveLength(NAME_LIMIT);
  });

  it("counts answered questions", () => {
    expect(answeredCount({})).toBe(0);
    expect(answeredCount({ began: "x", name: "y", unknown: "z" })).toBe(2);
  });
});

describe("the browser store", () => {
  it("probes storage and reads back what was written", () => {
    const store = browserStore();
    expect(store).not.toBeNull();
    expect(writeStored(store, { began: "Home." })).toBe(true);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved).toMatchObject({ v: VERSION, answers: { began: "Home." } });
    expect(typeof saved.saved).toBe("string");
    expect(readStored(store)).toEqual({ answers: { began: "Home." }, newer: false });
    expect(clearStored(store)).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("starts empty from damaged data and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readStored(localStorage)).toEqual({ answers: {}, newer: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, answers: "nope" }));
    expect(readStored(localStorage)).toEqual({ answers: {}, newer: false });
    expect(warn).toHaveBeenCalled();
  });

  it("shows a newer version's draft and marks it", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION + 1, answers: { began: "Future." } }));
    expect(readStored(localStorage)).toEqual({ answers: { began: "Future." }, newer: true });
  });

  it("works without storage, and says a full store refused", () => {
    expect(readStored(null)).toEqual({ answers: {}, newer: false });
    expect(writeStored(null, { began: "x" })).toBe(false);
    expect(clearStored(null)).toBe(true);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    expect(browserStore()).toBeNull();
    expect(writeStored(localStorage, { began: "x" })).toBe(false);
  });

  it("keeps which question is open per tab, and only a known one", () => {
    expect(readOpen()).toBeNull();
    writeOpen("scene");
    expect(readOpen()).toBe("scene");
    sessionStorage.setItem("bp-testimony-builder-open", "nothing");
    expect(readOpen()).toBeNull();
  });
});

describe("draft files", () => {
  it("hold the answers and the date only, and are named by the local date", () => {
    const date = new Date(2026, 10, 11, 23, 30);
    expect(draftFileName(date)).toBe("bible-guide-testimony-draft-2026-11-11.json");
    expect(JSON.parse(draftFileText({ began: "Home." }, date))).toEqual({ kind: FILE_KIND, v: VERSION, saved: "2026-11-11", answers: { began: "Home." } });
  });

  it("read a draft back, rebuilt", () => {
    const read = readDraftFile(JSON.stringify({ kind: FILE_KIND, v: 1, answers: { began: "Home.", bogus: "x", name: 5 } }));
    expect(read).toEqual({ ok: true, answers: { began: "Home." } });
  });

  it("refuse what is not a draft from this page, and say why", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(readDraftFile("x".repeat(MAX_FILE_BYTES + 1))).toEqual({ ok: false, reason: "too-big" });
    expect(readDraftFile("{nope")).toEqual({ ok: false, reason: "not-draft" });
    expect(readDraftFile(JSON.stringify({ kind: "something-else", v: 1, answers: {} }))).toEqual({ ok: false, reason: "not-draft" });
    expect(readDraftFile(JSON.stringify({ kind: FILE_KIND, v: 1, answers: [] }))).toEqual({ ok: false, reason: "not-draft" });
    expect(readDraftFile(JSON.stringify({ kind: FILE_KIND, v: 1 }))).toEqual({ ok: false, reason: "not-draft" });
    expect(readDraftFile(JSON.stringify({ kind: FILE_KIND, v: 2, answers: {} }))).toEqual({ ok: false, reason: "newer" });
  });
});
