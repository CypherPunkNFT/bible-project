// 02 · Teachers through the Bible: a ring of 66 spokes, one per book, each as long as the chosen teacher's works on it
// (or everyone's, summed). The teacher list on the left, the ring in the middle, and a narrow book panel on the right
// listing that teacher's works on the chosen book, each linking to the work itself. Teachers whose works are dated
// (Spurgeon) also get a year slider that grows the ring through their preaching life
// (approved mock-up: design/authors-directions/teachers/through.js).
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { SectionHead } from "../shared/Frame";
import { familyOf } from "../shared/people";
import { usePreachers } from "./context";
import { centreInStrip, reducedMotion } from "./bible/words";
import { BookPanel, type Order } from "./through/BookPanel";
import { noPlaybackReason, ringCaption } from "./through/captions";
import { buildThroughModel, timelineOf } from "./through/model";
import { Rail, Who, Years } from "./through/parts";
import { Ring } from "./through/Ring";
import "./through.css";

const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;

export function Through() {
  const { data, openProfile } = usePreachers();
  const model = useMemo(() => buildThroughModel(data), [data]);
  const [chosen, setChosen] = useState("all");
  const track = model.byId.get(chosen) ?? model.everyone;
  const timeline = useMemo(() => timelineOf(track), [track]);
  const [selected, setSelected] = useState(model.everyone.top);
  const [order, setOrder] = useState<Order>("text");
  const [year, setYear] = useState(Infinity); // Infinity (or the slider's "All") shows every work
  const [playing, setPlaying] = useState(false);
  const [playFrom, setPlayFrom] = useState(0);

  const choose = useCallback((id: string, item: HTMLElement) => {
    const next = model.byId.get(id);
    if (!next) throw new Error(`Teachers through the Bible: unknown teacher "${id}"; expected "all" or the id of a teacher with Bible texts`);
    setPlaying(false);
    setChosen(id);
    setSelected((b) => (next.totals[b] ? b : next.top));
    setYear(Infinity);
    centreInStrip(item);
  }, [model]);
  const selectBook = useCallback((b: number) => setSelected((b + 66) % 66), []);

  // Playing: one year every 130 ms (40 ms with reduced motion) from where the slider stands, stopping at "All".
  useEffect(() => {
    if (!playing || !timeline) return;
    const start = performance.now(), perYear = reducedMotion() ? 40 : 130;
    let frame = 0;
    const advance = (now: number) => {
      const next = Math.min(timeline.all, playFrom + Math.floor((now - start) / perYear));
      setYear(next);
      if (next >= timeline.all) { setPlaying(false); return; }
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing, playFrom, timeline]);

  function play() {
    if (!timeline) return;
    if (playing) { setPlaying(false); return; }
    const from = year >= timeline.all ? timeline.first : year;
    setYear(from); setPlayFrom(from); setPlaying(true);
  }
  function slide(next: number) { setPlaying(false); setYear(next); }

  return <div className="thr" style={tone("--poetry")}>
    <SectionHead num="02" kicker="Book by book" title={<>Teachers <em>through</em> the Bible</>}
      line="Choose a teacher. Each spoke is one book of the Bible, as long as the number of their works on it. Choose a spoke to read those works." />
    <div className="thr-layout">
      <Rail model={model} chosen={chosen} onChoose={choose} onOpen={openProfile} />
      <div className="thr-ringcard" style={tone(track.person ? familyOf(track.person).tone : "--accent")}>
        <Who model={model} track={track} onOpen={openProfile} />
        <Ring books={model.books} track={track} timeline={timeline} year={year} selected={selected} onSelect={selectBook} />
        <Years track={track} timeline={timeline} year={year} playing={playing} reason={noPlaybackReason(model, track)} onPlay={play} onYear={slide} />
        <p className="thr-caption">{ringCaption(model, track, timeline, model.books)}</p>
      </div>
      <BookPanel books={model.books} track={track} byId={model.byId} timeline={timeline} year={year} selected={selected} order={order} onOrder={setOrder} />
    </div>
  </div>;
}
