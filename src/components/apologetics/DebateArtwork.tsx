import type { ReactNode } from "react";

const drawings: Record<string, ReactNode> = {
  "craig-hitchens": <><circle cx="60" cy="35" r="24" strokeDasharray="2 6"/><circle cx="60" cy="35" r="14"/><path d="M60 16v6m0 26v6M41 35h6m26 0h6M60 56v46M46 104h28M26 70h68M32 70 18 92h28Zm56 0L74 92h28ZM18 92q14 16 28 0m28 0q14 16 28 0"/></>,
  "craig-ally-resurrection": <><path d="M15 88V58a35 35 0 0 1 70 0v30M28 88V58a22 22 0 0 1 44 0v30M10 89h83M50 15V6m-17 13-5-8m39 8 5-8"/><circle cx="88" cy="75" r="21"/><path d="M76 66q12-9 22 3M78 79q8 10 18 0M30 98h36v16H30Zm8 6h20m-20 5h12"/></>,
  "craig-ally-god": <><circle cx="44" cy="40" r="22"/><circle cx="30" cy="64" r="22"/><circle cx="58" cy="64" r="22"/><path d="M74 27v65" strokeDasharray="2 5"/><circle cx="98" cy="56" r="15"/><path d="M18 103h42m26 0h24M38 96v14m62-14v14"/></>,
  "lennox-dawkins": <><ellipse cx="60" cy="43" rx="39" ry="14"/><ellipse cx="60" cy="43" rx="39" ry="14" transform="rotate(60 60 43)"/><ellipse cx="60" cy="43" rx="39" ry="14" transform="rotate(120 60 43)"/><circle cx="60" cy="43" r="4"/><path d="M17 84q22-9 43 2 21-11 43-2v27q-22-9-43 2-21-11-43-2Zm43 2v27M25 94q12-4 25 1m20 0q12-5 25-1"/></>,
  "bahnsen-stein": <><path d="m60 13 42 23H18ZM25 43h16v45H25Zm54 0h16v45H79ZM19 94h82M12 104h96"/><circle cx="53" cy="65" r="11"/><circle cx="67" cy="65" r="11"/><path d="M60 30v-8m-4 4h8M8 113h104"/></>,
  "craig-ehrman": <><path d="M22 17h65v31.75M22 17v88h65V93.25M32 32h43M32 43h43M32 54h21M32 85h20M32 95h31"/><circle cx="78" cy="71" r="24"/><path d="m95 89 18 21M64 80V68a14 14 0 0 1 28 0v12M60 81h35M72 79V69a6 6 0 0 1 12 0v10"/></>,
  "craig-krauss": <><circle cx="60" cy="60" r="9"/><circle cx="60" cy="60" r="26" strokeDasharray="3 6"/><circle cx="60" cy="60" r="44"/><path d="M60 5v29m0 52v29M5 60h29m52 0h29M21 21l20 20m38 38 20 20M21 99l20-20m38-38 20-20M55 11l5-6 5 6m44 44 6 5-6 5M55 109l5 6 5-6M11 55l-6 5 6 5"/></>,
  "craig-grayling": <><circle cx="60" cy="36" r="16"/><path d="M60 7v7M31 17l6 6m46 0 6-6M25 36h8m54 0h8M13 72q12-23 25 0t25 0 25 0 25 0M13 87q12-23 25 0t25 0 25 0 25 0M13 102q12-23 25 0t25 0 25 0 25 0"/></>,
  "lennox-shermer": <><path d="M60 109V53q-25-7-29-31 28-3 29 31 1-34 29-31-4 24-29 31ZM30 90q-23-14-9-38m69 38q23-14 9-38M22 77l-12 4m14-17-12-5m24 35-4 14m66-31 12 4m-14-17 12-5M84 94l4 14M44 80l16 9 16-9"/></>,
};

export function DebateArtwork({ id }: { id: string }) {
  return <svg className="dr-exchange-artwork" viewBox="0 0 120 120" fill="none" aria-hidden="true">{drawings[id] ?? <path d="M15 25q23-10 45 0 22-10 45 0v70q-23-10-45 0-22-10-45 0Zm45 0v70" />}</svg>;
}
