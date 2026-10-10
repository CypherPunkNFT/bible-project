import type { ReactNode } from 'react';
import snapshot from '../../../content/missions/muslim-world.json';
import type { CountryPanelDesign } from '@/lib/country-panel-designs';

type Country = typeof snapshot.countries[number];
const compact = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
export default function CountryPanelHeader({ country, design, finder, adopted = false }: { country: Country; design: CountryPanelDesign; finder: ReactNode; adopted?: boolean }) {
  const flag = <img className="mw-country-flag" src={`/assets/muslim-world/flags/${country.code}.svg`} alt={country.code === 'MYT' ? 'French flag for Mayotte' : `${country.name} flag`} width={80} height={60} />;
  const religions = Object.entries(country.religions2020).filter(([name, share]) => name !== 'Muslims' && share >= .1).sort((a, b) => b[1] - a[1]).map(([name, share]) => `${name === 'Christians' ? 'Christian' : name === 'Hindus' ? 'Hindu' : name === 'Buddhists' ? 'Buddhist' : name} ${share.toFixed(1)}%`).join(' · ') || 'Each other religious category is below 0.1%.';
  const population = compact(country.population2020);
  const muslim = <>{country.muslimShare2020.toFixed(1)}<small>%</small></>;
  const christianShare = country.religions2020.Christians;
  const facts = <dl className="mw-header-new-facts"><div><dt>Population · 2020</dt><dd>{population}</dd></div><div><dt>Identify as Muslim</dt><dd>{muslim}</dd></div></dl>;
  if (['e', 'f', 'g', 'h'].includes(design)) return <div className={`mw-header-${design} mw-header-new`} aria-label={`${country.name} country summary`}>
    <div className="mw-header-new-identity">{flag}<div><p>{country.region}</p><h3>{country.name}</h3></div></div>
    {design === 'e' || design === 'g' ? <>{facts}{finder}</> : <>{finder}{facts}</>}
    <p className="mw-header-new-religions">{religions}<span>Pew · 2020 estimates</span></p>
  </div>;
  if (design === 'a') return <div className="mw-country-summary mw-header-a" aria-label={`${country.name} country summary`}>
    <div className="mw-header-search">{finder}</div>
    <div className="mw-header-a-identity">{flag}<div><h3>{country.name}</h3><p>{country.region}</p></div><div className="mw-header-a-population"><strong>{population}</strong><span>Population · 2020</span></div></div>
    <div className="mw-header-a-faith">{[{ name: 'Muslim', share: country.muslimShare2020, color: 'var(--poetry)' }, { name: 'Christian', share: christianShare, color: 'var(--accent)' }].map(faith => <div key={faith.name} className="mw-faith-row"><div><span>{faith.name}</span><strong>{faith.share.toFixed(1)}%</strong></div><div className="mw-faith-track" role="meter" aria-label={`${faith.name} identification in ${country.name}, 2020`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={faith.share}><span style={{ width: `${faith.share}%`, background: faith.color }} /></div></div>)}<p>Religious identification · Pew 2020 estimates</p></div>
  </div>;
  if (adopted) return <div className="mw-header-b mw-header-adopted" aria-label={`${country.name} country summary`}>
    <div className="mw-header-b-top"><div className="mw-header-b-identity">{flag}<div><h3>{country.name}</h3><p>{country.region}</p></div></div><dl className="mw-header-population"><div><dt>Population</dt><dd>{population}</dd></div></dl></div>
    <div className="mw-header-faith">{[{ name: 'Muslim', share: country.muslimShare2020, color: 'var(--poetry)' }, { name: 'Christian', share: christianShare, color: 'var(--accent)' }].map(faith => <div key={faith.name} className="mw-faith-row"><div><span>{faith.name}</span><strong>{faith.share.toFixed(1)}%</strong></div><div className="mw-faith-track" role="meter" aria-label={`${faith.name} identification in ${country.name}, 2020`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={faith.share}><span style={{ width: `${faith.share}%`, background: faith.color }} /></div></div>)}</div>
    <p className="mw-header-caption"><span>Pew · 2020 estimates</span></p>
  </div>;
  if (design === 'b') return <div className="mw-header-b" aria-label={`${country.name} country summary`}>
    <div className="mw-header-b-top"><div className="mw-header-b-identity">{flag}<div><p>{country.region}</p><h3>{country.name}</h3></div></div>{finder}</div>
    <dl className="mw-header-b-facts"><div><dt>Population</dt><dd>{population}</dd></div><div><dt>Muslim</dt><dd>{muslim}</dd></div><div><dt>Christian</dt><dd>{christianShare.toFixed(1)}<small>%</small></dd></div></dl>
    <p className="mw-header-caption"><span>Pew · 2020 estimates</span></p>
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
