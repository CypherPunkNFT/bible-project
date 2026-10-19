import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fnv1a, personPack, personPackPath } from "./person-pack";

const PEOPLE = path.resolve(__dirname, "../../data/study/people");

/** Serves the given JSON bodies by path; anything else gets the production fallback page (HTML with status 200). */
function serve(files: Record<string, unknown>) {
  vi.stubGlobal("fetch", async (url: string) => {
    const body = files[url.split("?")[0]];
    return body === undefined
      ? new Response("<!doctype html>", { headers: { "content-type": "text/html" } })
      : new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  });
}

describe("person packs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("hashes with standard FNV-1a, so the packer and the site agree", () => {
    expect(fnv1a("").toString(16)).toBe("811c9dc5");
    expect(fnv1a("a").toString(16)).toBe("e40c292c");
    expect(fnv1a("foobar").toString(16)).toBe("bf9cf968");
    expect(personPack("david-rut-4-17", 128)).toBe(personPack("david-rut-4-17", 128));
    expect(personPackPath(5, 128)).toBe("people-packs/128/5.json");
  });

  it.skipIf(!existsSync(PEOPLE))("spreads the real people evenly over 128 packs", () => {
    const counts = new Array<number>(128).fill(0);
    const ids = readdirSync(PEOPLE).map((name) => name.replace(/\.json$/, ""));
    for (const id of ids) counts[personPack(id, 128)]++;
    expect(Math.max(...counts)).toBeLessThanOrEqual((2 * ids.length) / 128);
  });

  it("reads a person's own file when the index names no packs (local preview)", async () => {
    serve({ "/data/study/index.json": { stamp: "s", corrections: [] }, "/data/study/people/abel-gen-4-2.json": { d: "Abel" } });
    const { loadPersonDetail } = await import("./study");
    await expect(loadPersonDetail("abel-gen-4-2")).resolves.toEqual({ d: "Abel" });
  });

  it("reads the person's pack when the index names packs (live site)", async () => {
    const pack = `/data/study/${personPackPath(personPack("abel-gen-4-2", 128), 128)}`;
    serve({ "/data/study/index.json": { stamp: "s", corrections: [], personPacks: 128 }, [pack]: { "abel-gen-4-2": { d: "Abel" } } });
    const { loadPersonDetail } = await import("./study");
    await expect(loadPersonDetail("abel-gen-4-2")).resolves.toEqual({ d: "Abel" });
  });

  it("reports a person missing from its pack, including names every object inherits", async () => {
    const files: Record<string, unknown> = { "/data/study/index.json": { stamp: "s", corrections: [], personPacks: 128 } };
    for (const id of ["nobody-gen-1-1", "constructor"]) files[`/data/study/${personPackPath(personPack(id, 128), 128)}`] = {};
    serve(files);
    const { loadPersonDetail } = await import("./study");
    await expect(loadPersonDetail("nobody-gen-1-1")).rejects.toThrow("not in its pack");
    await expect(loadPersonDetail("constructor")).rejects.toThrow("not in its pack");
  });
});
