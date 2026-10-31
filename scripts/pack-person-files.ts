import { lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { personPack, personPackPath } from "../src/lib/person-pack.ts";
import { assertFrontEndReadsPersonPacks } from "./person-packs-guard.mjs";

// Release only: replaces data/study/people/<id>.json (one file per person, 3,133 of them) with a few packs, so the
// release stays well inside Cloudflare Workers' 100,000-file limit. Works on the release COPY; the shared data folder, which local
// preview and the Python builds read, keeps its per-person files. The site reads packs only when the study index says
// "personPacks" (src/lib/study.ts loadPersonDetail).

export const PERSON_PACKS = 128;
const ID = /^[a-z0-9_\-.]+$/;
const MAX_PACK_BYTES = 24 * 1024 * 1024;

/** Refuses anything but a real folder inside a .release copy: a link here would delete the shared originals. */
async function assertReleaseCopy(site: string, people: string): Promise<void> {
  for (const dir of [path.join(site, "data"), path.join(site, "data", "study"), people]) {
    if ((await lstat(dir)).isSymbolicLink()) throw new Error(`Person packing refused: ${dir} is a link, not a copied folder.`);
  }
  const real = await realpath(people);
  if (!real.includes(`${path.sep}.release${path.sep}`)) throw new Error(`Person packing refused: ${people} resolves to ${real}, outside a .release copy.`);
}

/** Packs the release site's person files and marks its study index; returns how many people and packs. */
export async function packPersonFiles(site: string, packs = PERSON_PACKS): Promise<{ people: number; packs: number }> {
  const study = path.join(site, "data", "study");
  const people = path.join(study, "people");
  await assertReleaseCopy(site, people);
  assertFrontEndReadsPersonPacks(site);
  const names = (await readdir(people)).sort();
  const strays = names.filter((name) => !name.endsWith(".json") || !ID.test(name.slice(0, -5)));
  if (strays.length) throw new Error(`Person packing refused: ${people} holds files that are not person records: ${strays.slice(0, 5).join(", ")}`);
  const groups = new Map<number, [string, unknown][]>();
  for (const name of names) {
    const id = name.slice(0, -5);
    const group = groups.get(personPack(id, packs)) ?? [];
    group.push([id, JSON.parse(await readFile(path.join(people, name), "utf8"))]);
    groups.set(personPack(id, packs), group);
  }
  await mkdir(path.dirname(path.join(study, personPackPath(0, packs))), { recursive: true });
  for (const [n, entries] of groups) {
    const body = JSON.stringify(Object.fromEntries(entries));
    if (Buffer.byteLength(body) > MAX_PACK_BYTES) throw new Error(`Person pack ${n} is ${Buffer.byteLength(body)} bytes; the limit is ${MAX_PACK_BYTES}. Raise the pack count.`);
    await writeFile(path.join(study, personPackPath(n, packs)), body);
  }
  // Read every pack back and find each person where the site will look, before any original is removed.
  let found = 0;
  for (const n of groups.keys()) {
    const pack = JSON.parse(await readFile(path.join(study, personPackPath(n, packs)), "utf8")) as Record<string, unknown>;
    for (const id of Object.keys(pack)) {
      if (personPack(id, packs) !== n) throw new Error(`Person ${id} was written to pack ${n}, but the site looks in ${personPack(id, packs)}.`);
      found++;
    }
  }
  if (found !== names.length) throw new Error(`Person packs hold ${found} people; expected ${names.length}.`);
  await rm(people, { recursive: true });
  const indexFile = path.join(study, "index.json");
  const index = JSON.parse(await readFile(indexFile, "utf8")) as Record<string, unknown>;
  await writeFile(indexFile, JSON.stringify({ ...index, personPacks: packs }));
  return { people: names.length, packs: groups.size };
}
