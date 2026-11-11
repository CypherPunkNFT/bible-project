// Line drawings for the games hub's shelf doors (HubDoors on the hub), one per registry shelf, drawn like the study
// hub's subject art (src/pages/study/hub/Artwork.tsx): a 200 x 215 box, strokes in currentColor so the door's tone
// colours them, two faint rings behind each figure, no text. DOOR_TONES gives each shelf its colour from the site's
// section palette (src/index.css).
import type { ReactNode } from "react";
import { doorFrame } from "@/components/hub-doors/door-parts";
import type { Shelf } from "../registry";

export const DOOR_TONES: Record<Shelf, string> = { daily: "epistles", family: "history", groups: "gospels", solo: "poetry" };

export const DOOR_ART: Record<Shelf, ReactNode> = {
  // a calendar leaf with a letter grid on it: a new puzzle every day
  daily: doorFrame(<g>
    <path d="M58 72h84v76H58Z" /><path d="M58 88h84" /><path d="M76 62v16M124 62v16" strokeWidth="2" />
    <path d="M74 100h52v36H74Z" opacity=".8" /><path d="M87 100v36M100 100v36M113 100v36M74 112h52M74 124h52" opacity=".5" />
    <path d="M78 102h9v9h-9Zm26 12h9v9h-9Zm13 12h9v9h-9Z" fill="currentColor" fillOpacity=".22" />
    <path d="M44 158h112" opacity=".45" />
  </g>),
  // a table with two dice and fanned cards: the family at the table
  family: doorFrame(<g>
    <path d="M46 118h108" /><path d="M58 118v36M142 118v36" opacity=".7" /><path d="M46 118c10-6 26-10 54-10s44 4 54 10" opacity=".55" />
    <path d="M70 96l16-8 14 8-16 8Z" /><path d="M70 96v12l14 8V108" /><path d="M100 96v12l-16 8" />
    <circle cx="80" cy="106" r="1.6" fill="currentColor" /><circle cx="92" cy="106" r="1.6" fill="currentColor" /><circle cx="86" cy="94" r="1.6" fill="currentColor" />
    <path d="M110 86h18v26h-18Z" /><path d="M116 82l18-3 4 26-18 3Z" opacity=".75" /><path d="M123 75l17 4-6 26-17-4Z" opacity=".5" />
    <path d="M44 158h112" opacity=".45" />
  </g>),
  // a screen on a stand with rows of seats in front: one room, one screen
  groups: doorFrame(<g>
    <path d="M60 64h80v50H60Z" /><path d="M100 114v14M86 128h28" /><path d="M72 76h56M72 86h40M72 96h48" opacity=".6" />
    <path d="M56 142h12M78 142h12M100 142h12M122 142h12" strokeWidth="2.4" /><path d="M48 156h14M70 156h14M92 156h14M114 156h14M136 156h14" strokeWidth="2.4" opacity=".7" />
    <path d="M60 64l-8-8M140 64l8-8" opacity=".4" />
  </g>),
  // one armchair, a lamp and a puzzle on the lap: on your own, at your own pace
  solo: doorFrame(<g>
    <path d="M66 104v44h68v-44" /><path d="M66 104a10 10 0 0 0-10 10v24h10M134 104a10 10 0 0 1 10 10v24h-10" />
    <path d="M70 104c0-14 10-22 30-22s30 8 30 22" opacity=".8" /><path d="M66 148v10M134 148v10" opacity=".6" />
    <path d="M88 112h24v18H88Z" /><path d="M96 112v18M104 112v18M88 118h24M88 124h24" opacity=".5" />
    <path d="M152 62v70" opacity=".6" /><path d="M140 72h24l-4-16h-16Z" /><path d="M152 76c-4 6-6 10-6 13a6 6 0 0 0 12 0c0-3-2-7-6-13Z" opacity=".7" />
    <path d="M44 158h112" opacity=".45" />
  </g>),
};
