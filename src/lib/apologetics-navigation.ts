import {DEBATES, PATHS, PRACTICE, STUDIES, TOPICS, WORLDVIEWS} from '@/data/apologetics-library';
const base = '/apologetics';
const islam = base + '/worldviews/islam';
const guide = islam + '/guide';
type Destination = { label: string; to: string; detail?: string; accent?: string };
const main: Destination[] = [
  {label:'Explore',to:base}, {label:'Questions',to:base+'/questions'},
  {label:'Reformed theology',to:base+'/topics/reformed'}, {label:'Historic texts',to:base+'/texts'},
  {label:'Learning paths',to:base+'/paths'}, {label:'Worldviews',to:base+'/worldviews'},
  {label:'Debates',to:base+'/debates'}, {label:'Practice',to:base+'/practice'}, {label:'My study',to:base+'/saved'},
];
const worldviewNames: Record<string,string> = {islam:'Islam',secular:'Secular',buddhism:'Buddhism',hinduism:'Hinduism'};
const accents: Record<string,string> = {islam:'var(--poetry)',secular:'var(--worldview-secular)',buddhism:'var(--worldview-buddhism)',hinduism:'var(--worldview-hinduism)'};
const worlds: Destination[] = WORLDVIEWS.map(w => ({label:worldviewNames[w.id],to:base+'/worldviews/'+w.id,accent:accents[w.id],detail:w.description}));
const islamPages: Destination[] = [
  {label:'Overview',to:islam,detail:'Christianity & Islam'},
  {label:'Understanding Islam',to:guide+'/understanding',detail:'Beliefs, texts & daily life'},
  {label:'Ministering to Muslim friends',to:guide+'/ministry',detail:'Friendship & conversation'},
];
const browseGroups = [
  {label:'Explore the faith',links:main.slice(0,4)},
  {label:'Across beliefs',links:worlds},
  {label:'Put it into practice',links:main.slice(4).filter(x=>x.label!=='Worldviews'&&x.label!=='My study')},
  {label:'Keep studying',links:[main[8],{label:'The source room',to:base+'/sources'},...islamPages.slice(1,3)]},
];
const destinations: Destination[] = [
  ...main,...worlds,...islamPages,
  {label:'The source room',to:base+'/sources',detail:'Primary texts and study sources'},
  ...TOPICS.map(t=>({label:t.title,to:base+'/topics/'+t.id,detail:'Question topic'})),
  ...PATHS.map(p=>({label:p.title,to:base+'/paths/'+p.id,detail:'Learning path'})),
  ...DEBATES.map(d=>({label:d.title,to:base+'/debates/'+d.id,detail:'Debate study'})),
  ...STUDIES.map(s=>({label:s.title,to:base+'/study/'+s.id,detail:'Study · '+s.summary})),
];
function groupFor(path:string) {
  if(path.startsWith(base+'/topics/reformed')) return 'Reformed theology';
  if(path.startsWith(base+'/topics/')||path.startsWith(base+'/study/')) return 'Questions';
  return [...main].reverse().find(x=>x.to!==base&&path.startsWith(x.to))?.label ?? (path.startsWith(base+'/sources')?'Sources':'Explore');
}
function secondary(group:string): Destination[] {
  if(group==='Worldviews') return [{label:'All worldviews',to:base+'/worldviews'},...worlds];
  if(group==='Questions') return [{label:'All questions',to:base+'/questions'},...TOPICS.map(t=>({label:t.title,to:base+'/topics/'+t.id}))];
  if(group==='Learning paths') return [{label:'All paths',to:base+'/paths'},...PATHS.map(p=>({label:p.title,to:base+'/paths/'+p.id}))];
  if(group==='Practice') return PRACTICE.map(p=>({label:p.label,to:base+'/practice?scenario='+p.id}));
  if(group==='Reformed theology'||group==='Historic texts') return [{label:'Reformed questions',to:base+'/topics/reformed'},{label:'Confessions & historic texts',to:base+'/texts'},{label:'The source room',to:base+'/sources'}];
  if(group==='Debates') return [{label:'All exchanges',to:base+'/debates'},{label:'The source room',to:base+'/sources'},{label:'Conversation practice',to:base+'/practice'}];
  if(group==='My study'||group==='Sources') return [{label:'My study',to:base+'/saved'},{label:'The source room',to:base+'/sources'},{label:'Find a question',to:base+'/questions'}];
  return [{label:'Start here',to:base+'/paths/begin'},{label:'Explore the questions',to:base+'/questions'},{label:'Across beliefs',to:base+'/worldviews'},{label:'The source room',to:base+'/sources'}];
}

function currentIslam(path:string,search:string) {
  if(path.endsWith('/article'))return islamPages[['friendship','journeys','gospel','debates'].includes(new URLSearchParams(search).get('article')??'')?2:1];
  return islamPages.find(d=>d.to===path)??islamPages[0];
}

export {main, worlds, islamPages, groupFor, secondary, currentIslam, browseGroups, destinations};
