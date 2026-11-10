# Verse of the day for churches: research and design

**Feature:** entry 3 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md), "Verse-of-the-day widget: an embeddable widget churches can put on their own websites, linking back to the site."
**Step:** research and design (step 11 of sequence 32, "Bible Guide chain C"); reviewed once in step 12, with the corrections applied in place and listed in a Review section at the end. Implementation is step 13.
**Rules followed:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), the site's [AGENTS.md](../../../AGENTS.md), the [doctrinal foundation](../../../../DOCTRINAL-FOUNDATION.md) (Berean Standard Bible everywhere) and the sources register [SOURCES.md](../../../SOURCES.md).
**Tools hub entry:** already present as `verse-widget`, "Verse of the day for churches", status `coming-soon`, in [registry.ts](../../../src/pages/tools/registry.ts).
**Date:** 2026-11-09.

## 1. What we are building, in one paragraph

A page on Bible Guide, **/verse-of-the-day**, shows today's verse from the Berean Standard Bible and, below it, a short builder where a church chooses how the verse should look on its own website and copies a few lines of code to paste there. Pasted into a church's site, those lines show the same verse of the day, in the church's own fonts and colours if it wants, with the reference linking to the verse in Bible Guide's reader and a small "Bible Guide" credit linking back to the site. Everyone gets the same verse on the same calendar date; it changes at the visitor's own midnight. In Advent and Lent the verse is that day's verse from the site's [Countdowns](../countdowns/design.md), with a line linking to the day's reading (so Christmas, Good Friday and Easter carry those days' verses), and New Year's Day and Pentecost have fixed verses of their own. Every verse is chosen once, ahead of time, and stored in small files the site already hosts, so the widget costs nothing to run however many churches use it. It sets no cookies, keeps no record of who sees it, calls no other company and asks for no sign-up.

## 2. Research

### 2.1 What churches can already paste in

Free verse-of-the-day widgets have existed for twenty years. The current ones fall into three patterns:

| Service | How it is embedded | Styling | Privacy | Translation |
|---|---|---|---|---|
| [DailyVerses.net](https://dailyverses.net/website) | An empty `<div id="dailyVersesWrapper">` and an async `<script>` that fills it | The church writes its own CSS against `.dailyVerses.bibleVerse` | No statement on the embed page | ESV, KJV, NASB, NIV, NKJV, NLT and others, picked with `?language=` |
| [BibleGateway](https://www.biblegateway.com/usage/) | Copy the "HTML code" for a chosen version; WordPress plugin `[biblevotd]` | Little; it takes on the host page's styles | BibleGateway is ad-supported | Many versions |
| [BibleWindow](https://biblewindow.com/widget) | A `<div class="biblewindow-votd">` **holding two ordinary links** (a fallback), plus an async script that renders into a **Shadow DOM** so the church's styles and the widget's cannot clash | `data-theme="light"`, `"auto"` (follows the device), dark by default; `data-verse` pins one verse | "No account, no cookies, does not track your visitors"; the credit link must stay visible | KJV |
| Christ.com and other older widgets | A script that calls `document.write` | None | None stated | KJV, NIV |
| WordPress plugins (BibleGateway VOTD, Verse of the Day Widget for WP) | A plugin that fetches the verse server-side once a day | The theme's | Varies | Varies |

What the good ones share, and this design keeps: a few lines to paste, no account, the verse changing by itself every day, and a visible credit link. What none of them offers, and Bible Guide can: a modern translation that is free to quote at length (the BSB is in the public domain), a reference that opens the whole chapter in a clean reader instead of an ad page, the church year (Advent, Lent, Easter) followed automatically, and a plain promise about privacy that a church can repeat to its members.

BibleWindow's pattern is the best of these and is the starting point here: the snippet **works with no script at all** (the two links show), the rendering is isolated in a Shadow DOM, and the options are a handful of `data-` attributes.

### 2.2 What church websites allow

A church's website is usually built on a general site builder or a church platform. What each lets an editor paste decides the embed method:

| Platform | Scripts | Iframes | Source |
|---|---|---|---|
| **WordPress, self-hosted** | Yes, in a Custom HTML block, for administrators and editors; contributors' posts have `<script>` and `<iframe>` stripped (`wp_kses`) | Yes, same rule | [WordPress Custom HTML](https://wordpress.org/documentation/article/custom-html/) |
| **WordPress.com** | Only on a paid plan with hosting features switched on (installing one plugin turns them on); stripped on the free plan | Same | [WordPress.com Custom HTML block](https://wordpress.com/support/wordpress-editor/blocks/custom-html-block/) |
| **Squarespace** | Code block in HTML mode, on Core, Plus or Advanced (the older Business and Commerce plans too); Personal plans do not run scripts or iframes, Markdown blocks strip scripts | Same | [Squarespace code blocks](https://support.squarespace.com/hc/en-us/articles/206543167-Code-blocks) |
| **Wix** | "Embed code, Embed HTML" runs the code **inside its own sandboxed iframe** on a `filesusr.com` address, with a fixed height set in the editor | That is how all custom code runs | [Wix HTML iframe element](https://dev.wix.com/docs/develop-websites/articles/wix-editor-elements/other-elements/html-i-frame-element/working-with-the-html-iframe-element) |
| **Church platforms** (Subsplash, Nucleus, The Church Co, Clover, Tithe.ly Sites, ChurchSpring, Ekklesia360) | A "custom code" or embed block; Nucleus's own embeddable launcher lists all of these as accepting custom code | Generally yes | [Nucleus Launcher](https://www.nucleus.church/the-launcher), [church builder survey](https://theleadpastor.com/tools/best-church-website-builder/) |

So: most church sites can run a script; a sizeable minority can run only an iframe; and some (free WordPress.com, Squarespace Personal) can run neither and can only show a link. A design that offers all three, from one builder, serves every church.

### 2.3 Script or iframe

| | Script into a Shadow DOM (recommended) | Iframe (offered as the second choice) |
|---|---|---|
| **Height** | Grows to fit the verse, whatever its length | Fixed; long verses must be fitted in (section 5.4) |
| **Fonts** | Can take the church's own font and text colour, so it looks like part of their page | Cannot see the church's styles; uses its own fonts |
| **Isolation** | The Shadow DOM keeps the church's CSS out and ours in, but our script runs on their page | Complete: nothing of ours runs on their page |
| **Trust the church must give** | They run 4–6 KB of our JavaScript. It is small, readable, has no dependencies and never loads anything else | None beyond showing a frame |
| **Link back** | The credit is a real link in the church's own page, and so counts as a link to bibleguide.io for search engines | A link inside a frame belongs to the frame's page, so it gives no search credit |
| **Works with no script** | Yes: the snippet's two plain links show if the script is blocked or fails | The frame shows nothing if its own script fails, so the frame's page carries the same two links as its fallback |
| **Wix** | Runs, but inside Wix's iframe, so it behaves like the iframe option | Runs |
| **Free WordPress.com, Squarespace Personal** | Stripped | Stripped |

**Decision:** the builder's first tab is the script snippet; the second tab, "If your website does not allow scripts", is the iframe; the third, "Just a link", is a plain text link for sites that allow neither. All three show the same verse and link to the same places.

### 2.4 Linking back without breaking Google's rules

Google's spam policies name "keyword-rich, hidden, or low-quality links embedded in widgets that are distributed across various sites" as link spam ([Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)). So the widget's links are **visible**, carry **plain names** (the verse reference, such as "John 3:16 (BSB)", and the site's name, "Bible Guide"), and are never hidden or stuffed with phrases like "free Bible verses online". They carry no `rel="nofollow"` by default; if Google ever treated them as a problem, adding that one attribute in the script would change every widget at once, with no church needing to repaste anything.

### 2.5 Hosting facts that shape the design

Checked in the code and on the live site on 2026-11-09:

- bibleguide.io is a Cloudflare Worker with static files (`assets.directory` of the release) and `not_found_handling: "single-page-application"`; only the paths in [public/_routes.json](../../../public/_routes.json) plus `/atlas-tiles/*` and `/circles/*` run the Worker's code first ([prepare-testimonies-release.ts](../../../scripts/prepare-testimonies-release.ts), lines 126–132).
- **Cloudflare charges nothing for requests that are answered with a static file, without limit**; only requests that run the Worker's code are billed (10 million a month included in the $5 plan the owner already pays, then $0.30 per million) ([static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)). The one exception: if "Workers caching" is ever switched on, cached static responses are billed too.
- Headers for static files come from [public/_headers](../../../public/_headers), which Workers honours (up to 100 rules, today about 20) ([Workers headers](https://developers.cloudflare.com/workers/static-assets/headers/)). `/atlas-tiles/*` already sends `Access-Control-Allow-Origin: *`, the precedent for letting other websites read a file. Only `/testimonies*` forbids framing (`X-Frame-Options: DENY`); nothing site-wide does.
- **A file that does not exist is answered with the site's page, status 200, as HTML** (tried live: `https://bibleguide.io/widget/v1/days/2026-11-09.json` returned `200 text/html`). The widget must therefore check that what it got is JSON, not trust the status.
- The live site sets **no cookies** on its pages (no `Set-Cookie` on `/` or `/random-verse`) and its page shell loads **no analytics** ([index.html](../../../index.html)).

### 2.6 What the site already has that we reuse

| Need | Existing piece | Where |
|---|---|---|
| A list of well-known verses that read on their own | The 234 hand-chosen verses in Random verse's seventeen themes, already checked to exist in the BSB and to start a sentence | [themes.ts](../../../src/pages/random-verse/themes.ts), [pick.test.ts](../../../src/pages/random-verse/pick.test.ts) |
| Advent and Lent day verses, with their dates computed every year | Each countdown day's `card` passage (240 characters or fewer) and its permanent day key; 29 Advent and 47 Lent days | [src/data/countdowns/](../../../src/data/countdowns/), [season.ts](../../../src/pages/countdowns/season.ts) |
| Easter and other church dates, local-date arithmetic safe across daylight-saving changes | `easterSunday`, `sundayOnOrAfter`, `dayNumber`, `fromDayNumber`, `today`, `parseDateKey`, with no imports so a build script can load it | [calendar.ts](../../../src/pages/countdowns/calendar.ts) |
| Passages as verse ids, their reference text ("Psalm 130:5") and tidied words (unpartnered quotation marks dropped, "…" where a passage stops mid-sentence) | `p()`, `passageReference`, `tidyPassageText`, `assemblePassage` | [life-events/types.ts](../../../src/data/life-events/types.ts), [passage.ts](../../../src/pages/life-events/passage.ts) |
| The BSB's text | `data/plain/bsb/<BOOK>.json` (one file per book) for the build; the reader's chapter files for the site | [data/plain/bsb/](../../../data/plain/bsb/) |
| A link to a verse in the reader, shaded | `/read/bsb/<BOOK>/<chapter>?hl=<verse>` | [VerseCard.tsx](../../../src/pages/random-verse/VerseCard.tsx) |
| "Copy" with a "Copied" status and a hand-copy box where copying is refused | Random verse's and Countdowns' church panel pattern | [RandomVersePage.tsx](../../../src/pages/random-verse/RandomVersePage.tsx), [ChurchPanel.tsx](../../../src/pages/countdowns/ChurchPanel.tsx) |
| A daily schedule fixed ahead of time, with days already seen never changing | Bible Wordle's `daily.json` with `builtOn` and frozen days | [bible-wordle/design.md](../bible-wordle/design.md) section 6 |

The Countdowns design already expects this: its table of neighbouring features says "in Advent and Lent the widget could show the countdown's reading for the day" ([countdowns design](../countdowns/design.md), section 2.8).

### 2.7 Neighbouring features: who covers what

| Need | Covered by |
|---|---|
| A verse that changes daily, on a church's website | **This feature** |
| A random verse on demand, on Bible Guide | [Random verse](../../../src/pages/random-verse/README.md) |
| A good-looking picture of a verse to post on social media | Shareable verse cards (approved idea 4, steps 14–16 of this sequence). Later, the verse-of-the-day page can offer "Make a card of today's verse" using that generator; nothing is built for it here. |
| One verse for each date of the year, to send on a birthday | Birthday verses (approved idea 5, steps 17–19). That list is fixed per calendar date; this one rotates year to year (section 4), so the two never have to match and are kept as separate lists. |
| A month of readings for Advent or Lent | [Countdowns](../countdowns/design.md); this widget points into it during those seasons |

## 3. The embed

### 3.1 Addresses, all static files under one versioned folder

Everything a church's page loads lives under **`/widget/v1/`** on bibleguide.io:

| Address | What it is |
|---|---|
| `/widget/v1/verse.js` | The script (section 3.3). Hand-written, plain JavaScript (ES2017), no build step, no dependencies, 4–6 KB before compression. |
| `/widget/v1/days/YYYY-MM-DD.json` | One small file per date with that day's verse (section 4.5), for about three years ahead. |
| `/widget/v1/pool.json` | Every ordinary verse in schedule order, read only when a day file is missing (section 4.4). |
| `/widget/v1/frame/` | The iframe page: a tiny HTML page that loads `verse.js` and renders into itself (section 3.4). |

**`v1` is a promise.** Snippets stay pasted on church websites for years and nobody will come back to update them. Every address in `v1` keeps working with the same options for as long as the site exists: a change that would break an old snippet ships as `/widget/v2/` beside it. A test checks that the four `v1` addresses exist in `public/` and that the options section 5.1 lists are all still understood (section 10).

None of these paths may be added to `run_worker_first` or `_routes.json`: they must stay plain static files, which is what makes them free (section 6).

### 3.2 The snippets the builder writes

**Script (first tab, recommended):**

```html
<div class="bibleguide-verse" data-style="card" data-theme="auto">
  <a href="https://bibleguide.io/verse-of-the-day">Today's Bible verse</a>
  from <a href="https://bibleguide.io/">Bible Guide</a>
</div>
<script src="https://bibleguide.io/widget/v1/verse.js" async referrerpolicy="no-referrer"></script>
```

Only the `data-` attributes the church changed from the defaults are written, so the default snippet is as short as possible. The two links inside the `div` are the fallback: they are what shows if the script is blocked, fails or never loads, so a broken widget is never a blank hole on the church's page.

**Iframe (second tab, "If your website does not allow scripts"):**

```html
<iframe src="https://bibleguide.io/widget/v1/frame/?style=card&theme=auto"
  title="Bible verse of the day from Bible Guide" width="100%" height="240"
  style="border:0;max-width:640px" loading="lazy" referrerpolicy="no-referrer"
  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>
```

The same options as query parameters. `sandbox` gives the frame only what it needs: to run its own script and open links in a new tab. Without `allow-same-origin` the frame cannot read anything of the church's page, nor its own cookies (there are none). The `height` is the builder's recommendation for the chosen size (section 5.4).

**Just a link (third tab, for sites that allow neither):** the same two links as plain HTML, and the address as plain text for builders that only take a link: `Today's Bible verse: https://bibleguide.io/verse-of-the-day`.

### 3.3 What the script does

1. **Once per page.** A global guard (`window.__bibleGuideVerse`) makes a second copy of the script do nothing, so a church that pastes two widgets with two `<script>` lines does not double the work.
2. **Finds every `div.bibleguide-verse`** not yet marked as done, when the document is ready (it is `async`, so it may run before or after the page has finished loading). Two widgets on one page both render; they share one fetch.
3. **Works out today** from the device's local year, month and day, exactly as Countdowns' `today()` does: "today" is the visitor's own date and changes at their midnight (section 11 on time zones).
4. **Fetches** `/widget/v1/days/<today>.json` with `fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" })`. It checks that the answer is `200`, that its `Content-Type` is JSON, and that it parses and passes the shape check of section 4.5 (types, lengths, a reference that matches its pattern, links that start with `/read/` or `/countdowns/`). Anything else is treated as missing.
5. **If missing**, it fetches `/widget/v1/pool.json` and picks the verse for today by the same rule the build uses past its last day (section 4.4). If that fails too, it leaves the fallback links alone and stops. It never throws into the church's page: everything is inside one `try`, and errors are not logged to the console either, since the church cannot act on them.
6. **Renders** into a Shadow DOM attached to the `div` (open mode), replacing the visible fallback with the verse (section 5.2). All text is set with `textContent`; no HTML from any file is ever parsed, and nothing is evaluated.
7. **Keeps current**: on `visibilitychange` to visible, if the local date has changed since it rendered, it fetches and renders the new day. No timers run while the page is hidden.

What it never does: load another script, font, image or stylesheet; read or write cookies, `localStorage` or `sessionStorage`; read anything from the church's page except the attributes of its own `div` and the inherited font and colour; send anything anywhere except the one or two file requests above.

### 3.4 The iframe page

`public/widget/v1/frame/index.html`: a static page with `lang="en"`, `<meta name="robots" content="noindex">`, the same two fallback links inside a `div.bibleguide-verse`, and `<script src="/widget/v1/verse.js">`. The script sees it is inside the frame page (a `data-frame` attribute on the `div`) and reads its options from the page's query string instead of `data-` attributes, with the same validation. Two differences from the script embed:

- "Your website's font" is not available (a frame cannot see the parent's styles), so the builder hides that option on the iframe tab and the frame uses the serif or sans choice.
- Plain style keeps the frame transparent. The page sets `color-scheme` to match the chosen theme on the root only when the card style is used: browsers paint an opaque background behind a frame whose colour scheme differs from its parent's, which would put a white box on a dark church page.

Its headers (section 6.3) give it a strict Content Security Policy, since it is a page on bibleguide.io that anyone may frame.

The exact address the static host answers without a redirect (`/widget/v1/frame/` from a folder's `index.html`, given `html_handling: "auto-trailing-slash"`) is checked on the preview at 127.0.0.1:8931 in the implementation step and written into the builder, so no snippet ever starts with a redirect.

## 4. Choosing the verse for each day

### 4.1 The rule, in order

For each date, the build script takes the first of these that applies:

1. **A countdown day.** If the date falls in this year's Advent run (Advent Sunday to Christmas Day, 22 to 29 days) or Lent run (Ash Wednesday to Easter Day, 47 days), the verse is that countdown day's `card` passage, and the day file carries a season line linking to the day's reading ("Day 14 of Advent · Read today's reading", to `/countdowns/advent/dec-12`). The dates come from the countdowns' own occasion data and [season.ts](../../../src/pages/countdowns/season.ts), so the widget and the Countdowns pages can never disagree about which day it is. Christmas Day, Good Friday and Easter Day are countdown days, so they already have fitting verses.
2. **A fixed day** outside those runs, from a short list in the curation file: **New Year's Day** (for example Lamentations 3:22–23) and **Pentecost** (Easter + 49 days; for example Acts 2:4 or Acts 2:38). The list is small on purpose: the Baptist Faith and Message says nothing about a church calendar, and the site's Countdowns design keeps to Scripture only, Western dates and no saints' days ([countdowns design](../countdowns/design.md), section 2.4). The same rules apply here.
3. **The ordinary pool**, in a fixed order (4.3).

### 4.2 The ordinary pool

A hand-chosen list of single verses or short passages, in `src/data/verse-of-the-day/curation.ts`, written with the life-event packs' `p()` helper so every entry is a verse id, never copied words.

- **Size:** at least **320** entries. A year has about 290 ordinary days once Advent, Lent and the fixed days are taken, so no ordinary verse repeats within a year.
- **Starting point:** the 234 verses of Random verse's themes, which were chosen by hand and already pass the "exists in the BSB and starts a sentence" checks. The implementation step keeps those that meet the rules below and adds about 100 more by hand, from books the themes under-use (Genesis, the Prophets, the Gospels' narratives, Acts, the shorter letters), recording each addition's reason in a one-line note beside it, as the countdown cards do.
- **Rules for an entry** (all checked by tests except the last two):
  - inside one chapter, at most three verses;
  - **220 characters or fewer** after tidying, so the fixed-height frame fits every ordinary verse (countdown cards keep their own limit of 240, which section 5.4 also fits);
  - starts a sentence, so it reads on its own;
  - not also used as a countdown card or a fixed-day verse, so the seasons' verses stay special;
  - no more than about a quarter of the pool from Psalms and Proverbs together, and at least 40% from the New Testament, so the year is not lopsided;
  - its plain words on their own say something the passage itself says. A verse that only means what it seems to mean in its setting (a promise made to one person, or to Israel in exile, read as a promise to every reader) is left out, or included only as part of a short passage that carries its setting. The site's voice follows the [doctrinal foundation](../../../../DOCTRINAL-FOUNDATION.md); the widget adds no comment of its own, so the choice of verse is the whole of its teaching.
- **No runtime model and no batch.** The list is short enough to choose by hand in the implementation step; no paid model is needed, and the feature build rules' "generated once, stored" is met by the stored list itself.

### 4.3 The order: a schedule, fixed ahead and frozen

As Bible Wordle does with its words, the build script writes a **schedule** once and keeps it, rather than computing the verse from a formula when someone views it:

- `src/data/verse-of-the-day/schedule.json`: `{ epoch, builtOn, frozenThrough, seed, poolOrder: [...], days: { "2026-11-09": "<passage key>", ... } }`.
- **Pool order:** a shuffle of the pool made once with a recorded seed, then kept. Entries added later go to the end; removed entries are skipped. Two consecutive ordinary days never come from the same book (the order is adjusted by swapping neighbours until this holds, the same way every run).
- **Days:** each ordinary day takes the next entry in the pool order, cycling; seasonal and fixed days do not use up pool entries.
- **Frozen days:** every day up to **14 days after the build date** is copied unchanged from the existing schedule and never altered (Wordle's margin, for the same reason: building and putting the site live are separate manual steps). A church member who saw Tuesday's verse on Tuesday must not find a different one under Tuesday's date the next week.
- **Horizon:** the schedule runs from the day before the build date to **three years** after it, about 1,100 days. Starting a day early covers visitors whose date is behind the build machine's.

### 4.4 Past the end of the schedule

If the site goes more than three years without a rebuild, or a day file is missing for any reason, the script falls back to `pool.json`, which holds every ordinary entry already in schedule order with its words and reference, plus the schedule's last date and the pool position after it. The script takes entry `(position after the last scheduled day + days since that day − 1) mod pool length`, so the rotation carries on where the schedule stopped. Seasons are not followed in this fallback; that is the one thing a church loses if the site is never rebuilt. The README tells whoever runs releases to rebuild the schedule at least once a year, and a check in `npm test` fails when fewer than 400 days remain after today, which gives more than a year's warning.

### 4.5 What a day file holds

`public/widget/v1/days/2026-12-12.json`, about 400 bytes (the words here are illustrative; the build copies the BSB's):

```json
{
  "v": 1,
  "date": "2026-12-12",
  "text": "Then a shoot will spring up from the stump of Jesse, and a branch from his roots will bear fruit.",
  "reference": "Isaiah 11:1",
  "translation": "BSB",
  "read": "/read/bsb/ISA/11?hl=1",
  "season": { "label": "Day 14 of Advent", "link": "/countdowns/advent/dec-12", "linkText": "Read today's reading" }
}
```

- `text` is the tidied BSB wording (`assemblePassage`, then `tidyPassageText`), the same words the Countdowns pages and the cards show.
- `reference` comes from `passageReference`: "Psalm 130:5", "1 Corinthians 13:4–7".
- `read` opens the reader at the first verse of the passage, shaded.
- `season` is `null` on ordinary and fixed days. Its label counts days as the Countdowns page does.
- Links are site-relative, so the files name no host. The script prefixes them, and its file requests, with **the origin it was itself loaded from** (read from `document.currentScript.src` while it first runs; `https://bibleguide.io` if that is unavailable). On bibleguide.io that is the live site; on the preview at 127.0.0.1:8931 it is the preview, so the builder's live preview reads local files and links stay local.

The script's shape check accepts only these keys with these types, `text` up to 400 characters, `reference` matching a book, chapter and verse pattern, and links matching `^/(read|countdowns)/[A-Za-z0-9/?=._-]+$`.

### 4.6 The build script

`scripts/build-verse-of-the-day.ts`, run by hand with `node --experimental-strip-types` (like `build-wordle.ts`), not in `prebuild`. It reads the curation file, the countdown occasions, the calendar module, `data/plain/bsb` and the existing `schedule.json`; checks every rule in 4.2 and every countdown card's length; then, only if every check passes, writes `schedule.json`, all the day files and `pool.json`, and removes day files dated more than 30 days before the build. Writing everything together, only after the checks, means a failed run changes nothing. It prints the number of days written, the first and last date, and how many ordinary entries remain before the pool cycles.

The day files are committed with the schedule, so the release carries exactly what the tests checked: about 1,100 files of 400 bytes, a little under half a megabyte, or about 1% of the room under Cloudflare's 100,000-file limit (the release is about 43,800 files today).

## 5. How it looks, and what a church can change

### 5.1 The options

Seven choices, each with a safe default, so the default snippet carries no options at all. The same names work as `data-` attributes (script) and query parameters (iframe).

| Option | Values (default first) | What it does |
|---|---|---|
| `style` | `plain`, `card` | **Plain** has no box: a transparent background, the church page's own text colour, a thin rule above the credit. It sits in a sidebar or footer as if the church had typed it. **Card** has its own background, padding, a 1px border and rounded corners, for a page section of its own. |
| `theme` | `auto`, `light`, `dark` | The card's colours, or the visitor's device setting (`prefers-color-scheme`). The plain style in the script embed ignores it and takes the page's own colours; the plain style in the iframe cannot see the page, so there `theme` sets its text colour (dark text for `light`, light text for `dark`), and the builder asks for it. |
| `accent` | none, or a colour `#rgb` / `#rrggbb` | The colour of the reference and the links. With none, links take the text colour, underlined. The value must match `^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$` or it is ignored; it is set only as a CSS custom property, never pasted into a stylesheet. |
| `font` | `site`, `serif`, `sans` | **Site** inherits the church page's font (font properties pass into a Shadow DOM by inheritance). **Serif** and **sans** use system font stacks (Georgia, "Times New Roman" / system-ui, "Segoe UI", Roboto), so no font file is ever downloaded. The iframe has no `site` and defaults to `serif`. |
| `size` | `standard`, `compact` | **Standard** shows the heading, the date, the verse, the reference, the season line in Advent and Lent, and the credit. **Compact** shows the verse, the reference and the credit on fewer lines, for a narrow sidebar. |
| `heading` | `verse-of-the-day`, `todays-verse`, `none` | "Verse of the day", "Today's verse", or no heading. Fixed choices, not free text: a page on bibleguide.io (the frame) must never be made to show words someone typed into a link. |
| `align` | `start`, `center` | Text alignment. `start` follows the page's direction. |

Anything not in the table, or a value not listed, is ignored and the default used. Unknown attributes never cause an error, so a later version can add options that an old script simply skips.

### 5.2 What it shows

Inside the Shadow DOM, a `<figure lang="en">` holding, in order:

1. the heading (standard size, unless `none`), small and in capitals with letter spacing, like the site's section kickers;
2. the date in the visitor's own format (`Intl.DateTimeFormat` with the page's language if it has one, otherwise the browser's, month and day only: "Monday 9 November" or "Monday, November 9"), standard size only;
3. the verse in a `<blockquote translate="no">`: the BSB's words, at 1.15–1.25 times the surrounding text size, the line length capped at about 60 characters on wide containers;
4. a `<figcaption>`: the reference as a link ("John 3:16 (BSB)") to the reader at that verse, opening in a new tab;
5. in Advent and Lent, the season line: "Day 14 of Advent · Read today's reading", the second half a link to the countdown day;
6. the credit, small: "Bible Guide", linking to `https://bibleguide.io/verse-of-the-day`, so a church member who clicks lands on a page that shows the verse, the whole chapter one click away, and the builder for their own church.

All links open in a new tab with `rel="noopener"` and carry no tracking parameters. Link text is the reference and the site's name only (section 2.4).

No pictures, no animation, no glow and no drop shadow, in keeping with the site's [approved design sections](../../../design/README.md); the card style is a quiet surface with a hairline border, not a decorated box. The verse fades in over 150 ms only when the visitor has not asked for reduced motion; otherwise it simply appears.

### 5.3 Fitting any page

- **Width:** the widget fills its container. Below 260px it switches to compact layout by itself, whatever was chosen; above 640px the verse's line length stops growing and the text sits at the chosen alignment.
- **Colours:** card light uses the site's paper and ink colours; card dark its dark surface; both pass WCAG AA contrast (4.5:1 for text) with the default accent and are checked by a test. When a church picks an accent, the builder warns ("This colour is hard to read on a light card") if it falls below 4.5:1 against the card, and the plain style warns only that the preview is the place to check.
- **Right-to-left pages:** the widget sets `dir="ltr"` on the verse and reference, since they are English, and leaves the church page's own direction alone.
- **Print:** the widget prints as it shows; the links print as their text.

### 5.4 The iframe's fixed height

An iframe cannot grow to fit its content unless the church's page runs a script to resize it, which defeats the point of the iframe option. So:

- The builder recommends a height for the chosen size and width: about **240px** for standard and **170px** for compact at 320px or wider, worked out once in the implementation step by rendering the **longest verse the schedule holds** (an ordinary entry of up to 220 characters or a countdown card of up to 240) at 280px wide, plus a small margin. The recommended number is written into the snippet.
- Inside the frame, if the content still overflows (a much narrower column than expected, a large default font), the script steps the verse's font size down by 6% at a time, to no smaller than 14px, until it fits. It never shows a scroll bar. If it still cannot fit at 14px, the season line and the date are dropped before the verse is ever cut.
- On Wix, whose "Embed HTML" element is itself an iframe of fixed height, the builder's Wix instructions give the same recommended height.

## 6. Caching on Cloudflare, and the cost at scale

### 6.1 Why it is free

Every request a church's page makes is for a **static file**: the script, a day file, rarely the pool file, and for the iframe its page. Cloudflare serves static files on Workers **without charge and without a request limit**; only requests that run the Worker's code are billed (section 2.5). None of the widget's paths run the Worker's code, so:

| Widget loads a month | Requests (script + day file, before browser caching) | Cost if static (this design) | Cost if each went through the Worker's code |
|---|---|---|---|
| 100,000 (about 50 small churches) | 200,000 | $0 | $0, inside the 10 million included |
| 2 million (about 1,000 churches at 2,000 page views each) | 4 million | $0 | $0, inside the included 10 million |
| 50 million | 100 million | $0 | about $27 a month ((100 − 10) million × $0.30) plus CPU time |
| 500 million | 1 billion | $0 | about $297 a month |

Cloudflare does not bill for data sent either. The owner's existing $5-a-month Workers plan is the only spend, and it is already paid for the site. **This design adds no cost and no new cloud service.** The one way it could start costing money is if someone later switches on "Workers caching" for the site, which makes cached static files billable; the README for the widget says so next to the cost line.

### 6.2 How much each visitor downloads

- `verse.js`: about 5 KB, about 2 KB compressed (Cloudflare compresses text files with Brotli or gzip by itself).
- A day file: about 400 bytes.
- The pool file, only when a day file is missing: about 80 KB, about 25 KB compressed.

A church visitor who reads five pages in a visit downloads the script and the day file once, then reads both from the browser's cache.

### 6.3 Headers, added to `public/_headers`

Three rules, added to the existing file with an edit (it is a shared file):

```
# The verse-of-the-day widget (docs/features/verse-widget/design.md 6.3): read by other websites, so open to all
# origins, cached a day, and never sending a cookie or a referrer.
/widget/v1/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
/widget/v1/frame/*
  ! Cache-Control
  Cache-Control: public, max-age=3600
  Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none'
  X-Robots-Tag: noindex
```

- **One day** for the script and the day files: a fix to the script reaches every church within a day, and a day file never changes once published (4.3), so a day is plenty. `stale-while-revalidate` lets a browser show its cached copy at once while it checks for a newer one. Revalidation answers `304` from the file's `ETag`, which Cloudflare sets by itself.
- **An hour** for the frame page, so a correction to it shows quickly.
- **No `X-Frame-Options`** on the frame, on purpose: it exists to be framed. Its CSP stops it loading anything not from bibleguide.io. (`style-src 'unsafe-inline'` is needed only because the script sets styles inside its Shadow DOM; if the implementation uses a constructed stylesheet instead, drop it.)
- **Checked in a real browser in the implementation step, not assumed:** that `/widget/v1/frame/*` also matches the bare `/widget/v1/frame/` address, and that the frame's script and fetch pass its CSP while it runs sandboxed without `allow-same-origin` (its requests then come from an opaque origin, which the `*` above allows). If either does not hold, the rule is adjusted and the change written into this section.
- `Access-Control-Allow-Origin: *` with no credentials is safe: the files are public and carry nothing private. `X-Content-Type-Options: nosniff` makes browsers refuse to run the script if it were ever served as anything but JavaScript.

Because a missing file is answered with the site's HTML page and status 200 (section 2.5), the `nosniff` header and the script's own JSON check (3.3, step 4) are what stop a missing day file from being misread.

### 6.4 Nothing in the Worker

No Worker code, no database, no KV store and no scheduled job. The verse changes at midnight because the visitor's browser asks for a different file, not because anything on the server runs.

## 7. The page where churches get the snippet

### 7.1 Address and entry points

- **`/verse-of-the-day`**, routed in `src/App.tsx` like the other tools, lazy-loaded.
- The tools hub entry `verse-widget` becomes `status: "live", path: "/verse-of-the-day"` (its title, "Verse of the day for churches", and its card picture are already there). That is its nav entry; no new header tab.
- Search title in `ROUTE_TITLES`: **"Bible Verse of the Day: Today's Verse, and a Free Widget for Church Websites"**. One address serves both searches people make, "verse of the day" (someone wanting today's verse) and "verse of the day widget" (a church wanting the code), and every widget's credit link points to it.
- The widget's credit links here, so the page is also where a church member lands from their church's website.

### 7.2 Top to bottom

1. **Today's verse**, large: the real widget, rendered by the real `verse.js` from the day file (same origin, so no special case), in the site's own font and the card style. Under it: "Read the chapter" (the reader link) and, in Advent and Lent, the season line. The date shown is the visitor's own; the page says nothing about today until the browser has worked it out, so the search engines' ready-made copy of the page never names a stale date or verse (it shows the heading, the introduction and the builder; the verse box shows "Today's verse appears here").
2. **One sentence**: "Every day a new verse from the Berean Standard Bible, the same for everyone, changing at midnight where you are."
3. **"Put it on your church's website"**, the builder:
   - **Choices**, as labelled buttons, not drop-downs, in two rows on a phone: Look (Plain / Card), Colours (Match the visitor's device / Light / Dark; shown for Card only), Link colour (six swatches taken from the site's palette plus "Your own colour" with a colour picker and a hex box, plus "Same as the text"), Font (Your website's / Serif / Sans), Size (Standard / Compact), Heading (Verse of the day / Today's verse / None), Align (Left / Centre).
   - **Live preview** of exactly what the church will get, rendered by the real script into a preview box. A "Preview on" control sets the box's background and text colour (White page / Dark page / Your colours, with two colour pickers), so a church can see the plain style against its own page colours. A width slider (260 to 640px) shows the sidebar and full-width cases. A "Show the longest verse" toggle renders the longest verse in the schedule, so nobody is surprised by a long day.
   - **The snippet**, in three tabs: "Most websites (recommended)", "If your website does not allow scripts" (iframe, with its recommended height), "Just a link". Each in a read-only box in a monospace font, with **Copy** ("Copied" for two seconds; where copying is refused, the box is selected and a line says "Press Ctrl+C, or long-press and choose Copy"). Changing a choice updates the snippet immediately; nothing is saved anywhere, so leaving the page forgets the choices (the snippet is the record).
4. **"Where to paste it"**, short steps for each common platform, as a set of disclosure rows (one open at a time):
   - **WordPress:** add a Custom HTML block where you want it (or a Custom HTML widget in a sidebar) and paste. On WordPress.com this needs a paid plan with plugins switched on; on the free plan, use "Just a link".
   - **Squarespace:** add a Code block, set it to HTML, paste. Needs the Core, Plus or Advanced plan (or the older Business or Commerce); on Personal, use "Just a link".
   - **Wix:** Add, Embed code, Embed HTML, choose Code, paste the iframe snippet, and set the height shown.
   - **Church website platforms** (Subsplash, Nucleus, The Church Co, Clover, Tithe.ly Sites and others): look for a "Custom code", "Embed" or "HTML" block, and paste the first snippet; if it does not show, try the iframe.
   - **Your own site:** paste the snippet into the HTML where you want it.
   Each row names the platform's own help page only where section 2.2 recorded one; the rest stay generic, so no instruction claims more than was checked.
5. **"Privacy, in plain words"**: the promise of section 8.1, in five lines.
6. **"For your web person"**, a closed disclosure: the addresses the widget loads, the Content Security Policy lines to allow it (`script-src https://bibleguide.io; connect-src https://bibleguide.io` for the script, `frame-src https://bibleguide.io` for the iframe), the full option list of 5.1, the promise that `/widget/v1/` keeps working, and that the script is small and readable at its address.
7. **"Questions"**, three or four short answers: Is it free? (yes, always, with no account). Which Bible? (the Berean Standard Bible, in English). Can we choose the verses? (not in this version; the verse is the same for every church, so a congregation shares it). It shows nothing? (the two links mean the script could not run: try the iframe tab, or check the site builder's plan).

The page is a tool page: no long lists, so the long-list rule of the feature build rules does not arise.

### 7.3 Words and languages

The page's words are plain text in its components, so the site's translation collector picks them up (as Random verse's README describes), and the page is translated with the rest of the site. **The widget and the verse stay English** (`translate="no"` on the verse): the BSB is English, and the snippet's fallback and credit words are English. Other languages' Bibles are a later step (section 12).

### 7.4 Reusing the site's pieces

- Copy button and "Copied" status: the same pattern Random verse and Countdowns use.
- The preview renders through `verse.js` itself, mounted by a small React component that inserts the snippet's `div` and calls the script's render function for that element, so the page cannot drift from what churches get. The script exposes one function on its global for this (`window.__bibleGuideVerse.render(element)`); it is documented as internal and not offered to churches.

## 8. Privacy and safety

### 8.1 The promise, as the page states it

- No cookies, no sign-up, no account and no key.
- No tracking: Bible Guide keeps no record of which websites show the verse or who sees it, and the links carry nothing that identifies the church or the visitor.
- Nothing from any other company is loaded: no fonts, no analytics, no adverts.
- The widget asks bibleguide.io for one small file a day, and tells it nothing about the page it is on.
- Like every website, bibleguide.io is delivered by its host, Cloudflare, which sees a visitor's internet address in order to send the file, as it does for anyone opening bibleguide.io itself. Bible Guide does not collect or keep these.

### 8.2 How each promise is kept

| Promise | How |
|---|---|
| No cookies | The site sets none on static files (checked live, 2.5). The script uses `credentials: "omit"`, so even a cookie set some day for another part of the site would not be sent. A test asserts the script never touches `document.cookie`, `localStorage` or `sessionStorage`. |
| Not telling bibleguide.io which page it is on | `referrerpolicy="no-referrer"` on the snippet's `<script>` and `<iframe>`, `referrerPolicy: "no-referrer"` on the fetch, and `Referrer-Policy: no-referrer` on the widget's files. Browsers otherwise send the church site's address with every request. |
| No tracking in links | The links are the bare reader, countdown and site addresses. No `utm_` or other parameters. |
| Nothing from other companies | The script loads only bibleguide.io files; the frame's Content Security Policy enforces this for the iframe; fonts are system stacks. |
| No logs kept by Bible Guide | The Worker's configuration has no logging or analytics switched on, and these files never run the Worker's code. If Cloudflare Web Analytics or Workers Logs is ever switched on for the site, the widget's paths must be left out, and this page's promise reviewed; the README says so. |

For churches in Europe: because the widget sets no cookies and stores nothing in the visitor's browser, it needs no cookie consent. A visitor's browser does contact Cloudflare to fetch the file, which some very cautious European sites avoid for any outside resource; the "Just a link" tab is the choice for them. The page states this fact plainly and gives no legal advice.

### 8.3 Safety for the church's page

A church is trusting Bible Guide with a script on its own website, so the script is held to stricter rules than the site's own code:

- **Small and readable**: one hand-written file, no minifier-only build, no dependencies, comments explaining each step, under 6 KB. The page links to it so a web volunteer can read it.
- **No HTML from data**: everything is written with `textContent` and `setAttribute` on elements the script creates; the link `href`s are built from the checked site-relative paths (4.5) prefixed with the script's own origin. A day file that somehow carried markup would show as plain text.
- **No `eval`, no `Function`, no `document.write`, no inline event handlers**, so the script works under a strict Content Security Policy with only `script-src` and `connect-src` for bibleguide.io.
- **Options validated** against fixed lists (5.1); the accent colour against a strict pattern; nothing a church types reaches CSS or HTML as text.
- **Touches only its own `div`**: it reads that element's `data-` attributes and its inherited font and colour, attaches a Shadow DOM to it, and changes nothing else on the page. No global CSS is added; no global names except the one guard object.
- **Never breaks the page**: everything runs inside `try`; a failure leaves the fallback links.
- **Supply chain**: the file is served from bibleguide.io's own release, built from the site's repository; nothing is pulled from a CDN at build or run time. A test fails if the file contains `import`, `http://`, or any origin other than `https://bibleguide.io` (its fallback when it cannot read its own address, 4.5).

### 8.4 Safety for Bible Guide

- **The frame cannot be turned against the site**: it shows only the day's verse, fixed headings and fixed links; there is no free text in its options (5.1), so a link to the frame cannot make bibleguide.io appear to say something it does not. It is `noindex`, so it never appears in search results.
- **A church's page cannot reach into the frame**, and the frame cannot reach into the church's page (sandbox without `allow-same-origin`).
- **Embedding on a website the owner would not want associated with Bible Guide** (a hateful or mocking page) cannot be prevented by any public widget; the widget shows only Scripture and a link, so it lends that page nothing but the verse. If the owner ever needs to stop a particular site, the honest answer is that a static file cannot refuse one site without running the Worker's code on every request, which would end the "free at any scale" property. Recorded here so it is a known trade-off rather than a surprise.

## 9. Building it

### 9.1 Files

New, in the feature's own folders:

| File | What it holds |
|---|---|
| `public/widget/v1/verse.js` | The script (3.3, 5, 8.3). Hand-written, commented, ES2017. |
| `public/widget/v1/frame/index.html` | The iframe page (3.4). |
| `public/widget/v1/days/*.json`, `public/widget/v1/pool.json` | Generated by the build script (4.5, 4.4); committed. |
| `src/data/verse-of-the-day/curation.ts` | The ordinary pool and the fixed days, as `p()` passages with one-line notes (4.1, 4.2). Imports nothing through `@/`, like the countdowns data, so the build script can load it. |
| `src/data/verse-of-the-day/schedule.json` | The schedule (4.3), generated, committed. |
| `scripts/build-verse-of-the-day.ts` | The build script (4.6). |
| `src/pages/verse-of-the-day/VerseOfTheDayPage.tsx` | The page (7.2): today's verse, the builder, platform steps, privacy, questions. |
| `src/pages/verse-of-the-day/Builder.tsx`, `snippet.ts`, `Preview.tsx` | The choices, the snippet text for each tab (pure: options in, text out), and the preview that mounts the real script. |
| `src/pages/verse-of-the-day/verse-of-the-day.css` | Its styles (`vd-` classes). |
| `src/pages/verse-of-the-day/README.md` | How it works, how to rebuild the schedule (and that a test fails with fewer than 400 days left), the `v1` promise, the cost line and the "Workers caching" warning, the privacy rules for anyone adding analytics. |
| Tests, listed in 10. | |

Shared files, each changed by one small edit, re-read just before editing (other chains work in parallel):

| File | Change |
|---|---|
| `src/App.tsx` | One lazy import and one `<Route path="/verse-of-the-day">`. |
| `src/pages/tools/registry.ts` | `verse-widget` entry: `status: "live", path: "/verse-of-the-day"`. |
| `src/lib/page-head.ts` | One `ROUTE_TITLES` line (7.1) and its description. |
| `public/_headers` | The widget block (6.3). |
| `src/pages/PrivacyPage.tsx` (the site's privacy page) | One short paragraph: the widget on other websites sets no cookies and Bible Guide keeps no record of where it is shown or by whom. |
| `content/translation/page-register.json` | Only if a one-word status ("Copied") needs registering, as Random verse did. |

No new source enters the site: the verses are the BSB, already registered in [SOURCES.md](../../../SOURCES.md). The platform help pages in 2.2 are research references, not content the site uses.

### 9.2 Order of work for the implementation step

1. Curation file and build script; run it; read a sample of day files across an Advent, a Lent and ordinary weeks.
2. `verse.js` and the frame page, with their tests, against those files.
3. `_headers` block; check on the preview at 127.0.0.1:8931 that `/widget/v1/verse.js`, a day file and the frame answer without a redirect (and fix the frame's address in the builder if needed, 3.4).
4. The page, builder and preview; registry, route and title.
5. **A real embed test**: a plain HTML file outside the site's folders (in the job's own scratch folder) that pastes the default script snippet, the card snippet and the iframe snippet, opened in the installed browser tooling against the preview, at 320px and 1280px, light and dark; screenshots saved and looked at. The snippets' origin is changed to the preview's for this test only.
6. `npm test` and the build.

## 10. Tests (added in the implementation step, run with the site's `test` and `build`)

- **Curation and schedule** (`verse-of-the-day-data.test.ts`): every pool entry and fixed-day passage exists in the BSB, sits in one chapter, has at most three verses, starts a sentence, is 220 characters or fewer after tidying, and is not a countdown card; the pool has at least 320 entries, at most a quarter from Psalms and Proverbs, at least 40% New Testament; every scheduled date has a day file and every day file a scheduled date; the day files' words equal `tidyPassageText(assemblePassage(...))` from the BSB files today (so a change in the BSB text or the tidying would be caught); no two consecutive ordinary days share a book; no ordinary entry repeats within 365 days; **fewer than 400 days left after today fails**, with a message saying to run the build script.
- **Seasons agree with Countdowns**: for 2026–2029, every date in the Advent and Lent runs carries that countdown day's card verse and a link to that day's key, and the day before and after each run do not; Pentecost and New Year's Day carry their fixed verses.
- **The `v1` promise**: `verse.js`, `frame/index.html`, `pool.json` and at least one day file exist; the script still recognises every option name and value in 5.1.
- **The script, in jsdom** (`verse-widget.test.ts`, loading the real file with a fake `fetch` and a fixed clock):
  - renders into a Shadow DOM, with the verse, reference link to the reader, credit link to `/verse-of-the-day`, all opening in a new tab with `rel="noopener"`;
  - each option and its default; an invalid accent, an unknown style or heading is ignored;
  - `compact` and `standard`; the season line only when the day file has one;
  - two widgets on one page share one fetch; a second copy of the script does nothing;
  - the fallback links stay when the fetch fails, when the answer is HTML with status 200, when the JSON is malformed or has extra or wrong-typed fields, and when a link in it points anywhere but `/read/` or `/countdowns/`;
  - a day file with `<b>` in its text shows the characters, not bold;
  - a missing day file falls back to `pool.json` and picks the right entry for a date past the schedule;
  - the date changes on `visibilitychange` after midnight and the new day is fetched;
  - the fetch is made with `credentials: "omit"` and `referrerPolicy: "no-referrer"`.
- **Static checks on the script's source**: no `eval`, `Function(`, `document.write`, `innerHTML`, `insertAdjacentHTML`, `document.cookie`, `localStorage`, `sessionStorage`, `import`, `http://`, or any origin but `https://bibleguide.io`; size under 6 KB.
- **Time zones** (a file of its own, as Wordle's and Countdowns' are, since it sets the zone for its process): in `America/New_York`, `Europe/London`, `Australia/Sydney` and `Pacific/Kiritimati` (UTC+14), the script asks for the visitor's local date's file, across both daylight-saving changes and across midnight.
- **Snippet text** (`snippet.test.ts`): the default script snippet has no `data-` attributes; each changed option adds exactly its attribute; the iframe snippet carries `title`, `sandbox`, `referrerpolicy`, `loading="lazy"` and the recommended height; nothing a person types (the custom colour box) reaches the snippet unless it passes the colour pattern.
- **The page** (`VerseOfTheDayPage.test.tsx`): the tools registry entry is live at `/verse-of-the-day`; choices change the snippet and the preview; Copy, "Copied", and the hand-copy box when copying is refused; the contrast warning on a pale accent with a light card.
- **Contrast**: the card's light and dark colours with the default accent reach 4.5:1.
- **Headers**: `public/_headers` has the widget block with `Access-Control-Allow-Origin: *`, `Referrer-Policy: no-referrer`, and no `X-Frame-Options` on `/widget/v1/frame/*`.

## 11. Edge cases

| Case | What happens |
|---|---|
| **Two visitors in different time zones** | They can see different verses for a few hours around midnight, because each sees their own date's verse. Accepted on purpose, as Bible Wordle and Countdowns accept it: "today" is the visitor's day. |
| **A device with the wrong date** | It shows the verse of the date it believes it is. Nothing to correct against without a server clock, which would cost a Worker request. |
| **A visitor's date before the schedule's first day or after its last** | Before: the day file is missing (the build keeps 30 days of past files), so the pool rule picks a verse. After: the pool rule carries on the rotation (4.4). Either way a verse shows. |
| **A missing file answered with the site's page** | Status 200 and HTML: the script's JSON check rejects it, and it moves to the pool file, then to the fallback links (3.3, 6.3). |
| **Script blocked** (an ad blocker, a strict CSP, an old browser, JavaScript off) | The two plain links in the snippet show. Nothing breaks. |
| **The site builder strips the script but keeps the `div`** (some editors do) | The links show. The page's questions explain to try the iframe tab. |
| **The site builder strips both** (free WordPress.com, Squarespace Personal, a Markdown block) | Only "Just a link" works; the platform steps say so. |
| **Wix** | Its "Embed HTML" is an iframe of fixed height on `filesusr.com`. The script works inside it but cannot grow, so the Wix steps use the iframe snippet and the recommended height (5.4). |
| **The snippet pasted twice on one page, or the `<script>` line twice** | Every `div` renders, sharing one fetch; the second script does nothing (3.3). |
| **The `div` added later by the church's own JavaScript** (a single-page church site) | Not picked up unless the script line is added after it. Rare; noted in "For your web person". No `MutationObserver` watching the whole page, since that would cost the church's visitors work on every change. |
| **A very narrow column** (under 260px) | Compact layout by itself (5.3). |
| **A long verse** | The script embed grows. The frame shrinks the font in steps to 14px, then drops the date and season line, never cutting the verse (5.4). Ordinary verses are capped at 220 characters and cards at 240, so this is rare. |
| **A verse the BSB leaves out** (Matthew 17:21 and the like) | Cannot be scheduled: the data test requires every verse to exist in the BSB. |
| **Advent run starting in November** | The countdown run decides (Advent Sunday can fall on 27 November to 3 December). The test for 2026–2029 covers the earliest and latest cases. |
| **Easter in March or April** | Lent and Easter dates come from the countdowns' calendar module, tested 1900–2200 against Wordle's Easter. |
| **A day file corrected after release** (a wrong verse) | Allowed only for a real mistake, by editing the schedule and rerunning the build; browsers pick up the change within a day (6.3). The frozen-days rule stops ordinary rebuilds from changing anything visible. |
| **The site rolled back to an older release** (`wrangler rollback`) | The older release's day files are served; if it was built more than three years earlier the pool rule takes over. A rollback never removes `/widget/v1/` from a release built after this feature, because it is in `public/`. |
| **A church page in dark mode with the plain style** | Plain takes the page's own text colour, so it is readable wherever the page is. |
| **The iframe on a dark page** | Plain style keeps the frame transparent; the text colour comes from the `theme` choice, so the builder makes the church pick Light or Dark text for a plain iframe (it cannot inherit). |
| **A right-to-left church page** | The verse and reference stay left-to-right English; the page's direction is untouched (5.3). |
| **A church that wants its own verses, its own translation or another language** | Not in this version (12). The questions on the page say so. |
| **Someone frames the page `/verse-of-the-day` itself instead of the frame address** | It works as any framed page would (the site does not forbid framing of ordinary pages), but it is the whole site in a box; the builder never writes that snippet. |
| **The day files and the reader disagree after a BSB text update** | The data test compares every day file with the BSB files and fails until the build script is rerun. |
| **Heavy traffic** (a large church network, or a famous site, embedding it) | Static files: Cloudflare serves them free at any volume (6.1). |

## 12. Decisions this design makes, and what is left for the owner

Made here, as the obvious choices (none needs the owner's word: no money, nothing published or deleted, no reversal of an earlier direction):

1. **Script first, iframe second, a plain link third**, from one builder (2.3).
2. **Everything static**, so it is free at any scale and needs no server code (6).
3. **Same verse for everyone on a date**, changing at the visitor's midnight, in a schedule fixed three years ahead with 14 frozen days (4.3).
4. **Advent and Lent follow the Countdowns**, with a link into the day's reading; New Year's Day and Pentecost have fixed verses; nothing else from the church calendar (4.1).
5. **A visible credit link named "Bible Guide"**, with no `nofollow` and no keyword-stuffed text (2.4).
6. **No tracking of any kind**, including no counting of how many churches use it. The cost is that nobody will know how widely it is used. If the owner later wants a count, the least intrusive way would be the request totals Cloudflare already shows in its dashboard for the file `/widget/v1/verse.js`, which name no church and no visitor; this design does not set anything up for it.
7. **English and the BSB only** in this version, as the doctrinal foundation requires the BSB and the other languages' Bibles are separate work.

Nothing in this feature waits on the owner.

## 13. Out of scope for this build

- A church choosing its own verses or a theme for the widget (would need per-church data; possible later as extra pool files named in an option, still static).
- Other languages and their Bibles (`lang` option over the site's other Bibles), once the owner wants it.
- "Make a card of today's verse" on the page, using the verse-card generator from steps 14–16 of this sequence, once it exists.
- A week-ahead list for bulletins; the day files make it easy later.
- WordPress, Squarespace or Wix plug-ins or app-store listings.
- A JSON API for developers beyond the documented day files.
