// Build display geometry locally; no public API calls and no edits to raw sources.
import { readFile, writeFile } from 'node:fs/promises';
import { feature, merge } from 'topojson-client';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const coarse = await read('node_modules/world-atlas/countries-110m.json');
const fine = await read('node_modules/world-atlas/countries-50m.json');
const profiles = await read('content/missions/muslim-world.json');
const raw = await readFile(process.argv[2] || '../sources/missions/muslim-world/2026-10-09/pew-interactive.js', 'utf8');
const start = raw.search(/\[\{"Region":"/);
if (start < 0) throw new Error('Review the changed Pew source format.');
const rows = JSON.parse(raw.slice(start).match(/^\[[\s\S]*?\]/)[0]).filter(r => r.Year === 2020 && r.Country !== 'All Countries' && r.Muslims / r.Total >= .2);
const extra = { Benin: ['BEN', '204'], Cameroon: ['CMR', '120'], Cyprus: ['CYP', '196'], Ethiopia: ['ETH', '231'], 'Ivory Coast': ['CIV', '384'], Montenegro: ['MNE', '499'], 'North Macedonia': ['MKD', '807'], Tanzania: ['TZA', '834'] };
const low = feature(coarse, coarse.objects.countries).features;
const high = feature(fine, fine.objects.countries).features;
const countries = rows.map(r => {
  const profile = profiles.countries.find(c => c.name === r.Country);
  const [code, numeric] = profile ? [profile.code, profile.numeric] : extra[r.Country] || [];
  if (!code) throw new Error('Missing country mapping: ' + r.Country);
  let geometry = (low.find(f => numeric ? String(f.id) === numeric : f.properties.name === r.Country) || high.find(f => numeric ? String(f.id) === numeric : f.properties.name === r.Country))?.geometry;
  if (code === 'MYT') geometry = { type: 'MultiPolygon', coordinates: high.find(f => String(f.id) === '250').geometry.coordinates.filter(p => p[0].some(([x,y]) => x > 44 && x < 46 && y > -14 && y < -12)) };
  if (!geometry) throw new Error('Missing geometry: ' + r.Country);
  return { type: 'Feature', properties: { code, name: r.Country, muslimShare2020: r.Muslims / r.Total * 100, selectable: !!profile }, geometry };
});
const output = { thresholdPercent: 20, demographicYear: 2020, pewSha256: createHash('sha256').update(raw).digest('hex'), land: merge(coarse, coarse.objects.countries.geometries), countries };
// Two decimal degrees is finer than a pixel at the displayed globe size.
const bytes = JSON.stringify(output, (key, value) => typeof value === 'number' && key !== 'muslimShare2020' ? Math.round(value * 100) / 100 : value);
await writeFile('public/assets/muslim-world/atlas.json', bytes + '\n');
console.log(JSON.stringify({ borderCountries: countries.length, selectable: countries.filter(c => c.properties.selectable).length, bytes: Buffer.byteLength(bytes), gzipBytes: gzipSync(bytes).length }));
