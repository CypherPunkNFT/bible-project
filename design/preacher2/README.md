# Preacher2

Open http://127.0.0.1:8931/mockups/preacher2/.

A separate historical preview, requested October 12, 2026. The current Teachers pages are unchanged.

- Requested point in time: October 11, 2026, noon America/New_York.
- Latest saved commit before that time: `cf1ddd4903539df48badf166d1f10d73921f1ad3`, October 11 at 08:56:43 EDT.
- Original Preachers components, styles, teacher data and site shell are built from that commit, isolated from the current application.
- All ten sections and the original entrance animations are included.
- External sources and the acquired-library service still resolve to their available endpoints; those external datasets are not historical backups.
- Links out of the snapshot open the current site or original source.

Rebuild with `python scripts/build-preacher2-snapshot.py`. The script extracts historical source into the ignored `.local/preacher2-noon-snapshot/` directory and builds only this page into this folder. It does not replace `dist/` or current source.
