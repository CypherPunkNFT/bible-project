import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Writable } from 'node:stream';
import test from 'node:test';
import { build } from 'esbuild';

const site=path.resolve(import.meta.dirname,'../..');
const compiled=await build({entryPoints:[path.join(site,'scripts/data-analysis-vite.ts')],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {dataAnalysisPlugin}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'bible-editorial-routes-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const website=path.join(root,'Website');
 for(const dir of ['analysis-desk','.local/data-analysis','../KnowledgeBase/library-knowledge/connected-research/curation'])await fs.mkdir(path.join(website,dir),{recursive:true});
 for(const [name,body] of Object.entries({'reading.html':'Reading guides','reading.js':'Reading script','reading.css':'Reading style','hub.html':'Data hub','index.html':'Editorial overview','candidates.html':'Candidates app','view.html':'Historical desk','desk.js':'app script','desk.css':'app style'}))await fs.writeFile(path.join(website,'analysis-desk',name),body);
 await fs.writeFile(path.join(website,'.local/data-analysis/reading-review.json'),'{}');
 await fs.writeFile(path.join(website,'.local/data-analysis/website-candidates.json'),'[{"fingerprint":"unchanged"}]');
 await fs.writeFile(path.join(root,'KnowledgeBase/library-knowledge/connected-research/curation/SOURCE-REVIEW.md'),'Owner decisions stay here');
 let handler;dataAnalysisPlugin(website).configurePreviewServer({middlewares:{use(h){handler=h;}}});
 const request=(url,options={})=>new Promise((resolve,reject)=>{
  const req=new PassThrough();Object.assign(req,{url,method:options.method??'GET',headers:{host:'127.0.0.1:8931',...options.headers},socket:{remoteAddress:options.remote??'127.0.0.1'}});
  const chunks=[],headers={};const res=new Writable({write(chunk,encoding,callback){chunks.push(Buffer.from(chunk));callback();}});
  Object.assign(res,{statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v;}});
  res.on('error',reject);res.on('finish',()=>resolve({status:res.statusCode,headers,body:Buffer.concat(chunks).toString()}));
  handler(req,res,()=>{resolve({next:true});});req.end(options.body??'');
 });
 return {request,website};
}

test('existing editorial routes serve only the fixed private application files',async t=>{
 const {request}=await fixture(t);
 for(const suffix of ['/','/candidates/','/kr110/','/kr120/index.html','/kr140/','/desk.js','/desk.css','/api/website-candidates.json','/api/source-review.md']){
  const r=await request('/data_analysis'+suffix);assert.equal(r.status,200,suffix);
  assert.equal(r.headers['cache-control'],'no-store');assert.equal(r.headers['cross-origin-resource-policy'],'same-origin');
 }
 assert.equal((await request('/data_analysis/candidates/')).headers['content-security-policy'].includes("connect-src 'self'"),true);
 assert.equal((await request('/data/')).body,'Data hub');
});

test('slash redirects preserve candidate and source deep links',async t=>{
 const {request}=await fixture(t);
 for(const prefix of ['/data_analysis'])for(const suffix of ['', '/candidates','/kr110']){
  const r=await request(prefix+suffix+'?candidate=supper&record=2134297');assert.equal(r.status,302);
  assert.equal(r.headers.location,prefix+suffix+'/?candidate=supper&record=2134297');
 }
});

test('editorial routes preserve loopback host origin fetch-site and method restrictions',async t=>{
 const {request}=await fixture(t);
 for(const prefix of ['/data_analysis']){
  for(const options of [{remote:'192.168.1.2'},{headers:{host:'public.example:8931'}},{headers:{origin:'https://outside.example'}},{headers:{'sec-fetch-site':'cross-site'}},{method:'POST'},{method:'DELETE'}])assert.equal((await request(prefix+'/candidates/',options)).status,403);
  const post={method:'POST',body:'{}'};
  for(const headers of [{},{origin:'https://outside.example','content-type':'application/json'},{origin:'http://127.0.0.1:8931','content-type':'text/plain'}])assert.equal((await request(prefix+'/api/review',{...post,headers})).status,403);
  const invalid=await request(prefix+'/api/review',{...post,headers:{origin:'http://127.0.0.1:8931','content-type':'application/json'},body:'{"action":"sync","root":"arbitrary-path"}'});assert.equal(invalid.status,400);
  for(const suffix of ['/api/review','/api/population']){const r=await request(prefix+suffix,{method:'HEAD'});assert.equal(r.status,200);assert.equal(r.body,'');}
 }
});

test('only explicit routes can serve private files',async t=>{
 const {request}=await fixture(t);
 assert.equal((await request('/data_analysis-fake/candidates/')).next,true);
 for(const suffix of ['/../AGENTS.md','/%2e%2e/AGENTS.md','/api/arbitrary.sqlite3','/candidates/private.json','/desk.js/extra'])assert.equal((await request('/data_analysis'+suffix)).status,404,suffix);
});


test('reading guides and their private evidence inherit local access restrictions',async t=>{
 const {request}=await fixture(t);
 const routes=['/reading/','/reading/ephesians/','/reading/?proposal=unity','/reading.js','/reading.css','/api/reading-review.json'];
 for(const route of routes){
  const result=await request('/data_analysis'+route);assert.equal(result.status,200,route);assert.equal(result.headers['cache-control'],'no-store');
  for(const options of [{remote:'192.168.1.2'},{headers:{host:'public.example:8931'}},{headers:{origin:'https://outside.example'}},{headers:{'sec-fetch-site':'cross-site'}},{method:'POST'}])assert.equal((await request('/data_analysis'+route,options)).status,403,route);
 }
 for(const route of ['/reading','/reading/ephesians'])assert.equal((await request('/data_analysis'+route+'?proposal=unity')).headers.location,'/data_analysis'+route+'/?proposal=unity');
 for(const route of ['/reading/private.json','/reading-content.json','/api/reading-content.json'])assert.equal((await request('/data_analysis'+route)).status,404);
});
