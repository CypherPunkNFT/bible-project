/**
 * Meaning search on the visitor's own device (MEANING_SEARCH.md). The pack built by scripts/build-meaning-pack.py
 * (model, engine, fingerprints) is downloaded once into the browser's Cache Storage, then every question is turned into a
 * fingerprint locally and compared with ours. Nothing typed leaves the device; it works offline after setup.
 */
import type { FeatureExtractionPipeline } from "@huggingface/transformers";

export interface PackPart { path: string; size: number }
export interface PackFile { name: string; parts: PackPart[] }
export interface MeaningManifest {
  version: string;
  dimensions: number;
  bytes: number;
  model: string;
  counts: { studies: number; bibleVerses: number };
  files: PackFile[];
  demo: { question: string; studies: string[] }[];
}

export const PACK_BASE = "/search-model";
const CACHE_NAME = "bp-meaning";
const INSTALLED_KEY = "bp-meaning-version";

const fileUrl = (manifest: MeaningManifest, name: string) => new URL(`${PACK_BASE}/${manifest.version}/${name}`, window.location.href).href;

export async function fetchManifest(): Promise<MeaningManifest> {
  const response = await fetch(`${PACK_BASE}/meaning.json`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`meaning search: ${response.url} returned ${response.status}; expected the pack manifest`);
  return (await response.json()) as MeaningManifest;
}

export function installedVersion(): string | null {
  try {
    return localStorage.getItem(INSTALLED_KEY);
  } catch (error) {
    console.warn("meaning search: localStorage unavailable", error);
    return null;
  }
}

/** Can this device run it? Checked before offering the download. */
export async function checkDevice(bytesNeeded: number): Promise<{ ok: boolean; reason: string }> {
  if (typeof WebAssembly !== "object") return { ok: false, reason: "This browser cannot run WebAssembly, which meaning search needs." };
  if (typeof caches === "undefined") return { ok: false, reason: "This browser does not allow sites to store files (private mode can do this)." };
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory < 2) return { ok: false, reason: `This device reports ${memory} GB of memory; meaning search needs about 2 GB.` };
  const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
  if (estimate?.quota !== undefined && estimate.quota - (estimate.usage ?? 0) < bytesNeeded * 1.5) {
    return { ok: false, reason: `Not enough free browser storage: about ${Math.round(bytesNeeded / 1e6)} MB is needed.` };
  }
  return { ok: true, reason: "" };
}

/** Download one file (all its parts), reporting bytes as they arrive; returns it whole. */
async function downloadFile(manifest: MeaningManifest, file: PackFile, onBytes: (n: number) => void): Promise<Blob> {
  const dir = file.name.includes("/") ? file.name.slice(0, file.name.lastIndexOf("/") + 1) : "";
  const blobs: Blob[] = [];
  for (const part of file.parts) {
    const response = await fetch(fileUrl(manifest, dir + part.path));
    if (!response.ok || !response.body) throw new Error(`meaning search: ${response.url} returned ${response.status}; expected part of ${file.name}`);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      onBytes(value.byteLength);
    }
    const blob = new Blob(chunks as BlobPart[]);
    if (blob.size !== part.size) throw new Error(`meaning search: ${dir + part.path} is ${blob.size} bytes; expected ${part.size}`);
    blobs.push(blob);
  }
  return new Blob(blobs);
}

/** Download the whole pack into browser storage. `onProgress` gets 0..1. */
export async function installPack(manifest: MeaningManifest, onProgress: (fraction: number) => void): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  let done = 0;
  for (const file of manifest.files) {
    const url = fileUrl(manifest, file.name);
    if (await cache.match(url)) {
      done += file.parts.reduce((total, part) => total + part.size, 0);
      continue;
    }
    const blob = await downloadFile(manifest, file, (n) => { done += n; onProgress(Math.min(1, done / manifest.bytes)); });
    await cache.put(url, new Response(blob, { headers: { "Content-Length": String(blob.size) } }));
  }
  onProgress(1);
  await navigator.storage?.persist?.().catch(() => false); // ask the browser not to evict it; harmless if refused
  try {
    localStorage.setItem(INSTALLED_KEY, manifest.version);
  } catch (error) {
    console.warn("meaning search: could not remember the installed version", error);
  }
}

