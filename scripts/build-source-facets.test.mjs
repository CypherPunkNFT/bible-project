import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildSourceFacets} from './build-source-facets.mjs';

test('source metadata follows exact creator IDs, retains uncertainty and excludes private fields',()=>{
 const root=fs.mkdtempSync(path.resolve('.local/source-facet-test-'));
 const write=(file,value)=>{const full=path.join(root,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,JSON.stringify(value));};
 const person={id:'person-one',name:'Test author',contributorIds:['author-one'],traditions:['baptist'],identity:{reviewRequired:false},facts:{kind:'person',recordedTraditions:['baptist'],dates:{born:1800,status:'source-supported',basis:'public source'}},privateBody:'DO NOT EXPORT'};
 write('public/content/scholar-population/index.json',{builtAt:'test',sourceCredits:{'Explicit source credit':['person-one']},entries:[person,{...person,id:'person-conflict',contributorIds:['author-conflict'],facts:{...person.facts,dates:{born:1400,status:'conflicting'}}}]});
 write('content/library/catalog/works/work-one.json',{id:'work-one',creators:[{authorId:'author-one',role:'author'}]});
 write('content/library/catalog/works/work-conflict.json',{id:'work-conflict',creators:[{authorId:'author-conflict',role:'author'}]});
 fs.mkdirSync(path.join(root,'public/content/sources'),{recursive:true});
 const entries=[{id:'work-one',author:'Test author'},{id:'work-conflict',author:'Test author'},{id:'acquired-same-name',author:'Test author'},{id:'citation-one',author:'Explicit source credit'}];
 const result=buildSourceFacets(root,entries), raw=fs.readFileSync(path.join(root,'public/content/sources/facets.json'),'utf8'), data=JSON.parse(raw);
 assert.equal(result.linkedWorks,3);assert.equal(result.era,2);assert.deepEqual(data.records['citation-one'].traditions,['baptist']);assert.deepEqual(data.records['work-one'].eras,['modern']);
 assert.deepEqual(data.records['work-conflict'].eras,['unrecorded']);assert.equal(data.records['acquired-same-name'],undefined);
 assert.ok(!raw.includes('DO NOT EXPORT'));assert.match(data.entriesSha256,/^[a-f0-9]{64}$/);
 // Retain the tiny fixture as a bounded local test receipt; no recursive cleanup of shared directories.
});
