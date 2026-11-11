// Line drawings for the tools hub's category doors (HubDoors on the hub), one per registry category, drawn like the
// study hub's subject art (src/pages/study/hub/Artwork.tsx): a 200 x 215 box, strokes in currentColor so the door's tone
// colours them, two faint rings behind each figure, no text. DOOR_TONES gives each category its colour from the site's
// section palette (src/index.css).
import type { ReactNode } from "react";
import { doorFrame } from "@/components/hub-doors/door-parts";
import type { Category } from "../registry";

export const DOOR_TONES: Record<Category, string> = { family: "history", "hard-times": "prophets", prayer: "epistles", sharing: "poetry", study: "gospels" };

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
  // hands folded over an open book: prayer at home
  prayer: doorFrame(<g>
    <path d="M58 136c10-6 26-8 42-2 16-6 32-4 42 2v22c-10-6-26-8-42-2-16-6-32-4-42 2Z" /><path d="M100 134v24" opacity=".6" />
    <path d="M100 124c-8-12-10-30-6-46 2-8 8-10 10-2 2-8 8-6 10 2 4 16 2 34-6 46" />
    <path d="M94 76c-4-8-12-10-16 0-2 6 2 22 10 34M106 76c4-8 12-10 16 0 2 6-2 22-10 34" />
    <path d="M100 52v8M80 60l4 6m32-6-4 6" opacity=".55" />
  </g>),
  // a verse card leaving as a paper plane: sharing
  sharing: doorFrame(<g>
    <path d="M54 82h72v58H54Z" /><path d="M66 98h48M66 110h40M66 122h28" opacity=".7" />
    <path d="M118 64 158 96l-22 8-6 20-8-18-22-4Z" fill="currentColor" fillOpacity=".14" /><path d="M136 104 158 96" /><path d="M130 86l-10 16" opacity=".7" />
    <path d="M44 150h116" opacity=".45" />
  </g>),
  // a magnifying glass over a scroll: study and reference
  study: doorFrame(<g>
    <path d="M58 70h70a8 8 0 0 1 0 16H58a8 8 0 0 1 0-16Z" /><path d="M66 86v60h62" /><path d="M128 146a8 8 0 0 0 0-16H66" opacity=".7" />
    <path d="M78 100h40M78 112h34M78 124h26" opacity=".7" />
    <circle cx="124" cy="112" r="20" fill="var(--page)" fillOpacity=".55" /><circle cx="124" cy="112" r="20" /><path d="M138 126l18 18" strokeWidth="3" /><path d="M114 112h20M124 102v20" opacity=".55" />
  </g>),
};
