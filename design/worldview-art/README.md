# Worldview illustration comparison

Local URL: http://localhost:8931/mockups/worldview-art/#artifacts

Build from the Website directory with `node design/worldview-art/build.mjs`.
The running preview on port 8931 exposes this design directory. The build copies
the current production base stylesheet; fonts are served from the site assets.

## Artifact review

The current comparison contains ten artifacts each for Hinduism, Buddhism and
Islam, continuing the user's scope that excludes Secular from this illustration
review. The six approved artifacts retain their original drawings and numbers:

| Number | Group | Artifact |
| --- | --- | --- |
| 1 | Hinduism | Oil lamp / diya |
| 3 | Hinduism | Temple bell |
| 5 | Hinduism | Kalash vessel |
| 10 | Buddhism | Alms bowl |
| 14 | Buddhism | Lotus blossom |
| 19 | Islam | Geometric tile |

There are 24 fresh candidates, numbered 21–44. Do not renumber the approved
options when incorporating later user selections. `artifacts-v2.tsx` supplies
the current grouped comparison. `artifacts.tsx` preserves the earlier set of
twenty options as a reference and is not imported by the active page.

Shortlisting new candidates is local to the browser, under the versioned key
`worldview-artifact-shortlist-v2`. An explicit user approval in conversation is
the authority for marking an artifact approved; the shortlist is a review aid.
Museum reference links are available beneath each group.

## Main illustration directions

The nine larger compositions remain below the artifact grids: three each for
Hinduism, Buddhism and Islam. The Hindu temple has a vertical finial rather
than a cross-shaped one, the mosque has expanded architectural details, and
the compositions have no ground ellipses. Dotted rings rotate slowly, with a
pause control and reduced-motion support. Each Buddhist wheel has eight spokes,
and its subtitle mentions the Eightfold Path.

These are local review assets. Production components are not changed by this
comparison build.

## Verification

Verified in headless Edge: 30 cards, exactly ten per group, approved numbers
1/3/5/10/14/19, shortlist toggle and persistence after reload, SVG bounds,
dark/light rendering, compact approval badges, no browser errors, and no
horizontal overflow at widths 1440, 1024, 768, 390 and 320.
