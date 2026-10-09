import type { ReactNode } from 'react';
import snapshot from '../../../content/missions/muslim-world.json';

type Country = typeof snapshot.countries[number];
const compact = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
export default function CountryPanelHeader({ country, design, finder }: { country: Country; design: 'a' | 'b' | 'c' | 'd'; finder: ReactNode }) {
  const flag = <img className="mw-country-flag" src={`/assets/muslim-world/flags/${country.code}.svg`} alt={country.code === 'MYT' ? 'French flag for Mayotte' : `${country.name} flag`} width={64} height={48} />;
  const religions = Object.entries(country.religions2020).filter(([name, share]) => name !== 'Muslims' && share >= .1).sort((a, b) => b[1] - a[1]).map(([name, share]) => `${name === 'Christians' ? 'Christian' : name === 'Hindus' ? 'Hindu' : name === 'Buddhists' ? 'Buddhist' : name} ${share.toFixed(1)}%`).join(' · ') || 'Each other religious category is below 0.1%.';
  const population = compact(country.population2020);
  const muslim = <>{country.muslimShare2020.toFixed(1)}<small>%</small></>;
  if (design === 'a') return <div className="mw-country-summary mw-header-a" aria-label={`${country.name} country summary`}>
    <div className="mw-header-search">{finder}</div>
    <div className="mw-country-heading"><div><p className="ap-eyebrow">{country.region}</p><h3>{country.name}</h3></div>{flag}</div>
    <div className="mw-demographics"><div><strong>{population}</strong><span>Population · 2020 estimate</span></div><div><strong>{muslim}</strong><span>Identify as Muslim · 2020</span></div></div>
    <div className="mw-religion-summary"><div className="mw-religion-bar" aria-hidden="true"><span style={{ width: country.muslimShare2020 + '%' }} /></div><p className="mw-other-religions">{religions}</p></div>
  </div>;
  if (design === 'b') return <div className="mw-header-b" aria-label={`${country.name} country summary`}>
    <div className="mw-header-b-top"><div className="mw-header-b-identity">{flag}<div><p>{country.region}</p><h3>{country.name}</h3></div></div>{finder}</div>
    <dl className="mw-header-b-facts"><div><dt>Population</dt><dd>{population}</dd></div><div><dt>Identify as Muslim</dt><dd>{muslim}</dd></div></dl>
    <p className="mw-header-caption">{religions}<span>Pew · 2020 estimates</span></p>
  </div>;
  if (design === 'c') return <div className="mw-header-c" aria-label={`${country.name} country summary`}>
    <div className="mw-header-search">{finder}</div>
    <div className="mw-header-c-passport"><div className="mw-header-c-identity">{flag}<p>{country.region}</p><h3>{country.name}</h3></div><dl><div><dt>Population · 2020</dt><dd>{population}</dd></div><div><dt>Muslim · 2020</dt><dd>{muslim}</dd></div></dl></div>
    <div className="mw-header-c-faith"><span style={{ width: country.muslimShare2020 + '%' }} aria-hidden="true" /><p>{religions}</p></div>
  </div>;
  return <div className="mw-header-d" aria-label={`${country.name} country summary`}>
    <div className="mw-header-d-banner"><div><p>{country.region}</p><h3>{country.name}</h3></div>{flag}</div>
    <div className="mw-header-d-content">{finder}<dl><div><dt>Population</dt><dd>{population}</dd></div><div><dt>Muslim</dt><dd>{muslim}</dd></div></dl></div>
    <div className="mw-header-d-religions"><span>Religious landscape</span><p>{religions}</p><span>2020 estimates</span></div>
  </div>;
}
