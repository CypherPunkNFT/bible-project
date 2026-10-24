import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Writable } from 'node:stream';
import test from 'node:test';
import { build } from 'esbuild';

const site=path.resolve(import.meta.dirname,'../..');
const compiled=await build({entryPoints:[path.join(site,'scripts/data-grants-vite.ts')],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {dataGrantsPlugin}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const venv=path.join(site,'../KnowledgeBase/.venv/Scripts/python.exe');
const python=existsSync(venv)?venv:(process.platform==='win32'?'python':'python3');

// A stand-in builder: counts its runs, then prints research, fails, or hangs as the fixture's mode file says.
const FAKE=`import pathlib, sys, time
here = pathlib.Path(sys.argv[0]).parent
runs = here / "runs.txt"
runs.write_text(runs.read_text() + "x" if runs.exists() else "x")
mode = (here / "mode.txt").read_text().strip()
if mode == "fail":
    print("Traceback (most recent call last): secret D:/private/path", file=sys.stderr)
    print("grant research: Research folder missing: RedeemerForgeInc/Grants", file=sys.stderr)
    sys.exit(2)
if mode == "hang":
    time.sleep(30)
sys.stdout.write('{"version":1,"generated":"2031-01-01T00:00:00+00:00","run":%d}' % len(runs.read_text()))
`;

async function fixture(t,{timeoutMs=20000}={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'grant-routes-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250})); // a stopped builder lets go of its folder a moment later
 const website=path.join(root,'Projects/BibleProject/Website'),projects=path.join(root,'Projects');
 await fs.mkdir(path.join(website,'analysis-desk'),{recursive:true});
 for(const [name,body] of Object.entries({'grants.html':'Grant page','grants.js':'page script','grants.css':'page style','grants-render.js':'render script'}))await fs.writeFile(path.join(website,'analysis-desk',name),body);
 const grants=path.join(projects,'RedeemerForgeInc/Grants');
 await fs.mkdir(grants,{recursive:true});await fs.mkdir(path.join(projects,'Websites/GrantsDashboard/dashboard'),{recursive:true});
 await fs.writeFile(path.join(grants,'TODO.md'),'# To-do\n');
 const tools=path.join(root,'tools');await fs.mkdir(tools);
 const builder=path.join(tools,'fake_builder.py');await fs.writeFile(builder,FAKE);
 const mode=(value)=>fs.writeFile(path.join(tools,'mode.txt'),value);await mode('ok');
 const runs=async()=>{try{return (await fs.readFile(path.join(tools,'runs.txt'),'utf8')).length;}catch{return 0;}};
 let handler;dataGrantsPlugin(website,{python,builder,timeoutMs,retryAfterMs:60000}).configurePreviewServer({middlewares:{use(h){handler=h;}}});
 const request=(url,options={})=>new Promise((resolve,reject)=>{
  const req=new PassThrough();Object.assign(req,{url,method:options.method??'GET',headers:{host:'127.0.0.1:8931',...options.headers},socket:{remoteAddress:options.remote??'127.0.0.1'}});
  const chunks=[],headers={};const res=new Writable({write(chunk,encoding,callback){chunks.push(Buffer.from(chunk));callback();}});
  Object.assign(res,{statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v;}});
  res.on('error',reject);res.on('finish',()=>resolve({status:res.statusCode,headers,body:Buffer.concat(chunks).toString()}));
  handler(req,res,()=>{resolve({next:true});});req.end();
 });
 const research=async()=>{const r=await request('/data_grants/api/research.json');return {...r,json:JSON.parse(r.body)};};
 return {request,research,mode,runs,grants};
}

test('serves only the fixed page files, and only to this computer',async t=>{
 const {request,runs}=await fixture(t);
 assert.equal((await request('/data_grants')).status,302);
 const page=await request('/data_grants/');
 assert.equal(page.body,'Grant page');assert.match(page.headers['content-security-policy'],/script-src 'self'/);assert.equal(page.headers['cache-control'],'no-store');
 assert.equal((await request('/data_grants/grants-render.js')).body,'render script');
 for(const url of ['/data_grants/../vite.config.ts','/data_grants/grants.html','/data_grants/api/other.json','/data_grants/api/research.json/x'])assert.equal((await request(url)).status,404,url);
 assert.equal((await request('/data/grants.json')).next,true);
 assert.equal((await request('/data_questions/')).next,true);
 assert.equal((await request('/data_grants/',{remote:'192.168.1.5'})).status,403);
 assert.equal((await request('/data_grants/api/research.json',{headers:{origin:'http://evil.example'}})).status,403);
 assert.equal((await request('/data_grants/api/research.json',{method:'POST'})).status,403);
 assert.equal((await request('/data_grants/api/research.json',{method:'HEAD'})).status,200);
 assert.equal(await runs(),0,'HEAD and refused requests never start a build');
});

test('reads once, then again only when a research file changes, appears or goes',async t=>{
 const {research,runs,grants}=await fixture(t);
 const first=await research();
 assert.equal(first.status,200);assert.equal(first.json.stale,false);assert.equal(first.json.research.run,1);
 await research();assert.equal(await runs(),1);
 await fs.writeFile(path.join(grants,'TODO.md'),'# To-do\n\n- [ ] new line\n');
 assert.equal((await research()).json.research.run,2);
 await fs.writeFile(path.join(grants,'NEW.md'),'# New\n');
 assert.equal((await research()).json.research.run,3);
 await fs.rm(path.join(grants,'NEW.md'));
 assert.equal((await research()).json.research.run,4);
});

test('a failed reading keeps the last good copy, marked stale, with one plain line and no traceback',async t=>{
 const {research,mode,grants,runs}=await fixture(t);
 await research();
 await mode('fail');await fs.writeFile(path.join(grants,'TODO.md'),'# changed\n');
 let r=await research();
 assert.equal(r.status,200);assert.equal(r.json.research.run,1);
 for(let i=0;i<50&&r.json.error===null;i++){await new Promise(done=>setTimeout(done,100));r=await research();}
 assert.equal(r.json.stale,true);assert.equal(r.json.error,'Research folder missing: RedeemerForgeInc/Grants');
 assert.doesNotMatch(r.body,/Traceback|private/);
 const before=await runs();await research();assert.equal(await runs(),before,'a failure is not retried on every request');
});

test('with no good copy a failure is a 503 that says why',async t=>{
 const {research,mode}=await fixture(t);
 await mode('fail');
 const r=await research();
 assert.equal(r.status,503);assert.equal(r.json.error,'Research folder missing: RedeemerForgeInc/Grants');
});

test('a reading that hangs is stopped and reported',async t=>{
 const {research,mode}=await fixture(t,{timeoutMs:1500});
 await mode('hang');
 const r=await research();
 assert.equal(r.status,503);assert.match(r.json.error,/longer than 1.5 seconds/);
});

test('the page builds its DOM without HTML strings, and the hub keeps its other three cards',()=>{
 for(const file of ['analysis-desk/grants.js','analysis-desk/grants-render.js']){
  const source=readFileSync(path.join(site,file),'utf8');
  assert.doesNotMatch(source,/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/,file);
  execFileSync(process.execPath,['--check',path.join(site,file)]);
 }
 const hub=readFileSync(path.join(site,'analysis-desk/hub.html'),'utf8');
 for(const href of ['/data_intake/','/data_analysis/','/data_questions/','/data_grants/'])assert.equal(hub.split(`class="gateway`).filter(card=>card.includes(`href="${href}"`)).length,1,href);
 const config=readFileSync(path.join(site,'vite.config.ts'),'utf8');
 assert.ok(config.includes('react(),'),'the preview launcher strips react() by this exact text');
 assert.match(config,/dataGrantsPlugin\(__dirname\)/);
});
