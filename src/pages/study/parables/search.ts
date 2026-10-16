import { PARABLES, PARABLE_ROOMS, type Parable } from '../../../data/parables';

function normalize(text: string) {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[’']/g,'').replace(/&/g,' and ').replace(/neighbour/g,'neighbor')
    .replace(/[^a-z0-9]+/g,' ').trim();
}

const books: Record<string,string> = {matthew:'MAT',matt:'MAT',mat:'MAT',mt:'MAT',mark:'MRK',mrk:'MRK',mk:'MRK',luke:'LUK',luk:'LUK',lk:'LUK'};
const referencePattern=/^(matthew|matt|mat|mt|mark|mrk|mk|luke|luk|lk)\.?\s*(\d+)?(?:\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?\s*$/;
export function findSearchPassage(story: Parable, query: string) {
  const reference=query.trim().toLowerCase().match(referencePattern);
  if(!reference) return undefined;
  const [,book,chapter,start,end]=reference;
  if(start && (!chapter || Number(start)<1 || Number(end ?? start)<Number(start))) return undefined;
  return story.passages.find(p=>p.book===books[book] && (!chapter || p.chapter===Number(chapter)) &&
    (!start || p.start<=Number(end ?? start) && p.end>=Number(start)));
}
const entries = PARABLES.map(story=>({
  story,
  name: normalize(`${story.title} ${story.aliases ?? ''}`),
  text: normalize(`${story.title} ${story.aliases ?? ''} ${story.question} ${PARABLE_ROOMS.find(room=>room.id===story.room)?.title ?? ''}`),
}));

/** Search only this curated collection; verse searches overlap its linked ranges. */
export function searchParables(query: string): Parable[] {
  if(referencePattern.test(query.trim().toLowerCase())) return PARABLES.filter(story=>findSearchPassage(story,query));
  const words=normalize(query).split(/\s+/).filter(word=>word && !['a','an','the','and','of'].includes(word));
  if(!words.length) return [...PARABLES];
  return entries.filter(entry=>words.every(word=>entry.text.includes(word)))
    .sort((a,b)=>Number(words.every(word=>b.name.includes(word)))-Number(words.every(word=>a.name.includes(word))))
    .map(entry=>entry.story);
}
