/** Index source directories actually imported by live study pages. No holdings or name-search inference. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const inputs={};
const hash=file=>{const raw=fs.readFileSync(file);inputs[file]=createHash('sha256').update(raw).digest('hex');return raw.toString('utf8').replace(/^\uFEFF/,'');};
const read=file=>JSON.parse(hash(file));
hash('scripts/collect-scholar-site-sources.mjs');
const definitions=[
 ['witnesses','Surviving manuscripts','/study/surviving-witnesses','src/pages/study/witnesses/SurvivingWitnessesPage.tsx',['src/pages/study/witnesses/witnesses.ts']],
 ['manuscript-passages','Passage through manuscripts','/study/passage-through-manuscripts','src/pages/study/passages/PassageManuscriptsPage.tsx',['src/pages/study/passages/evidence.ts']],
 ['dead-sea-scrolls','Dead Sea Scrolls','/study/dead-sea-scrolls','src/pages/study/scrolls/DeadSeaScrollsPage.tsx',['content/academic-research/03-dead-sea-scrolls.json']],
 ['canon','How the canon took shape','/study/how-the-canon-took-shape','src/pages/study/canon/CanonPage.tsx',['content/academic-research/04-how-the-canon-took-shape.json']],
 ['printed-bible','Manuscript to printed Bible','/study/from-manuscript-to-printed-bible','src/pages/study/print-room/PrintRoomShared.tsx',['content/academic-research/05-from-manuscript-to-printed-bible.json']],
 ['discoveries','Discoveries and the biblical record','/study/discoveries-biblical-record','src/pages/study/discoveries/Evidence.tsx',['content/academic-research/06-discoveries-biblical-record.json']],
 ['empires','Israel among the empires','/study/israel-among-the-empires','src/pages/study/empires/IsraelEmpiresPage.tsx',['src/pages/study/empires/evidence.ts']],
 ['cities','Cities through their layers','/study/cities-through-their-layers','src/pages/study/history/HistoryShared.tsx',['src/pages/study/history/evidence.ts','src/pages/study/history/cities-research.ts']],
 ['world','World of Jesus and the apostles','/study/world-of-jesus-apostles','src/pages/study/world/MergedWorldPage.tsx',['src/pages/study/world/world-data.ts','src/pages/study/world/investigation-data.ts','src/pages/study/world/merged-data.ts']],
 ['parables','Parables · close reading','/study/gospels?guide=parables','src/pages/study/parables/ParablesPage.tsx',['src/data/parables-deep-reading.ts']],
 ['atlas-history','Atlas · historical collections','/study/atlas','src/pages/AtlasPage.tsx',['src/pages/places/history-collections.ts']],
];
const providerNames={
 'britishmuseum.org':'British Museum','deadseascrolls.org.il':'Israel Antiquities Authority','imj.org.il':'Israel Museum','collections.imj.org.il':'Israel Museum','dss.collections.imj.org.il':'Israel Museum',
 'codexsinaiticus.org':'Codex Sinaiticus Project','vatlib.it':'Vatican Library','vatican.va':'Vatican Library','lib.umich.edu':'University of Michigan Library','apps.lib.umich.edu':'University of Michigan Library','ascsa.edu.gr':'American School of Classical Studies at Athens',
 'bl.uk':'British Library','lib.cam.ac.uk':'Cambridge University Library','cambridge.org':'Cambridge University Press','chesterbeatty.ie':'Chester Beatty','ntvmr.uni-muenster.de':'Institute for New Testament Textual Research',
 'isac.uchicago.edu':'Institute for the Study of Ancient Cultures','metmuseum.org':'Metropolitan Museum of Art','louvre.fr':'Musée du Louvre','getty.edu':'Getty Museum','gutenberg.org':'Project Gutenberg','ccel.org':'Christian Classics Ethereal Library','sblgnt.com':'Society of Biblical Literature',
 'thegospelcoalition.org':'The Gospel Coalition','inscriptionsisraelpalestine.org':'Inscriptions of Israel/Palestine','penn.museum':'Penn Museum','custodia.org':'Custodia Terrae Sanctae','gov.il':'Israel Antiquities Authority','magdala.org':'Magdala Archaeological Project',
 'pompeiisites.org':'Archaeological Park of Pompeii','whc.unesco.org':'UNESCO','culture.gouv.fr':'French Ministry of Culture','biblegateway.com':'Bible Gateway','doi.org':'Publisher / DOI record',
};
const notCredit=/^(\d|the |a |an |great isaiah|ecm mark|codex |sirach|summa|world english|digital |dead sea|temple |greek |latin |roman |bible |manuscript |new testament|old testament|journal |international |fortress press hebrew|through assyria|cuneiform)/i;
function credit(s){
 if(s.author)return s.author;
 const label=s.title??s.label??'';
 const prefix=label.split(/\s+·\s+|:\s+/)[0].trim();
 if(prefix!==label&&prefix.length<85&&!notCredit.test(prefix))return prefix;
 const host=new URL(s.url??s.href).hostname.replace(/^www\./,'');
 const entry=Object.entries(providerNames).find(([domain])=>host===domain||host.endsWith('.'+domain));
 return entry?.[1]??host;
}
function objects(value,result=[]){
 if(Array.isArray(value))for(const v of value)objects(v,result);
 else if(value&&typeof value==='object'){
   if((value.url||value.href)&&(value.title||value.label)&&/^https?:/.test(value.url??value.href))result.push(value);
   else for(const v of Object.values(value))objects(v,result);
 }
 return result;
}
async function loadModule(file){
 const result=await build({entryPoints:[file],bundle:true,write:false,format:'esm',platform:'node',metafile:true,logLevel:'silent'});
 for(const input of Object.keys(result.metafile.inputs))if(fs.existsSync(input))hash(input.replaceAll('\\','/'));
 return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
function referenceIds(value,ids=new Set()){
 if(Array.isArray(value))for(const v of value)referenceIds(v,ids);
 else if(value&&typeof value==='object')for(const[key,child]of Object.entries(value)){
   if(['sourceIds','sources','links'].includes(key)&&Array.isArray(child))for(const id of child)if(typeof id==='string')ids.add(id);
   referenceIds(child,ids);
 }
 return ids;
}
const features=[];
for(const [id,label,address,page,files]of definitions){
 hash(page);const rows=[];
 for(const file of files){
   const raw=hash(file),whole=file.endsWith('.json')?read(file):await loadModule(file);
   const value=file.endsWith('.json')?whole.sources:whole,used=referenceIds(whole);
   const sources=objects(value);
   for(const source of sources){
     const url=source.url??source.href,title=source.title??source.label;
     const consultation=source.access??source.read??source.scope??source.contribution??source.limit??'';
     // A directory citation is evidence of attribution, not a claim the complete book was read.
     const kind=file.endsWith('.json')&&source.id&&!used.has(source.id)?'bibliography':'citation';
     rows.push({author:credit(source),title,year:source.year??source.date??'',url,evidence:file,verify:raw.includes(url)?url:raw.includes('PARABLE_DEEP_READINGS')?'PARABLE_DEEP_READINGS':raw.includes('sources')?'sources':raw.slice(0,30),locator:consultation||'Source linked in the live study’s research trail.',consultation,kind});
   }
 }
 const unique=[...new Map(rows.map(row=>[JSON.stringify([row.author,row.title,row.url]),row])).values()];
 features.push({id,label,address,rows:unique});
}
// Source data feeding live charts, as opposed to books merely held in the library.
const direct=[
 ['bible-texts','Bible reader · text editions','/bible','eBible.org','Scripture text distributions used by the reader','https://ebible.org/Scriptures/','scripts/build-data.py','build_translation','Reader editions imported from the registered eBible translation distributions; edition-specific credits remain in Versions & sources.'],
 ['cross-references','Scripture cross-references','/study/connections','OpenBible.info','Bible cross-reference dataset','https://www.openbible.info/labs/cross-references/','scripts/build-data.py','read_cross_references','Cross-reference edges generated from the OpenBible dataset.'],
 ['atlas','Atlas and biblical places','/study/atlas/map','OpenBible.info','Bible Geocoding Data','https://github.com/openbibleinfo/Bible-Geocoding-Data','scripts/build-data.py','read_places','Place records and coordinates loaded by the atlas.'],
];
for(const[id,label,address,author,title,url,file,verify,locator]of direct){const raw=hash(file);if(!raw.includes(verify))throw Error(`Missing ${verify}`);features.push({id,label,address,rows:[{author,title,year:'',url,evidence:file,verify,locator}]});}
const output={schemaVersion:1,scope:'Source directories imported by live pages, plus verified chart data inputs. Institution labels identify source providers when no named author is recorded. Bibliographic access limits are retained; holdings and incidental name mentions are excluded.',inputs,features};
const text=JSON.stringify(output,null,2)+'\n',target='content/teachers/site-source-sweep.json';
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==text)throw Error('Site source sweep is stale');}else fs.writeFileSync(target,text);
console.log(JSON.stringify(features.map(f=>({id:f.id,sources:f.rows.length})),null,2));
