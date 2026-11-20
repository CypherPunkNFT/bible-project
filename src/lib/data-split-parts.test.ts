// A split part (src/lib/data.ts loadSplitPart): fetched without the release stamp, shared while it is on its way, and
// not kept in the session cache once it has arrived (the reader keeps the rows it builds; the browser keeps the file).
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSplitPart } from "./data";

const PART = "list-0.0123456789ab.json";
const reply = (value: unknown) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("split parts", () => {
  it("shares one request between readers while it is on its way, and asks again once it has arrived", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const fetch = vi.fn(async () => { await gate; return reply([[1]]); });
    vi.stubGlobal("fetch", fetch);
    const both = Promise.all([loadSplitPart("scholars", PART), loadSplitPart("scholars", PART)]);
    release();
    expect(await both).toEqual([[[1]], [[1]]]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String((fetch.mock.calls[0] as unknown[])[0])).toBe(`/data/split/scholars/${PART}`);
    await loadSplitPart("scholars", PART);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("lets a failed request be tried again", async () => {
    const fetch = vi.fn(async () => new Response("gone", { status: 404 }));
    vi.stubGlobal("fetch", fetch);
    await expect(loadSplitPart("scholars", PART)).rejects.toThrow(/404/);
    vi.stubGlobal("fetch", vi.fn(async () => reply({ a: 1 })));
    await expect(loadSplitPart("scholars", PART)).resolves.toEqual({ a: 1 });
  });
});
