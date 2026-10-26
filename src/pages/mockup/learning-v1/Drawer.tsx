// The drawer beneath the doors (mock-up E). Choosing a door opens it: the drawer grows from nothing while the stack
// rises a little into place. Choosing another door slides the open stack out and the next one in, from the side the
// door is on; choosing the open door again closes it. Inside, one reader's view: the stack and its panel (01), then
// what its titles are built from (02). Motion is Web Animations (slides, no fades); reduced motion jumps straight there.
import { useLayoutEffect, useRef, useState } from "react";
import type { Audience, Division } from "@/data/resources/learning-catalogue";
import { BuiltFromRing } from "./BuiltFromRing";
import { Glyph } from "./Art";
import { doorBack, groupsFor, plural, toneOf } from "./model";
import { SecHead } from "./parts";
import { Stack } from "./Stack";

const SLIDE_MS = 680, OPEN_MS = 760, EASE = "cubic-bezier(.65, 0, .25, 1)";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

interface ViewProps { division: Division; audience: Audience; kind: string | null; onKind: (kind: string | null) => void; settled: number }

function AgeView({ division, audience: a, kind, onKind, settled }: ViewProps) {
  const items = division.forAudience(a.id), ready = items.filter((t) => t.status === "ready").length;
  const back = doorBack(a);
  // Only the kinds this door has: one quiet row, with no "None here" chips.
  const kinds = division.kinds.map((k) => [k, items.filter((t) => t.kind === k.id).length] as const).filter(([, n]) => n > 0);
  const sources = new Set(items.flatMap((t) => t.builtFrom.map((b) => b.path))).size;
  return <>
    <section className="lm-sec lm-view-sec" aria-labelledby={`lm-stack-${a.id}`}>
      <SecHead num="01" id={`lm-stack-${a.id}`} title={<>{a.name}: <em>the stack behind the door</em></>}
        lead={`${a.line} ${plural(items.length, "title")}, ${ready ? `${ready} ready` : "none ready yet"}, in ${plural(groupsFor(division, a.id).length, "subject")}. Solid books are ready to download, outlines are planned; point at one to read about it.`} />
      <div className="lm-kinds" role="group" aria-label="Light one kind">
        {kinds.map(([k, n]) => <button key={k.id} type="button" className="lm-kind" aria-pressed={kind === k.id} onClick={() => onKind(kind === k.id ? null : k.id)}>
          <Glyph name={k.glyph} size={20} strokeWidth={1.25} /><span><b>{k.plural}</b><small>{n} here</small></span>
        </button>)}
      </div>
      <Stack division={division} audience={a} kind={kind} back={back} reflow={settled} />
    </section>
    <section className="lm-sec" aria-labelledby={`lm-ring-${a.id}`}>
      <SecHead num="02" id={`lm-ring-${a.id}`} title={<>What it is <em>built from</em></>}
        lead={`The ${plural(items.length, "title")} behind the ${a.name.toLowerCase()} door on the inner ring; the ${plural(sources, "page")} of the site they are written from on the outer ring.`} />
      <BuiltFromRing division={division} audience={a} items={items} back={back} />
    </section>
  </>;
}

interface View { id: string; key: number; role: "still" | "out" | "in" }
type Pending = { type: "open" } | { type: "slide"; sign: number } | null;

