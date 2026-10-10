# Worldview color palettes

Local preview: http://localhost:8931/mockups/worldview-colors/

Ten numbered palettes keep Islam teal, vary Secular green, Buddhism orange and Hinduism blue, and include corresponding light-theme colors. Each comparison row reuses the current production `WorldviewNavigation` component. Choosing an icon shows its compact navigation; Show names restores the comparison. View palette updates the larger menu and illustration preview. Its numbered controls also switch palettes. Selection and theme are reflected in `?p=1&theme=dark` for direct links.

`palettes.ts` defines the ten palettes. `build.mjs` adapts the color registry in memory for this bundle only, using palette-specific CSS variables. It extracts the current Islam hero illustration without changing production files. The other three drawings come directly from `WorldviewHeroArt`. The stylesheet uses the current production base CSS from dist, so rebuild this preview after rebuilding production.

Run `node design/worldview-colors/build.mjs`. With localhost:8931 running, `node design/worldview-colors/check.mjs` checks all palettes, both themes, icon destinations, shared color values, palette selection links, no browser errors and no page overflow at 1440, 1024, 768, 390 and 320px. Results and screenshots are saved alongside the preview.

Palette 3 was selected and applied to production menus, index cards and collection pages on 2026-10-10. Its light/dark values are defined in `src/components/apologetics/worldview-colors.css`; navigation and collection artwork share those variables. Islam retains its existing teal. The ten palettes remain available for comparison.
