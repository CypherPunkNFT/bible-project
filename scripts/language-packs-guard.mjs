// Once a release packs the translated files and splits the question bank (scripts/pack-language-files.ts), only a front
// end built with src/lib/translated-packs.ts can read them; an older one would ask for files that are gone and show
// English, or no questions. Checked by the packer before packing, and by deploy-worker.mjs and deploy-pages-resumable.mjs
// before uploading any site whose data is packed (for example one assembled from an earlier release under older code).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MARKERS = ['packs.json', 'questionParts'];

/** Throws unless the site's built scripts read language packs and bank parts. */
export function assertFrontEndReadsLanguagePacks(site) {
  const assets = path.join(site, 'assets');
  const scripts = readdirSync(assets, { recursive: true }).map(String).filter((name) => name.endsWith('.js'));
  const code = scripts.map((name) => readFileSync(path.join(assets, name), 'utf8'));
  const missing = MARKERS.filter((marker) => !code.some((text) => text.includes(marker)));
  if (!missing.length) return;
  throw new Error(`The front end in ${assets} predates language packs: none of its ${scripts.length} scripts mentions ${missing.map((m) => `"${m}"`).join(' or ')}. Build it from current source before releasing.`);
}

/** True when the site's data is packed: a language manifest, or a question bank in parts. */
export function sitePacksLanguages(site) {
  const i18n = path.join(site, 'data', 'i18n');
  if (existsSync(i18n) && readdirSync(i18n).some((folder) => existsSync(path.join(i18n, folder, 'packs.json')))) return true;
  const bank = path.join(site, 'data', 'questions', 'bank.json');
  return existsSync(bank) && readFileSync(bank, 'utf8').includes('"questionParts"');
}
