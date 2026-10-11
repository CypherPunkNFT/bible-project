import { Coins, Footprints, HeartHandshake, Hourglass, LayoutGrid, MessageCircle, Sprout } from 'lucide-react';
import type { CSSProperties } from 'react';
import { PARABLE_ROOMS, PARABLES, type ParableRoom } from '@/data/parables';

const ICONS = {field:Sprout,home:HeartHandshake,prayer:MessageCircle,treasure:Coins,response:Footprints,door:Hourglass};
export function ParableIcon({room,size=24}:{room:ParableRoom;size?:number}) {
  const Icon=ICONS[room];
  return <Icon size={size} strokeWidth={1.35} aria-hidden="true"/>;
}

export function ParableSelector({value,onChange}:{value:string;onChange:(id:string)=>void}) {
  return <div className="pb-selector">
    <h2>The parables of Christ</h2>
    <nav className="pb-selector-grid" aria-label="Parable categories">
      <button type="button" aria-pressed={value==='all'} onClick={()=>onChange('all')} className="pb-category"><LayoutGrid size={24} strokeWidth={1.35} aria-hidden="true"/><span><strong>All studies</strong><small>{PARABLES.length} studies</small></span></button>
      {PARABLE_ROOMS.map(category=><button key={category.id} type="button" className="pb-category" aria-pressed={value===category.id} onClick={()=>onChange(category.id)} style={{'--pb-tone':category.color} as CSSProperties}><ParableIcon room={category.id}/><span><strong>{category.short}</strong><small>{PARABLES.filter(story=>story.room===category.id).length} studies</small></span></button>)}
    </nav>
  </div>;
}
