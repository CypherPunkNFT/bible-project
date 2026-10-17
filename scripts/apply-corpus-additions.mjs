// Merge the Christian writers corpus additions (built by build-corpus-additions.py) into the desk catalogue.
// Replaces any earlier copy of the same records, so it is safe to run repeatedly.
import fs from 'node:fs';
import path from 'node:path';
export function applyCorpusAdditions(records,out){
 const file=path.join(out,'corpus-additions.json');if(!fs.existsSync(file))return {added:0};
 const additions=JSON.parse(fs.readFileSync(file)).records,ids=new Set(additions.map(r=>r.id));
 for(const r of additions)if(r.textUrl&&!fs.existsSync(path.join(out,r.textUrl)))throw Error(`Corpus addition ${r.collection} ${r.subtitle}: missing text ${r.textUrl}; rerun build-corpus-additions.py`);
 const kept=records.filter(r=>!ids.has(r.id));records.splice(0,records.length,...kept,...additions);
 return {added:additions.length};
}
if(import.meta.url===`file:///${process.argv[1].replaceAll('\\','/')}`||import.meta.url===`file://${process.argv[1]}`){
 const site=path.resolve(import.meta.dirname,'..'),out=path.join(site,'public/data_acquisition'),file=path.join(out,'catalogue.json');
 const catalogue=JSON.parse(fs.readFileSync(file));const result=applyCorpusAdditions(catalogue.records,out);catalogue.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(catalogue,null,2)+'\n');console.log(JSON.stringify({...result,records:catalogue.records.length}));
}
