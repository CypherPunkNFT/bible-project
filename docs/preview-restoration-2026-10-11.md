# Working preview restoration - October 11, 2026

The working preview at `http://127.0.0.1:8931` was replaced by an older published frontend. The recorded sync source was `.release/study-hover-20261011/site`, commit `4490ebfa6e13f60c1cdb381ec93b34dda0972fde`, at 20:05:25 UTC. This caused the old Apologetics header to appear even though the newer source files remained intact.

## Recovery

- Saved tracked changes, the staged patch, changed source files, the previous index and sync record under `.local/recovery/preview-restore-20261011/` before editing.
- Rebuilt the current working source into `dist/`. No source reset, checkout or rollback was used.
- Removed the post-deployment preview-sync import and call from `deploy-pages-resumable.mjs`.
- Retained `sync-published-preview.mjs` as a guard that rejects old calls before writing any files.
- Corrected the preview startup comment. The pre-existing redirect from port 8941 still points to 8931; no additional user preview was created.

## Verification

Application TypeScript and production build passed. Two guard tests confirm that the retired sync function leaves the preview entry unchanged and that the deployment helper has no sync hook. Desktop and phone browser checks confirmed the five tabs (Explore, Worldviews, Questions, Debates, Sources), newer Questions page, nine debate cards, repeated topic navigation, six mockup directions and the old-port redirect. Screenshots are stored with the recovery snapshot.

## Working rule

`dist/` serves the current working preview. Refresh it by building the current working source. Production deployment must not copy a release package over it. Prepared releases and the public deployment have their own lifecycle; deployment success does not authorize replacing newer local work. A rebuild can still change the shared preview, so coordinate concurrent builds and verify the rendered result before reporting completion.
