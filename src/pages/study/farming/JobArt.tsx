// The ten small drawings of the work, in one hand with the opening drawing. Illustrative forms, not reconstructions of any find.
import type { ReactNode } from "react";

const JOB_ART: Record<string, ReactNode> = {
  plough: <><path d="M6 15l22 8 13-13" /><path d="M28 23l-5 13-12 4" /><path d="M23 30l-9-17" /><path d="M6 42h36" strokeDasharray="2 3" /></>,
  sow: <><path d="M6 14c9-6 18-5 24 5" /><path d="M30 19l5-2M30 19l4 3" /><path d="M6 42h36" /><circle cx="33" cy="27" r=".8" /><circle cx="38" cy="31" r=".8" /><circle cx="30" cy="33" r=".8" /><circle cx="35" cy="37" r=".8" /><circle cx="41" cy="37" r=".8" /></>,
  flax: <><path d="M16 43V17M24 43V11M32 43V19M16 25l-5-5M24 21l5-5M32 28l5-5" /><circle cx="16" cy="13" r="3.4" /><circle cx="24" cy="7" r="3.4" /><circle cx="32" cy="15" r="3.4" /></>,
  reap: <><path d="M15 42l7-10" /><path d="M22 32c11 2 19-5 20-20 3 16-6 29-23 25" /><path d="M8 42V24M13 42V20" strokeDasharray="4 1.5" /></>,
  glean: <><path d="M5 40h38" /><path d="M12 40l6-13c1 5 0 9-6 13zM26 40l-4-12c4 3 6 7 4 12zM37 40l5-10c1 5-1 8-5 10z" /><path d="M24 7v10M19 11l5 6 5-6" strokeDasharray="2 2" /></>,
  thresh: <><path d="M7 26h34l-4 7H11z" /><path d="M13 33v4M19 33v4M25 33v4M31 33v4M37 33v3" /><path d="M41 26l5-9" /><path d="M4 42h40" /></>,
  winnow: <><path d="M9 43l19-24" /><path d="M23 13l7 8M27 11l6 8M31 9l5 8" /><circle cx="39" cy="8" r=".9" /><circle cx="43" cy="14" r=".9" /><circle cx="35" cy="5" r=".9" /><circle cx="44" cy="7" r=".9" /><path d="M6 11c5-2 9-2 13 0M4 18c4-2 7-2 10 0" strokeDasharray="3 2" /></>,
  prune: <><path d="M8 42c8-6 8-16 16-20 7-3 10-9 9-16" /><path d="M24 22c4 2 8 2 12-1" /><path d="M9 10c6 0 9 4 8 10-3-4-5-6-8-6l-3 3" /></>,
  tread: <><path d="M6 25h36v15H6z" /><path d="M42 36h4" /><path d="M21 22V7h6c-1 3 0 5 3 6 2 1 3 4 2 9z" /><circle cx="13" cy="31" r="2" /><circle cx="19" cy="34" r="2" /><circle cx="25" cy="31" r="2" /><circle cx="33" cy="34" r="2" /></>,
  press: <><path d="M4 12l40 8" /><path d="M4 7v10" /><path d="M42 20v8M37 28h10v9H37z" /><path d="M14 22h14v5H14zM14 27h14v5H14z" /><path d="M9 32h24v5H9z" /><circle cx="21" cy="42" r="2" /></>,
};

export function JobArt({ id }: { id: string }) {
  return <svg className="fy-jobart" viewBox="0 0 48 48" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{JOB_ART[id]}</svg>;
}
