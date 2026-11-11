// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { CSSProperties } from 'react';
export const drawTiming=(seconds:number)=>({'--wc-draw-delay':`${seconds}s`} as CSSProperties);
