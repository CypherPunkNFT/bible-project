# Sphere theme mock-ups

Preview in the existing atlas: http://127.0.0.1:8931/apologetics/worldviews/islam?country=PAK&globeDesign=a#muslim-world . A–F switches only the sphere treatment, beside the current country panel. These are reusable renderer palettes, not a separate recreated page.

| Option | Treatment |
|---|---|
| A · Earth | Existing deep ocean, olive terrain and gold selection |
| B · Midnight | Ink-blue seas, slate land and silver-blue outlines |
| C · Verdigris | Mineral teal seas, patinated green land and brass selection |
| D · Parchment | Sand-coloured water, sage land, sepia lines and russet selection |
| E · Copper | Smoked plum seas, copper terrain and champagne outlines |
| F · Porcelain | Sea-glass water, ivory terrain, blue-grey lines and terracotta selection |

The full circle, square container, current camera, country selection, zoom and wheel containment are retained. Theme switching invalidates the existing canvas; it does not recreate the renderer, load another atlas, add a texture or introduce WebGL. Illustrative terrain uses the original geographic wash positions and radii with different colours. It is not land-cover or demographic classification. A preserves the current normal globe exactly, including light/dark outline contrast.

Files: `src/lib/mission-sphere-themes.ts` (typed palettes), `src/lib/mission-globe.ts` (`setPalette`), `src/components/apologetics/SphereThemePrototype.tsx` and its CSS (lazy preview controls), and the `globeDesign` branch in `MuslimWorldExplorer.tsx`. Ordinary URLs use Earth without preview controls. Flat-map colours remain as before; switching back to globe restores the chosen sphere palette. No source data or external assets were added.

Gallery bookmarks at `/mockups/muslim-world-spheres/?s=a` redirect to this actual-page preview. Palette selection is a review choice, not owner acceptance or deployment.
