/**
 * One emblem per museum, drawn here rather than taken from anywhere.
 *
 * No museum logo appears on this page. A museum's name and mark are its trademarks, almost none of
 * them are openly licensed, and a page about open licensing is the last place to be careless about
 * that. So every emblem is our own line drawing, in the same idiom as the rest of the site's artwork:
 * a building, an object or an instrument that says something true about that collection.
 *
 * Institutions without a drawing of their own get a frame chosen by what kind of body they are, with
 * their own initials inside, so every card still carries a mark of its own.
 */

import { initials } from "@/lib/museums";

const BOX = "0 0 72 72";

/** A line of shelves, used behind several of the library and archive emblems. */
const shelf = (y: number) => <path key={y} d={`M18 ${y}h36`} opacity=".35" />;

const DRAWINGS: Record<string, React.ReactNode> = {
  // A classical portico: the Met's Fifth Avenue front, reduced to columns and a pediment.
  met: <>
    <path d="M10 56h52M14 56V30h6v26m8 0V30h6v26m8 0V30h6v26m8 0V30h6v26" />
    <path d="m8 30 28-16 28 16Z" fill="currentColor" fillOpacity=".07" />
    <path d="M12 60h48" opacity=".4" />
  </>,
  // Cleveland: a rotunda with a shallow dome.
  cleveland: <>
    <path d="M14 56h44M18 56V34m8 22V34m8 22V34m8 22V34m8 22V34" />
    <path d="M14 34a22 22 0 0 1 44 0Z" fill="currentColor" fillOpacity=".07" />
    <path d="M36 12v6M12 60h48" opacity=".4" />
  </>,
  // The Art Institute: a stepped entrance between two guardian plinths.
  "art-institute": <>
    <path d="M10 58h52M22 58V26h28v32M26 26V18h20v8" />
    <path d="M30 58V40h12v18" fill="currentColor" fillOpacity=".08" />
    <path d="M14 50h6v8h-6Zm38 0h6v8h-6Z" opacity=".45" />
  </>,
  // The Smithsonian: a many-roomed institution, drawn as linked pavilions under one roofline.
  smithsonian: <>
    <path d="M8 54h56M14 54V34h12v20m8 0V26h12v28m8 0V34h12v20" />
    <path d="m32 26 8-8 8 8" fill="none" />
    <path d="M18 42h4m24-8h4m8 8h4" opacity=".4" />
    <path d="M10 58h52" opacity=".35" />
  </>,
  // Europeana aggregates: many institutions, one index. Small marks gathered on a ring.
  europeana: <>
    <circle cx="36" cy="36" r="20" opacity=".3" strokeDasharray="3 4" />
    <circle cx="36" cy="36" r="7" fill="currentColor" fillOpacity=".1" />
    {[0, 60, 120, 180, 240, 300].map((angle) => {
      const radians = (angle * Math.PI) / 180;
      return <rect key={angle} x={36 + 20 * Math.cos(radians) - 3.5} y={36 + 20 * Math.sin(radians) - 3.5}
        width="7" height="7" rx="1" fill="currentColor" fillOpacity=".25" />;
    })}
  </>,
  // Wikidata holds no object: an identifier, drawn as a label tied to nothing.
  wikidata: <>
    <path d="M12 28h12v16H12Zm18 0h6v16h-6Zm12 0h12v16H42Zm18 0h2v16h-2" fill="currentColor" fillOpacity=".15" />
    <path d="M12 28h12v16H12Zm18 0h6v16h-6Zm12 0h12v16H42Z" />
    <path d="M10 52h52" opacity=".35" />
    <path d="M36 20v-6m-5 3 5-3 5 3" opacity=".5" />
  </>,
  // ORACC: an edited tablet — the wedge rows with an editor's bracket beside them.
  oracc: <>
    <path d="M18 14h36v44H18Z" fill="currentColor" fillOpacity=".05" />
    <path d="M18 14h36v44H18Z" />
    {[22, 30, 38, 46].map((y) => <g key={y}><path d={`M24 ${y}h24`} opacity=".5" />
      <path d={`M26 ${y - 3}v6m8-6v6m8-6v6`} opacity=".7" /></g>)}
    <path d="M58 24h4v24h-4" opacity=".55" />
  </>,
  // CDLI: the catalogue of tablets wherever they are — a card index of them.
  cdli: <>
    {[0, 1, 2].map((i) => <path key={i} d={`M${12 + i * 4} ${20 + i * 6}h40v30h-40Z`}
      fill="var(--surface)" opacity={0.55 + i * 0.22} />)}
    <path d="M20 32h40v30H20Z" fill="currentColor" fillOpacity=".05" />
    <path d="M20 32h40v30H20Z" />
    <path d="M26 40h20m-20 7h28m-28 7h16" opacity=".5" />
  </>,
  // The British Museum: the Great Court's glazed roof over a reading room.
  "british-museum": <>
    <path d="M8 56h56M16 56V28h40v28" />
    <path d="M16 28 36 12l20 16Z" fill="currentColor" fillOpacity=".07" />
    <circle cx="36" cy="44" r="10" fill="var(--surface)" />
    <path d="M26 44a10 10 0 0 1 20 0" />
    <path d="M30 44v12m12-12v12" opacity=".4" />
    <path d="M12 60h48" opacity=".35" />
  </>,
  // The Louvre: the glass pyramid in front of the palace wing.
  louvre: <>
    <path d="M8 56h56M14 56V34h44v22" opacity=".5" />
    <path d="M18 42h6v14h-6Zm12 0h6v14h-6Zm12 0h6v14h-6Z" opacity=".3" />
    <path d="m36 20 20 36H16Z" fill="currentColor" fillOpacity=".08" />
    <path d="m36 20 20 36H16Zm0 0v36M24 44h24" />
  </>,
  // The Israel Museum: the Shrine of the Book's white lid, beside the museum's long galleries.
  "israel-museum": <>
    <path d="M12 56h48" />
    <path d="M36 18c10 6 14 14 14 22H22c0-8 4-16 14-22Z" fill="currentColor" fillOpacity=".08" />
    <path d="M36 18c10 6 14 14 14 22H22c0-8 4-16 14-22Z" />
    <path d="M36 18v22" opacity=".4" />
    <path d="M14 48h44v8H14Z" opacity=".5" />
  </>,
  // The antiquities authority: a licensed trench, with its own marker peg and tag.
  iaa: <>
    <path d="M10 44h52v14H10Z" fill="currentColor" fillOpacity=".06" />
    <path d="M10 44h52v14H10Zm0 7h52" />
    <path d="M24 44V20h4v24" />
    <path d="M28 22h16v10H28Z" fill="var(--surface)" />
    <path d="M28 22h16v10H28Zm4 4h8m-8 4h6" opacity=".6" />
  </>,
  // The Egyptian Museum: a stele, round-topped, with a register line and a cartouche.
  "egyptian-museum": <>
    <path d="M22 60V32a14 14 0 0 1 28 0v28Z" fill="currentColor" fillOpacity=".06" />
    <path d="M22 60V32a14 14 0 0 1 28 0v28ZM22 44h28" />
    <rect x="30" y="24" width="12" height="14" rx="6" opacity=".55" />
    <path d="M28 50h16m-16 5h12" opacity=".45" />
  </>,
  // Leiden's museum of antiquities: a Nile temple front, re-erected indoors.
  leiden: <>
    <path d="M10 58h52" />
    <path d="M16 58V26h40v32" fill="currentColor" fillOpacity=".06" />
    <path d="M16 58V26h40v32M12 26h48l-4-6H16Z" />
    <path d="M28 58V38h16v20" fill="var(--surface)" />
    <path d="M28 58V38h16v20M22 34h4m20 0h4" opacity=".55" />
  </>,
  // Istanbul: a domed hall with a sarcophagus lid in front of it.
  istanbul: <>
    <path d="M10 54h52" />
    <path d="M18 54V32a18 18 0 0 1 36 0v22Z" fill="currentColor" fillOpacity=".06" />
    <path d="M18 54V32a18 18 0 0 1 36 0v22Z" />
    <path d="M36 14v-4" opacity=".5" />
    <path d="M22 54h28l-4-8H26Z" fill="var(--surface)" />
    <path d="M22 54h28l-4-8H26Z" />
  </>,
  // The Chester Beatty: papyrus leaves, bound at the spine.
  "chester-beatty": <>
    <path d="M14 16h44v44H14Z" fill="currentColor" fillOpacity=".05" />
    <path d="M14 16h44v44H14ZM36 16v44" />
    {[24, 31, 38, 45, 52].map((y) => <g key={y}><path d={`M20 ${y}h12`} opacity=".45" /><path d={`M40 ${y}h12`} opacity=".45" /></g>)}
    <path d="M10 60h52" opacity=".35" />
  </>,
  // The Vatican Library: a vaulted reading room, with its shelves.
  vatican: <>
    <path d="M14 58V28a22 22 0 0 1 44 0v30Z" fill="currentColor" fillOpacity=".05" />
    <path d="M14 58V28a22 22 0 0 1 44 0v30Z" />
    {[36, 44, 52].map(shelf)}
    <path d="M36 10V4m-4 3 4-3 4 3" opacity=".45" />
  </>,
  // The Bodmer Foundation: a codex opened flat, which is what its papyri are famous for.
  bodmer: <>
    <path d="M10 24q13-8 26 0q13-8 26 0v30q-13-7-26 0q-13-7-26 0Z" fill="currentColor" fillOpacity=".06" />
    <path d="M10 24q13-8 26 0q13-8 26 0v30q-13-7-26 0q-13-7-26 0ZM36 24v30" />
    <path d="M16 32h14m-14 7h12m12-7h14m-14 7h12" opacity=".45" />
  </>,
  // The Bibliothèque nationale: a cabinet of medals, which is where its stone is catalogued.
  bnf: <>
    <path d="M12 18h48v44H12Z" fill="currentColor" fillOpacity=".05" />
    <path d="M12 18h48v44H12Z" />
    {[0, 1, 2].map((row) => [0, 1, 2].map((column) => (
      <circle key={`${row}-${column}`} cx={24 + column * 12} cy={28 + row * 13} r="4.5" opacity=".5" />
    )))}
    <path d="M12 40h48M12 53h48" opacity=".25" />
  </>,
  // Ginosar: the hull of the first-century boat, on its cradle.
  "galilee-boat": <>
    <path d="M10 34h52l-8 16H18Z" fill="currentColor" fillOpacity=".08" />
    <path d="M10 34h52l-8 16H18Z" />
    <path d="M34 34V14l14 8-14 6" />
    <path d="M14 56h44" opacity=".4" />
    <path d="M18 40h36m-33 5h30" opacity=".35" />
  </>,
  // Magdala: a first-century synagogue floor, and the carved stone standing on it.
  magdala: <>
    <path d="M8 52h56" />
    <path d="M12 52V30h48v22" opacity=".45" />
    <path d="M26 52V34h20v18Z" fill="currentColor" fillOpacity=".09" />
    <path d="M26 52V34h20v18Z" />
    <path d="M36 38v10m-5-5h10" opacity=".6" />
    <path d="M18 44h4m28 0h4" opacity=".35" />
  </>,
  // Amsterdam, which we hold nothing from: the building, with its door not yet open.
  rijksmuseum: <>
    <path d="M8 58h56M14 58V26h44v32" opacity=".5" />
    <path d="m12 26 24-14 24 14Z" fill="currentColor" fillOpacity=".04" />
    <path d="m12 26 24-14 24 14Z" opacity=".5" />
    <path d="M30 58V40h12v18" strokeDasharray="4 4" />
    <path d="M20 36h6m20 0h6" opacity=".3" />
  </>,
  // No holder recorded: an object with an empty label beside it.
  unrecorded: <>
    <path d="M20 58V34a16 16 0 0 1 32 0v24Z" fill="currentColor" fillOpacity=".05" />
    <path d="M20 58V34a16 16 0 0 1 32 0v24Z" opacity=".55" />
    <path d="M26 44h20m-20 7h14" opacity=".4" />
    <path d="M8 16h26v12H8Z" strokeDasharray="4 4" />
    <path d="M14 22h2" opacity=".6" />
  </>,
};

