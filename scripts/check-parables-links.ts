import {PARABLE_DEEP_READINGS} from '../src/data/parables-deep-reading';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const urls=new Set(Object.values(PARABLE_DEEP_READINGS).flatMap(notes=>notes!.flatMap(n=>n.sources.map(s=>s.href))));
const scope=readFileSync('src/pages/study/parables/ParableScope.tsx','utf8');
for(const match of scope.matchAll(/href="(https:[^"]+)"/g)) urls.add(match[1]);
const results=[];
const pending=[...urls];
while(pending.length){
 const batch=pending.splice(0,4);
 results.push(...await Promise.all(batch.map(async url=>{
  try {const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'follow'});await response.body?.cancel();return {url,status:response.status,finalUrl:response.url};}
  catch(error){return {url,error:String(error)};}
 })));
}
mkdirSync('.output/parables',{recursive:true});writeFileSync('.output/parables/link-checks.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.status!==200)) process.exitCode=1;
