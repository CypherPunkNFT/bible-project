import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { VIEWS, type Sample, type ShotManifest, type Template, type Variant, type ViewKey } from "./review-data";

export interface Opened { template: Template; variant: Variant; sample: Sample; view: ViewKey }

/** One screenshot, large: switch view (desktop/phone, light/dark), sample, and whole page / signature section.
 *  It slides up from the bottom (the owner's rule: no fades between screens). Escape or the close button shuts it. */
export function ShotViewer({ opened, shots, onClose, onMove }: { opened: Opened; shots: ShotManifest | null; onClose: () => void; onMove: (next: Opened) => void }) {
  const { template, variant, sample, view } = opened;
  const shot = shots?.images[`${template.id}/${variant.id}/${sample.id}`]?.[view];
  const [part, setPart] = useState<"full" | "crop">("full");
  const shownPart = part === "crop" && shot?.crop ? "crop" : "full";

  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = overflow; };
  }, [onClose]);

  return (
    <div className="review-viewer" role="dialog" aria-modal="true" aria-label={`${template.name}, ${variant.name}: ${sample.label}`}>
      <div className="review-viewer-bar">
        <div className="review-viewer-title"><strong>{template.name} · {variant.name}</strong><span>{sample.label}: {sample.why.replace(/^[^:"]{1,60}:\s*/, "")}</span></div>
        <div className="review-viewer-controls">
          <div className="review-segments" role="radiogroup" aria-label="View">
            {VIEWS.map((v) => <button key={v.key} type="button" role="radio" aria-checked={view === v.key} onClick={() => onMove({ ...opened, view: v.key })}>{v.label}</button>)}
          </div>
          {variant.samples.length > 1 && (
            <div className="review-segments" role="radiogroup" aria-label="Sample">
              {variant.samples.map((s) => <button key={s.id} type="button" role="radio" aria-checked={sample.id === s.id} onClick={() => onMove({ ...opened, sample: s })}>{s.label}</button>)}
            </div>
          )}
          {shot?.crop && (
            <div className="review-segments" role="radiogroup" aria-label="Part of the page">
              <button type="button" role="radio" aria-checked={shownPart === "full"} onClick={() => setPart("full")}>Whole page</button>
              <button type="button" role="radio" aria-checked={shownPart === "crop"} onClick={() => setPart("crop")}>{shot.cropKind === "signature" && template.signature ? template.signature.label : "First screen"}</button>
            </div>
          )}
          <a href={sample.url} target="_blank" rel="noreferrer" className="review-viewer-open">Open the real page<ArrowUpRight size={13} aria-hidden /></a>
          <button type="button" className="review-viewer-close" onClick={onClose} aria-label="Close"><X size={18} aria-hidden /></button>
        </div>
      </div>
      <div className="review-viewer-body" data-width={VIEWS.find((v) => v.key === view)?.width}>
        {shot
          ? <img key={`${sample.id}-${view}-${shownPart}`} src={`/review-data/shots/${shownPart === "crop" ? shot.crop : shot.full}`} alt={`${sample.label}, ${VIEWS.find((v) => v.key === view)?.label}`} />
          : <p>No screenshot of this view yet.</p>}
        {shot?.clipped && shownPart === "full" && <p className="review-viewer-note">The page is longer than this; the picture shows its first {Math.round(shot.height).toLocaleString()} pixels.</p>}
      </div>
    </div>
  );
}
