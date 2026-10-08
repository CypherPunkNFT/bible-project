// 04 · Who was alive at the same time: painting one frame of the lifelines canvas.
import type { Person } from "@/data/teachers/pages-types";
import { lifeEnd, type Family } from "../../shared/people";
import { easeOut } from "./common";
import { START, isAlive, xOf, type Geometry, type Head } from "./model";

export const SANS = "'Archivo Variable', system-ui, sans-serif";

/** Colours as currently painted (re-read when the theme changes). */
export interface Palette { family: string[]; tone: Map<string, string>; ink: string; muted: string; line: string; page: string; surface: string }

/** Everything one frame needs. `year` is the cursor (fractional while it moves); `focus` dims every other family. */
export interface Scene {
  width: number; height: number; g: Geometry;
  people: Person[]; fams: Family[]; rowY: Float32Array;
  heads: Head[]; fadingHeads: Head[] | null; morph: number;
  year: number; hover: number; focus: string | null; dark: boolean;
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  if (typeof c.roundRect === "function") c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
}

function drawGrid(c: CanvasRenderingContext2D, s: Scene, pal: Palette) {
  c.lineWidth = 1;
  c.textAlign = "center";
  c.font = `500 10px ${SANS}`;
  const cursorX = xOf(s.g, s.width, s.year);
  for (let y = START; y <= 2000; y += 50) {
    const x = Math.round(xOf(s.g, s.width, y)) + 0.5, major = y % 100 === 0, covered = Math.abs(x - cursorX) < 40;
    c.globalAlpha = major ? 1 : 0.45;
    c.strokeStyle = pal.line;
    c.beginPath(); c.moveTo(x, 24); c.lineTo(x, s.height - 2); c.stroke();
    if ((major || !s.g.narrow) && !covered) { c.fillStyle = pal.muted; c.globalAlpha = major ? 1 : 0.7; c.fillText(String(y), x, 12); }
  }
}

/** Group headings, cross-fading while the order changes. */
function drawHeads(c: CanvasRenderingContext2D, s: Scene, pal: Palette) {
  c.textAlign = "left";
  c.font = `600 ${s.g.narrow ? 8 : 9}px ${SANS}`;
  const paint = (heads: Head[], alpha: number) => {
    for (const h of heads) {
      c.globalAlpha = alpha;
      c.fillStyle = h.tone ? pal.tone.get(h.tone) ?? pal.muted : pal.muted;
      c.letterSpacing = "1.6px";
      c.fillText(h.label.toUpperCase(), 0, h.y);
      c.letterSpacing = "0px";
    }
  };
  if (s.fadingHeads) { const p = easeOut(s.morph); paint(s.fadingHeads, 1 - p); paint(s.heads, p); } else paint(s.heads, 1);
}

/** Lives: faint first, then the living-at-the-cursor on top, then the hovered one. */
function drawLives(c: CanvasRenderingContext2D, s: Scene, pal: Palette) {
  const year = Math.round(s.year), X = (y: number) => xOf(s.g, s.width, y);
  const rank = (i: number) => (i === s.hover ? 2 : isAlive(s.people[i], year) ? 1 : 0);
  const order = [...s.people.keys()].sort((a, b) => rank(a) - rank(b));
  c.lineCap = "round";
  for (const i of order) {
    const p = s.people[i], y = s.rowY[i], x1 = X(p.born), x2 = X(lifeEnd(p)), on = isAlive(p, year), hot = i === s.hover;
    const dim = s.focus !== null && s.fams[i].key !== s.focus;
    c.globalAlpha = dim ? 0.1 : on || hot ? 1 : s.dark ? 0.46 : 0.42;
    c.strokeStyle = pal.family[i];
    c.lineWidth = hot ? 4 : on ? 3.2 : 2;
    c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke();
    if (on || hot) { // small gaps where they moved to a new place
      c.fillStyle = pal.surface;
      for (let k = 1; k < p.places.length; k++) { const mx = X(p.places[k][3]); if (mx > x1 + 3 && mx < x2 - 3) c.fillRect(mx - 0.75, y - 3, 1.5, 6); }
    }
    if (!p.died) { c.globalAlpha *= 0.9; c.fillStyle = pal.family[i]; c.beginPath(); c.moveTo(x2 + 3, y - 3.5); c.lineTo(x2 + 8, y); c.lineTo(x2 + 3, y + 3.5); c.fill(); }
    c.globalAlpha = dim ? 0.18 : on || hot ? 1 : 0.62;
    c.font = `${on || hot ? 600 : 400} ${s.g.font}px ${SANS}`;
    c.fillStyle = on || hot ? pal.ink : pal.muted;
    c.textAlign = "right";
    c.fillText(p.short, x1 - 6, y + 0.5);
  }
}

/** The cursor: a line, a dot on every life it crosses, and a year pill on the axis. */
function drawCursor(c: CanvasRenderingContext2D, s: Scene, pal: Palette) {
  const year = Math.round(s.year), cx = xOf(s.g, s.width, s.year);
  c.globalAlpha = 1;
  c.strokeStyle = pal.ink;
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(Math.round(cx) + 0.5, 22); c.lineTo(Math.round(cx) + 0.5, s.height - 2); c.stroke();
  s.people.forEach((p, i) => {
    if (!isAlive(p, year) || (s.focus !== null && s.fams[i].key !== s.focus)) return;
    c.fillStyle = pal.surface; c.beginPath(); c.arc(cx, s.rowY[i], 5, 0, 7); c.fill();
    c.fillStyle = pal.family[i]; c.beginPath(); c.arc(cx, s.rowY[i], 3.3, 0, 7); c.fill();
  });
  c.font = `600 11px ${SANS}`;
  const label = String(year), pw = c.measureText(label).width + 16, px = Math.min(s.width - pw, Math.max(0, cx - pw / 2));
  c.fillStyle = pal.ink; roundRect(c, px, 2, pw, 20, 10); c.fill();
  c.fillStyle = pal.page; c.textAlign = "center"; c.fillText(label, px + pw / 2, 12.5);
}

export function drawScene(c: CanvasRenderingContext2D, s: Scene, pal: Palette) {
  c.clearRect(0, 0, s.width, s.height);
  c.textBaseline = "middle";
  drawGrid(c, s, pal);
  drawHeads(c, s, pal);
  drawLives(c, s, pal);
  drawCursor(c, s, pal);
}
