// MOCK-UP: the pill at the bottom of the Privacy and Support mock-ups that swaps between their versions in place, kept
// in the address (?v=b). Looks: test-options.css (.to-pill), shared with the other version mock-ups.
import { useSearchParams } from "react-router-dom";
import "../test-options.css";

export function VersionPill<T extends string>({ label, versions, current }: { label: string; versions: { id: T; name: string }[]; current: T }) {
  const [, setParams] = useSearchParams();
  return <nav className="to-pill" aria-label={`Mock-up: ${label}`}>
    <span className="to-pill-label">{label}</span>
    {versions.map((v) => <button key={v.id} type="button" aria-pressed={v.id === current} onClick={() => setParams({ v: v.id }, { replace: true, preventScrollReset: true })}>
      <b>{v.id.toUpperCase()}</b><span>{v.name}</span>
    </button>)}
  </nav>;
}
