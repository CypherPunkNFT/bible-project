import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { feature } from 'topojson-client';
import { geoCentroid, geoContains } from 'd3-geo';

const data = JSON.parse(await readFile(new URL('../../content/missions/muslim-world.json', import.meta.url), 'utf8'));
const atlas = JSON.parse(await readFile(new URL('../../public/assets/muslim-world/countries-50m.json', import.meta.url), 'utf8'));
const map = feature(atlas, atlas.objects.countries).features;
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

test('every place has a map geometry, including Mayotte as an actual multipart French island', () => {
  for (const country of data.countries.filter(c => c.code !== 'MYT')) {
    assert.ok(map.find(f => country.numeric ? String(f.id) === country.numeric : f.properties.name === country.name), country.name);
  }
  const france = map.find(f => f.id === '250');
  assert.equal(france.geometry.type, 'MultiPolygon');
  assert.ok(france.geometry.coordinates.some(p => p[0].some(([lon, lat]) => lon > 44 && lon < 46 && lat > -14 && lat < -12)));
  const pakistan = map.find(f => f.id === '586');
  assert.ok(geoContains(pakistan, geoCentroid(pakistan)));
});

test('snapshot has primary-source provenance and records its aggregation', () => {
  assert.equal(new URL(data.sources.pew.url).hostname, 'www.pewresearch.org');
  assert.equal(new URL(data.sources.imb.dataUrl).hostname, 'services2.arcgis.com');
  assert.match(data.sources.pew.sha256, /^[a-f0-9]{64}$/);
  assert.match(data.sources.imb.sha256, /^[a-f0-9]{64}$/);
  assert.match(data.sources.imb.transformation, /aggregated/);
});
