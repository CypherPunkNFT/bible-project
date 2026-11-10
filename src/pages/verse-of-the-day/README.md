# Verse of the day for churches

The page **/verse-of-the-day** shows today's verse from the Berean Standard Bible and a builder where a church copies a
few lines of code to show the same verse on its own website. Design: [design.md](../../../docs/features/verse-widget/design.md).
Tools hub entry: `verse-widget` in [registry.ts](../tools/registry.ts).

## The parts

| Part | File |
|---|---|
| The script churches load, hand-written, no build step | [public/widget/v1/verse.js](../../../public/widget/v1/verse.js) |
| The frame page, answered at `/widget/v1/frame` | [public/widget/v1/frame.html](../../../public/widget/v1/frame.html) |
| One small file per date, and the fallback rotation | `public/widget/v1/days/*.json`, [pool.json](../../../public/widget/v1/pool.json) (generated, committed) |
| The fixed days and the ordinary pool, chosen by hand | [curation.ts](../../data/verse-of-the-day/curation.ts) |
| The schedule: which passage each date shows | [schedule.json](../../data/verse-of-the-day/schedule.json) (generated, committed), rules in [schedule.ts](schedule.ts) |
| The build | [scripts/build-verse-of-the-day.ts](../../../scripts/build-verse-of-the-day.ts), bundling [build-inputs.ts](build-inputs.ts) with esbuild |
| The page | [VerseOfTheDayPage.tsx](VerseOfTheDayPage.tsx), [Builder.tsx](Builder.tsx), [Preview.tsx](Preview.tsx), [snippet.ts](snippet.ts), [contrast.ts](contrast.ts) |
| The headers that let other websites read the files | the `/widget/v1/` block in [public/_headers](../../../public/_headers) |

## Rebuilding the schedule (at least once a year)

```
node --experimental-strip-types scripts/build-verse-of-the-day.ts
```

It checks every rule of the curation file, then writes `schedule.json`, the day files and `pool.json` together, and
removes day files more than 30 days old. Days up to 14 days after the build date never change, so a build put live
within two weeks never changes a verse anyone has seen. The schedule runs three years ahead; **`npm test` fails when
fewer than 400 days remain**, which gives more than a year's warning. Past the schedule's end the script carries the
rotation on from `pool.json`, but without Advent and Lent.

To add a verse, add a line at the end of the pool in `curation.ts` and rebuild: new entries join the end of the rotation.
Removing an entry makes the rotation skip it; if that leaves two verses from one book side by side, the data test says so.
Pass `--today YYYY-MM-DD` to build as of another date.

Putting it live needs a **full release**, not the quick one: the quick release refuses changes to `src/lib/page-head.ts`.

## The `v1` promise

Snippets stay pasted on church websites for years. Every address under `/widget/v1/` keeps working with the same options
for as long as the site exists; a change that would break an old snippet ships as `/widget/v2/` beside it. A test checks
the four addresses exist and that `verse.js` still knows every option.

## Cost

Every request a church's page makes is for a static file, which Cloudflare serves without charge or limit. None of the
widget's paths may be added to `run_worker_first` or `public/_routes.json`. **If "Workers caching" is ever switched on
for the site, cached static files become billable**, and this line must be revisited.

## Privacy rules for anyone adding analytics

The page promises: no cookies, no tracking, nothing from other companies, and no record of which websites show the
verse. The script uses `credentials: "omit"` and sends no referrer. If Cloudflare Web Analytics or Workers Logs is ever
switched on, leave the `/widget/v1/` paths out of it and review the page's privacy section and the privacy policy line.

## Checked in a browser (2026-11-10, sequence 32 step 13)

In Chromium, against the always-on preview at 127.0.0.1:8931, with a pretend church page answered by the test and the
`public/_headers` widget block added to the preview's answers:

- `/verse-of-the-day` answers 200 at 320px and 1280px, shows today's verse through the real script, links "Read the
  chapter", and does not scroll sideways. `/widget/v1/frame` answers 200 directly, with no redirect.
- On a white page and a dark page, in light and dark device settings, at 320px and 1280px: the default script embed,
  the card, and the frame in plain, card, compact and compact card all draw today's verse. The frames run with an
  opaque origin (sandboxed, no `allow-same-origin`) under the frame's Content Security Policy, with no console errors.
- With the longest scheduled day (Deuteronomy 8:3) every frame at its recommended height shows the whole verse.
  The first heights (270 card, 170 / 200 compact) cut it off at 320px; they are now 280, 200 and 260 (design 5.4).
- With the day file and pool.json failing to load, every embed keeps its two fallback links.
- Not checked in the browser: the missing-CORS case. Playwright adds `Access-Control-Allow-Origin` to any answer it
  fakes, so that run proved nothing; [snippet.test.ts](snippet.test.ts) checks the header lines instead.

## Notes

- A second copy of the script on a page only looks for divs not yet drawn, so pasting the snippet twice costs nothing.
- The page's own previews carry `data-bibleguide-manual`, so the script's scan leaves them to [Preview.tsx](Preview.tsx).
- `verse.js` must stay under 16 KB with its comments (a test checks it).
