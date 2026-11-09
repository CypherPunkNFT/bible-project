import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { combinations } from '../src/pages/games/two-truths/deal.ts';
import type { Statement, Person } from '../src/pages/games/two-truths/types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const dir = 'src/data/two-truths/';
function option(name: string, fallback: string) {
  const index=process.argv.indexOf(name);
  if (index<0) return fallback;
  if (!process.argv[index+1] || process.argv[index+1].startsWith('--')) throw Error(`Missing value: ${name}`);
  return path.resolve(process.argv[index+1]);
}
const source = JSON.parse(fs.readFileSync(option('--source',path.join(root,dir+'statements.source.json')),'utf8')) as { people: string[]; statements: Statement[] };
interface Approval { fingerprint: string; note: string }
const review=JSON.parse(fs.readFileSync(option('--review',path.join(root,dir+'semantic-review.json')),'utf8')) as {reviewer:string; statements:Record<string,Approval>; triples:Record<string,Approval>};
const hash=(value:unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fingerprint=(s:Statement) => hash([s.who,s.kind,s.text,s.refs,s.check,s.topic,s.truth??null,s.swap??null,s.swapIn??null,s.clash??[]]);
const pool = read('src/data/whos-older/characters.source.json').characters as { id: string; label: string; tag: string }[];
const slugs = read('src/data/people-slugs.json').slugs as Record<string,string>;
const books = Object.fromEntries([...fs.readFileSync(path.join(root,'scripts/bible/books.py'),'utf8').matchAll(/ {4}\("([^"]+)", "([^"]+)",/g)].map((m,i)=>[i+1,[m[1],m[2]]])) as Record<string,[string,string]>;
const blocked = read(dir + 'blocklist.json') as { refs: [number,number][]; topics: string[] };
const veto = JSON.parse(fs.readFileSync(option('--veto',path.join(root,dir+'veto.json')),'utf8')) as Record<string,string>;
const errors: string[] = [], warnings: string[] = [];
const ids = new Set<string>();
const normal = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g,' ').trim();
const cache = new Map<string,Record<string,string>>();
function passage([a,b]: [number,number]): string {
  const num = Math.floor(a/1000000), ch = Math.floor(a/1000)%1000;
  if (Math.floor(b/1000000) !== num || Math.floor(b/1000)%1000 !== ch || b < a || b-a > 100) throw Error('Invalid range');
  const code = books[num]?.[0]; if (!code) throw Error('Unknown book');
  if (!cache.has(code)) cache.set(code,read(`data/plain/bsb/${code}.json`));
  const book = cache.get(code)!;
  return Array.from({length:b-a+1},(_,i) => {
    const words=book[`${ch}:${a%1000+i}`]; if (!words) throw Error(`Missing verse ${a+i}`); return words;
  }).join(' ');
}
for (const s of source.statements) {
  try {
    if (ids.has(s.id)) throw Error('Duplicate id'); ids.add(s.id);
    if (!source.people.includes(s.who) || !pool.some(p => p.id === s.who)) throw Error('Unknown person');
    if (!['truth','lie'].includes(s.kind) || !s.topic || !s.origin || !s.id.startsWith(s.who+':')) throw Error('Invalid metadata');
    if (s.text.length < 20 || s.text.length > 110 || !/[.!?]$/.test(s.text)) throw Error('Invalid sentence length or ending');
    if (!s.refs?.length || !s.check) throw Error('Missing evidence');
    const words=normal(s.refs.map(passage).join(' '));
    if (!words.includes(normal(s.check))) throw Error(`Check words absent: ${s.check}`);
    if (blocked.topics.includes(s.topic) || s.refs.some(([a,b]) => blocked.refs.some(([x,y]) => a<=y && b>=x))) throw Error('Blocked fact');
    if (s.kind === 'lie') {
      if (!s.truth || !s.swap || !s.swapIn || !s.text.includes(s.swapIn)) throw Error('Missing correction or swap');
      if (!['person','place','number','object','group','order','outcome'].includes(s.swap)) throw Error('Invalid swap');
    }
    for (const id of s.clash ?? []) {
      const other=source.statements.find(other => other.id===id && other.who===s.who);
      if (!other || other.id===s.id) throw Error('Unknown or self clash');
      if (!other.clash?.includes(s.id)) throw Error('Asymmetric clash');
    }
    if (s.reviewed===true && !s.retired && !veto[s.id]) {
      const approval=review.statements[s.id];
      if (!approval?.note || approval.fingerprint!==fingerprint(s)) throw Error('Missing or stale semantic approval');
    }
  } catch (e) { errors.push(`${s.id}: ${(e as Error).message}`); }
}
for (const id of Object.keys(veto)) if (!ids.has(id) || !veto[id]) errors.push(`Invalid veto: ${id}`);
const statements = source.statements.filter(s => !s.retired && !veto[s.id] && s.reviewed===true);
const people: Person[] = [];
const triples: Record<string,string[][]>={};
const sheet=['# Two truths and a lie — starter review sheet','',
  'Reconciled with job 762 corrected design. '+review.reviewer+'. Mechanical checks establish reference/check-phrase integrity, not entailment. Content fingerprints bind semantic notes and triple review to these exact statements. No independent human approval or model verification is claimed.',''];
for (const id of source.people) {
  const person=pool.find(p=>p.id===id); if (!person) { errors.push(`Unknown person ${id}`); continue; }
  const rows=statements.filter(s=>s.who===id);
  const rounds=combinations(rows);
  const playable=rows.filter(s=>s.kind==='truth').length>=3 && rows.filter(s=>s.kind==='lie').length>=2 && rounds.length>0;
  sheet.push(`## ${person.label} (${playable ? rounds.length+' possible rounds' : 'not playable'})`,'');
  if (playable) people.push({id,label:person.label,tag:person.tag,href:`/people/${Object.entries(slugs).find(([,v])=>v===id)?.[0] ?? id}`, testament: /-(mat|luk|act)-/.test(id) ? 'new':'old'});
  const mean=(kind:string) => { const group=rows.filter(s=>s.kind===kind); return group.reduce((n,s)=>n+s.text.length,0)/(group.length||1); };
  if (Math.abs(mean('lie')/mean('truth')-1)>0.25) warnings.push(`${id}: truth/lie length imbalance`);
  for (const s of rows) sheet.push(`- ${s.id}: ${s.kind==='lie' ? `~~${s.text}~~ **The truth:** ${s.truth}` : s.text} (${s.refs.map(([a,b])=>a===b ? a : `${a}–${b}`).join(', ')}; check: ${s.check}; topic: ${s.topic}; clashes: ${(s.clash??[]).join(', ')||'none'}${s.swap?`; swap ${s.swap}: ${s.swapIn}`:''})`, `  Review: ${review.statements[s.id]?.note??'MISSING'}`, `  > ${s.refs.map(passage).join(' ')}`);
  for (const round of rounds) {
    const key=round.map(s=>s.id).sort().join('|'), approval=review.triples[key];
    if (!approval?.note || approval.fingerprint!==hash(round.map(fingerprint))) errors.push(`Missing or stale triple approval: ${key}`);
    sheet.push(`- Triple ${round.map(s=>s.id).join(' / ')}: ${approval?.note??'MISSING'}`);
  }
  if (playable) triples[id]=rounds.map(round=>round.map(s=>s.id));
  const excluded=source.statements.filter(s=>s.who===id && !rows.includes(s));
  for (const s of excluded) sheet.push(`- Excluded ${s.id}: ${veto[s.id]??(s.retired?'retired':'unreviewed')}`);
  sheet.push('');
}
if (people.length<10) errors.push('Fewer than ten playable people');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const content={people,statements:statements.filter(s=>people.some(p=>p.id===s.who)),triples};
const stamp=createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0,16);
const outputs: [string,string][]=[[option('--data-out',path.join(root,dir+'two-truths.json')),JSON.stringify({stamp,...content},null,2)+'\n'],[option('--review-sheet',process.env.TWO_TRUTHS_REVIEW_SHEET??path.join(root,'docs/features/two-truths/review-sheet.md')),sheet.join('\n')+'\n']];
for (const [name,body] of outputs) {
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(name) || fs.readFileSync(name,'utf8')!==body) { console.error(`Stale: ${name}`); process.exitCode=1; }
  } else fs.writeFileSync(name,body,'utf8');
}
console.log(`${people.length} people, ${content.statements.length} mechanically verified statements; stamp ${stamp}`);
for (const warning of warnings) console.warn(warning);
