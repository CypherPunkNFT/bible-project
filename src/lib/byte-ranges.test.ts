import { describe, expect, it } from "vitest";
import { readSlice, serveByteRange, wantsByteRange } from "../../server/byte-ranges.mjs";

const FILE = Uint8Array.from({ length: 1000 }, (_, index) => index % 251);
const URL_BIN = "https://example.test/atlas-tiles/v1/000.bin";

function stream(bytes: Uint8Array, pieceSize = 64) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let at = 0; at < bytes.length; at += pieceSize) controller.enqueue(bytes.slice(at, at + pieceSize));
      controller.close();
    },
  });
}

const assets = (status = 200) => ({
  fetch: async () => new Response(status === 200 ? stream(FILE) : "missing", { status, headers: { "Content-Length": String(FILE.length), "Content-Type": "application/octet-stream" } }),
});
const decliningCache = { match: async () => undefined, put: async (_key: Request, response: Response) => { await response.body?.cancel(); } };
const ranged = (range: string) => new Request(URL_BIN, { headers: { Range: range } });

describe("readSlice", () => {
  it("returns exactly the requested bytes across stream pieces", async () => {
    expect(await readSlice(stream(FILE), 60, 200)).toEqual(FILE.slice(60, 201));
  });
  it("stops at the end of the file", async () => {
    expect(await readSlice(stream(FILE), 990, 2000)).toEqual(FILE.slice(990));
  });
});

describe("wantsByteRange", () => {
  it("takes only ranged reads of the two .bin folders", () => {
    expect(wantsByteRange(ranged("bytes=0-9"))).toBe(true);
    expect(wantsByteRange(new Request("https://example.test/circles/documents-0.bin", { headers: { Range: "bytes=0-9" } }))).toBe(true);
    expect(wantsByteRange(new Request(URL_BIN))).toBe(false);
    expect(wantsByteRange(ranged("bytes=-9"))).toBe(false);
    expect(wantsByteRange(new Request("https://example.test/data/catalog.json", { headers: { Range: "bytes=0-9" } }))).toBe(false);
  });
});

describe("serveByteRange", () => {
  it("cuts the slice itself when the cache declines the file", async () => {
    const response = await serveByteRange(ranged("bytes=100-199"), { ASSETS: assets() }, decliningCache);
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 100-199/1000");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(FILE.slice(100, 200));
  });
  it("answers from the cache when it holds the file", async () => {
    const hit = new Response(FILE.slice(0, 10), { status: 206 });
    const response = await serveByteRange(ranged("bytes=0-9"), { ASSETS: { fetch: async () => { throw new Error("assets must not be read"); } } }, { match: async () => hit, put: async () => undefined });
    expect(response).toBe(hit);
  });
  it("refuses a slice past the end of the file", async () => {
    const response = await serveByteRange(ranged("bytes=5000-5009"), { ASSETS: assets() }, decliningCache);
    expect(response.status).toBe(416);
    expect(response.headers.get("Content-Range")).toBe("bytes */1000");
  });
  it("passes a missing file through unchanged", async () => {
    const response = await serveByteRange(ranged("bytes=0-9"), { ASSETS: assets(404) }, decliningCache);
    expect(response.status).toBe(404);
  });
});
