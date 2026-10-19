// On the live site the person records ship in packs, not one file each (scripts/pack-person-files.ts): Cloudflare Pages
// takes at most 20,000 files per release, and one file per person was 3,133 of them. The packer and the loader
// (src/lib/study.ts loadPersonDetail) both use this file, so they agree on which pack holds an id. No imports and no
// "@/" aliases: the release script loads it directly under Node.

/** FNV-1a (32-bit) over the text's UTF-16 code units (person ids are ASCII). */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return hash >>> 0;
}

/** Which of `packs` packs holds person `id`. */
export const personPack = (id: string, packs: number): number => fnv1a(id) % packs;

/** Pack `n` of `packs`, under data/study/. The count is in the path, so a new layout never meets a cached old pack. */
export const personPackPath = (n: number, packs: number): string => `people-packs/${packs}/${n}.json`;