/** Remove everything meaning search stored on this device. */
export async function removePack(): Promise<void> {
  await caches.delete(CACHE_NAME);
  try {
    localStorage.removeItem(INSTALLED_KEY);
  } catch (error) {
    console.warn("meaning search: could not forget the installed version", error);
  }
  extractor = null;
}

export async function packSize(): Promise<number> {
  const cache = await caches.open(CACHE_NAME);
  let total = 0;
  for (const request of await cache.keys()) total += Number((await cache.match(request))?.headers.get("Content-Length") ?? 0);
  return total;
}

async function cachedBytes(manifest: MeaningManifest, name: string): Promise<ArrayBuffer> {
  const response = await (await caches.open(CACHE_NAME)).match(fileUrl(manifest, name));
  if (!response) throw new Error(`meaning search: ${name} is not on this device; turn meaning search on again`);
  return response.arrayBuffer();
}
export const cachedJson = async <T>(manifest: MeaningManifest, name: string): Promise<T> => JSON.parse(new TextDecoder().decode(await cachedBytes(manifest, name))) as T;
export const cachedVectors = async (manifest: MeaningManifest, name: string): Promise<Int8Array> => new Int8Array(await cachedBytes(manifest, name));

let extractor: Promise<FeatureExtractionPipeline> | null = null;

/** The model, loaded from browser storage only (never the network). */
function loadExtractor(manifest: MeaningManifest): Promise<FeatureExtractionPipeline> {
  extractor ??= (async () => {
    const { env, pipeline } = await import("@huggingface/transformers");
    const cache = await caches.open(CACHE_NAME);
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = new URL(`${PACK_BASE}/${manifest.version}/`, window.location.href).href;
    env.useBrowserCache = false;
    env.useCustomCache = true;
    env.customCache = { match: (request: RequestInfo | URL) => cache.match(request), put: async () => undefined }; // the pack is already stored
    const onnx = env.backends.onnx as { wasm?: { wasmPaths?: unknown; numThreads?: number } };
    // The plain CPU engine (14 MB) from the pack; its loader script is handed over as a blob so it works offline too.
    const loader = await cachedBytes(manifest, "engine/ort-wasm-simd-threaded.mjs");
    if (onnx.wasm) {
      onnx.wasm.wasmPaths = { mjs: URL.createObjectURL(new Blob([loader], { type: "text/javascript" })), wasm: fileUrl(manifest, "engine/ort-wasm-simd-threaded.wasm") };
      onnx.wasm.numThreads = 1;
    }
    return pipeline("feature-extraction", "model", { device: "wasm", dtype: "q8" }) as Promise<FeatureExtractionPipeline>;
  })();
  extractor.catch(() => { extractor = null; });
  return extractor;
}

/** A question's fingerprint: Granite pools on its first (CLS) token, then unit length, as the pack's fingerprints were made. */
export async function embedQuestion(manifest: MeaningManifest, text: string): Promise<Float32Array> {
  const run = await loadExtractor(manifest);
  const output = await run(text, { pooling: "cls", normalize: true });
  return output.data as Float32Array;
}

/** Indices of the `k` stored fingerprints closest to `query` (best first), with a 0..1-ish score. */
export function nearest(query: Float32Array, vectors: Int8Array, dimensions: number, k: number): { index: number; score: number }[] {
  const count = vectors.length / dimensions;
  const top: { index: number; score: number }[] = [];
  for (let i = 0; i < count; i++) {
    let dot = 0;
    const offset = i * dimensions;
    for (let d = 0; d < dimensions; d++) dot += vectors[offset + d] * query[d];
    const score = dot / 127;
    if (top.length < k || score > top[top.length - 1].score) {
      top.push({ index: i, score });
      top.sort((a, b) => b.score - a.score);
      if (top.length > k) top.pop();
    }
  }
  return top;
}
