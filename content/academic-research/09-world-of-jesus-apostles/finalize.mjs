import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const record=JSON.parse(fs.readFileSync(dir+'/review/verification.json','utf8'));assert.equal(record.status,'passed');
const design=fs.readFileSync(dir+'/design.md','utf8');
for(const match of design.matchAll(/\]\(([^)]+)\)/g)){const target=match[1];if(!target.startsWith('http')){if(target==='progress.json')continue;assert(fs.existsSync(path.resolve(dir,target)),target);}}
const html=fs.readFileSync(dir+'/prototype.html','utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!match[1].startsWith('http'))assert(fs.existsSync(path.resolve(dir,match[1])),match[1]);}
const css=fs.readFileSync(dir+'/prototype.css','utf8');for(const match of css.matchAll(/url\('([^']+)'\)/g))assert(fs.existsSync(path.resolve(dir,match[1])),match[1]);
const map=JSON.parse(fs.readFileSync(dir+'/content-map.json','utf8'));assert.equal(map.scenes.length,8);assert.equal(map.scenes.reduce((n,s)=>n+s.viewpoints.length,0),28);
const progress={study:9,title:'The world of Jesus & the apostles',phase:'design',designStatus:'draft-ready',approvalStatus:'not-approved-for-integration',design:'design.md',artifact:'prototype.html',contentMap:'content-map.json',verification:'review/verification.json',updated:'2026-10-14',completed:['Source, dossier, workflow and five reference routes inspected','Three approaches compared; threshold/evidence design selected','Complete design and content preservation map saved','Working isolated prototype with eight scenes and28 viewpoints','Rendered and tested desktop/laptop/mobile, keyboard, reduced motion, reader return state'],notCompleted:['Live integration','Site rebuild','Public deployment','Screen-reader audit','Integrated site-transition verification'],queueScope:'Academic09 only; Scripture/Theology40-study queue and global academic next-study position unchanged.'};
fs.writeFileSync(dir+'/progress.json',JSON.stringify(progress,null,2)+'\n');
const indexPath=path.resolve(dir,'../index.json');const index=JSON.parse(fs.readFileSync(indexPath,'utf8'));const entry=index.studies.find(s=>s.order===9);assert(entry.title===progress.title);entry.designProposal='09-world-of-jesus-apostles/design.md';entry.designProposalStatus='isolated-prototype-verified-no-integration';entry.designProgress='09-world-of-jesus-apostles/progress.json';fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
assert(JSON.parse(fs.readFileSync(dir+'/progress.json','utf8')).designStatus==='draft-ready');assert(fs.readFileSync(dir+'/design.md','utf8').includes('No application build or route change occurred.'));console.log('Read-back, local links, font paths, 8/28 inventory and scoped queue update passed.');
