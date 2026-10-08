# Design mock-ups: the gallery and the approved creative sections

Every mock-up lives in a folder here and has a card in [catalog.json](catalog.json). The gallery is at
http://127.0.0.1:8931/mockups/ ([index.html](index.html)).

## The style benchmark: the Authors mock-ups (owner, 2026-10-08)

The Authors directions are the model for **how a page should feel**:
- [Lifelines](authors-directions/lifelines/)
- [Their world](authors-directions/their-world/)
- [The preached Bible](authors-directions/preached-bible/)

Every section in them is approved, except "Quiet chapters" in The preached Bible. [Rearrange](authors-directions/rearrange/)
was "not that interesting".

What they get right:
- They look like the rest of the site: warm parchment ground, the site header, serif titles with one italic accent word.
- Sections are numbered (01, 02…) with a short plain lead.
- Stats sit in a quiet row with thin dividers.
- The graphics are real and informative: lifelines, a map with a year slider, heat grids, link curves. Each one is
  interactive in a way that answers a question ("Who was alive at the same time?").
- They are subdued, never loud.

The owner's rule for every people page from now on: find the balance between this house style and the approved
creative sections below. The page should be striking yet informative, creative yet consistent with the site,
innovative yet never distracting or chaotic.

## Approved creative sections (pull from these first)

The owner reviewed mock-ups and approved the sections below as **reusable building blocks** (2026-10-08). Any new
mock-up should include the ones that fit its subject before inventing new ones. Each entry names where the working
example lives, so it can be copied.

When the good ideas outgrow one page, they go onto a second page rather than being crammed into the first. The owner
adds to this list as he reviews other mock-up sets (apostles, David, Michael, the tribes and others).

