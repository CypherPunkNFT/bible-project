// The zoom buttons both maps on /resources/life share: in, out, and back to the whole map.
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { RefObject } from "react";
import type { Zoom } from "./zoom";

export function ZoomButtons({ zoom, onReset }: { zoom: RefObject<Zoom | null>; onReset?: () => void }) {
  return <div className="lf-zoom">
    <button type="button" aria-label="Zoom in" onClick={() => zoom.current?.zoomBy(1.8)}><Plus size={16} strokeWidth={1.6} aria-hidden="true" /></button>
    <button type="button" aria-label="Zoom out" onClick={() => zoom.current?.zoomBy(1 / 1.8)}><Minus size={16} strokeWidth={1.6} aria-hidden="true" /></button>
    <button type="button" aria-label="Show all" onClick={() => { zoom.current?.reset(); onReset?.(); }}><RotateCcw size={15} strokeWidth={1.6} aria-hidden="true" /></button>
  </div>;
}
