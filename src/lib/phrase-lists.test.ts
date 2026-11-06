import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The small phrase lists in the page (translation system, stage 5 job 17; src/lib/phrase-lists.ts): the core list made
// for the running code first, a code file's part as that file runs, the whole list when idle; the whole list at once
// whenever the parts do not fit.
const BUILD = "index-AAAAAAAA.js";
const PAGE = "MiraclesPage-BBBBBBBB.js";
const CORE = { build: BUILD, groups: { [PAGE]: "g01", "TopicsPage-EEEEEEEE.js": "g02" }, phrases: { "Every subject. Every verse.": "Cada tema. Cada versículo." } };
const PART = { build: BUILD, phrases: { "The miracles of Jesus": "Los milagros de Jesús" } };
const WHOLE = { ...CORE.phrases, ...PART.phrases, "Only in the whole list": "Solo en la lista entera" };

type Answers = Record<string, unknown>;
let fetched: Array<[string, RequestCache | undefined]> = [];
let idle: Array<() => void> = [];

/** fetch answering from `answers` by address (a number is an HTTP failure, a Promise is awaited first). */
function serve(answers: Answers) {
  fetched = [];
  vi.stubGlobal("fetch", async (address: string, init?: RequestInit) => {
    fetched.push([address, init?.cache]);
    const answer = await answers[address.split("?")[0]];
    if (answer === undefined) return new Response("<!doctype html>", { status: 200 }); // the site's fallback page
    if (typeof answer === "number") return new Response("", { status: answer });
    return new Response(JSON.stringify(answer));
  });
}

/** A fresh page in Spanish running `build` (null: no built code, as in development). */
async function page(build: string | null = BUILD) {
  vi.resetModules();
  document.head.replaceChildren(...(build ? [Object.assign(document.createElement("script"), { type: "module", src: `/assets/${build}` })] : []));
  localStorage.setItem("bp-language", "es");
  const lists = await import("./phrase-lists");
  const memory = await import("./phrase-memory");
  const arrived = vi.fn();
  lists.onWordsArrived(arrived);
  return { lists, arrived, knows: (english: string) => memory.phrase(english, "es") };
}

// Timers are pretend (each test's page would otherwise leave its own running into the next); fetches still need real turns.
const flush = async () => {
  for (let round = 0; round < 10; round++) await new Promise((done) => setImmediate(done));
};
const addresses = () => fetched.map(([address]) => address);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  idle = [];
  vi.stubGlobal("requestIdleCallback", (task: () => void) => idle.push(task));
  delete window.__bgEarly;
  delete window.__bgStamp;
  delete window.__bgChunks;
});
afterEach(() => {
  vi.clearAllTimers();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
});

