import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
const dir=path.dirname(fileURLToPath(import.meta.url));
const website=path.resolve(dir,'../..');
const audit=JSON.parse(fs.readFileSync(path.join(dir,'current-audit.json'),'utf8'));
const tracked=['src/pages/WorldviewsPage.tsx','src/pages/worldviews.css','src/components/Layout.tsx','src/components/apologetics/MuslimWorldExplorer.tsx','src/components/apologetics/BasisReader.tsx','content/apologetics/worldviews/islam.json','content/missions/muslim-world.json'];
const hashes=()=>Object.fromEntries(tracked.map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(website,f))).digest('hex')]));
const before=hashes();
const bundle=await build({entryPoints:[path.join(dir,'preview.tsx')],bundle:true,splitting:true,format:'esm',outdir:path.join(dir,'bundle'),entryNames:'preview-[hash]',chunkNames:'chunk-[hash]',assetNames:'asset-[hash]',minify:true,metafile:true,jsx:'automatic',alias:{'@':path.join(website,'src')},define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false','import.meta.env.PROD':'false','import.meta.env.BASE_URL':'"/"'},loader:{'.woff2':'file','.woff':'file'},plugins:[{
 name:'preview-only-exports',setup(b){
  b.onLoad({filter:/WorldviewsPage\.tsx$/},args=>({contents:fs.readFileSync(args.path,'utf8')+'\nexport { Collection, IslamHeroArt, CollectionArt, IslamClaimsDesk, ReadingPlanRoom, StudyArtwork, ClaimsDiagram, IllustratedStudy };',loader:'tsx',resolveDir:path.dirname(args.path)}));
  b.onLoad({filter:/apologetics-notebook\.ts$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace('"bp-apologetics-notebook-v1"','"bp-islam-design-notebook-v1"'),loader:'ts',resolveDir:path.dirname(args.path)}));
  b.onLoad({filter:/components[\\/]Layout\.tsx$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace('(isActive && !(to === "/study"', '((to === "/apologetics" && location.pathname.startsWith("/mockups/christianity-islam")) || isActive) && !(to === "/study"').replace('location.pathname.startsWith("/study/atlas"))) ||', 'location.pathname.startsWith("/study/atlas")) ||'),loader:'tsx',resolveDir:path.dirname(args.path)}));
 }
}]});
const base=audit.styles.find(x=>x.startsWith('/assets/index-'));
const baseFile=path.join(website,'dist',base.slice(1));
// Keep the inspected site's base styles and font files with this local mockup.
// A later production rebuild can replace hashed dist assets without breaking it.
const baseCss=fs.readFileSync(baseFile,'utf8').replace(/url\(([^)]+)\)/g,(all,raw)=>{
 const ref=raw.replace(/^['"]|['"]$/g,'');
 if(ref.startsWith('data:')||ref.startsWith('http')||ref.startsWith('#'))return all;
 const source=ref.startsWith('/')?path.join(website,'dist',ref.slice(1)):path.resolve(path.dirname(baseFile),ref);
 if(!fs.existsSync(source))throw Error('Missing base stylesheet asset: '+ref);
 const filename=path.basename(source);
 fs.copyFileSync(source,path.join(dir,'bundle',filename));
 return `url(./${filename})`;
});
fs.writeFileSync(path.join(dir,'bundle/site-base.css'),baseCss);
const [entry,metadata]=Object.entries(bundle.metafile.outputs).find(([file,data])=>data.entryPoint?.endsWith('preview.tsx')&&file.endsWith('.js'));
const script=path.basename(entry),stylesheet=path.basename(metadata.cssBundle);
fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Cache-Control" content="no-cache"><title>Islam study guide · Apologetics · Bible Project</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="./bundle/site-base.css"><link rel="stylesheet" href="./bundle/${stylesheet}"><script>try{if(!localStorage.getItem('bp-theme'))localStorage.setItem('bp-theme','dark')}catch{}</script></head><body><div id="root"></div><script type="module" src="./bundle/${script}"></script></body></html>`);
if(JSON.stringify(before)!==JSON.stringify(hashes()))throw Error('Production source changed during preview build.');
fs.writeFileSync(path.join(dir,'source-baseline.json'),JSON.stringify({scope:'Read-only component reuse; adaptations happen in the preview bundle only.',files:before},null,2));
console.log('Local mockup built: http://127.0.0.1:8931/mockups/christianity-islam/');
