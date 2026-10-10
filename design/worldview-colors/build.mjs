import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const dir=path.dirname(fileURLToPath(import.meta.url)),website=path.resolve(dir,'../..');
const result=await build({entryPoints:[path.join(dir,'preview.tsx')],outdir:path.join(dir,'bundle'),bundle:true,format:'esm',minify:true,metafile:true,jsx:'automatic',entryNames:'preview-[hash]',assetNames:'asset-[hash]',alias:{'@':path.join(website,'src')},define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false','import.meta.env.PROD':'false'},plugins:[{name:'isolated-worldview-palette',setup(b){
 b.onResolve({filter:/^existing-islam-art$/},()=>({path:'existing-islam-art',namespace:'existing-art'}));
 b.onLoad({filter:/.*/,namespace:'existing-art'},()=>{
  const source=fs.readFileSync(path.join(website,'src/pages/WorldviewsPage.tsx'),'utf8');
  const start=source.indexOf('function IslamHeroArt()'),end=source.indexOf('function identity(',start);
  if(start<0||end<0)throw Error('Existing Islam illustration anchor missing');
  return {contents:'export '+source.slice(start,end),loader:'tsx',resolveDir:website};
 });
 b.onLoad({filter:/apologetics-navigation\.ts$/},args=>{
 const source=fs.readFileSync(args.path,'utf8');
 const contents=source.replace(/const accents: Record<string,string> = \{.*\};/,"const accents: Record<string,string> = {islam:'var(--palette-islam)',secular:'var(--palette-secular)',buddhism:'var(--palette-buddhism)',hinduism:'var(--palette-hinduism)'};");
 if(contents===source)throw Error('Worldview palette adaptation anchor missing');
 return {contents,loader:'ts',resolveDir:path.dirname(args.path)};
});}}]});
const html=fs.readFileSync(path.join(website,'dist/index.html'),'utf8');
const stylesheet=html.match(/href="(\/assets\/index-[^"]+\.css)"/)[1];
const [entry,meta]=Object.entries(result.metafile.outputs).find(([f,m])=>m.entryPoint&&f.endsWith('.js'));
fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Worldview colors · Bible Project</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="${stylesheet}"><link rel="stylesheet" href="./bundle/${path.basename(meta.cssBundle)}"></head><body><div id="root"></div><script type="module" src="./bundle/${path.basename(entry)}"></script></body></html>`);
console.log('Built http://localhost:8931/mockups/worldview-colors/');