describe("the first words of a page", () => {
  it("reads the core list made for the running code, then a code file's part as it runs, then the whole list when idle", async () => {
    serve({ "/data/i18n/es/phrases/core.json": CORE, "/data/i18n/es/phrases/g01.json": PART, "/data/i18n/es/ui.json": WHOLE });
    const { lists, arrived, knows } = await page();
    await lists.loadFirstWords("es");
    expect(addresses()).toEqual(["/data/i18n/es/phrases/core.json"]);
    expect(knows("Every subject. Every verse.")).toBe("Cada tema. Cada versículo.");
    expect(knows("The miracles of Jesus")).toBeNull();

    window.__bgChunks!.push(`http://127.0.0.1:8931/assets/${PAGE}`);
    window.__bgChunks!.push("http://127.0.0.1:8931/assets/Unlisted-CCCCCCCC.js"); // no part: nothing to read
    await lists.wordsForLoadedCode();
    expect(knows("The miracles of Jesus")).toBe("Los milagros de Jesús");
    expect(addresses()).toEqual(["/data/i18n/es/phrases/core.json", "/data/i18n/es/phrases/g01.json"]);
    expect(arrived).toHaveBeenCalledWith("es");

    expect(knows("Only in the whole list")).toBeNull();
    expect(idle).toEqual([]); // not at once: the browser looks idle while it waits for a page's code
    await vi.advanceTimersByTimeAsync(900);
    expect(idle).toEqual([]);
    await vi.advanceTimersByTimeAsync(200);
    expect(idle.length).toBe(1);
    idle.forEach((task) => task());
    await flush();
    expect(knows("Only in the whole list")).toBe("Solo en la lista entera"); // late, never lost
    expect(arrived).toHaveBeenCalledTimes(2);
  });

  it("counts code files that ran before the site's own code was listening", async () => {
    serve({ "/data/i18n/es/phrases/core.json": CORE, "/data/i18n/es/phrases/g01.json": PART });
    window.__bgChunks = [`/assets/${PAGE}`];
    const { lists, knows } = await page();
    await lists.loadFirstWords("es");
    await lists.wordsForLoadedCode();
    expect(knows("The miracles of Jesus")).toBe("Los milagros de Jesús");
  });

  it("reads the whole list instead when the lists were made for other code, are missing, or no code is built", async () => {
    for (const [build, core] of [[BUILD, { ...CORE, build: "index-OLDOLDOL.js" }], [BUILD, 404], [BUILD, undefined], [null, CORE]] as const) {
      serve({ "/data/i18n/es/phrases/core.json": core, "/data/i18n/es/ui.json": WHOLE });
      const { lists, knows } = await page(build);
      await lists.loadFirstWords("es");
      expect(knows("Only in the whole list"), `${build} ${JSON.stringify(core)}`).toBe("Solo en la lista entera");
      expect(addresses().at(-1)).toBe("/data/i18n/es/ui.json");
    }
  });

  it("still reads a page's part while the whole list is on its way, and none once it is learned", async () => {
    let answer!: (value: unknown) => void;
    serve({ "/data/i18n/es/phrases/core.json": CORE, "/data/i18n/es/phrases/g01.json": PART, "/data/i18n/es/ui.json": new Promise((done) => (answer = done)) });
    const { lists, knows } = await page();
    await lists.loadFirstWords("es");
    void lists.loadWholeList("es"); // as the language menu does on a pointer resting on it
    window.__bgChunks!.push(`/assets/${PAGE}`);
    await lists.wordsForLoadedCode();
    expect(knows("The miracles of Jesus")).toBe("Los milagros de Jesús");
    answer(WHOLE);
    await flush();
    fetched = [];
    window.__bgChunks!.push("/assets/TopicsPage-EEEEEEEE.js");
    expect(addresses()).toEqual([]);
  });

  it("reads the whole list when a part fails, so its page is not left in English", async () => {
    serve({ "/data/i18n/es/phrases/core.json": CORE, "/data/i18n/es/phrases/g01.json": { ...PART, build: "index-OLDOLDOL.js" }, "/data/i18n/es/ui.json": WHOLE });
    const { lists, arrived, knows } = await page();
    await lists.loadFirstWords("es");
    window.__bgChunks!.push(`/assets/${PAGE}`);
    await lists.wordsForLoadedCode();
    expect(knows("The miracles of Jesus")).toBe("Los milagros de Jesús");
    expect(arrived).toHaveBeenCalledWith("es");
  });

  it("takes over the fetch index.html started, and asks again only when that one failed to answer", async () => {
    serve({ "/data/i18n/es/ui.json": WHOLE, "/data/i18n/es/phrases/core.json": CORE });
    window.__bgEarly = { "/data/i18n/es/phrases/core.json": Promise.resolve(CORE) };
    let { lists, knows } = await page();
    await lists.loadFirstWords("es");
    expect(addresses()).toEqual([]);
    expect(knows("Every subject. Every verse.")).toBe("Cada tema. Cada versículo.");

    fetched = [];
    window.__bgEarly = { "/data/i18n/es/phrases/core.json": Promise.resolve(null) };
    ({ lists, knows } = await page());
    await lists.loadFirstWords("es");
    expect(addresses()).toEqual(["/data/i18n/es/phrases/core.json"]);

    fetched = [];
    window.__bgEarly = { "/data/i18n/es/phrases/core.json": Promise.resolve(503) };
    ({ lists, knows } = await page());
    await lists.loadFirstWords("es");
    expect(addresses()).toEqual(["/data/i18n/es/ui.json"]); // a failure is not asked again: the whole list instead
  });

  it("asks for the stamped lists, which the browser may keep, once a release has stamped the page", async () => {
    serve({ "/data/i18n/es/phrases/core.json": CORE, "/data/i18n/es/phrases/g01.json": PART });
    window.__bgStamp = "0123456789ab";
    const { lists } = await page();
    await lists.loadFirstWords("es");
    window.__bgChunks!.push(`/assets/${PAGE}`);
    await lists.wordsForLoadedCode();
    expect(fetched).toEqual([["/data/i18n/es/phrases/core.json?v=0123456789ab", "default"], ["/data/i18n/es/phrases/g01.json?v=0123456789ab", "default"]]);
  });

  it("ignores a stamp that is not 12 hex letters", async () => {
    serve({ "/data/i18n/es/phrases/core.json": CORE });
    window.__bgStamp = "../../x";
    const { lists } = await page();
    await lists.loadFirstWords("es");
    expect(fetched).toEqual([["/data/i18n/es/phrases/core.json", "no-cache"]]);
  });

  it("on this computer's preview, can be told to read the parts only, so a reading shows what they miss", async () => {
    serve({ "/data/i18n/es/phrases/core.json": CORE, "/data/i18n/es/ui.json": WHOLE });
    const { lists } = await page();
    localStorage.setItem("bp-phrase-lists", "parts-only");
    await lists.loadFirstWords("es");
    await vi.advanceTimersByTimeAsync(5000);
    expect(idle).toEqual([]);
  });

  it("draws a page after a moment at most when its part does not come", async () => {
    let answer!: (value: unknown) => void;
    serve({ "/data/i18n/es/phrases/core.json": CORE, "/data/i18n/es/phrases/g01.json": new Promise((done) => (answer = done)) });
    const { lists, knows } = await page();
    await lists.loadFirstWords("es");
    window.__bgChunks!.push(`/assets/${PAGE}`);
    const drawn = vi.fn();
    void lists.wordsForLoadedCode().then(drawn);
    await vi.advanceTimersByTimeAsync(1600);
    expect(drawn).toHaveBeenCalled();
    answer(PART);
    await flush();
    expect(knows("The miracles of Jesus")).toBe("Los milagros de Jesús"); // swapped in when it comes
  });
});
