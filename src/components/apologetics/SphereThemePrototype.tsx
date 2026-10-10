import { missionSphereThemes, type SphereDesign } from '@/lib/mission-sphere-themes';
import './sphere-theme-prototype.css';

export default function SphereThemePrototype({ design, choose }: { design: SphereDesign; choose(value: SphereDesign): void }) {
  const selected = missionSphereThemes.find(theme => theme.id === design)!;
  return <aside className="mw-sphere-review" aria-label="Sphere theme mock-up">
    <div className="mw-sphere-review-heading"><div><span>Sphere studies</span><h3>{selected.name}</h3></div><p>{selected.description}</p></div>
    <div className="mw-sphere-options" role="group" aria-label="Sphere colour themes">{missionSphereThemes.map(theme => <button key={theme.id} type="button" aria-label={`Sphere theme ${theme.id.toUpperCase()}: ${theme.name}`} aria-pressed={theme.id === design} onClick={() => choose(theme.id)}>
      <span className="mw-sphere-swatches" aria-hidden="true">{[theme.ocean, theme.land, theme.selected].map((color, index) => <i key={index} style={{ background: color }} />)}</span><span><b>{theme.id.toUpperCase()}</b>{theme.name}</span>
    </button>)}</div>
  </aside>;
}
