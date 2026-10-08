// A town's landmark as a small line drawing (40×40 artboard, drawn in currentColor).
import { landmarkOf } from "./landmarks";

export function LandmarkIcon({ name, size, className }: { name: string; size: number; className: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.5}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {landmarkOf(name).marks.map((mark, i) => "circle" in mark
      ? <circle key={i} cx={mark.circle[0]} cy={mark.circle[1]} r={mark.circle[2]} />
      : <path key={i} className={mark.tone ? `cty-${mark.tone}` : undefined} d={mark.d} />)}
  </svg>;
}
