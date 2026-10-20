// Local presentation of existing analysis receipts. No analytical worker or public export.
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { spawn } from 'node:child_process';
import type { Connect, Plugin } from 'vite';
import { allowedLocalLibraryRequest } from './local-library-vite';

export function dataAnalysisPlugin(siteRoot: string): Plugin {
  const pages = path.resolve(siteRoot, 'analysis-desk');
  const snapshot = path.resolve(siteRoot, '.local/data-analysis');
  // Read requests are serialized and bounded; no analytical writer or service is launched.
  let active = false;
  let reviewWriter = false;
  const reviewRoot=path.resolve(siteRoot,'../KnowledgeBase/library-knowledge/connected-research/curation');
  const types: Record<string,string> = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
  const handle: Connect.NextHandleFunction = (req,res,next) => {
    const url = (req.url ?? '').split('?')[0];
    if (!['/data','/data/','/data/index.html','/data_analysis'].includes(url) && !url.startsWith('/data_analysis/')) return next();
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cross-Origin-Resource-Policy','same-origin');
    if(url==='/data_analysis/api/review'){
      res.setHeader('Content-Type','application/json; charset=utf-8');
      const post=req.method==='POST';
      const allowed=allowedLocalLibraryRequest({headers:req.headers,method:post?'GET':req.method,socket:req.socket});
      if(!allowed || (post&&(req.headers.origin!==`http://${req.headers.host}`||!String(req.headers['content-type']??'').startsWith('application/json')))){
        res.statusCode=403;res.end(JSON.stringify({error:'Owner review writes require this local page, same origin and JSON.'}));return;
      }
      if(req.method==='HEAD'){res.end();return;}
      if(!post&&req.method!=='GET'){res.statusCode=403;res.end('{}');return;}
      if(post&&reviewWriter){res.statusCode=409;res.end(JSON.stringify({error:'A review action is finishing. Nothing was changed; retry shortly.'}));return;}
      const run=(input:Record<string,unknown>)=>{
        if(post)reviewWriter=true;
        const child=spawn(path.resolve(siteRoot,'../KnowledgeBase/.venv/Scripts/python.exe'),['-X','utf8','-m','knowledge.library_analytics.candidate_review'],{cwd:siteRoot,windowsHide:true,stdio:['pipe','pipe','pipe']});
        let stdout='',done=false;
        const end=(status:number,body:string)=>{if(done)return;done=true;if(post)reviewWriter=false;clearTimeout(timer);if(!res.destroyed){res.statusCode=status;res.end(body);}};
        const timer=setTimeout(()=>{child.kill();end(504,JSON.stringify({error:'The curation request timed out. Refresh to see whether its atomic decision committed.'}));},35000);
        child.stdout.on('data',b=>{stdout+=b.toString();if(stdout.length>16_000_000){child.kill();end(413,JSON.stringify({error:'Review response exceeded its bounded size.'}));}});
        child.stderr.on('data',()=>{});child.stdin.on('error',()=>{});
        child.on('error',()=>end(503,JSON.stringify({error:'Local curation helper is unavailable.'})));
        child.on('close',code=>{try{const result=JSON.parse(stdout);end(code===0?200:result.status??422,stdout);}catch{end(503,JSON.stringify({error:'Curation helper returned no valid result. Refresh before retrying.'}));}});
        child.stdin.end(JSON.stringify(input));res.on('close',()=>{if(!done){child.kill();end(499,'');}});
      };
      if(!post){const params=new URL(req.url??'','http://127.0.0.1:8931').searchParams;const view=params.get('view')??'state';if(!['state','marks','history'].includes(view)){res.statusCode=400;res.end('{}');return;}run({action:'get',view,id:params.get('id')});return;}
      let body='';req.on('data',chunk=>{body+=chunk.toString();if(body.length>48000){res.statusCode=413;res.end(JSON.stringify({error:'Review request too large.'}));req.destroy();}});
      req.on('end',()=>{if(res.writableEnded)return;try{const input=JSON.parse(body);const keys=['action','requestId','id','expectedRevision','fingerprint','status','note','destination','integrationEvidence','proposal','track','kind','key','q','author','title','language','family','purpose'];if(!input||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k))||!['sync','decide','prepare','nominate','discover'].includes(input.action))throw Error('Invalid curation action');run(input);}catch{res.statusCode=400;res.end(JSON.stringify({error:'Invalid curation request.'}));}});return;
    }
    if (!allowedLocalLibraryRequest(req)) { res.statusCode=403; res.end('Available only through the local preview.'); return; }
    if (url==='/data_analysis/api/population') {
      res.setHeader('Content-Type','application/json; charset=utf-8');
      if(req.method==='HEAD'){res.end();return;}
      if(active){res.statusCode=429;res.end(JSON.stringify({error:'Another data query is finishing. Please retry shortly.'}));return;}
      const params=Object.fromEntries(new URL(req.url??'', 'http://127.0.0.1:8931').searchParams);
      if(Object.keys(params).some(k=>!['track','action','id','cursor','q','author','title','work','language','concept','native','channel','seed','scope','family'].includes(k)) || JSON.stringify(params).length>5000){res.statusCode=400;res.end(JSON.stringify({error:'Invalid browse parameters.'}));return;}
      active=true;
      const child=spawn(path.resolve(siteRoot,'../KnowledgeBase/.venv/Scripts/python.exe'),['-X','utf8',path.join(siteRoot,'scripts/analysis-population.py')],{cwd:siteRoot,windowsHide:true,stdio:['pipe','pipe','pipe']});
      let stdout='',stderr='',ended=false;
      const finish=(status:number,body:string)=>{if(ended)return;ended=true;active=false;clearTimeout(timer);if(!res.destroyed){res.statusCode=status;res.end(body);}};
      const timer=setTimeout(()=>{child.kill();finish(504,JSON.stringify({error:'Query timed out. Narrow your filters and retry.'}));},20000);
      child.stdout.on('data',chunk=>{stdout+=chunk.toString();if(stdout.length>8_000_000){child.kill();finish(413,JSON.stringify({error:'Record is too large for this preview.'}));}});
      child.stderr.on('data',chunk=>{if(stderr.length<2000)stderr+=chunk.toString();});
      child.on('error',()=>finish(503,JSON.stringify({error:'Local read-only data browser is unavailable.'})));
      child.on('close',code=>{try{JSON.parse(stdout);finish(code===0?200:422,stdout);}catch{finish(503,JSON.stringify({error:'Unable to read the pinned analytical store.'}));}});
      child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(params));
      res.on('close',()=>{if(!ended){child.kill();finish(499,'');}});
      return;
    }
    if (url==='/data' || url==='/data_analysis' || url==='/data_analysis/candidates' || url==='/data_analysis/reading' || url==='/data_analysis/reading/ephesians' || /^\/data_analysis\/kr(?:110|120|140)$/.test(url)) {
      const query=(req.url??'').slice(url.length);
      res.statusCode=302;res.setHeader('Location',url+'/'+query);res.end();return;
    }
    let file: string|undefined;
    if(url==='/data_analysis/api/source-review.md')file=path.join(reviewRoot,'SOURCE-REVIEW.md');
    else if(url==='/data_analysis/api/integration-queue.json')file=path.join(reviewRoot,'integration-queue.json');
    else if (url==='/data/' || url==='/data/index.html') file=path.join(pages,'hub.html');
    else if (url==='/data_analysis/' || url==='/data_analysis/index.html') file=path.join(pages,'index.html');
    else if (url==='/data_analysis/reading/' || url==='/data_analysis/reading/ephesians/') file=path.join(pages,'reading.html');
    else if (url==='/data_analysis/candidates/' || url==='/data_analysis/candidates/index.html') file=path.join(pages,'candidates.html');
    else if (/^\/data_analysis\/kr(?:110|120|140)\/(?:index.html)?$/.test(url)) file=path.join(pages,'view.html');
    else if (/^\/data_analysis\/(?:reading.css|reading.js|desk.css|desk.js|population.js|candidates.css|candidates.js|review.js|queue.js)$/.test(url)) file=path.join(pages,path.basename(url));
    else if (/^\/data_analysis\/api\/(?:reading-review.json|summary.json|projection-manifest.json|website-candidates.json|kr(?:110|120|140).md|kr(?:110|120|140)\/index.json|kr(?:110|120|140)\/details\/[a-f0-9]{24}.json)$/.test(url)) file=path.join(snapshot,url.slice('/data_analysis/api/'.length));
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.statusCode=404;res.end('Analysis record not found.');return;}
    res.setHeader('Content-Type',types[path.extname(file)]);
    if (path.extname(file)==='.html') res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'");
    if (req.method==='HEAD') {res.end();return;}
    pipeline(fs.createReadStream(file),res,error=>{if(error)res.destroy();});
  };
  return {name:'local-data-analysis',configureServer(server){server.middlewares.use(handle);},configurePreviewServer(server){server.middlewares.use(handle);}};
}
