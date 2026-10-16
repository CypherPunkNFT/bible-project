import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async p => JSON.parse(await fs.readFile(path.join(root, p), 'utf8'));
const catalog = await read('data/catalog.json');
const people = await read('data/study/people.json');
const choices = await read('content/long-memory.json');
const kjv = catalog.translations.find(t => t.slug === 'kjv');
const books = catalog.books.filter(b => b.num <= 66).map(b => ({...b, chapters: kjv.books[b.code].length}));
const plain = new Map();
async function point(id) {
  const b = Math.floor(id / 1000000), c = Math.floor(id % 1000000 / 1000), v = id % 1000;
  const book = books.find(book => book.num === b);
  if (!book) throw new Error(`Unknown book: ${id}`);
  if (!plain.has(b)) plain.set(b, await read(`data/plain/kjv/${book.code}.json`));
  const text = plain.get(b)[`${c}:${v}`];
  if (!text) throw new Error(`Missing KJV verse: ${id}`);
  const n = Object.keys(plain.get(b)).filter(key => key.startsWith(`${c}:`)).length;
  return {id,b,c,v,n,text:text.replace(/^¶\s*/, '')};
}
const out = path.join(root, 'src/data/long-memory');
await fs.mkdir(out,{recursive:true});
const index = [];
for (const choice of choices) {
  const row = people.find(p => p.id === choice.id);
  if (!row) throw new Error(`Missing person: ${choice.id}`);
  const detail = await read(`data/study/people/${choice.id}.json`);
  const mentions = [...new Set(detail.refs)].sort((a,b)=>a-b);
  if (mentions.length !== row.c) throw new Error(`Count mismatch: ${choice.id}`);
  const ids = new Set(mentions);
  const lenses = {};
  for (const mode of ['words','moments','memory']) {
    lenses[mode] = choice[mode].map(([title,code,c,from,to]) => {
      const b = books.find(b => b.code === code).num;
      const refs = Array.from({length:to-from+1},(_,i)=>b*1000000+c*1000+from+i);
      refs.forEach(id=>ids.add(id));
      return {title,refs};
    });
  }
  const points = await Promise.all([...ids].sort((a,b)=>a-b).map(point));
  await fs.writeFile(path.join(out,`${choice.key}.json`),JSON.stringify({mentions,lenses,points}));
  index.push({id:choice.id,key:choice.key,name:choice.name,role:choice.role,line:choice.line,count:mentions.length,books:new Set(mentions.map(id=>Math.floor(id/1000000))).size});
}
await fs.writeFile(path.join(out,'index.json'),JSON.stringify({books,people:index}));
console.log(index.map(p=>`${p.name}: ${p.count} verses / ${p.books} books`).join('\n'));