export function Drawer({ division, age, kind, onKind, onShown }: { division: Division; age: string | null; kind: string | null; onKind: (kind: string | null) => void; onShown: (shown: boolean) => void }) {
  const [views, setViews] = useState<View[]>(() => (age ? [{ id: age, key: 1, role: "still" }] : []));
  const [settled, setSettled] = useState(0);
  const drawer = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const last = useRef(age), nextKey = useRef(1), pending = useRef<Pending>(null), running = useRef<Animation[]>([]);
  const order = division.audiences.map((a) => a.id);

  const stop = () => {
    running.current.forEach((anim) => anim.cancel());
    running.current = [];
    for (const el of [drawer.current, stage.current]) el?.style.removeProperty("overflow");
  };

  // A new age: open, slide or close, from wherever the last motion had got to.
  useLayoutEffect(() => {
    const before = last.current;
    last.current = age;
    if (before === age) return;
    stop();
    if (age && !before) {
      pending.current = { type: "open" };
      setViews([{ id: age, key: ++nextKey.current, role: "still" }]);
      onShown(true);
    } else if (age && before) {
      pending.current = { type: "slide", sign: order.indexOf(age) > order.indexOf(before) ? 1 : -1 };
      setViews((list) => {
        const current = list.filter((v) => v.role !== "out").at(-1);
        return [...(current ? [{ ...current, role: "out" as const }] : []), { id: age, key: ++nextKey.current, role: "in" }];
      });
    } else if (drawer.current) {
      const el = drawer.current, anim = el.animate([{ height: `${el.offsetHeight}px` }, { height: "0px" }], { duration: reduced() ? 1 : SLIDE_MS, easing: EASE, fill: "forwards" });
      el.style.overflow = "clip";
      running.current = [anim];
      anim.finished.then(() => { if (running.current[0] === anim) { setViews([]); onShown(false); } }, () => { /* cancelled by a newer choice */ });
    }
  }, [age]); // eslint-disable-line react-hooks/exhaustive-deps -- runs once per new age; the rest is read at that moment

  // Run the motion the new views were committed for.
  useLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (!views.length) { stop(); return; }
    const d = drawer.current, s = stage.current;
    if (!p || !d || !s) return;
    const duration = reduced() ? 1 : p.type === "open" ? OPEN_MS : SLIDE_MS;
    if (p.type === "open") {
      const h = d.offsetHeight;
      d.style.overflow = "clip";
      const anims = [d.animate([{ height: "0px" }, { height: `${h}px` }], { duration, easing: EASE }), s.animate([{ transform: "translateY(-48px)" }, { transform: "translateY(0)" }], { duration, easing: EASE })];
      running.current = anims;
      anims[0].finished.then(() => { if (running.current === anims) stop(); }, () => { /* cancelled */ });
      // Bring the doors to the top of the window, so the stack opens in view.
      const doors = document.querySelector(".lm-doors"), header = document.querySelector("body header");
      if (doors) {
        const top = doors.getBoundingClientRect().top + scrollY - (header?.getBoundingClientRect().height ?? 0) - 12;
        if (top > scrollY + 40) scrollTo({ top, behavior: reduced() ? "auto" : "smooth" });
      }
      return;
    }
    const old = s.querySelector<HTMLElement>('[data-role="out"]'), next = s.querySelector<HTMLElement>('[data-role="in"]');
    if (!old || !next) return;
    const shift = s.clientWidth + 64, opts = { duration, easing: EASE, fill: "both" as const };
    s.style.overflow = "clip";
    const anims = [old.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-p.sign * shift}px)` }], opts),
      next.animate([{ transform: `translateX(${p.sign * shift}px)` }, { transform: "translateX(0)" }], opts),
      s.animate([{ height: `${old.offsetHeight}px` }, { height: `${next.offsetHeight}px` }], opts)];
    running.current = anims;
    Promise.all(anims.map((anim) => anim.finished)).then(() => {
      if (running.current !== anims) return;
      stop();
      setViews((list) => list.filter((v) => v.role !== "out").map((v) => ({ ...v, role: "still" })));
      setSettled((n) => n + 1);
    }, () => { /* cancelled by a newer choice */ });
  }, [views]);

  return <div className="lm-drawer" ref={drawer} hidden={!views.length}>
    <div className="lm-stage" ref={stage}>
      {views.map((v) => <div key={v.key} className="lm-view" data-role={v.role} data-aud={v.id} style={toneOf(division.audience[v.id])} aria-hidden={v.role === "out" || undefined}>
        <AgeView division={division} audience={division.audience[v.id]} kind={kind} onKind={onKind} settled={settled} />
      </div>)}
    </div>
  </div>;
}
