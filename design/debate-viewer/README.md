# Debate viewer mockups

Local only; the original server remains http://127.0.0.1:8931.

**Selected combination, 2026-10-11:** option 2's video and context area above option 1's transcript desk. This is now the default: http://127.0.0.1:8931/mockups/debate-viewer/?design=combined. Existing panels are reused, keeping chapter selection, search and notes consistent across switches. The two original layouts remain available for comparison.

The duplicate chapter tabs beneath the video have been removed. Chapter selection lives in the transcript outline. Reading areas now use the site's outside-scroll pattern: native slim pill beyond the container border, gutter-free content, scroll position mirrored in both directions and page scrolling continuing at the ends. Checked positioning, scrolling, empty-state hiding and light/dark layouts at 1440px and 390px.

The title header is now compact: desktop title and speaker/event details share one row, without the forced title break or large vertical padding. Full-page review captures include the masthead, title, video, transcript and footer at desktop and phone sizes in both themes. Desktop title area measures 145px; phone 195px.

- Desk: http://127.0.0.1:8931/mockups/debate-viewer/?design=desk
- Room: http://127.0.0.1:8931/mockups/debate-viewer/?design=room

Both designs embed the original recording (YouTube zF5bPI92-5o). There are no start/end restrictions and no autoplay. Switching designs unloads the hidden player to stop background playback.

Both now reproduce the complete owner-supplied transcript: 14,824 words, 95 speaker turns, twelve sections from the welcome through the closing thanks. The Desk uses a continuous chapter reader with outline and notes; the Room uses speaker cards in original speaking order. Both have independent transcript scrolling, global search and an exact original-text download. The former paraphrase walkthrough is replaced by the real text. Existing invented Q&A remains a separately marked thirteenth section and is excluded from transcript search/download.

Canonical source: `content/apologetics/transcripts/lennox-dawkins.txt` and its `index.json` provenance/section record. Run `node scripts/build-debate-viewer.mjs` to regenerate `transcript-data.js`; `--check` verifies freshness and the original SHA-256. `viewer.js` renders this text; the older `simulation.js` is no longer loaded. `god-delusion.js` supplies only the separately labelled exercises to this viewer. No audio alignment is claimed.

Verified all 95 turns in order in both designs at 1440px and 390px, with every rendered word matching the original. Downloads match the original bytes. Search, all twelve sections, separate exercises, design switching/player unloading and light/dark layout checks pass. Mockups are served directly from `design/` by the original preview; no deployment or app rebuild is needed.
