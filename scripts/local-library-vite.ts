import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { pipeline } from 'node:stream';
import type { Connect, Plugin } from 'vite';

interface HeldCopy { id: string; path: string; sha256: string; title: string; authorIds: string[]; workId: string | null; genre: string; sourceUrl: string | null; format: string; attributionConflict: boolean; language: string; source: string; mixedAttribution?: boolean }
interface LocalIndex { builtAt: string; documents: Record<string,HeldCopy>; bindings: Record<string,string[]>; profiles: Record<string,string[]>; contributors: Record<string,string>; counts: Record<string,number> }
interface ShelfRow { id: string; workId?: string | null; title: string; genre?: string; reference?: string; readable?: boolean; sourceUrl?: string | null; localReadable?: boolean; edition?: boolean; language?: string; format?: string; sharedCollection?: boolean }
const ID=/^[a-z0-9][a-z0-9-]{0,160}$/;

export function allowedLocalLibraryRequest(req: Pick<Parameters<Connect.NextHandleFunction>[0],'headers'|'method'|'socket'>): boolean {
  if(!['GET','HEAD'].includes(req.method??'GET'))return false;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??''))return false;
  const host=String(req.headers.host??'');
  if(!/^(?:127\.0\.0\.1|localhost|\[::1\]):893[01]$/.test(host))return false;
  const origin=req.headers.origin;
  if(origin&&origin!==`http://${host}`)return false;
  const site=req.headers['sec-fetch-site'];
  return !site||site==='same-origin'||site==='none';
}

export function localLibraryPlugin(siteRoot: string): Plugin {
  const root=path.resolve(siteRoot);
  const indexFile=path.join(root,'.local/local-library/index.json');
  const python=path.join(root,'../KnowledgeBase/.venv/Scripts/python.exe');
  const helper=path.join(root,'scripts/local_library.py');
  let cached:LocalIndex|undefined,stamp=0;
  function index():LocalIndex {
    const modified=fs.statSync(indexFile).mtimeMs;
    if(!cached||modified!==stamp){cached=JSON.parse(fs.readFileSync(indexFile,'utf8')) as LocalIndex;stamp=modified;}
    return cached;
  }
  function resolve(id:string,data:LocalIndex):HeldCopy|undefined { return data.documents[id]??data.documents[data.bindings[id]?.[0]??'']; }
  function runReader(id:string,page?:number):Promise<unknown> {
    return new Promise((resolve,reject)=>{
      execFile(python,['-X','utf8',helper,'--record',id,...(page===undefined?[]:['--page',String(page)])],{cwd:root,windowsHide:true,timeout:120000,maxBuffer:8*1024*1024},(error,stdout)=>{
        try{const result=JSON.parse(stdout);if(error||result.error)reject(new Error(result.error??'The local reading copy could not be prepared.'));else resolve(result);}
        catch{reject(new Error('The local reading copy could not be prepared.'));}
      });
    });
  }
  function profileShelf(id:string):Promise<ShelfRow[]> {
    return new Promise((resolve,reject)=>{
      execFile(python,['-X','utf8',path.join(root,'scripts/reader_catalog.py'),'--profile',id],{cwd:root,windowsHide:true,timeout:30000,maxBuffer:16*1024*1024},(error,stdout)=>{
        if(error){reject(new Error('The joined reading catalogue is unavailable or stale. Rebuild it with scripts/reader_catalog.py --build.'));return;}
        try{resolve(JSON.parse(stdout) as ShelfRow[]);}catch{reject(new Error('The reading catalogue returned invalid data.'));}
      });
    });
  }
  const middleware:Connect.NextHandleFunction=async(req,res,next)=>{
    if(!req.url?.startsWith('/api/local-library/'))return next();
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
    const json=(value:unknown,status=200)=>{res.statusCode=status;res.end(req.method==='HEAD'?'':JSON.stringify(value));};
    if(!allowedLocalLibraryRequest(req)){json({error:'Local reading is available only from this loopback preview.'},403);return;}
    try{
      const parts=new URL(req.url,'http://127.0.0.1').pathname.slice('/api/local-library/'.length).split('/');
      const data=index();
      if(parts[0]==='status'&&parts.length===1){json({available:true,builtAt:data.builtAt,...data.counts});return;}
      const id=parts[1];if(!id||!ID.test(id)){json({error:'Invalid library identity.'},400);return;}
      if(parts[0]==='contributors'&&parts.length===2){
        // Older index snapshots can recover this mapping from the existing profile data.
        const profile=data.contributors?.[id]??(JSON.parse(fs.readFileSync(path.join(root,'src/data/teachers/people.json'),'utf8')).people as {id:string;acquiredId:string|null}[]).find(p=>p.id===id||p.acquiredId===id)?.id;
        if(!profile||!data.profiles[profile]){json({error:'No local contributor shelf.'},404);return;}
        const rows=await profileShelf(profile);
        json(rows.filter(row=>row.localReadable).map(row=>({...row,language:row.language??'und',source:data.documents[row.id]?.source??'Library catalogue',availability:'local-text'})));return;
      }
      if(parts[0]==='profiles'&&parts.length===2){
        if(!data.profiles[id]){json({error:'No profile shelf.'},404);return;}
        json(await profileShelf(id));return;
      }
      const held=resolve(id,data);if(!held){json({error:'No locally held reading copy for this work.'},404);return;}
      if(parts[0]==='records'&&parts.length===2){json(await runReader(held.id));return;}
      if(parts[0]==='pages'&&parts.length===3){
        if(!/^\d{1,6}$/.test(parts[2])){json({error:'Invalid reading page.'},400);return;}
        json(await runReader(held.id,Number(parts[2])));return;
      }
      if(parts[0]==='files'&&parts.length===2&&held.format==='pdf'){
        const source=fs.realpathSync(held.path),allowed=fs.realpathSync(path.join(root,'../sources/library'))+path.sep;
        if(!source.startsWith(allowed)){json({error:'File outside the held library.'},403);return;}
        res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','inline');res.setHeader('Content-Security-Policy',"frame-ancestors 'self'");
        if(req.method==='HEAD'){res.end();return;}
        pipeline(fs.createReadStream(source),res,error=>{if(error)res.destroy();});return;
      }
      json({error:'Unknown local library request.'},404);
    }catch(error){json({error:error instanceof Error?error.message:'Local reader unavailable.'},503);}
  };
  return {name:'private-local-library',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
