// Reuse the site's archived facts, geometry, fonts and installed Lucide icons.
import { readFile, writeFile } from 'node:fs/promises';
import { geoOrthographic, geoPath } from 'd3-geo';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { Search, RadioTower, UsersRound, Compass, Sprout, CircleCheck, Globe2, Moon, Sun, ArrowUpRight } from 'lucide-react';
const root = new URL('../../', import.meta.url);
const source = JSON.parse(await readFile(new URL('content/missions/muslim-world.json', root), 'utf8'));
const countries = source.countries.map(({code,name,region,population2020,muslimShare2020,religions2020,imb})=>({code,name,region,population2020,muslimShare2020,religions2020,imb}));
await writeFile(new URL('summary.json', import.meta.url), JSON.stringify({snapshotDate:source.snapshotDate,countries}));
const atlas=JSON.parse(await readFile(new URL('public/assets/muslim-world/atlas.json',root),'utf8'));
const projection=geoOrthographic().rotate([-40,-20]).scale(288).translate([300,300]);
const path=geoPath(projection).digits(2);
const globe=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" aria-label="Country selection globe"><circle class="edge" cx="300" cy="300" r="288"/><path class="coast" d="${path(atlas.land)}"/>${atlas.countries.map(c=>`<path class="country${c.properties.selectable?' selectable':''}" data-country="${c.properties.code}" d="${path(c)||''}"/>`).join('')}</svg>`;
await writeFile(new URL('globe.svg',import.meta.url),globe);
const icons={search:Search,gospel:RadioTower,groups:UsersRound,unengaged:Compass,engagedUnreached:Sprout,noLongerUnreached:CircleCheck,globe:Globe2,moon:Moon,sun:Sun,arrow:ArrowUpRight};
const symbols=Object.entries(icons).map(([id,component])=>{
 const svg=renderToStaticMarkup(createElement(component,{strokeWidth:1.5}));
 return `<symbol id="${id}" viewBox="0 0 24 24">${svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>'))}</symbol>`;
});
await writeFile(new URL('icons.svg',import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>`);
const require=createRequire(import.meta.url);
await writeFile(new URL('LICENSE-icons',import.meta.url),await readFile(resolve(dirname(require.resolve('lucide-react')),'../../LICENSE')));
console.log(`Generated ${countries.length} country summaries, globe geometry and existing Lucide symbols.`);
