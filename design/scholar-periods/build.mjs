import {build} from 'esbuild';
import fs from 'node:fs';
const scholars=JSON.parse(fs.readFileSync('src/data/teachers/scholars.json','utf8'));
const population=JSON.parse(fs.readFileSync('public/content/scholar-population/index.json','utf8'));
const profiles=new Map(scholars.scholars.map(s=>[s.id,s]));
const eligible=population.entries.filter(p=>['documented-profile','source-supported'].includes(p.facts?.dates.status)&&Number.isFinite(p.facts.dates.born));
if(eligible.length!==population.summary.datedBirths)throw Error('Population birth coverage does not reconcile');
if(new Set(eligible.map(p=>p.id)).size!==eligible.length)throw Error('Duplicate population entry IDs');
if(scholars.scholars.some(s=>!eligible.some(p=>p.profileId===s.id)))throw Error('Curated profile absent from eligible population');
if(eligible.some(p=>p.facts.dates.born<0||p.facts.dates.born>2026))throw Error('Timeline bounds exclude eligible records');
const records=eligible.map(p=>{const s=profiles.get(p.profileId);return {id:p.id,profileId:s?.id??null,name:p.name,born:p.facts.dates.born,died:p.facts.dates.died??null,circa:Boolean(p.facts.dates.approximate),field:s?.field??Object.keys(p.fields)[0]??'unassigned',dateStatus:p.facts.dates.status};});
const coverage={builtAt:population.builtAt,total:population.entries.length,eligible:eligible.length,unplotted:population.entries.length-eligible.length};
fs.writeFileSync('design/scholar-periods/scholars-data.js','window.mockCoverage='+JSON.stringify(coverage)+';window.mockScholars='+JSON.stringify(records)+';');
fs.writeFileSync('design/scholar-periods/population-audit.json',JSON.stringify({...coverage,segments:Array.from({length:11},(_,i)=>({start:i*200,end:i===10?2026:i*200+199,total:records.filter(p=>Math.floor(p.born/200)===i).length}))},null,2));
await build({entryPoints:['design/scholar-periods/profile-bridge.tsx'],bundle:true,format:'iife',outfile:'design/scholar-periods/profile-bridge.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
await build({stdin:{contents:"export {layoutLandingArc,layoutArc} from './src/pages/teachers/preachers/landing/arc';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'PreachersArc',outfile:'design/scholar-periods/preachers-arc.js'});
const css=fs.readFileSync('src/pages/teachers/preachers/landing.css','utf8');
const declaration=selector=>{const start=css.indexOf(selector+' {');if(start<0)throw Error(selector);return css.slice(css.indexOf('{',start)+1,css.indexOf('}',start));};
fs.writeFileSync('design/scholar-periods/preachers-template.css',[
 '/* Generated from the actual Preachers landing styles. */',
 '.graph{'+declaration('.tp-preachers .lnd-band')+'margin:0;height:auto}',
 '.circle{'+declaration('.tp-preachers .lnd-disc')+'width:calc(var(--r)*2);height:calc(var(--r)*2)}',
 '.timeline-curve path{'+declaration('.tp-preachers .lnd-arc')+'stroke-dasharray:none}',
 '.period-year,.last-year{font-size:.68rem}'
].join('\n'));
