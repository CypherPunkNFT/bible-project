// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { PATHS, PRACTICE, TOPICS, WORLDVIEWS } from '@/data/apologetics-library';
import { createContext, useContext } from 'react';
import './preview.css';
import './variants.css';
export const DesignContext=createContext('a');

export const useDesign=()=>useContext(DesignContext);

export const base = '/apologetics';

export const islam = base + '/worldviews/islam';

export const guide = islam + '/guide';

export type Destination = { label: string; to: string; detail?: string; accent?: string };

export const main: Destination[] = [
  {label:'Explore',to:base}, {label:'Questions',to:base+'/questions'},
  {label:'Reformed theology',to:base+'/topics/reformed'}, {label:'Historic texts',to:base+'/texts'},
  {label:'Learning paths',to:base+'/paths'}, {label:'Worldviews',to:base+'/worldviews'},
  {label:'Debates',to:base+'/debates'}, {label:'Practice',to:base+'/practice'}, {label:'My study',to:base+'/saved'},
];

export const worldviewNames: Record<string,string> = {islam:'Islam',secular:'Secular thought',buddhism:'Buddhism',hinduism:'Hinduism'};

export const accents: Record<string,string> = {islam:'var(--poetry)',secular:'var(--epistles)',buddhism:'var(--accent)',hinduism:'var(--history)'};

export const worlds: Destination[] = WORLDVIEWS.map(w => ({label:worldviewNames[w.id],to:base+'/worldviews/'+w.id,accent:accents[w.id],detail:w.description}));

export const islamPages: Destination[] = [
  {label:'Overview',to:guide,detail:'A place to begin'},
  {label:'Understanding Islam',to:guide+'/understanding',detail:'Beliefs, texts & daily life'},
  {label:'Ministry',to:guide+'/ministry',detail:'Friendship & conversation'},
  {label:'Texts & studies',to:guide+'/library',detail:'Read in context'},
  {label:'Christianity & Islam',to:islam,detail:'Examine the claims'},
];

export function groupFor(path:string) {
  if(path.startsWith(base+'/topics/reformed')) return 'Reformed theology';
  if(path.startsWith(base+'/topics/')||path.startsWith(base+'/study/')) return 'Questions';
  return [...main].reverse().find(x=>x.to!==base&&path.startsWith(x.to))?.label ?? (path.startsWith(base+'/sources')?'Sources':'Explore');
}

export function secondary(group:string): Destination[] {
  if(group==='Worldviews') return [{label:'All worldviews',to:base+'/worldviews'},...worlds];
  if(group==='Questions') return [{label:'All questions',to:base+'/questions'},...TOPICS.map(t=>({label:t.title,to:base+'/topics/'+t.id}))];
  if(group==='Learning paths') return [{label:'All paths',to:base+'/paths'},...PATHS.map(p=>({label:p.title,to:base+'/paths/'+p.id}))];
  if(group==='Practice') return PRACTICE.map(p=>({label:p.label,to:base+'/practice?scenario='+p.id}));
  if(group==='Reformed theology'||group==='Historic texts') return [{label:'Reformed questions',to:base+'/topics/reformed'},{label:'Confessions & historic texts',to:base+'/texts'},{label:'The source room',to:base+'/sources'}];
  if(group==='Debates') return [{label:'All exchanges',to:base+'/debates'},{label:'The source room',to:base+'/sources'},{label:'Conversation practice',to:base+'/practice'}];
  if(group==='My study'||group==='Sources') return [{label:'My study',to:base+'/saved'},{label:'The source room',to:base+'/sources'},{label:'Find a question',to:base+'/questions'}];
  return [{label:'Start here',to:base+'/paths/begin'},{label:'Explore the questions',to:base+'/questions'},{label:'Across beliefs',to:base+'/worldviews'},{label:'The source room',to:base+'/sources'}];
}

export function currentIslam(path:string,search:string) {
  if(path.endsWith('/article'))return islamPages[['friendship','journeys','gospel','debates'].includes(new URLSearchParams(search).get('article')??'')?2:1];
  return islamPages.find(d=>d.to===path)??islamPages[0];
}
