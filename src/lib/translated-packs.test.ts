// Reading translated files out of a release's language packs (src/lib/translated-packs.ts, translation job 29).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Files = Record<string, unknown>;

/** A fetch that answers from `files` (JSON), 404 for anything else, or the site's page for paths in `html`. */
function serve(files: Files, html: string[] = []) {
  return vi.fn(async (url: string) => {
    const path = String(url).split("?")[0];
    if (html.includes(path)) return new Response("<!doctype html>", { status: 200, headers: { "content-type": "text/html" } });
    if (!(path in files)) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(files[path]), { status: 200, headers: { "content-type": "application/json" } });
  });
}

const VERSION = "0123456789abcdef";
const manifest = (version = VERSION, packs: Record<string, number> = { "topics/t/grace.json": 0 }) => ({ layout: 1, version, packs });

describe("readPacked", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it("finds a packed file in its pack", async () => {
    vi.stubGlobal("fetch", serve({ "/data/i18n/es/packs.json": manifest(), [`/data/i18n/es/packs/${VERSION}/0.json`]: { "topics/t/grace.json": { title: "Gracia" } } }));
    const { readPacked } = await import("./translated-packs");
    expect(await readPacked("i18n/es/topics/t/grace.json")).toEqual({ value: { title: "Gracia" } });
  });

  it("says to read the file itself where the language ships no packs (the preview's page or a 404)", async () => {
    vi.stubGlobal("fetch", serve({}, ["/data/i18n/es/packs.json"]));
    const { readPacked } = await import("./translated-packs");
    expect(await readPacked("i18n/es/topics/t/grace.json")).toBeNull();
    expect(await readPacked("i18n/es/topics/t/love.json")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1); // "no packs" is kept for the session
  });

  it("reads a file the manifest does not list on its own, and refuses a manifest it cannot trust", async () => {
    vi.stubGlobal("fetch", serve({ "/data/i18n/es/packs.json": manifest(), "/data/i18n/hi/packs.json": manifest("../../x") }));
    const { readPacked } = await import("./translated-packs");
    expect(await readPacked("i18n/es/questions/bank.json")).toBeNull();
    expect(await readPacked("i18n/hi/topics/t/grace.json")).toBeNull();
  });

  it("does not keep a server error as 'no packs'", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async () => (++calls === 1 ? new Response("busy", { status: 503 }) : new Response(JSON.stringify(manifest()), { status: 200, headers: { "content-type": "application/json" } }))));
    const { readPacked, PackUnavailable } = await import("./translated-packs");
    await expect(readPacked("i18n/es/topics/t/grace.json")).rejects.toBeInstanceOf(PackUnavailable);
    await expect(readPacked("i18n/es/topics/t/grace.json")).rejects.toBeInstanceOf(PackUnavailable); // the manifest now loads; its pack is missing
    expect(calls).toBeGreaterThan(2);
  });

  it("reads the manifest again when a newer release has replaced the packs", async () => {
    const files: Files = { "/data/i18n/es/packs.json": manifest() };
    vi.stubGlobal("fetch", serve(files));
    const { readPacked } = await import("./translated-packs");
    expect(await readPacked("i18n/es/questions/bank.json")).toBeNull(); // the old manifest is now held
    const newer = "fedcba9876543210";
    files["/data/i18n/es/packs.json"] = manifest(newer);
    files[`/data/i18n/es/packs/${newer}/0.json`] = { "topics/t/grace.json": { title: "Gracia nueva" } };
    expect(await readPacked("i18n/es/topics/t/grace.json")).toEqual({ value: { title: "Gracia nueva" } });
  });

  it("throws when the pack does not hold a file the manifest lists, so the caller shows the English", async () => {
    vi.stubGlobal("fetch", serve({ "/data/i18n/es/packs.json": manifest(), [`/data/i18n/es/packs/${VERSION}/0.json`]: {} }));
    const { readPacked, PackUnavailable } = await import("./translated-packs");
    await expect(readPacked("i18n/es/topics/t/grace.json")).rejects.toBeInstanceOf(PackUnavailable);
  });

  it("makes a pack cut short or a failed download a PackUnavailable (the caller shows the English), and keeps neither", async () => {
    const packUrl = `/data/i18n/es/packs/${VERSION}/0.json`;
    const good = serve({ "/data/i18n/es/packs.json": manifest(), [packUrl]: { "topics/t/grace.json": { title: "Gracia" } } });
    let packCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).split("?")[0] !== packUrl) return good(url);
      packCalls += 1;
      if (packCalls === 1) return new Response('{"topics', { status: 200, headers: { "content-type": "application/json" } });
      if (packCalls === 2) throw new TypeError("Failed to fetch");
      return good(url);
    }));
    const { readPacked, PackUnavailable } = await import("./translated-packs");
    await expect(readPacked("i18n/es/topics/t/grace.json")).rejects.toBeInstanceOf(PackUnavailable); // cut short (the manifest is read again: same version)
    await expect(readPacked("i18n/es/topics/t/grace.json")).rejects.toBeInstanceOf(PackUnavailable); // the download fails
    expect(await readPacked("i18n/es/topics/t/grace.json")).toEqual({ value: { title: "Gracia" } });
  });

  it("makes a failed manifest download a PackUnavailable, and reads the manifest again next time", async () => {
    const good = serve({ "/data/i18n/es/packs.json": manifest(), [`/data/i18n/es/packs/${VERSION}/0.json`]: { "topics/t/grace.json": { title: "Gracia" } } });
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (++calls === 1) throw new TypeError("Failed to fetch");
      return good(url);
    }));
    const { readPacked, PackUnavailable } = await import("./translated-packs");
    await expect(readPacked("i18n/es/topics/t/grace.json")).rejects.toBeInstanceOf(PackUnavailable);
    expect(await readPacked("i18n/es/topics/t/grace.json")).toEqual({ value: { title: "Gracia" } });
  });
});

describe("loadQuestionBank", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("joins a split bank's parts in order", async () => {
    const folder = `questions/bank-parts/2-${VERSION}`;
    const head = { kinds: {}, topics: [], books: [], collections: [], questions: [], questionParts: { count: 2, folder } };
    vi.stubGlobal("fetch", serve({ "/data/questions/bank.json": head, [`/data/${folder}/0.json`]: [{ question: "a" }], [`/data/${folder}/1.json`]: [{ question: "b" }, { question: "c" }] }));
    const { loadQuestionBank } = await import("./data");
    expect((await loadQuestionBank()).questions.map((q) => q.question)).toEqual(["a", "b", "c"]);
  });

  it("reads a whole bank as before", async () => {
    vi.stubGlobal("fetch", serve({ "/data/questions/bank.json": { kinds: {}, topics: [], books: [], collections: [], questions: [{ question: "a" }] } }));
    const { loadQuestionBank } = await import("./data");
    expect((await loadQuestionBank()).questions).toHaveLength(1);
  });
});
