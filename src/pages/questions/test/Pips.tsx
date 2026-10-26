// The mark for how hard: three rising bars, filled up to the level. Used by the questions page's test banner.
// Styles: test-setup.css (.tsu-pips).

export function Pips({ level }: { level: number }) {
  return <span className="tsu-pips" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} data-on={i <= level || undefined} />)}</span>;
}
