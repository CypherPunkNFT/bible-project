import fs from 'node:fs';
import {createHash} from 'node:crypto';
const dir=new URL('./',import.meta.url),root=new URL('../../../',dir);
const design=fs.readFileSync(new URL('design.md',dir),'utf8');
for(const m of design.matchAll(/\]\(([^)]+)\)/g)){if(!m[1].startsWith('http')&&!fs.existsSync(new URL(m[1],dir)))throw Error('Missing document link: '+m[1]);}
const snapshot=JSON.parse(fs.readFileSync(new URL('source-snapshot.json',dir),'utf8'));
for(const [p,expected] of Object.entries(snapshot.hashes)){const actual=createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');if(actual!==expected)throw Error('Source changed since snapshot: '+p);}
const progress=JSON.parse(fs.readFileSync(new URL('progress.json',dir),'utf8'));
const queue=JSON.parse(fs.readFileSync(new URL('../index.json',dir),'utf8'));
const item=queue.studies.find(s=>s.title==='Cities through their layers');
if(progress.designStatus!=='draft-ready'||item.designStatus!=='draft-ready')throw Error('Progress mismatch');
const contentQueue=JSON.parse(fs.readFileSync(new URL('content/studies/progress.json',root),'utf8'));
console.log(JSON.stringify({designWords:design.split(/\s+/).length,localLinks:'passed',sourceSnapshot:'unchanged',studyProgress:'draft-ready',unrelatedQueueNext:contentQueue.nextDesignNumber,siteBuild:'not run',deployment:'not run'}));
