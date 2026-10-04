import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { ArrowRight, Maximize, Minus, Plus } from "lucide-react";
import { Fragment, useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { formatTestimonyDate, type TestimonyNode } from "@/lib/testimonies";

const TONES = ["poetry", "epistles", "gospels", "history"];
interface Position { node: TestimonyNode; left: number; top: number; depth: number }
interface Props {
  positions: Position[];
  width: number;
  height: number;
  selectedId: string;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
}

/** Gestures update one transform directly, without rendering the tree on every movement. */
export function TestimonyTree({ positions, width, height, selectedId, onSelect, onExpand }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const percentage = useRef<HTMLOutputElement>(null);
  const behaviour = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const fit = useRef(() => {});
  const byId = new Map(positions.map((position) => [position.node.id, position]));
  const shownChildren = new Map<string, number>();
  for (const position of positions) if (position.node.parentId) shownChildren.set(position.node.parentId, (shownChildren.get(position.node.parentId) ?? 0) + 1);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const selection = select(element);
    const zoomer = zoom<HTMLDivElement, unknown>()
      .clickDistance(6)
      .duration(0)
      .on("start", () => element.classList.add("is-moving"))
      .on("zoom", ({ transform }: { transform: ZoomTransform }) => {
        if (surface.current) surface.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
        if (percentage.current) percentage.current.value = `${Math.round(transform.k * 100)}%`;
      })
      .on("end", () => element.classList.remove("is-moving"));
    behaviour.current = zoomer;
    selection.call(zoomer);
    // Keep wheel gestures inside the viewer even at its zoom limits.
    const preventScroll = (event: WheelEvent) => event.preventDefault();
    element.addEventListener("wheel", preventScroll, { passive: false });
    fit.current = () => {
      const w = element.clientWidth, h = element.clientHeight;
      if (!w || !h) return;
      const scale = Math.min((w - 32) / width, (h - 72) / height, 1);
      zoomer.scaleExtent([Math.min(scale / 2, .15), 2.5]);
      selection.call(zoomer.transform, zoomIdentity.translate((w - width * scale) / 2, (h - 48 - height * scale) / 2).scale(scale));
    };
    fit.current();
    const observer = new ResizeObserver(() => fit.current());
    observer.observe(element);
    return () => {
      observer.disconnect();
      selection.on(".zoom", null);
      element.removeEventListener("wheel", preventScroll);
      behaviour.current = null;
    };
  }, [width, height]);

  function zoomBy(factor: number) {
    if (viewport.current && behaviour.current) select(viewport.current).call(behaviour.current.scaleBy, factor);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const element = viewport.current, zoomer = behaviour.current;
    if (!element || !zoomer) return;
    const shifts: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
    if (shifts[event.key]) {
      event.preventDefault();
      const [x, y] = shifts[event.key], k = zoomTransform(element).k;
      select(element).call(zoomer.translateBy, x / k, y / k);
    } else if (["+", "=", "-", "0", "Home"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "0" || event.key === "Home") fit.current();
      else zoomBy(event.key === "-" ? 1 / 1.3 : 1.3);
    }
  }
  function reveal(position: Position) {
    const element = viewport.current, zoomer = behaviour.current;
    if (!element || !zoomer) return;
    const t = zoomTransform(element);
    const left = t.applyX(position.left), top = t.applyY(position.top);
    if (left < 8 || top < 8 || left + 194 * t.k > element.clientWidth - 8 || top + 86 * t.k > element.clientHeight - 56) {
      select(element).call(zoomer.translateTo, position.left + 97, position.top + 43, [element.clientWidth / 2, (element.clientHeight - 48) / 2]);
    }
  }

  return <div className="testimony-tree-stage">
    <div ref={viewport} className="testimony-map-viewport" tabIndex={0} role="region" aria-label="Interactive testimony tree" aria-describedby="testimony-tree-help" onKeyDown={keyboard}>
      <div ref={surface} className="testimony-map-surface" style={{ width, height }}>
        <svg width={width} height={height} aria-hidden="true">{positions.map((p) => {
          const parent = p.node.parentId ? byId.get(p.node.parentId) : undefined;
          if (!parent) return null;
          const fromX = parent.left + 194, fromY = parent.top + 43, toX = p.left, toY = p.top + 43;
          return <path key={p.node.id} d={`M${fromX},${fromY} C${fromX + 24},${fromY} ${toX - 24},${toY} ${toX},${toY}`} />;
        })}</svg>
        {positions.map((p) => <Fragment key={p.node.id}><button type="button" className="testimony-tree-node" aria-pressed={selectedId === p.node.id}
          onClick={() => onSelect(p.node.id)} onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) reveal(p); }}
          style={{ left: p.left, top: p.top, "--node-tone": "var(--" + TONES[p.depth % TONES.length] + ")" } as CSSProperties}>
          <span className="testimony-avatar">{p.node.available === false ? "·" : p.node.name.slice(0, 1)}</span><span><strong>{p.node.name}</strong><small title={p.node.theme ? "Story theme: " + p.node.theme : "No story theme chosen"}>{p.node.available === false ? "The branch continues" : p.node.theme || "Personal testimony"}</small>{p.node.publishedAt && <time dateTime={p.node.publishedAt}>Shared {formatTestimonyDate(p.node.publishedAt)}</time>}</span><ArrowRight size={13} />
        </button>{(p.node.childCount ?? 0) > (shownChildren.get(p.node.id) ?? 0) && <button type="button" className="testimony-more-invitations" style={{ left: p.left + 70, top: p.top + 88 }} onClick={() => onExpand(p.node.id)} onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) reveal(p); }} aria-label={"Show invitations from " + p.node.name}><Plus size={10} />More invitations</button>}</Fragment>)}
      </div>
    </div>
    <div className="testimony-zoom-controls" role="group" aria-label="Tree zoom">
      <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.3)}><Minus size={16} /></button>
      <output ref={percentage} aria-label="Zoom level">100%</output>
      <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.3)}><Plus size={16} /></button>
      <button type="button" className="testimony-fit" onClick={() => fit.current()}><Maximize size={15} />Fit branch</button>
    </div>
    <p id="testimony-tree-help" className="sr-only">Drag to move. Pinch or use the mouse wheel to zoom. Arrow keys move the tree, plus and minus zoom, and Home fits the branch. Tab to a person and press Enter to read.</p>
  </div>;
}
