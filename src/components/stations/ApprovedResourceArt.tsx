import { resourceArtwork } from './resource-artwork.data';
import './approved-resource-art.css';

/** The owner's selected Q01, Y02 and AL03 drawings, kept as exact SVG copies. */
export function ApprovedResourceArt({ kind }: { kind: keyof typeof resourceArtwork }) {
  return <svg className={`resource-approved resource-approved-${kind}`} viewBox="0 0 280 210"
    aria-hidden="true" focusable="false" data-design={{ learning: 'Q01', fellowships: 'Y02', life: 'AL03' }[kind]}
    dangerouslySetInnerHTML={{ __html: resourceArtwork[kind] }} />;
}
