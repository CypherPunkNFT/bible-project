# Sphere theme mock-ups

Preview: http://127.0.0.1:8931/apologetics/worldviews/islam?country=PAK&globeDesign=a#sphere-studies . Sixteen choices retain the original colour-card format: three horizontal swatches with the letter and name underneath, six columns on desktop and three on phones. Selecting A–P changes the existing full-size globe below the array.

| Option | Treatment |
|---|---|
| A · Earth | Existing deep ocean, olive terrain and gold selection |
| B · Midnight | Ink-blue seas, slate land and silver-blue outlines |
| C · Quiet olive | Softer olive land and warmer shores, from Earth |
| D · Blue slate | Muted slate terrain and quieter silver lines, from Midnight |
| E · Deep forest | Deeper forest greens and cooler seas |
| F · Atlantic | Slightly bluer water and land |
| G · Warm shore | Soft ochre terrain and champagne outlines |
| H · Smoke blue | Grey-blue land and subdued water |
| I · Moss | Muted moss terrain and sage lines |
| J · Deep navy | Deeper navy seas and clearer coastline contrast |
| K · Charcoal | Charcoal water and pewter-green terrain |
| L · Silver coast | Silver coastlines and muted blue terrain |
| M · Muted teal | Restrained teal sea and cool green terrain |
| N · Dusk | Grey-blue terrain and warm gold selection |
| O · Soft earth | Softer terrain contrast and delicate outlines |
| P · Quiet midnight | Deeper slate land and lower-contrast outlines |

The owner preferred the original A and B. Both are preserved exactly; fourteen restrained variations replace the four rejected colourful/light directions. This records a preference, not review-board acceptance or deployment.

The owner rejected replacing the colour cards with miniature globes. The original swatch markup, spacing, typography and responsive layout are restored. Cards use only CSS colours and add no image requests, canvas, animation or renderer. Only the full-size atlas has an active canvas. The unused WebP card images are removed. `node scripts/build-sphere-previews.mjs` now refreshes only the gallery thumbnails from the actual globe in both app themes, with no external imagery.

The full circle, square container, current camera, country selection, zoom and wheel containment are retained. Theme switching invalidates the existing canvas; it does not recreate the renderer, load another atlas, add a texture or introduce WebGL. Illustrative terrain uses the original geographic wash positions and radii with different colours. It is not land-cover or demographic classification. A preserves the current normal globe exactly, including light/dark outline contrast.

Files: `src/lib/mission-sphere-themes.ts` (typed palettes), `src/lib/mission-globe.ts` (`setPalette`), `src/components/apologetics/SphereThemePrototype.tsx` and its original CSS (lazy colour-card array), and the `globeDesign` branch in `MuslimWorldExplorer.tsx`. Ordinary URLs use Earth without preview controls. Flat-map colours remain as before; switching back to globe restores the chosen sphere palette. Source data is unchanged.

Gallery bookmarks at `/mockups/muslim-world-spheres/?s=a` redirect to this actual-page preview. Palette selection is a review choice, not owner acceptance or deployment.
