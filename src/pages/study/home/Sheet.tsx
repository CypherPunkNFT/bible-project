// The record sheet: one room or one object. It opens from the right, the same way as on every study, keeps the three parts of a record
// apart, and closes on Escape.
import { useEffect } from "react";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { kindWord, type HouseObject, type Opened, type Room } from "./model";
import { Cite, KindMark, Picture, Quote, ThreeParts } from "./parts";

function RoomRecord({ room }: { room: Room }) {
  return <>
    <p className="hh-kicker hh-sheet-kind"><KindMark kind={room.kind} /> Mostly: {kindWord(room.kind).toLowerCase()}</p>
    <h2>{room.name}</h2>
    <p className="hh-sheet-line">{room.line}</p>
    <ThreeParts evidence={room.evidence} inference={room.inference} limit={room.limit} />
    {room.verses.map((label) => <Quote key={label} label={label} />)}
    <Cite ids={room.sources} />
  </>;
}

function ObjectRecord({ object }: { object: HouseObject }) {
  return <>
    <p className="hh-kicker">{object.from} · {object.culture}</p>
    <h2>{object.name}</h2>
    <p className="hh-sheet-line">{object.date}</p>
    <Picture id={object.picture} lazy={false} />
    <ThreeParts evidence={object.evidence} inference={object.inference} limit={object.limit} />
    {object.verses.map((label) => <Quote key={label} label={label} />)}
  </>;
}

export function HomeSheet({ opened, onClose }: { opened: Opened | null; onClose: () => void }) {
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onClose]);
  const label = opened?.type === "room" ? opened.room.name : opened?.type === "object" ? opened.object.name : "Record";
  return <SlidePanel open={Boolean(opened)} onClose={onClose} label={label} closeLabel="Close this record">
    {opened?.type === "room" && <RoomRecord room={opened.room} />}
    {opened?.type === "object" && <ObjectRecord object={opened.object} />}
  </SlidePanel>;
}
