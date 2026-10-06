import type { RangeResponse, Source } from "pmtiles";

/** Written by `scripts/build-street-atlas.py split` next to the pieces. */
interface Manifest {
  version: string;
  size: number;
  chunkSize: number;
  chunks: number;
}

/**
 * The map file read as numbered pieces (`<base>/<version>/000.bin` …), because Cloudflare Pages refuses files over
 * 25 MiB. A byte range is fetched from whichever piece(s) hold it; a range that crosses a boundary is stitched together.
 */
export class ChunkedSource implements Source {
  private manifest: Promise<Manifest> | null = null;
  private warnedFullFile = false;

  constructor(private readonly base: string) {}

  getKey(): string {
    return "bible-atlas";
  }

  private loadManifest(): Promise<Manifest> {
    this.manifest ??= fetch(`${this.base}/bible-atlas.json`, { cache: "no-cache" }).then(async (response) => {
      if (!response.ok) throw new Error(`street atlas: manifest ${response.url} returned ${response.status}; expected the map's piece list`);
      return (await response.json()) as Manifest;
    });
    this.manifest.catch(() => { this.manifest = null; }); // retry next time instead of caching a failure
    return this.manifest;
  }

  /** Bytes [start, end] inclusive of one piece. */
  private async readPiece(manifest: Manifest, index: number, start: number, end: number, signal?: AbortSignal): Promise<Uint8Array> {
    const url = `${this.base}/${manifest.version}/${String(index).padStart(3, "0")}.bin`;
    const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, signal });
    if (response.status !== 206 && response.status !== 200) throw new Error(`street atlas: ${url} returned ${response.status}; expected 206 Partial Content`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (response.status === 206) return bytes;
    if (!this.warnedFullFile) console.warn(`street atlas: ${url} ignored the byte range and sent the whole piece (slow, still correct)`);
    this.warnedFullFile = true;
    return bytes.subarray(start, end + 1);
  }

  async getBytes(offset: number, length: number, signal?: AbortSignal): Promise<RangeResponse> {
    const manifest = await this.loadManifest();
    const last = Math.min(offset + length, manifest.size) - 1;
    const parts: Uint8Array[] = [];
    for (let index = Math.floor(offset / manifest.chunkSize); index <= Math.floor(last / manifest.chunkSize); index++) {
      const pieceStart = index * manifest.chunkSize;
      const from = Math.max(offset, pieceStart) - pieceStart;
      const to = Math.min(last, pieceStart + manifest.chunkSize - 1) - pieceStart;
      parts.push(await this.readPiece(manifest, index, from, to, signal));
    }
    const data = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let at = 0;
    for (const part of parts) { data.set(part, at); at += part.length; }
    return { data: data.buffer, cacheControl: "public, max-age=31536000, immutable" };
  }
}
