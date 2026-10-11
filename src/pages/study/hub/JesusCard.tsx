import { BookOpen, Sprout } from 'lucide-react';
import { Icon, StudyLink } from './shared';
import './jesus-card.css';

export function JesusCard() {
  return <section className="hub-jesus-card" aria-labelledby="hub-jesus-title">
    <div className="hub-jesus-symbol" aria-hidden="true"><BookOpen size={58} strokeWidth={1.1}/><span>Matthew &middot; Mark<br/>Luke &middot; John</span></div>
    <div className="hub-jesus-copy"><p className="eyebrow">His life &amp; teaching</p><h2 id="hub-jesus-title">Jesus Christ</h2><p>Meet Jesus in the four Gospels. Follow his life, listen to his parables, and explore his teaching, death and resurrection.</p></div>
    <div className="hub-jesus-links"><StudyLink to="/study/gospels">Explore Jesus &amp; the Gospels <Icon name="arrowUp"/></StudyLink><StudyLink to="/study/gospels?guide=parables"><Sprout size={18} strokeWidth={1.4}/> The parables of Christ <Icon name="arrowUp"/></StudyLink></div>
  </section>;
}
