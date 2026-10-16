import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoMercator, geoPath, geoGraticule } from 'd3-geo';

// Physical geography only. Never use country polygons as ancient frontiers.
const world = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-10m.json', 'utf8'));
const land = feature(world, world.objects.land);
const locations = {
  delta: [31.5,30.8], megiddo:[35.18,32.58], samaria:[35.19,32.28], jerusalem:[35.23,31.78],
  lachish:[34.85,31.56], ekron:[34.85,31.78], mizpah:[35.22,31.88], dibon:[35.78,31.50],
  damascus:[36.30,33.51], qarqar:[36.33,35.75], carchemish:[38.01,36.83],
  kalhu:[43.33,36.10], nineveh:[43.15,36.36], babylon:[44.42,32.54], gozan:[40.04,36.89],
};
const output = {};
for (const [name, width, height, center, scale] of [
  ['regional',760,390,[38.0,33.7],2100], ['local',360,390,[35.35,32.35],6500],
]) {
  const projection = geoMercator().center(center).scale(scale).translate([width/2,height/2]).clipExtent([[0,0],[width,height]]);
  const path = geoPath(projection).digits(1);
  output[name]={width,height,land:path(land),grid:path(geoGraticule().step(name==='local'?[1,1]:[5,5])()),
    points:Object.fromEntries(Object.entries(locations).map(([id,coordinate])=>[id,projection(coordinate).map(n=>+n.toFixed(1))]))};
}
fs.mkdirSync('src/pages/study/empires',{recursive:true});
fs.writeFileSync('src/pages/study/empires/geography.json',JSON.stringify(output));
console.log('Generated two cropped, projected physical base maps from Natural Earth land-10m.');
