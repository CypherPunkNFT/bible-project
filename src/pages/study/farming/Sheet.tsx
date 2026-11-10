// The record sheet: one job. It opens from the right, the same way as on every study, keeps the three parts of a record apart, and
// closes on Escape.
import { useEffect } from "react";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { monthBars, months, seasonNames, type Job } from "./model";
import { Cite, KindWord, Picture, Quote, ThreeParts } from "./parts";

function when(job: Job): string {
  const names = months();
  return monthBars(job.seasons).map((bar) => `mid-${names[bar.start]} to mid-${names[(bar.start + bar.months) % 12]}`).join(", and ");
}

function JobRecord({ job }: { job: Job }) {
  return <>
    <p className="fy-kicker fy-sheet-when">{seasonNames(job.seasons)}</p>
    <h2>{job.name}</h2>
    <p className="fy-sheet-line">{job.line} {`On this study's placing: ${when(job)}.`}</p>
    {job.picture && <Picture id={job.picture} lazy={false} matte={job.id === "reap"} />}
    {job.picture2 && <Picture id={job.picture2} lazy={false} matte={job.id === "reap"} />}
    <p className="fy-sheet-kinds">{job.witness.map((kind) => <KindWord key={kind} kind={kind} />)}</p>
    {job.groundNote && <p className="fy-groundnote"><b>In the ground, here, means:</b> {job.groundNote}</p>}
    <ThreeParts evidence={job.evidence} inference={job.inference} limit={job.limit} />
    {job.verses.map((label) => <Quote key={label} label={label} />)}
    <Cite ids={job.sources} />
  </>;
}

export function FarmingSheet({ job, onClose }: { job: Job | null; onClose: () => void }) {
  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [job, onClose]);
  return <SlidePanel open={Boolean(job)} onClose={onClose} label={job?.name ?? "Record"} closeLabel="Close this record">
    {job && <JobRecord job={job} />}
  </SlidePanel>;
}
