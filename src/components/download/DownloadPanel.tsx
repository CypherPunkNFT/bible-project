// The download panel: the book loader, what is downloading, its percentage, then "Done" (see download.ts).
import { useSyncExternalStore } from "react";
import { BookLoader } from "./BookLoader";
import { snapshot, subscribe } from "./download-store";

export function DownloadPanel() {
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);
  if (!current?.visible) return null;
  const { label, percent, phase } = current;
  const done = phase === "done";
  return <div className="dl-panel" data-phase={phase}>
    <BookLoader size={52} />
    <span className="dl-text">
      <strong>{label}</strong>
      <span className="dl-figure" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={percent ?? undefined} aria-valuetext={done ? "Done" : percent === null ? "In progress" : `${percent}%`}>
        {done ? "Done" : percent === null ? "Downloading…" : `${percent}%`}
      </span>
      <span className="dl-bar" aria-hidden="true"><span style={{ transform: `scaleX(${(percent ?? 0) / 100})` }} /></span>
    </span>
  </div>;
}
