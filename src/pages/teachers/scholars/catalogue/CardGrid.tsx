// The catalogue's cards. Every card stays in the DOM; filtering re-orders them with CSS `order` and hides the rest, and
// animates the change with FLIP: staying cards slide from where they were drawn, leaving cards fade where they stood,
// arriving cards fade in, and the grid's height eases. A class component because FLIP needs to measure the cards just
// before React commits the new order (getSnapshotBeforeUpdate), then animate right after (componentDidUpdate).
import { Component } from "react";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { reducedMotion } from "../marks/dom";
import { Card } from "./Card";

const EASE = "cubic-bezier(.2,.8,.2,1)";
interface GridProps { data: ScholarsData; visible: string[]; onOpen: (id: string, origin: Element | null) => void }
interface Snapshot { before: Map<string, DOMRect>; box: DOMRect }

export class CardGrid extends Component<GridProps> {
  private grid: HTMLDivElement | null = null;
  private cards = new Map<string, HTMLElement>();
  private gridAnimation: Animation | null = null;
  private cardRefs = new Map<string, (el: HTMLElement | null) => void>();
  /** One stable ref callback per card, so memoised cards do not re-render or re-attach on every update. */
  private refFor(id: string) {
    let ref = this.cardRefs.get(id);
    if (!ref) {
      ref = (el) => { if (el) this.cards.set(id, el); else this.cards.delete(id); };
      this.cardRefs.set(id, ref);
    }
    return ref;
  }

  getSnapshotBeforeUpdate(prev: GridProps): Snapshot | null {
    if (prev.visible === this.props.visible || !this.grid) return null;
    const animate = !reducedMotion(), before = new Map<string, DOMRect>(), box = this.grid.getBoundingClientRect();
    // Where every card is drawn right now (mid-animation included), then stop every running animation.
    if (animate) for (const [id, el] of this.cards) if (!el.hidden && !el.classList.contains("cat-leaving")) before.set(id, el.getBoundingClientRect());
    this.gridAnimation?.cancel();
    for (const el of this.cards.values()) {
      el.getAnimations().forEach((a) => a.cancel());
      if (el.classList.contains("cat-leaving")) settle(el, true);
    }
    return animate ? { before, box } : null;
  }

  componentDidUpdate(_prev: GridProps, _state: unknown, snapshot: Snapshot | null) {
    if (!snapshot || !this.grid) return;
    const { before, box } = snapshot, shown = new Set(this.props.visible);
    for (const [id, el] of this.cards) {
      const was = before.get(id);
      if (shown.has(id) || !was) continue;
      el.hidden = false;
      Object.assign(el.style, { position: "absolute", left: `${was.left - box.left}px`, top: `${was.top - box.top}px`, width: `${was.width}px`, height: `${was.height}px` });
      el.classList.add("cat-leaving");
      el.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.94)" }], { duration: 260, easing: "ease-out" }).onfinish = () => settle(el, true);
    }
    const height = this.grid.getBoundingClientRect().height;
    if (Math.abs(height - box.height) > 1) this.gridAnimation = this.grid.animate([{ height: `${box.height}px` }, { height: `${height}px` }], { duration: 400, easing: EASE });
    this.props.visible.forEach((id, i) => {
      const el = this.cards.get(id), was = before.get(id);
      if (!el) return;
      const now = el.getBoundingClientRect();
      if (!was) {
        el.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: 90 + Math.min(i, 12) * 14, easing: EASE, fill: "backwards" });
        return;
      }
      const dx = was.left - now.left, dy = was.top - now.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: EASE });
    });
  }

  componentWillUnmount() { this.gridAnimation?.cancel(); }

  render() {
    const order = new Map(this.props.visible.map((id, i) => [id, i]));
    return <div className="cat-grid" ref={(el) => { this.grid = el; }}>
      {this.props.data.scholars.map((s) => <Card key={s.id} data={this.props.data} s={s} order={order.get(s.id)} onOpen={this.props.onOpen}
        cardRef={this.refFor(s.id)} />)}
    </div>;
  }
}

/** A leaving card is lifted out of the flow while it fades; afterwards it goes back in the flow, hidden if still filtered out. */
function settle(el: HTMLElement, hide: boolean) {
  el.hidden = hide;
  el.classList.remove("cat-leaving");
  Object.assign(el.style, { position: "", left: "", top: "", width: "", height: "" });
}
