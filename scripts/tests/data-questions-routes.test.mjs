import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Writable } from 'node:stream';
import test from 'node:test';
import { build } from 'esbuild';

const site=path.resolve(import.meta.dirname,'../..');
const compiled=await build({entryPoints:[path.join(site,'scripts/data-questions-vite.ts')],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {dataQuestionsPlugin}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

async function fixture(t,{built=true}={}){
 const website=await fs.mkdtemp(path.join(os.tmpdir(),'bible-question-routes-'));
 t.after(()=>fs.rm(website,{recursive:true,force:true}));
 for(const dir of ['analysis-desk','.local/question-explorer','content/questions'])await fs.mkdir(path.join(website,dir),{recursive:true});
 for(const [name,body] of Object.entries({'questions.html':'Question page','questions.js':'page script','questions.css':'page style'}))await fs.writeFile(path.join(website,'analysis-desk',name),body);
 if(built)await fs.writeFile(path.join(website,'.local/question-explorer/questions.json'),JSON.stringify({columns:['id','question','answer'],rows:[['q:1','Who built the ark?','Noah']]}));
 let handler;dataQuestionsPlugin(website).configurePreviewServer({middlewares:{use(h){handler=h;}}});
 const request=(url,options={})=>new Promise((resolve,reject)=>{
  const req=new PassThrough();Object.assign(req,{url,method:options.method??'GET',headers:{host:'127.0.0.1:8931',...options.headers},socket:{remoteAddress:options.remote??'127.0.0.1'}});
  const chunks=[],headers={};const res=new Writable({write(chunk,encoding,callback){chunks.push(Buffer.from(chunk));callback();}});
  Object.assign(res,{statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v;}});
  res.on('error',reject);res.on('finish',()=>resolve({status:res.statusCode,headers,body:Buffer.concat(chunks).toString()}));
  handler(req,res,()=>{resolve({next:true});});req.end(options.body??'');
 });
 const post=(body,headers={})=>request('/data_questions/api/flag',{method:'POST',body:JSON.stringify(body),headers:{origin:'http://127.0.0.1:8931','content-type':'application/json',...headers}});
 const flags=async()=>JSON.parse(await fs.readFile(path.join(website,'content/questions/checks/flags.json'),'utf8'));
 return {request,post,flags,website};
}

test('serves only the fixed page files and the built questions',async t=>{
 const {request}=await fixture(t);
 assert.equal((await request('/data_questions')).status,302);
 const page=await request('/data_questions/');
 assert.equal(page.body,'Question page');assert.match(page.headers['content-security-policy'],/connect-src 'self'/);assert.equal(page.headers['cache-control'],'no-store');
 assert.equal((await request('/data_questions/questions.js')).body,'page script');
 assert.match((await request('/data_questions/api/questions.json')).body,/Who built the ark/);
 for(const url of ['/data_questions/../vite.config.ts','/data_questions/questions.html','/data_questions/api/other.json'])assert.equal((await request(url)).status,404,url);
 assert.equal((await request('/data/questions/bank.json')).next,true);
 assert.equal((await request('/data_questions/',{remote:'192.168.1.5'})).status,403);
 assert.equal((await request('/data_questions/api/questions.json',{headers:{origin:'http://evil.example'}})).status,403);
});

test('saves a flag with the wording shown, and removes it',async t=>{
 const {post,flags,request}=await fixture(t);
 assert.deepEqual(JSON.parse((await request('/data_questions/api/flags')).body).flags,{});
 const saved=await post({id:'q:1',note:'  Two right choices  '});
 assert.equal(saved.status,200,saved.body);
 const flag=(await flags()).flags['q:1'];
 assert.equal(flag.note,'Two right choices');assert.equal(flag.question,'Who built the ark?');assert.equal(flag.answer,'Noah');
 assert.equal((await post({id:'q:1',remove:true})).status,200);
 assert.deepEqual((await flags()).flags,{});
});

test('refuses flags that are not from this page, not JSON, unknown or malformed',async t=>{
 const {post,request,website}=await fixture(t);
 assert.equal((await post({id:'q:1',note:'x'},{origin:'http://evil.example'})).status,403);
 assert.equal((await post({id:'q:1',note:'x'},{'content-type':'text/plain'})).status,403);
 assert.equal((await request('/data_questions/api/flag',{method:'POST',body:'{}',headers:{'content-type':'application/json'}})).status,403);
 assert.equal((await request('/data_questions/api/flag',{method:'POST',remote:'10.0.0.2',body:'{"id":"q:1"}',headers:{origin:'http://127.0.0.1:8931','content-type':'application/json'}})).status,403);
 assert.equal((await request('/data_questions/api/flag',{headers:{origin:'http://127.0.0.1:8931'}})).status,403);
 assert.equal((await post({id:'q:404',note:'x'})).status,404);
 assert.equal((await post({id:'q:1',note:'x'.repeat(1001)})).status,400);
 assert.equal((await post({id:'q:1',note:'x',path:'../../x'})).status,400);
 assert.equal((await post(['q:1'])).status,400);
 await assert.rejects(fs.access(path.join(website,'content/questions/checks/flags.json')));
});

test('says the questions are not built instead of failing',async t=>{
 const {request,post}=await fixture(t,{built:false});
 assert.equal((await request('/data_questions/api/questions.json')).status,404);
 assert.equal((await post({id:'q:1',note:'x'})).status,503);
});
