import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const dir=path.dirname(fileURLToPath(import.meta.url)), website=path.resolve(dir,'../..');
const tracked=['src/pages/ApologeticsPage.tsx','src/pages/WorldviewsPage.tsx','src/pages/worldviews.css','src/components/Layout.tsx','src/components/apologetics/MuslimWorldExplorer.tsx','content/apologetics/worldviews/islam.json','design/christianity-islam/preview.tsx'];
const hashes=()=>Object.fromEntries(tracked.map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(website,f))).digest('hex')]));
const before=hashes();
function replaceOnce(source,from,to){if(!source.includes(from))throw Error('Missing adaptation anchor: '+from.slice(0,100));return source.replace(from,to);}
const result=await build({entryPoints:[path.join(dir,'preview.tsx')],outdir:path.join(dir,'bundle'),bundle:true,splitting:true,format:'esm',minify:true,metafile:true,jsx:'automatic',entryNames:'preview-[hash]',chunkNames:'chunk-[hash]',assetNames:'asset-[hash]',alias:{'@':path.join(website,'src')},define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false','import.meta.env.PROD':'false','import.meta.env.BASE_URL':'"/"'},loader:{'.woff2':'file','.woff':'file'},plugins:[{name:'local-navigation-only',setup(b){
 b.onLoad({filter:/ApologeticsPage\.tsx$/},args=>{
   let contents=fs.readFileSync(args.path,'utf8');
   contents='import {NavigationHeader, IslamSideNav, IslamGuide} from '+JSON.stringify(path.join(dir,'preview.tsx').replaceAll('\\','/'))+';\n'+contents;
   contents='import {MosqueGallery} from '+JSON.stringify(path.join(dir,'mosque-icons.tsx').replaceAll('\\','/'))+';\n'+contents;
   const start=contents.indexOf('    <div className="ap-masthead">'), end=contents.indexOf('    {book.storageError',start);
   if(start<0||end<0)throw Error('Missing original navigation');
   contents=contents.slice(0,start)+'    <NavigationHeader/><MosqueGallery/><div className="am-layout"><IslamSideNav/><div className="ap-page am-content">\n'+contents.slice(end);
   contents=replaceOnce(contents,'return <div className="ap-page mx-auto max-w-7xl px-4 sm:px-6">','return <div className="am-shell">');
   contents=replaceOnce(contents,'    <Routes>','    <Routes><Route path="worldviews/islam/guide/*" element={<IslamGuide/>}/>');
   contents=replaceOnce(contents,'  </div>;\n}\nfunction Hub','  </div></div></div>;\n}\nfunction Hub');
   return {contents,loader:'tsx',resolveDir:path.dirname(args.path)};
 });
 b.onLoad({filter:/WorldviewsPage\.tsx$/},args=>({contents:fs.readFileSync(args.path,'utf8')+'\nexport {Collection, IslamHeroArt, CollectionArt, StudyArtwork, ClaimsDiagram, IllustratedStudy};',loader:'tsx',resolveDir:path.dirname(args.path)}));
 b.onLoad({filter:/christianity-islam[\\/]preview\.tsx$/},args=>{
   let contents=fs.readFileSync(args.path,'utf8');
   contents=contents.slice(0,contents.indexOf("createRoot(document.getElementById('root')!"));
   const start=contents.indexOf('function existingUrl('), end=contents.indexOf('const nav=',start);
   contents=contents.slice(0,start)+`function existingUrl(view:string,extra=''){const params=new URLSearchParams(extra.replace(/^[?&]/,''));params.delete('view');const query=params.toString();return '/apologetics/worldviews/islam'+(query?'?'+query:'')+(view==='questions'?'#comparison':view==='reading'?'#reading-sources':view==='world'?'#muslim-world':'')}
const url=(view:string,extra='')=>{const path=view==='worldviews'?'/apologetics/worldviews':view==='collection'?'/apologetics/worldviews/islam':'/apologetics/worldviews/islam/guide'+(view==='hub'?'':'/'+view);return path+(extra?'?'+extra.replace(/^[?&]/,''):'')};
`+contents.slice(end);
   return {contents:contents+'\nexport {Hub, Understanding, Ministry, Library, Article};',loader:'tsx',resolveDir:path.dirname(args.path)};
 });
 b.onLoad({filter:/apologetics-notebook\.ts$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace('"bp-apologetics-notebook-v1"','"bp-apologetics-menu-notebook-v1"'),loader:'ts',resolveDir:path.dirname(args.path)}));
 b.onLoad({filter:/MuslimWorldExplorer\.tsx$/},args=>({contents:fs.readFileSync(args.path,'utf8').replaceAll("window.location.hash === '#muslim-world'","window.location.hash.endsWith('#muslim-world')").replaceAll("window.location.hash !== '#muslim-world'","!window.location.hash.endsWith('#muslim-world')"),loader:'tsx',resolveDir:path.dirname(args.path)}));
}}]});
const previous=path.resolve(dir,'../christianity-islam/bundle');
for(const file of fs.readdirSync(previous)){if(file==='site-base.css'||/\.(woff2?|ttf)$/.test(file))fs.copyFileSync(path.join(previous,file),path.join(dir,'bundle',file));}
const [entry,meta]=Object.entries(result.metafile.outputs).find(([f,m])=>m.entryPoint?.replaceAll('\\','/').endsWith('apologetics-navigation/preview.tsx')&&f.endsWith('.js'));
fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Cache-Control" content="no-cache"><title>Worldviews · Apologetics · Bible Project</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="./bundle/site-base.css"><link rel="stylesheet" href="./bundle/${path.basename(meta.cssBundle)}"><script>try{if(!localStorage.getItem('bp-theme'))localStorage.setItem('bp-theme','dark')}catch{}</script></head><body><div id="root"></div><script type="module" src="./bundle/${path.basename(entry)}"></script></body></html>`);
if(JSON.stringify(before)!==JSON.stringify(hashes()))throw Error('Source changed while building');
fs.writeFileSync(path.join(dir,'source-baseline.json'),JSON.stringify({files:before},null,2));
console.log('Built http://localhost:8931/mockups/apologetics-navigation/');
