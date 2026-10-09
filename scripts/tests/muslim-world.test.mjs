import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { geoCentroid, geoContains } from 'd3-geo';

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
