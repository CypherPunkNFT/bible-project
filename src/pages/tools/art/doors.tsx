// Line drawings for the tools hub's category doors (HubDoors on the hub), one per registry category, drawn like the
// study hub's subject art (src/pages/study/hub/Artwork.tsx): a 200 x 215 box, strokes in currentColor so the door's tone
// colours them, two faint rings behind each figure, no text. DOOR_TONES gives each category its colour from the site's
// section palette (src/index.css).
import type { ReactNode } from "react";
import { doorFrame } from "@/components/hub-doors/door-parts";
import type { Category } from "../registry";

export const DOOR_TONES: Record<Category, string> = { family: "history", "hard-times": "prophets", prayer: "epistles", sharing: "poetry", study: "gospels", witness: "acts" };

export const DOOR_ART: Record<Category, ReactNode> = {
  // a house whose door holds a heart: family and the events of a life
  family: doorFrame(<g>
    <path d="M52 104 100 62l48 42" /><path d="M62 98v60h76V98" /><path d="M118 70V60h10v18" />
    <path d="M88 158v-30h24v30" /><path d="M100 146c-5-6-9-9-9-13a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 4-4 7-9 13Z" fill="currentColor" fillOpacity=".18" />
    <path d="M72 112h10v10H72Zm46 0h10v10h-10Z" opacity=".7" /><path d="M44 158h112" opacity=".45" />
  </g>),
  // a lantern lit in the dark: comfort in hard times
  "hard-times": doorFrame(<g>
    <path d="M100 52v10" /><path d="M86 62h28l-4 10H90Z" /><path d="M84 72h32v62H84Z" /><path d="M78 134h44l-4 12H82Z" />
    <path d="M100 90c-7 10-10 16-10 22a10 10 0 0 0 20 0c0-6-3-12-10-22Z" fill="currentColor" fillOpacity=".18" />
    <path d="M100 100c-3 5-4 8-4 11a4 4 0 0 0 8 0c0-3-1-6-4-11Z" opacity=".8" />
    <path d="M66 96h-9M143 96h-9M72 72l-6-6m62 6 6-6" opacity=".5" />
  </g>),
  // praying hands under a roof: prayer at home
  prayer: doorFrame(<g>
    <path d="M44 96 100 48l56 48" /><path d="M54 88v70h92V88" opacity=".7" /><path d="M126 58V50h10v16" />
    <path d="M100 76c-9 10-15 26-15 44v30h30v-30c0-18-6-34-15-44Z" fill="currentColor" fillOpacity=".12" />
    <path d="M100 76v74" opacity=".55" /><path d="M85 110c-5 2-8 6-8 12v14M115 110c5 2 8 6 8 12v14" />
    <path d="M85 120c-3-6-3-12 0-18M115 120c3-6 3-12 0-18" opacity=".55" /><path d="M85 150h30" />
    <path d="M44 158h112" opacity=".45" />
  </g>),
  // a church beside an envelope that is sending: Scripture shared with friends and churches
  sharing: doorFrame(<g>
    <path d="M52 150V106l22-20 22 20v44" /><path d="M74 60v26" strokeWidth="1.6" /><path d="M66 68h16" strokeWidth="1.6" />
    <path d="M64 150v-18h20v18" opacity=".8" /><path d="M66 118h4v8h-4Zm12 0h4v8h-4Z" opacity=".6" />
    <path d="M96 112h60v38H96Z" fill="var(--page)" fillOpacity=".7" /><path d="M96 112h60v38H96Z" /><path d="M96 112l30 22 30-22" /><path d="M96 150l22-20M156 150l-22-20" opacity=".6" />
    <path d="M132 96c6-8 14-12 24-12M136 84c7-9 17-14 28-14" opacity=".55" />
    <path d="M44 158h112" opacity=".45" />
  </g>),
  // a magnifying glass over a scroll: study and reference
  study: doorFrame(<g>
    <path d="M58 70h70a8 8 0 0 1 0 16H58a8 8 0 0 1 0-16Z" /><path d="M66 86v60h62" /><path d="M128 146a8 8 0 0 0 0-16H66" opacity=".7" />
    <path d="M78 100h40M78 112h34M78 124h26" opacity=".7" />
    <circle cx="124" cy="112" r="20" fill="var(--page)" fillOpacity=".55" /><circle cx="124" cy="112" r="20" /><path d="M138 126l18 18" strokeWidth="3" /><path d="M114 112h20M124 102v20" opacity=".55" />
  </g>),
  // an open hand holding out a written page: a testimony offered to someone else
  witness: doorFrame(<g>
    <path d="M70 60h58l8 8v70H70Z" fill="var(--page)" fillOpacity=".7" /><path d="M70 60h58l8 8v70H70Z" /><path d="M128 60v8h8" opacity=".7" />
    <path d="M82 80h24M82 92h40M82 102h36M82 112h40M82 122h28" opacity=".7" />
    <path d="M103 74c-4-3-6-7-3-10 2-1 3 0 3 1 0-1 1-2 3-1 3 3 1 7-3 10Z" fill="currentColor" fillOpacity=".18" />
    <path d="M60 150c0-12 6-18 16-20l16-3c6-1 10 2 10 6s-4 6-10 7l-12 2" /><path d="M66 128c-4 4-6 10-6 18" opacity=".55" />
    <path d="M102 133c10-2 20-4 30-4 4 0 6 2 6 5s-2 5-6 6l-30 6" /><path d="M44 158h112" opacity=".45" />
  </g>),
};
