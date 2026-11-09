# Two truths and a lie — implementation

Installed in the actual Website alongside `review-sheet.md`, source code, data, tests and the live registry entry. Recovery on 2026-11-09 verified all 22 implementation files and both documents against job 763's integration-v3 manifest before editing this note.

`/games/two-truths` offers ten solo rounds or a leader-controlled group session with optional two-to-four named teams. The starter deck has 30 people and 150 stored statements. It makes no model calls. Testament filtering is withheld for the 24 OT / 6 NT launch deck.

The source was reimported from job 762's corrected Appendix A, then reviewed against actual local BSB passages. Incomplete citations were expanded and several claims narrowed to the narrated event, including the specific naming of Peter, Samuel's first calling, Ruth's departure with Naomi, Elijah's forty-day flight, Nehemiah's wine service and Lydia's riverside meeting. Occupation claims refer to the specific activity, not unsupported assertions about a person's entire earlier career. Biographical tags and person links appear only after reveal. Question text has semantic topics and symmetric clashes; 154 valid triples are explicitly reviewed and precomputed. The review ledger records a rationale and fingerprint for every statement and valid triple. This is implementation semantic review, not a claim of independent human sign-off.

Evidence uses `useVerses` and `Verse` with explicit `bible: "bsb"` / `bible="bsb"`, BSB captions and `/read/bsb/` context links. Failed loads retain the revealed round and score; Reload evidence remounts the shared helpers to retry. Every revealed lie is struck through and immediately corrected, including recap entries. An unanswered current group round is omitted when finishing early. Sharing contains score and squares only.

All statements require `reviewed: true` and a matching fingerprint in `src/data/two-truths/semantic-review.json` before shipping. Editing wording, citations, topics or clashes invalidates the stored approval. Generated statements have the same gate. The ledger's triple fingerprints must match every currently valid triple. Vetoes and retirement exclude rows; people with fewer than three truths/two lies or no valid triples are excluded, and fewer than ten playable people fails the builder. Never reuse a published statement id.

Build with `node --experimental-strip-types scripts/build-two-truths.ts`; verify both generated JSON and review sheet with the same command plus `--check`. The builder normally writes `docs/features/two-truths/review-sheet.md`. For restricted workers, `--review-sheet ABSOLUTE_PATH` or `TWO_TRUTHS_REVIEW_SHEET` selects a staged review sheet; neither skips verification. `--data-out`, `--source`, `--veto` and `--review` support isolated validation fixtures. Recovery verified the installed review sheet with the normal `--check` command.

Local records keep bounded recent histories, team names and completed-run ids. Session data preserves exact dealt order, picks, revealed state and team toggles. Corrupt phases, stale stamps, invalid triples, premature scores and oversized names are rejected. A completed-run id in the device record prevents duplicate statistics if session persistence lags. Storage failures leave an in-memory game.

The game ships English UI/statements with an honest language notice. Shared games README and translation extraction rules are untouched. Existing UI collection-compatible sentence forms are used so the English build gate retains its normal enforcement. This step does not generate translations or authorize spend.

Focused tests cover local BSB evidence, content/triple approval invalidation, reproducibility, veto/unreviewed exclusions, 3,000 seeded deals and distribution, both-direction truth clashes, exhaustion, confirmation, scoring, score sharing, blocked/corrupt storage, completion idempotency, team reload/toggles, hidden tags, empty/short decks, early group finish and real shared-helper BSB failure/retry on another site language. The hub tests verify the live entry and lazy import.

Statement wording was balanced against the same reviewed facts to remove all advisory mean truth/lie length imbalances. The builder still checks and reports future imbalances. No deployment or push is authorized.

Finishing pass on 2026-11-09 (sequence 31 step 13). Three gaps against the reviewed design were closed. The reveal now marks True and Made up in words and colour (design §8.3): green and red come from the site's own `--resource-life` and `--red-letter` variables in both themes, and the lie's edge is dashed so colour is never the only signal. Sharing no longer borrows Map quest's helper, which was uncommitted work of another chain; `share.ts` has its own share-sheet / clipboard / copy-box fallback with tests. Tests were added for the Made up / True labels, every score band edge and the share fallbacks.

Validation: all 7 feature and hub test files (41 tests) pass, as does feature ESLint and the builder `--check`. The full `npm test` passes content and release tests. Vitest passes 204 of 205 files; the one failure is `src/pages/when-youre/help.test.tsx`, an uncommitted file belonging to another chain's "When you're…" feature. `npm run build` stops at the English build gate on texts in `src/data/when-youre/` and `src/pages/games/verse-completion/`. Both are other chains' uncommitted work, and the gate labels them that way. Every later build step, and `vite build` itself, then ran individually and passed, which refreshed `dist/` and so the 8931 preview. The browser check on 8931 used Edge through Playwright at 1440px and 390px light, and at 320px and 1440px dark. It covered:

- the live hub card;
- confirm-before-reveal;
- coloured reveal labels;
- BSB evidence and context links;
- ten keyboard-played solo rounds and the ten-entry recap;
- named group teams with award persistence across reload;
- early finish.

There were no page errors and no horizontal overflow. Evidence is in job folder `C:/FortressOrchestrator/workspaces/ad846fb858794e17a794f4d067ab1b1e`. No deployment or push.
