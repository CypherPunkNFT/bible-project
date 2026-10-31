// MOCK-UP: the three wise men on camels under version I's closing quotations (owner, 2026-10-31: "add the three wise men on
// cammels under the quotations, same as the covenant study"). The caravan of the covenant-signs study's "Count the stars"
// ground F (design/covenants-signs/js/drawings-stars-more.js, caravan()), drawn the same way with the same seed: nine
// camels in one line along a bare ridge, every third with a rider, the faint lead ropes between them and the tracks under
// them. Only the line of camels is taken; that ground's dunes, stones and thorn are left behind.
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const fixed = (n: number) => n.toFixed(1);
const ridge = (x: number) => 512 - 20 * Math.sin(x / 300 + 0.4) + 2.5 * Math.sin(x / 41);
const CAMEL = "M-18-19C-17-27-10-28-6-35C-3-40 2-38 4-31C6-27 10-25 14-26C16-31 16-39 19-43C21-46 26-46 28-44L30-42L24-40C22-36 22-28 20-22C18-17 14-15 12-14L14 0H11L8-13H-6L-9 0H-12L-12-13C-16-14-18-16-18-19Z";
const RIDER = "M-4-37C-5-44-3-48 0-49C3-48 5-44 3-37ZM0-54a3 3 0 1 0 .01 0Z";
const PACK = "M-14-29C-11-37 4-39 8-30C4-27-10-26-14-29Z";
const FROM = 236, TO = 716;

/** The camels, ropes, ridge and tracks, worked out once in the study's order so the same seed draws the same caravan. */
function drawCaravan() {
  const random = seeded(7717);
  const camels: { transform: string; d: string }[] = [];
  let ropes = "";
  for (let x = 650, i = 0; i < 9; i++) {
    const size = 0.62 + random() * 0.1, y = ridge(x);
    const load = i % 3 === 0 ? RIDER : random() < 0.6 ? PACK : "";
    camels.push({ transform: `translate(${fixed(x)} ${fixed(y)}) scale(${fixed(size)})`, d: CAMEL + load });
    const next = x - (34 + random() * 22);
    if (i < 8) ropes += `M${fixed(next + 18)} ${fixed(ridge(next) - 26 * size)}Q${fixed(x - 26)} ${fixed(y - 12)} ${fixed(x - 11)} ${fixed(y - 13)}`;
    x = next;
  }
  let tracks = "";
  for (let x = 80; x < 640; x += 9 + random() * 12) tracks += `M${fixed(x)} ${fixed(ridge(x) + 4 + random() * 2)}h${fixed(2 + random() * 3)}`;
  let line = "";
  for (let x = FROM; x <= TO; x += 6) line += `${x === FROM ? "M" : "L"}${x} ${fixed(ridge(x))}`;
  return { camels, ropes, tracks, line };
}
const CARAVAN = drawCaravan();

export function Caravan() {
  return <svg className="hm6-caravan" viewBox={`${FROM} 456 ${TO - FROM} 76`} aria-hidden="true">
    <path className="hm6-caravan-ridge" d={CARAVAN.line} />
    <path className="hm6-caravan-tracks" d={CARAVAN.tracks} />
    {CARAVAN.camels.map(({ transform, d }) => <path className="hm6-caravan-camel" transform={transform} d={d} key={transform} />)}
    <path className="hm6-caravan-ropes" d={CARAVAN.ropes} />
  </svg>;
}
