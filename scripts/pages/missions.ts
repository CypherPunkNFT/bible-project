import { readFileSync } from 'node:fs';

export function missionGeographySection(): string {
  const snapshot = JSON.parse(readFileSync('content/missions/muslim-world.json', 'utf8'));
  return [
    '## Islam: An atlas for understanding the Muslim world', '',
    'A world of people. Learn the place. An outline globe and a flat SVG map open the same country profiles without Earth imagery or WebGL textures. A vertical pair of globe/map icons in the upper-right of the map switches views. Country selection is shareable with `?country=<IMB-code>#muslim-world` and preserves the selected comparison question.', '',
    `Scope: ${snapshot.scope} ${snapshot.countries.length} countries and territories. Demographic year: ${snapshot.demographicYear}. IMB snapshot: ${snapshot.snapshotDate}.`, '',
    'Country panel: region, estimated 2020 population, Muslim identification, other religious shares, IMB people-group status counts with population totals, three largest recorded people groups and source links. Search and region filters provide a keyboard-accessible alternative to the globe.', '',
    'Map: worldwide coastlines, with country outlines only where Pew estimates at least 20% Muslim identification in 2020. The 53 Muslim-majority profiles are selectable. A fixed circular window fills the map column. Wheel gestures zoom from full-globe fit to 8x detail within that circle; scrolling stays contained at both limits. Arrow keys turn it, Space pauses/starts rotation, and Home resets. Phones and coarse-pointer devices start with rotation paused. Only the two view icons are shown; there are no zoom or rotation buttons. The flat map supports wheel zoom and drag/arrow-key panning, preserves country selection and reuses the already-loaded geography.', '',
    'IMB counts cover all people groups in each country, including non-Muslim groups. No longer unreached is not a country completion score. Country aggregates preserve the source Engagement Progress categories; see content/missions/README.md for definitions, provenance and refresh steps.', '',
    `Sources: [Pew Research Center](${snapshot.sources.pew.url}), [IMB Global Research](${snapshot.sources.imb.url}). Coastlines and country outlines: Natural Earth (public domain).`, '',
    '| Country / territory | Population estimate (2020) | Muslim identification (2020) | IMB groups | Unengaged & unreached | Engaged yet unreached | No longer unreached |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...snapshot.countries.map((country: { name: string; population2020: number; muslimShare2020: number; imb: { totalGroups: number; unengaged: { groups: number }; engagedUnreached: { groups: number }; noLongerUnreached: { groups: number } } }) =>
      `| ${country.name} | ${country.population2020.toLocaleString('en')} | ${country.muslimShare2020.toFixed(1)}% | ${country.imb.totalGroups} | ${country.imb.unengaged.groups} | ${country.imb.engagedUnreached.groups} | ${country.imb.noLongerUnreached.groups} |`),
  ].join('\n');
}
