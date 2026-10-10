# Chosen worldview compositions

Local URL: http://localhost:8931/mockups/worldview-compositions/

Build from the Website directory: `node design/worldview-compositions/build.mjs`.

This is the second comparison page. The first page at
http://localhost:8931/mockups/worldview-art/ is preserved. These are design assets;
production files are not changed.

## Current chosen layouts

- Hinduism: balanced A around the B temple. Artifact 3 is the temple bell;
  25 is the garland, moved to the upper right; 21 is the trident, moved to the
  lower right. Both right-side objects are closer to the temple. One corrected
  fire altar (26) replaces the bottom-left oil lamp; there is no duplicate altar
  below the temple. B and C remain alternative arrangements for comparison.
- Buddhism: balanced A around the A eight-spoked wheel. Artifacts are bowl and
  flame (10), lotus (14), victory banner (30), and vajra (33). The bowl has a
  closed flame at its rim in all three variants on this page.
- Islam: B mosque retained, with ten new physical-object directions (45?54).
  The previous rosette, lattice and minaret artifacts are removed from these
  compositions. The new objects are candidates for review, not user approvals.

## Islamic object comparison

The ten-object grid is at `/mockups/worldview-compositions/#islam-objects`.
Each item has a description, a museum reference and an enlarged view.

| Number | Object |
| --- | --- |
| 45 | Prayer beads / misbaha |
| 46 | Prayer rug |
| 47 | Glass mosque lamp |
| 48 | Qur?an and folding stand |
| 49 | Reed pen and inkwell |
| 50 | Metal ewer |
| 51 | Spherical incense burner |
| 52 | Qur?an binding |
| 53 | Qibla compass |
| 54 | Calligrapher?s pen box |

Islam A previews 45/46/47, B previews 48/49/50/54, and C previews 51/52/53.
Legends list only the objects present in each composition.

## Artwork implementation

`centerpieces.tsx` copies the selected temple and mosque paths and A wheel
geometry. `glyphs.tsx` contains the Hindu and Buddhist artifacts, including the
corrected fire altar and flaming bowl. `islam-objects.tsx` contains the ten new
object glyphs and their comparison grid. `compositions.tsx` declares placement
and legend data. Optional numbers appear on the artwork, and each composition
has a modal with A/B/C switching.

Each of the altar?s three closed flame paths begins and ends at `(0,12)`, the
center of the opening. Opaque fill matching the surface masks hearth lines
behind the flame. A larger detail remains below the Hinduism row.

Ground ellipses remain absent. Dotted rings can be paused and respect reduced
motion. The temple finial has no horizontal crossbar.

## Verification

Verified in headless Edge: nine composition cards, chosen Hindu A artifact
positions and legend, three flaming bowls, ten new Islamic object cards and
matching museum links, all ten object enlargement buttons, composition
modals, visible SVG bounds, dark/light rendering, no browser errors, and no
horizontal overflow at widths 1440, 1024, 768, 390 and 320.
