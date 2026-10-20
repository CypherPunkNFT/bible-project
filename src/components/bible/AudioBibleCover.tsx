import { BookOpen } from 'lucide-react';
import type { AudioCategory } from '@/lib/audio-playlist';
import { AUDIO_ICONS } from './audio-category-icons';

export function AudioBibleCover({ category, compact = false }: { category?: AudioCategory; compact?: boolean }) {
  const Icon = category ? AUDIO_ICONS[category] : BookOpen;
  return <div className={`asv-cover${compact ? ' asv-cover-compact' : ''}`} aria-hidden="true">
    <span className="asv-cover-edition">THE HOLY BIBLE <span>1901</span></span>
    <div className="asv-cover-emblem">
      <svg viewBox="0 0 240 200" fill="none"><circle cx="120" cy="94" r="72"/><circle cx="120" cy="94" r="87" strokeDasharray="1 9"/>
        <path d="M120 0v18M120 170v20M26 94H8m224 0h-18M51 25l13 13m112 112 13 13M51 163l13-13M176 38l13-13"/>
        <path d="M34 136c30-9 58-3 86 13 28-16 56-22 86-13v40c-28-8-56-3-86 12-30-15-58-20-86-12z"/>
        <path d="M120 149v39M44 146c22-4 43 0 65 10M44 157c22-4 43 0 65 10M196 146c-22-4-43 0-65 10M196 157c-22-4-43 0-65 10"/>
        <path d="m54 74 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1zM183 58v12m-6-6h12M76 108v10m-5-5h10"/>
      </svg>
      <Icon className="asv-cover-icon" strokeWidth={1.1}/>
    </div>
    <strong>ASV</strong><span className="asv-cover-caption">AMERICAN STANDARD VERSION</span>
    <div className="asv-color-band">{(['history','poetry','prophets','gospels','epistles','revelation'] as const).map(color=><i key={color} style={{background:`var(--${color})`}}/>)}</div>
  </div>;
}
