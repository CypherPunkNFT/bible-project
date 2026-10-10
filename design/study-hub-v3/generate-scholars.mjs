// Snapshot the actual Scholars layout and mark geometry for the isolated static mockup.
import {readFile,writeFile} from 'node:fs/promises';
import ts from 'typescript';
const root=new URL('../../',import.meta.url),source='src/pages/teachers/scholars/';
async function moduleAt(path,bindings={}){
  const text=(await readFile(new URL(source+path,root),'utf8')).replace(/^import .*;\r?\n/gm,'');
  const js=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports={};new Function('exports',...Object.keys(bindings),js)(exports,...Object.values(bindings));return exports;
}
const data=JSON.parse(await readFile(new URL('src/data/teachers/scholars.json',root),'utf8'));
const {byBirth}=await moduleAt('marks/facts.ts');
const {buildSky}=await moduleAt('landing/layout.ts',{byBirth});
const {fieldShape,initials,FIELD_TONE}=await moduleAt('marks/shapes.ts');
const sky=buildSky(data,'wide');
const snapshot={w:sky.w,h:sky.h,size:sky.size,fields:sky.fields.map(f=>({id:f.field,label:data.fields[f.field],tone:FIELD_TONE[f.field],mx:f.mx,my:f.my,bottom:f.bottom,r:f.r,outer:fieldShape(f.field,1),inner:fieldShape(f.field,.82),nodes:f.own.map(n=>({id:n.s.id,name:n.s.name,initials:initials(n.s),x:n.x,y:n.y,used:n.s.site?.status==='in-use'}))}))};
await writeFile(new URL('scholar-sky.js',import.meta.url),'/* Generated from the production Scholars layout, marks and catalogue. */\nwindow.STUDY_SCHOLAR_SKY='+JSON.stringify(snapshot)+';\n');
console.log(`Generated ${sky.nodes.length} scholar marks from the production layout.`);
