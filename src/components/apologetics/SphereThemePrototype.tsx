import { missionSphereThemes, type SphereDesign } from '@/lib/mission-sphere-themes';
import { useThemeVersion } from '@/lib/theme';
import './sphere-theme-prototype.css';

export default function SphereThemePrototype({ design, choose }: { design: SphereDesign; choose(value: SphereDesign): void }) {
  useThemeVersion();
  const dark = document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const selected = missionSphereThemes.find(theme => theme.id === design)!;
  return <aside id="sphere-studies" className="mw-sphere-review" aria-label="Sphere theme mock-up">
    <div className="mw-sphere-review-heading"><div><span>Sphere studies · 16 variations</span><h3>{selected.name}</h3></div><p>{selected.description}</p></div>
    <div className="mw-sphere-options" role="group" aria-label="Sphere colour themes">{missionSphereThemes.map(theme => <button key={theme.id} type="button" aria-label={`Sphere theme ${theme.id.toUpperCase()}: ${theme.name}`} aria-pressed={theme.id === design} onClick={() => choose(theme.id)}>
      <img className="mw-sphere-thumbnail" src={`/assets/muslim-world/sphere-previews/${theme.id}${theme.id === 'a' && !dark ? '-light' : ''}.webp`} alt="" width="256" height="256" loading="lazy" decoding="async" /><span><b>{theme.id.toUpperCase()}</b>{theme.name}</span>
    </button>)}</div>
  </aside>;
}
