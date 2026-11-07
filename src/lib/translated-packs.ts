// Reads a translated content file out of its language's packs on a release that packs them (src/lib/language-packs.ts,
// scripts/pack-language-files.ts). On the preview, or a release made before packing, the language has no manifest, and
// every caller reads the file itself as before.
import { onLanguageChange } from "./language";
import { packPath, parsePackManifest, PACK_MANIFEST, type PackManifest } from "./language-packs";

/** A pack or manifest that should be there and could not be read; the caller shows the English. */
export class PackUnavailable extends Error {
  constructor(
    public readonly path: string,
    reason: string,
  ) {
    super(`translated pack for ${path}: ${reason}`);
    this.name = "PackUnavailable";
  }
}

const TRANSLATED = /^i18n\/([a-z0-9-]+)\/(.+)$/;
const manifests = new Map<string, Promise<PackManifest | null>>();
const packs = new Map<string, Promise<Record<string, unknown>>>();
onLanguageChange(() => packs.clear());

/** The JSON at `url`, or null when the address holds nothing (404, or the site's page served in its place). A failed
 * download or a body cut short is a PackUnavailable too, so the caller shows the English instead of failing the page. */
async function readJsonOrNothing(url: string, cache: RequestCache, what: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { cache });
  } catch (error) {
    throw new PackUnavailable(what, `${url}: ${String(error)}`);
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new PackUnavailable(what, `HTTP ${response.status} for ${url}`);
  if (!(response.headers.get("content-type") ?? "").includes("json")) return null;
  try {
    return await response.json();
  } catch (error) {
    throw new PackUnavailable(what, `${url}: ${String(error)}`);
  }
}

/** The language's manifest, or null when it ships no packs. Only a definite "nothing there" is kept for the session. */
function manifestFor(folder: string, fresh = false): Promise<PackManifest | null> {
  let pending = fresh ? undefined : manifests.get(folder);
  if (!pending) {
    pending = readJsonOrNothing(`/data/i18n/${folder}/${PACK_MANIFEST}`, "no-cache", folder).then((value) => {
      if (value === null) return null;
      const manifest = parsePackManifest(value);
      if (!manifest) console.warn(`translated packs: data/i18n/${folder}/${PACK_MANIFEST} is not a manifest this code reads; reading files one by one`);
      return manifest;
    });
    const reading = pending;
    reading.catch(() => {
      if (manifests.get(folder) === reading) manifests.delete(folder); // never a newer read made meanwhile
    });
    manifests.set(folder, reading);
  }
  return pending;
}

function packFor(url: string, what: string): Promise<Record<string, unknown>> {
  let pending = packs.get(url);
  if (!pending) {
    pending = readJsonOrNothing(url, "default", what).then((value) => {
      if (value === null) throw new PackUnavailable(what, `${url} is missing`);
      if (typeof value !== "object" || Array.isArray(value)) throw new PackUnavailable(what, `${url} is not a pack`);
      return value as Record<string, unknown>;
    });
    const reading = pending;
    reading.catch(() => {
      if (packs.get(url) === reading) packs.delete(url);
    });
    packs.set(url, reading);
  }
  return pending;
}

async function entryFrom(manifest: PackManifest, folder: string, path: string, translated: string): Promise<{ value: unknown } | null> {
  const n = manifest.packs.get(path);
  if (n === undefined) return null;
  const pack = await packFor(`/data/${packPath(folder, manifest.version, n)}`, translated);
  if (!Object.prototype.hasOwnProperty.call(pack, path)) throw new PackUnavailable(translated, `pack ${n} does not hold it`);
  return { value: pack[path] };
}

/**
 * `translated` is a path under data/ such as "i18n/es/topics/t/grace.json". Returns its JSON from the language's packs,
 * or null when the language ships no packs or does not pack this file (read the file itself). A pack that has gone
 * (a newer release replaced it) makes it read the manifest again once. Throws PackUnavailable when it cannot be read.
 */
export async function readPacked(translated: string): Promise<{ value: unknown } | null> {
  const match = TRANSLATED.exec(translated);
  if (!match) return null;
  const [, folder, path] = match;
  const manifest = await manifestFor(folder);
  if (!manifest) return null;
  try {
    return await entryFrom(manifest, folder, path, translated);
  } catch (error) {
    if (!(error instanceof PackUnavailable)) throw error;
    const fresh = await manifestFor(folder, true);
    if (!fresh || fresh.version === manifest.version) throw error;
    return entryFrom(fresh, folder, path, translated);
  }
}