| Section | What it is | Example | Owner's notes |
|---|---|---|---|
| **The three forties (life ring)** | A large ring of a whole life split into Scripture's own periods (Moses: Egypt, Midian and the wilderness, Acts 7:23, 30, 36). Clicking an arc opens that period. | [moses-directions #forties](moses-directions/#forties), hero | "Absolutely incredible." Use it as the **header**. Less glow and fewer boxes than the mock-up. |
| **Cinema chapters** | Huge full-screen sections, one per act, each with a giant numeral (I, II, III) in the background, and scenes that slide sideways. | [moses-directions #cinema](moses-directions/#cinema) | Liked a lot, especially the giant Roman numerals behind. Add more background detail (stars and similar); fewer glowing containers. |
| **Line-art scenes** | Our own line drawings (bush, sea, mountain, tent, objects) that draw themselves. | [#cinema](moses-directions/#cinema), [#objects](moses-directions/#objects) | "I really like the theme here of these line arts, a lot." They should loop slowly, not play once, and carry more detail: a moving flame, drifting sparks. One placed under the header, before the chapters, is wanted. |
| **The cabinet (object array)** | A simple, quiet grid of line-drawn exhibits, each opening its story. | [#objects](moses-directions/#objects) | "I really like the simplicity of this array, like a lot." |
| **Cabinet intro** | The big plain-type hero ("In his hands") with four small stats beside it. | [#objects](moses-directions/#objects), top | "This intro is really nice. We could use it for other sections." |
| **Through time (lanes)** | One lane per item across the books, a dot where it appears. | [#objects](moses-directions/#objects), "Through time" | Interesting, but it **must be interactive**: hovering a dot shows what happens there, on a line below. |
| **Constellation (concentric rings)** | The person at the centre; rings of people, places, moments and words; clicking a point draws its links and opens it. | [#constellation](moses-directions/#constellation) | "Very, very, very interesting." Use it where it fits, maybe on another page. |
| **Ten plagues (animated dots)** | The plagues as a grid that animates with small dots. | [#constellation](moses-directions/#constellation), plagues | Liked. |
| **The long memory** | Every verse naming the person, as points of light across the 66 books, with the echoes labelled. | [#memory](moses-directions/#memory) | "Very interesting. That could be kept." |
| **The journey map (as a side panel)** | The large map of the road, opened from a section ("see the map") and sliding in **beside** that section, on the same page. | [#road](moses-directions/#road), for the map only | The road as a whole scored 6/10, because there was too much scrolling. Use the map, not the scroll-driven page. |
| **Three anointings** | Three drops/medallions on one line (Samuel at Bethlehem, Judah at Hebron, Israel's elders at Hebron), each with its passage, and what Chronicles tells. | [david-directions/house](david-directions/house/), section 01 | Liked as it is (2026-10-08). |
| **Places array** | The places of a reign as numbered tiles, each with what happened there and its distance and direction from the capital. | [david-directions/house](david-directions/house/), section 08 | "08 is good." Make it more visual: icons inside, larger tiles, and a sideways-scrolling row. The kingdom itself should lead to an Atlas page (David's kingdom as an Atlas article), not be told on the person page. |
| **The 3D land table** | The land as a raised block seen in 3D, with Campaign, Places and Powers modes; pieces rise at each place. | [david-directions/war-table](david-directions/war-table/) | "I really like this geographical representation a lot." Not like a video game: no blue theme, no grid behind the table, no plus/minus/undo buttons. Scroll to zoom over the map, left-drag to move, right-drag to turn (a little more 3D, never tilting below the map), with a tiny legend of those controls. |
| **The codex** | The reference area under the map: a big-icon side menu opening each section of the page. | [david-directions/war-table](david-directions/war-table/), "The codex" | "Actually kind of nice." Wants it more visual. |
| **Crystals by kind (filter)** | Large chips, one per kind of event with its colour, icon and count; tapping one filters what is shown. | [david-directions/helix](david-directions/helix/), left of the helix | "I kind of like it a lot." |
| **Dust-field background** | Near-black with a faint warm-yellow glow that turns deep blue halfway across, and slow floating circular dust. | [david-directions/helix](david-directions/helix/) | Preferred to every other background so far; use it instead of grids. |
| **The globe** | A turning globe you can grab, spin and zoom; Scripture's journeys as solid arcs, tradition's routes dashed and labelled with who said it and when. | [apostle-directions #globe](apostle-directions/#globe) | "Super cool. I love the interactivity." Use a **texture** (an image of the earth that zooms smoothly), not dots that reload as you zoom. Never cropped left or right: full width when the page has room. Best as the **missions** section, after a short landing, not the top of a long scroll. |

## What the owner does not want

- **An arcade look** (the apostle round, 2026-10-08): "a laser arcade", "a glowing neon prison". Neon lines on black, glowing notes and staves, a 3D stack of glowing plates. Mock-ups must look like a modern, responsive website with new ways to show information, not a game. Be pragmatic.
- **A musical score** for a life (the apostle "score"): "I absolutely detest the score."
- **Chat bubbles, again** (the apostle "thread"): "absolutely atrocious".
- **A musical theme** for a person (the "Two voices" psalm strings, 2026-10-08): "absolute trash", and far too much scrolling.
- **Weird motion on a family tree** (the swaying "House of David" tree).
- **Lanes of small chips** for a reign's events ("the table with the tiny little thing underneath is atrocious"). Events
  belong in large super-category cards that open in place, as the Atlas's ancient cities do, with rich content in each.
- **A video-game look**: blue sci-fi panels, grids behind grids, game turn bars, plus/minus and undo/redo buttons.
- **The same glowing box repeated** for every section ("makes everything look so tacky").

- **Endless sections.** A good theme stretched into a long, unending scroll ("too much scrolling down and down and
  down"). Keep each idea compact, and move extra material to a second page.
- **Glow everywhere.** "Too much of the glowing everywhere. We're not children." Glow is for one focal point at most.
- **Boxes around everything.** Too many containers. Prefer **words floating with lines** (as in the constellation) over
  bulky cards. Example: the "what readers still ask" questions should be floating words joined by lines, not boxes.
- **Chat imitation.** People shown "chatting" in message bubbles ([#voices](moses-directions/#voices)) is not wanted.
  The score lanes in the same direction were "all right", not approved.
- **Line art that plays once and stops**, or stops animating after scrolling away and back.

## The ideal Moses page, as the owner described it (to build)

1. **Header:** the three forties ring.
2. **Under the header:** a detailed line-art scene on a slow loop (the bush, with the flame and sparks animating).
3. **Then the cinema chapters**, fewer and larger, with a giant numeral and stars behind each.
4. **In each chapter, "see the map"** slides the journey map in beside the chapter, on the same page. Scrolling up and
   down stays on the page, and the map slides back.
5. **Questions as floating words with lines**, not boxes.
6. Approved sections that do not fit (constellation, long memory, cabinet) go on a second page.

## Verdicts on the merged Moses page H (owner, 2026-10-08, second pass)

- **Landing:** use direction **B's three-forties landing exactly as it was** (ring, act cards and the Deuteronomy 34:7
  line). It beats the cleaned-up version.
- **Animated line-art under the header (the burning bush): not wanted.** Put an **Atlas section** in that slot, with a
  map and a link to the person's journey in the Atlas.
- **The Roman-numeral chapters must be dense with real information.** There is plenty of room; fill every chapter from
  the reviewed data.
- **Every people page needs:** the man (life, family), the word (for prophets), the questions, and the
  **constellation of the people around him** inside the page itself, not on a second page. "This is very much what we
  need for all peoples."
- **Cinema's vertical navigation (dots with a pill, at the side): approved, and wanted back.**
- **Sky and ground:** the faint dots at the top read as a sky (keep them); the bottom of each chapter should carry a
  relevant line-art landscape.
- **The map sliding in beside a chapter: approved** ("this is nice"). Closing it must slide away, not flash out.
- **The cabinet:** a technique for another page, not the people page. **The long memory:** undecided; keep it off the
  main page for now.
- **Sources at the bottom (the collapsed "Sources · N writers"):** fine.