/** The frames used for an institution with no drawing of its own. */
const FRAMES: Record<string, React.ReactNode> = {
  museum: <path d="M10 56h52M16 56V30h40v26m-44-26L36 14l24 16Z" />,
  university: <><circle cx="36" cy="36" r="22" /><path d="m36 16 18 9-18 9-18-9Zm14 12v10q-6 6-14 6t-14-6V28" /></>,
  library: <><path d="M14 16h44v44H14Z" />{[28, 36, 44, 52].map(shelf)}</>,
  catalogue: <><path d="M16 18h40v40H16Z" /><path d="M16 30h40M24 42h24M24 48h16" opacity=".5" /></>,
  authority: <><path d="M36 10l22 8v18c0 14-10 22-22 26C24 58 14 50 14 36V18Z" /><path d="M28 36h16m-8-8v16" opacity=".5" /></>,
  site: <><path d="M8 54h56" /><path d="m18 54 12-26 10 18 6-8 8 16Z" fill="currentColor" fillOpacity=".07" /><path d="m18 54 12-26 10 18 6-8 8 16" /></>,
  aggregator: <><circle cx="36" cy="36" r="20" strokeDasharray="3 4" /><circle cx="36" cy="36" r="6" /></>,
  unrecorded: <path d="M14 18h44v44H14Z" strokeDasharray="5 4" />,
};

export function MuseumEmblem({ emblem, name, size = 72 }: { emblem: string; name: string; size?: number }) {
  const drawing = DRAWINGS[emblem];
  const kind = emblem.startsWith("kind-") ? emblem.slice(5) : "museum";
  return (
    <svg className="mu-emblem" viewBox={BOX} width={size} height={size} role="img" aria-label={`${name} emblem`}
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      {drawing ?? (
        <>
          <g opacity=".5">{FRAMES[kind] ?? FRAMES.museum}</g>
          <text x="36" y="43" textAnchor="middle" fill="currentColor" stroke="none"
            fontFamily="var(--font-serif)" fontSize="19" fontWeight="600">{initials(name)}</text>
        </>
      )}
    </svg>
  );
}
