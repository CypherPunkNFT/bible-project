import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const hash = value => createHash('sha256').update(value).digest('hex');
const unique = values => [...new Set(values)];
/** Metadata only. Exact work -> creator IDs -> existing contributor facts; no title/name/host inference. */
export function buildSourceFacets(root, entries) {
  const populationFile = path.join(root, 'public/content/scholar-population/index.json');
  const populationText = fs.readFileSync(populationFile, 'utf8');
  const population = JSON.parse(populationText);
  const contributors = new Map();
  for (const person of population.entries) for (const id of person.contributorIds) {
    const candidates = contributors.get(id) ?? []; candidates.push(person); contributors.set(id, candidates);
  }
  const metadata = {}, inputHashes = {};
  const populationById = new Map(population.entries.map(p=>[p.id,p]));
  for (const entry of entries) {
    let creators = [], people = [], basis = 'Exact catalogue work and author IDs; recorded author metadata, not a classification of the text';
    if (/^work-[a-zA-Z0-9_-]+$/.test(entry.id)) {
      const workFile = path.join(root, 'content/library/catalog/works', entry.id + '.json');
      if (fs.existsSync(workFile)) {
        const raw = fs.readFileSync(workFile, 'utf8'), work = JSON.parse(raw);
        if (work.id === entry.id) {
          inputHashes[entry.id] = hash(raw);
          creators = (work.creators ?? []).filter(c=>c.role==='author');
          people = creators.map(c=>({id:c.authorId,candidates:contributors.get(c.authorId)??[]}));
        }
      }
    }
    if (!people.length && population.sourceCredits?.[entry.author]?.length) {
      people = population.sourceCredits[entry.author].map(id=>({id,candidates:populationById.has(id)?[populationById.get(id)]:[]}));
      creators = people;
      basis = 'Existing Scholars source-credit crosswalk for this exact recorded credit; no new name or title matching';
    }
    if (!people.length && !inputHashes[entry.id]) continue;
    const authors = people.flatMap(({id,candidates}) => {
      if (candidates.length !== 1) return [];
      const p = candidates[0], dates = p.facts?.dates;
      if (p.identity?.reviewRequired || p.facts?.identityReview || p.facts?.kind !== 'person') return [];
      const accepted = ['documented-profile', 'source-supported'].includes(dates?.status);
      const year = accepted && Number.isFinite(dates?.born) ? dates.born : null;
      return [{id, name:p.name, traditions:p.facts?.recordedTraditions ?? p.traditions ?? [],
        era: year === null ? null : year < 500 ? 'ancient' : year < 1500 ? 'medieval' : year < 1800 ? 'early-modern' : 'modern',
        born:year, died:accepted ? dates?.died ?? null : null, approximate:!!dates?.approximate,
        dateStatus:dates?.status ?? 'missing', dateBasis:dates?.basis ?? '',
        sourceConflict:!!dates?.sourceConflict,
        evidence:unique([...(p.identity?.authorities ?? []).flatMap(a=>(a.evidence ?? []).map(e=>e.url)),...(dates?.evidence ?? []).map(e=>e.sourceUrl)].filter(u=>typeof u==='string' && /^https?:\/\//.test(u)))
      }];
    });
    const incomplete = authors.length !== creators.length || !creators.length;
    metadata[entry.id] = {authors,
      traditions:unique([...authors.flatMap(p=>p.traditions.length ? p.traditions : ['unrecorded']), ...(incomplete ? ['unrecorded'] : [])]),
      eras:unique([...authors.map(p=>p.era ?? 'unrecorded'), ...(incomplete ? ['unrecorded'] : [])]),
      basis,
    };
  }
  // Public study notices are copied only from the exact published source record.
  for (const entry of entries) {
    if (!/^apologetics-[a-z0-9-]+$/.test(entry.id) || !metadata[entry.id]) continue;
    const file = path.join(root,'content/apologetics/sources',entry.id.slice(12)+'.json');
    if (!fs.existsSync(file)) continue;
    const raw=fs.readFileSync(file,'utf8'), source=JSON.parse(raw);
    if(source.publication==='published' && source.content.author===entry.author && entry.links.some(l=>l.url===source.content.url)) {
      metadata[entry.id].caution=source.content.note??''; inputHashes[entry.id]=hash(raw);
    }
  }
  const result = {schemaVersion:1, entriesSha256:hash(JSON.stringify(entries)), populationSha256:hash(populationText), populationBuiltAt:population.builtAt,
    workInputsSha256:hash(JSON.stringify(inputHashes)), records:metadata};
  fs.writeFileSync(path.join(root, 'public/content/sources/facets.json'), JSON.stringify(result));
  return {records:entries.length, linkedWorks:Object.keys(metadata).length, tradition:entries.filter(e=>metadata[e.id]?.traditions.some(t=>t!=='unrecorded')).length, era:entries.filter(e=>metadata[e.id]?.eras.some(t=>t!=='unrecorded')).length};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
 console.log(buildSourceFacets(root, read(path.join(root,'public/content/sources/directory.json')).entries));
}
