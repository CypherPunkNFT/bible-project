import fs from 'node:fs';
import {scenes,sources,governments,checks,diagramCaptions} from '../../../src/pages/study/world/merged-data.ts';
import {investigationSources,layers,mealClauses} from '../../../src/pages/study/world/investigation-data.ts';
const dir='content/academic-research/09-world-of-jesus-apostles';
const data={scenes,sources,governments,checks,diagramCaptions,investigationSources,layers,mealClauses};
data.passageTexts={};
for(const p of scenes.flatMap(s=>s.views.flatMap(v=>v.passages))){const book=JSON.parse(fs.readFileSync(`data/plain/web/${p.book}.json`,'utf8'));const [a,b]=p.verses.split('-').map(Number);data.passageTexts[p.book+'/'+p.chapter+'/'+p.verses]=Array.from({length:(b??a)-a+1},(_,i)=>({verse:a+i,text:book[p.chapter+':'+(a+i)]??''}));}
fs.writeFileSync(dir+'/prototype-data.js','window.STUDY = '+JSON.stringify(data,null,2)+';\n');
fs.writeFileSync(dir+'/content-map.json',JSON.stringify({source:'src/pages/study/world/merged-data.ts',scenes:scenes.map(s=>({id:s.id,place:s.place,viewpoints:s.views.map((v,i)=>({index:i,label:v.label,prototype:'prototype.html#'+s.id+'-'+i,retained:['title','evidence','meaning','limit','sources','passages']}))}))},null,2));
console.log(scenes.length+' scenes, '+scenes.reduce((n,s)=>n+s.views.length,0)+' viewpoints snapshotted unchanged.');
