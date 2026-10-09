import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { geoCentroid, geoContains } from 'd3-geo';
import { createHash } from 'node:crypto';

const data = JSON.parse(await readFile(new URL('../../content/missions/muslim-world.json', import.meta.url), 'utf8'));
const atlas = JSON.parse(await readFile(new URL('../../public/assets/muslim-world/atlas.json', import.meta.url), 'utf8'));
const map = atlas.countries;
const statuses = ['unengaged', 'engagedUnreached', 'noLongerUnreached'];

test('country snapshot is complete, dated and matches its declared majority scope', () => {
  assert.equal(data.countries.length, 53);
  assert.equal(new Set(data.countries.map(c => c.code)).size, 53);
  assert.match(data.snapshotDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(data.demographicYear, 2020);
  for (const country of data.countries) {
    assert.ok(country.muslimShare2020 > 50 && country.muslimShare2020 <= 100, country.name);
    assert.ok(country.population2020 > 0);
    assert.ok(country.region);
    assert.ok(Math.abs(Object.values(country.religions2020).reduce((a, b) => a + b, 0) - 100) <= .31, country.name);
  }
});

test('IMB counts and population sums reconcile in every profile, including legitimate zero categories', () => {
  for (const country of data.countries) {
    assert.equal(statuses.reduce((sum, key) => sum + country.imb[key].groups, 0), country.imb.totalGroups, country.name);
    assert.equal(statuses.reduce((sum, key) => sum + country.imb[key].population, 0), country.imb.population, country.name);
    for (const key of statuses) {
      assert.ok(Number.isInteger(country.imb[key].groups) && country.imb[key].groups >= 0);
      assert.ok(Number.isInteger(country.imb[key].population) && country.imb[key].population >= 0);
    }
    assert.equal(country.examples.length, 3);
    for (const example of country.examples) {
      assert.match(example.id, /^PG\d{6}$/);
      assert.ok(statuses.includes(example.status));
      assert.ok(example.population <= country.imb.population);
      assert.ok(example.name && example.language && example.religion);
    }
  }
});

test('every profile has selectable geometry, including Mayotte at its actual island location', () => {
  for (const country of data.countries) {
    assert.ok(map.find(f => f.properties.code === country.code && f.properties.selectable), country.name);
  }
  const mayotte = map.find(f => f.properties.code === 'MYT');
  assert.equal(mayotte.geometry.type, 'MultiPolygon');
  assert.ok(mayotte.geometry.coordinates.every(p => p[0].every(([lon, lat]) => lon > 44 && lon < 46 && lat > -14 && lat < -12)));
  const pakistan = map.find(f => f.properties.code === 'PAK');
  assert.ok(geoContains(pakistan, geoCentroid(pakistan)));
});

test('border geometry respects the 20% threshold while land keeps a worldwide coastline', () => {
  assert.equal(atlas.thresholdPercent, 20);
  assert.equal(atlas.demographicYear, 2020);
  assert.equal(atlas.pewSha256, data.sources.pew.sha256);
  assert.equal(map.length, 61);
  assert.equal(map.filter(c => c.properties.selectable).length, 53);
  assert.ok(map.every(c => c.properties.muslimShare2020 >= 20));
  assert.ok(map.find(c => c.properties.code === 'ETH' && !c.properties.selectable));
  assert.ok(!map.some(c => ['USA', 'IND', 'CHN'].includes(c.properties.code)));
  assert.equal(atlas.land.type, 'MultiPolygon');
  assert.ok(geoContains(atlas.land, [-100, 40]), 'North American land remains present without country borders');
  assert.ok(geoContains(atlas.land, [100, 35]), 'Asian land remains present without country borders');
});

test('snapshot has primary-source provenance and records its aggregation', () => {
  assert.equal(new URL(data.sources.pew.url).hostname, 'www.pewresearch.org');
  assert.equal(new URL(data.sources.imb.dataUrl).hostname, 'services2.arcgis.com');
  assert.match(data.sources.pew.sha256, /^[a-f0-9]{64}$/);
  assert.match(data.sources.imb.sha256, /^[a-f0-9]{64}$/);
  assert.match(data.sources.imb.transformation, /aggregated/);
});

test('all lazy country tables reconcile exactly with the summary and derivative hashes', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../content/missions/people-group-manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.files.length, data.countries.length);
  assert.equal(manifest.sourceSha256, data.sources.imb.sha256);
  for (const country of data.countries) {
    const bytes = await readFile(new URL(`../../public/assets/muslim-world/people-groups/${country.code}.json`, import.meta.url));
    const detail = JSON.parse(bytes), record = manifest.files.find(file => file.country === country.code);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
    assert.equal(bytes.length, record.bytes);
    assert.equal(detail.country, country.code);
    assert.equal(detail.snapshotDate, data.snapshotDate);
    assert.equal(detail.sourceSha256, data.sources.imb.sha256);
    assert.equal(detail.groups.length, country.imb.totalGroups);
    assert.equal(new Set(detail.groups.map(group => group.id)).size, country.imb.totalGroups);
    assert.deepEqual(detail.groups.slice(0, 3), country.examples);
    for (const status of statuses) {
      const groups = detail.groups.filter(group => group.status === status);
      assert.equal(groups.length, country.imb[status].groups, country.name);
      assert.equal(groups.reduce((sum, group) => sum + group.population, 0), country.imb[status].population, country.name);
    }
    for (const [index, group] of detail.groups.entries()) {
      assert.match(group.id, /^PG\d{6}$/);
      assert.ok(group.name && group.religion && statuses.includes(group.status));
      assert.ok(group.language === null || typeof group.language === 'string');
      assert.ok(Number.isInteger(group.population) && group.population >= 0);
      if (index) assert.ok(detail.groups[index - 1].population >= group.population);
    }
  }
});

test('every country has a local flag with pinned source and matching hash', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../content/missions/flag-manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.flags.length, data.countries.length);
  for (const country of data.countries) {
    const record = manifest.flags.find(flag => flag.country === country.code);
    assert.ok(record, country.name);
    const bytes = await readFile(new URL(`../../public/assets/muslim-world/flags/${country.code}.svg`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
    assert.equal(bytes.length, record.bytes);
    assert.ok(record.sourceUrl.includes(manifest.commit));
    assert.match(bytes.toString(), /<svg\b/);
    assert.doesNotMatch(bytes.toString(), /<script\b|<foreignObject\b|\son\w+=/i);
  }
  const license = await readFile(new URL('../../public/assets/muslim-world/flags/LICENSE', import.meta.url));
  assert.equal(createHash('sha256').update(license).digest('hex'), manifest.licenseSha256);
});
