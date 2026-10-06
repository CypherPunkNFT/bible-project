import type { ZoomTransform } from "d3-zoom";
import type { MapPlace } from "./projection";

export interface PlaceGroup {
  id: string;
  place: MapPlace;
  members: MapPlace[];
  sx: number;
  sy: number;
}

/** Group in screen pixels: zooming separates places without making their markers larger. */
export function groupPlaces(places: MapPlace[], view: ZoomTransform, width: number, height: number, selectedId?: string): PlaceGroup[] {
  const spacing = 36;
  const cells = new Map<string, PlaceGroup[]>();
  const groups: PlaceGroup[] = [];
  const ordered = [...places].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || b.verses.length - a.verses.length || a.id.localeCompare(b.id));
  for (const place of ordered) {
    const sx = view.applyX(place.x), sy = view.applyY(place.y);
    if (sx < 12 || sy < 12 || sx > width - 12 || sy > height - 12) continue;
    const col = Math.floor(sx / spacing), row = Math.floor(sy / spacing);
    let nearest: PlaceGroup | undefined;
    let distance = spacing;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const group of cells.get(`${col + dx},${row + dy}`) ?? []) {
        const gap = Math.hypot(sx - group.sx, sy - group.sy);
        if (gap < distance) { nearest = group; distance = gap; }
      }
    }
    if (nearest) nearest.members.push(place);
    else {
      const group = { id: place.id, place, members: [place], sx, sy };
      const key = `${col},${row}`;
      cells.set(key, [...(cells.get(key) ?? []), group]);
      groups.push(group);
    }
  }
  return groups;
}

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Reserve both names and markers, and try four sides before hiding a label. */
export function labelGroups(groups: PlaceGroup[], width: number, height: number) {
  const occupied: Box[] = [{ x: width - 45, y: 0, width: 45, height: 60 }];
  const markers = groups.map((group) => {
    const r = group.members.length > 1 ? 15 : 7;
    return { x: group.sx - r, y: group.sy - r, width: r * 2, height: r * 2 };
  });
  const labels: { id: string; name: string; x: number; y: number; anchorX: number; anchorY: number }[] = [];
  for (const [index, group] of groups.entries()) {
    const name = group.place.name;
    const w = name.length * 7.2 + 6;
    const r = group.members.length > 1 ? 17 : 10;
    const candidates: Box[] = [
      { x: group.sx + r, y: group.sy - 9, width: w, height: 18 },
      { x: group.sx - r - w, y: group.sy - 9, width: w, height: 18 },
      { x: group.sx - w / 2, y: group.sy - r - 18, width: w, height: 18 },
      { x: group.sx - w / 2, y: group.sy + r, width: w, height: 18 },
    ];
    // Give the most important names room beyond a dense group, joined by a fine leader line.
    if (index < 8) for (const distance of [32, 64, 96]) for (const direction of [-1, 1]) {
      candidates.push({ x: group.sx + r, y: group.sy - 9 + distance * direction, width: w, height: 18 });
      candidates.push({ x: group.sx - r - w, y: group.sy - 9 + distance * direction, width: w, height: 18 });
    }
    if (index < 8) for (const distance of [32, 64, 96, 128, 160]) for (const shift of [0, -24, 24, -48, 48]) {
      candidates.push({ x: group.sx + r + distance, y: group.sy - 9 + shift, width: w, height: 18 });
      candidates.push({ x: group.sx - r - w - distance, y: group.sy - 9 + shift, width: w, height: 18 });
    }
    const fits = (b: Box) => b.x >= 8 && b.y >= 8 && b.x + w <= width - 8 && b.y + 18 <= height - 8
      && !occupied.some((other) => overlaps(b, other)) && !markers.some((other, i) => groups[i].id !== group.id && overlaps(b, other));
    let box = candidates.find(fits);
    if (!box && index === 0) {
      const spaces: Box[] = [];
      for (let y = 8; y + 18 <= height - 8; y += 20) for (let x = 8; x + w <= width - 8; x += 20) spaces.push({ x, y, width: w, height: 18 });
      spaces.sort((a, b) => Math.hypot(a.x + w / 2 - group.sx, a.y - group.sy) - Math.hypot(b.x + w / 2 - group.sx, b.y - group.sy));
      box = spaces.find(fits);
    }
    if (box) { occupied.push(box); labels.push({ id: group.id, name, x: box.x + 3, y: box.y + 13, anchorX: group.sx, anchorY: group.sy }); }
  }
  return labels;
}
