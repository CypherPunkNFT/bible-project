// Once the person records ship in packs (scripts/pack-person-files.ts), only a front end built with
// src/lib/person-pack.ts can open a person; an older one gets the fallback page and shows every person as unavailable.
// Checked twice: by the packer before packing, and by deploy-pages-resumable.mjs before uploading any site whose study
// index says "personPacks" (for example one assembled from an earlier release's data under an older front end).
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Throws unless one of the site's built scripts asks for person packs. */
export function assertFrontEndReadsPersonPacks(site) {
  const assets = path.join(site, 'assets');
  const scripts = readdirSync(assets, { recursive: true }).map(String).filter((name) => name.endsWith('.js'));
  if (scripts.some((name) => readFileSync(path.join(assets, name), 'utf8').includes('people-packs/'))) return;
  throw new Error(`The front end in ${assets} predates person packs: none of its ${scripts.length} scripts asks for "people-packs/". Build it from current source before releasing.`);
}

/** True when the site's study index says the person records are packed. */
export function sitePacksPeople(site) {
  let text;
  try {
    text = readFileSync(path.join(site, 'data/study/index.json'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  return Boolean(JSON.parse(text).personPacks);
}
