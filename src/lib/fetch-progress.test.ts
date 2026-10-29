import { describe, expect, it } from "vitest";
import { knownLength, readWithProgress } from "./fetch-progress";

const streamOf = (...chunks: number[][]) => new ReadableStream<Uint8Array>({
  start(controller) { chunks.forEach(c => controller.enqueue(new Uint8Array(c))); controller.close(); },
});

describe("readWithProgress", () => {
  it("counts the bytes as each chunk arrives and returns them in order", async () => {
    const seen: number[] = [];
    const bytes = await readWithProgress(new Response(streamOf([1, 2], [3], [4, 5, 6])), n => seen.push(n));
    expect(seen).toEqual([2, 3, 6]);
    expect([...bytes]).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("fills a buffer of the expected size, and returns what came when the body is shorter", async () => {
    expect([...await readWithProgress(new Response(streamOf([1, 2], [3])), () => {}, 3)]).toEqual([1, 2, 3]);
    expect([...await readWithProgress(new Response(streamOf([1])), () => {}, 3)]).toEqual([1]);
  });

  it("refuses a body longer than expected", async () => {
    await expect(readWithProgress(new Response(streamOf([1, 2], [3, 4])), () => {}, 3)).rejects.toThrow(/longer than the expected 3 bytes/);
  });

  it("reads a response without a body stream in one go", async () => {
    const response = new Response(new Uint8Array([7, 8]));
    Object.defineProperty(response, "body", { value: null });
    const seen: number[] = [];
    expect([...await readWithProgress(response, n => seen.push(n))]).toEqual([7, 8]);
    expect(seen).toEqual([2]);
  });
});

describe("knownLength", () => {
  it("uses a positive Content-Length of uncompressed bytes only", () => {
    expect(knownLength(new Response("x", { headers: { "content-length": "120" } }))).toBe(120);
    expect(knownLength(new Response("x", { headers: { "content-length": "120", "content-encoding": "gzip" } }))).toBeNull();
    expect(knownLength(new Response("x", { headers: { "content-length": "0" } }))).toBeNull();
    expect(knownLength(new Response("x"))).toBeNull();
  });
});
