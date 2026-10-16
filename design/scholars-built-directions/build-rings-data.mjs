import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const scholars=read('src/data/teachers/scholars.json').scholars,people=read('src/data/teachers/people.json').people,teachers=read('src/data/teachers/teachers.json').teachers;
const aliases=read('content/teachers/source-profile-aliases.json').aliases;
const key=s=>String(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const leaders=[],lookup=new Map();
for(const p of [...people,...scholars,...teachers]){
 let leader=lookup.get(key(p.name));
 if(!leader){leader={id:p.id,name:p.name,short:p.short||p.name.split(' ').at(-1),born:p.born??null,died:p.died??null,line:p.line||'',kind:people.includes(p)?'Preacher & teacher':scholars.includes(p)?'Scholar':p.sections?.includes('preacher')?'Preacher & teacher':'Author & teacher',field:p.field||null,library:p.shelf||`/apologetics/texts?author=${encodeURIComponent(p.acquiredId||p.id)}`,aliases:[]};leaders.push(leader);}
 for(const name of [p.name,...(aliases[p.id]||[])]){lookup.set(key(name),leader);leader.aliases.push(name);}
 if(!leader.line&&p.line)leader.line=p.line;
}
const match=credit=>lookup.get(key(credit))||lookup.get(key(credit.split(/,?\s+(?:trans\.|translated|ed\.|edited)|\s+·/i)[0]));
const works=[],byKey=new Map();
function add({title,author,year='',url=null,records=[],leader=null,origin='citation',originalDate=false}){
 leader=leader||match(author);
if(leader?.id==='author-john-owen')title=({'Of Communion with God':'Communion with God','Of the Mortification of Sin in Believers':'The Mortification of Sin'})[title]||title;
const k=key(leader?.id||author)+'|'+key(title);let w=byKey.get(k);
 if(!w){w={id:`work-${works.length}`,title,author,leader:leader?.id||null,year:String(year),url,records:[],origin,originalDate};works.push(w);byKey.set(k,w);}
 if(url&&!w.url)w.url=url;if(year&&(!w.year||originalDate)){w.year=String(year);w.originalDate=originalDate;}
 w.records.push(...records);return w;
}
for(const f of read('content/teachers/feature-usage.json').features)for(const r of f.sources)add({...r,records:[{...r,feature:f.id}]});
for(const s of scholars)for(const [title,year]of s.works)add({title,year,author:s.name,leader:lookup.get(key(s.name)),origin:'catalogue'});
for(const t of teachers){const p=people.find(p=>p.id===t.id),leader=lookup.get(key(t.name));for(const w of t.published||[])add({title:w.title,author:t.name,url:w.source,leader,origin:'library'});for(const w of p?.known||[])add({title:w.t,year:w.y,author:p.name,url:w.u,leader,origin:'library',originalDate:true});}
// Preserve unmapped and joint credits as their own contributors; do not turn joint credits into a single person.
for(const w of works)if(!w.leader){let p=lookup.get(key(w.author));if(!p){p={id:`credit-${leaders.length}`,name:w.author,short:w.author,born:null,died:null,line:'',kind:'Recorded contributor',field:null,library:`/apologetics/texts?q=${encodeURIComponent(w.author)}`,aliases:[w.author]};leaders.push(p);lookup.set(key(w.author),p);}w.leader=p.id;}
const byLeader=new Map(leaders.map(p=>[p.id,p]));
const cats=[
 {id:'scripture',label:'Scripture studies',tag:'Read the text',tone:'#c9a454',icon:'book',description:'Gospels, letters and the themes running through Scripture.',studies:[['letters','Letters & their message','/study/letters'],['gospels','Gospel harmony','/study/gospels'],['miracles','Miracles','/study/miracles'],['topics','Themes & topics','/topics']]},
 {id:'theology',label:'Theology studies',tag:'Follow the teaching',tone:'#b39acb',icon:'arch',description:'Doctrine, Christian living and the teachers behind them.',studies:[['doctrine','Doctrine & belief','/study/theology'],['christian-life','The Christian life','/study/theology'],['church','The church & ministry','/study/theology']]},
 {id:'atlas',label:'Atlas',tag:'Enter the world',tone:'#70b6aa',icon:'compass',description:'Places, journeys and the geography of the biblical world.',studies:[['geography','Biblical geography','/study/atlas'],['journeys','Journeys & the early church','/study/atlas'],['ancient-world','The ancient world','/study/atlas']]},
 {id:'archaeology',label:'Archaeology studies',tag:'Explore the evidence',tone:'#d29570',icon:'layers',description:'Excavations, inscriptions and the material traces of history.',studies:[['holy-land','Archaeology of the Holy Land','/study/academic'],['near-east','Egypt & the Near East','/study/academic'],['excavations','Excavations & inscriptions','/study/academic']]},
 {id:'apologetics',label:'Apologetics',tag:'Examine a question',tone:'#80a8cd',icon:'spark',description:'Faith, reason and the historic claims of Christianity.',studies:[['faith-reason','Faith & reason','/apologetics'],['bible-canon','Scripture & canon','/apologetics/study/scripture'],['cross-resurrection','Cross & resurrection','/apologetics/study/resurrection']]},
 {id:'history',label:'People & history',tag:'Trace the story',tone:'#c28e9f',icon:'columns',description:'Rulers, prophets and the beginnings of the church.',studies:[['rulers','Rulers & kingdoms','/study/people?view=rulers'],['apostles','Apostles & the early church','/study/people?view=apostles'],['prophets','Prophets','/study/prophets']]},
];
const direct={letters:'letters',gospels:'harmony',miracles:'miracles',topics:'topics',rulers:'people-rulers',apostles:'people-apostles',prophets:'people-prophets','faith-reason':'apologetics'};
const patterns={doctrine:/institutes|divinity|theolog|doctrine|justification|christian religion|trinity|confession|atonement|creed|grace/i,'christian-life':/prayer|holiness|mortification|communion|contentment|pilgrim|morning and evening|all of grace|christian life|devotion|glory of christ/i,church:/church|ministry|pastor|preach|sermon|lectures to my students|decades/i,geography:/geograph|biblical researches|palestine|jordan|negev|jerusalem|holy land/i,journeys:/paul|traveller|roman empire|apostol|early church/i,'ancient-world':/egypt|nineveh|babylon|assyri|hittite|ancient near eastern|chaldean|antiquities/i,'holy-land':/palestine|holy land|israel|jerusalem|jericho|lachish|hazor|masada|qumran|dead sea|dan\b|megiddo|shechem|gibeon|philistine|herod|negev/i,'near-east':/egypt|nineveh|babylon|assyri|hittite|ancient near east|chaldean|\bur\b/i,excavations:/excavat|inscription|seal|pottery|archaeolog|stratigraphy|digging|recovery/i,'bible-canon':/scripture|canon|manuscript|bible|trustworthy/i,'cross-resurrection':/resurrection|cross|forgiveness|salvation|grace/i};
const studies=cats.flatMap(c=>c.studies.map(([id,label,url])=>({id,label,url,category:c.id,works:[]})));
for(const study of studies){for(const w of works){const p=byLeader.get(w.leader);let rs=[],curated=false;
 if(direct[study.id])rs=w.records.filter(r=>r.feature===direct[study.id]);
 else if(study.category==='apologetics')rs=w.records.filter(r=>r.feature==='apologetics'&&r.uses.some(u=>patterns[study.id].test(u.page+' '+u.address)));
 else if(['archaeology','atlas'].includes(study.category))curated=(p.field==='places'||(study.category==='atlas'&&p.field==='history'))&&patterns[study.id].test(w.title);
 else curated=['library','catalogue'].includes(w.origin)&&patterns[study.id].test(w.title);
 if(!rs.length&&!curated)continue;
 const count=new Set(rs.flatMap(r=>r.uses.map(u=>u.evidence+'|'+u.locator))).size;
 const cited=rs.some(r=>r.kind!=='bibliography');study.works.push({id:w.id,uses:count,kind:rs.length?(cited?'Used in this study':'Further reading'):'Curated reading',score:(cited?10000:rs.length?1000:0)+count});
 }
 study.works.sort((a,b)=>b.score-a.score||Number(works.find(w=>w.id===b.id).originalDate)-Number(works.find(w=>w.id===a.id).originalDate)||works.find(w=>w.id===a.id).title.localeCompare(works.find(w=>w.id===b.id).title));
}
// Full numbered inventory for the density trial, kept separate from the curated study shelves.
const sermonInventory=read('content/library/reports/spurgeon/sermons.json');
const inventoryLinks=new Map(read('content/library/reports/spurgeon/inventory.json').sermons.map(s=>[s.assetId,s.url]));
const dateIssues=new Set(read('content/library/reports/spurgeon/metadata-review.json').sourceIssues.map(s=>s.numberLabel));
// These printed dates cannot describe a preaching occasion in Spurgeon's lifetime.
dateIssues.add('2429');dateIssues.add('3443');
const spurgeonWorks=sermonInventory.filter(s=>s.creatorId==='author-charles-spurgeon').map(s=>{
 const lifetime=d=>d.value&&/^\d{4}/.test(d.value)&&Number(d.value.slice(0,4))>=1834&&Number(d.value.slice(0,4))<=1892;
 const delivered=!dateIssues.has(s.numberLabel)&&s.dates.find(d=>d.event==='delivery'&&lifetime(d));
 const published=s.dates.find(d=>d.event==='original-publication'&&lifetime(d));
 const date=delivered||published;
 const later=s.dates.find(d=>d.event==='original-publication'&&d.value);
 return {id:s.workId,title:s.title,author:'Charles Haddon Spurgeon',leader:'author-charles-spurgeon',year:date?date.value.slice(0,4):String(later?.value||''),fullDate:date?.value||null,dateEvent:date?.event||null,dateNote:dateIssues.has(s.numberLabel)?'The printed delivery date is flagged; it is not used to place this work.':null,url:inventoryLinks.get(s.assetId)||null,records:[],origin:'library',originalDate:!!date,genre:s.genre,number:s.numberLabel,passages:s.mainTexts.map(p=>p.reference),catalogueEntry:true};
});
const leaderWorks={'author-charles-spurgeon':spurgeonWorks};
fs.writeFileSync(path.join(dir,'rings-data.json'),JSON.stringify({categories:cats.map(({studies,...c})=>c),studies,leaders,works,leaderWorks}));
console.log('Spurgeon full inventory:',spurgeonWorks.length,'entries;',spurgeonWorks.filter(w=>w.fullDate).length,'dated in lifetime');
console.log(JSON.stringify({works:works.length,leaders:leaders.length,studies:studies.map(s=>[s.id,s.works.length])}));
