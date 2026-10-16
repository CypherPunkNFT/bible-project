import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const roots=['src/data/people-pages','src/data/apostle-pages','src/data/who-ruled','src/data/letters','src/components/moses-page/data','data/study/people','data/topics/t'];
const failures=[];
for(const dir of roots){
 const full=path.join(root,dir);if(!fs.existsSync(full))continue;
 for(const name of fs.readdirSync(full).filter(name=>name.endsWith('.json'))){
  if(/josephus|gutenberg\.org\/ebooks\/2848/i.test(fs.readFileSync(path.join(full,name),'utf8')))failures.push(`${dir}/${name}`);
 }
}
// The historical catalogue is deliberately exempt; do not delete its entry or original works.
const scholars=JSON.parse(fs.readFileSync(path.join(root,'src/data/teachers/scholars.json'),'utf8'));
if(!scholars.scholars.some(s=>s.id==='josephus'))failures.push('Scholars must retain its Josephus entry');
if(failures.length){console.error('Editorial source policy failed:\n'+failures.join('\n'));process.exitCode=1;}
else console.log('Editorial source policy: general reading data clear; Josephus retained in Scholars.');
