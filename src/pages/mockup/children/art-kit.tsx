// The pieces the lesson drawings share (art-old.tsx, art-new.tsx, art-belief.tsx). Each drawing sits in a 200 × 200 box
// whose circle it must stay inside (about 90 from the middle). Classes, children.css (.ck-art): p = paper fill,
// f = faint line, a = the gold accent, s = a soft wash of the part's colour, d = dotted.
import type { ReactNode } from "react";

/** A robed person standing with feet at (x, y); `extra` is drawn in their own frame (head at 0,-38), for a staff,
 *  raised arms or a crown. */
export const P = (x: number, y: number, s = 1, extra?: ReactNode) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path className="p" d="M-8 -29Q0 -32 8 -29L13 0H-13Z" /><circle className="p" cy={-38} r={7} />{extra}
</g>;

export const STAFF = <path d="M16 -44V0" />;
export const ARMS_UP = <path d="M-8 -26L-18 -44M8 -26L18 -44" />;
export const CROWN = <path className="a" d="M-7 -46L-6 -53L-2 -49L0 -55L2 -49L6 -53L7 -46Z" />;

/** A four-pointed star, outlined in gold. */
export const Star = (x: number, y: number, r: number) =>
  <path className="a" d={`M${x} ${y - r}L${x + r * 0.25} ${y - r * 0.25}L${x + r} ${y}L${x + r * 0.25} ${y + r * 0.25}L${x} ${y + r}L${x - r * 0.25} ${y + r * 0.25}L${x - r} ${y}L${x - r * 0.25} ${y - r * 0.25}Z`} />;

/** The faint ground everything stands on. */
export const Ground = ({ y = 158 }: { y?: number }) => <path className="f" d={`M34 ${y}Q100 ${y - 6} 166 ${y}`} />;

/** Two faint rows of water. */
export const Waves = ({ y }: { y: number }) => <>
  <path className="f" d={`M36 ${y}Q52 ${y - 6} 68 ${y}T100 ${y}T132 ${y}T164 ${y}`} />
  <path className="f" d={`M48 ${y + 13}Q64 ${y + 7} 80 ${y + 13}T112 ${y + 13}T144 ${y + 13}`} />
</>;

/** A clay jar standing at (x, y). */
export const Jar = (x: number, y: number, s = 1, wine?: boolean) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path className="p" d="M-10 -40Q-17 -34 -17 -22Q-18 -4 -10 0H10Q18 -4 17 -22Q17 -34 10 -40Z" />
  <path d="M-8 -40V-46H8V-40" />{wine && <path className="a" d="M-14 -30Q0 -26 14 -30" />}
</g>;

/** A flame rising from (x, y), `h` tall. */
export const Flame = (x: number, y: number, h: number) =>
  <path className="a" d={`M${x} ${y}Q${x - h * 0.45} ${y - h * 0.4} ${x} ${y - h}Q${x + h * 0.45} ${y - h * 0.4} ${x} ${y}Z`} />;

/** Sun rays around (x, y) from radius r1 to r2, eight of them. */
export const Rays = (x: number, y: number, r1: number, r2: number) => <path className="f" d={Array.from({ length: 8 }, (_, i) => {
  const t = (i * Math.PI) / 4, c = Math.cos(t), s = Math.sin(t);
  return `M${(x + c * r1).toFixed(1)} ${(y + s * r1).toFixed(1)}L${(x + c * r2).toFixed(1)} ${(y + s * r2).toFixed(1)}`;
}).join("")} />;

/** A crown, the band from x1 to x2 at y, the points `h` above it. */
export const Crown = (x1: number, x2: number, y: number, h: number) => {
  const w = x2 - x1, m = (x1 + x2) / 2;
  return <path className="p" d={`M${x1} ${y}L${x1 - 4} ${y - h}L${x1 + w * 0.22} ${y - h * 0.55}L${m} ${y - h * 1.15}L${x2 - w * 0.22} ${y - h * 0.55}L${x2 + 4} ${y - h}L${x2} ${y}Z`} />;
};

/** A woolly sheep facing right, its middle at (x, y). */
export const Sheep = (x: number, y: number, s = 1) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M-24 12V30M-10 16V32M12 16V32M24 10V28" />
  <path className="p" d="M-40 0Q-46 -16 -30 -20Q-24 -32 -8 -26Q4 -34 16 -24Q32 -26 32 -10Q40 4 26 10Q16 20 0 14Q-16 20 -28 12Q-42 12 -40 0Z" />
  <path className="p" d="M28 -16Q40 -24 50 -16Q50 -4 40 -2Q30 -4 28 -16Z" /><path d="M34 -20L28 -26" /><circle className="a" cx="42" cy="-12" r="1.6" />
</g>;
