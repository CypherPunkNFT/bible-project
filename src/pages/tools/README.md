# Tools

The tools hub at `/tools` (linked from the main menu as **Tools**, beside **Games**). It lists every approved non-game
tool for parents, families and pastors (BibleProject/APPROVED-IDEAS.md, 2026-11-07), grouped into four categories.
Every tool is one entry in [registry.ts](registry.ts); the hub ([ToolsPage.tsx](ToolsPage.tsx)) draws its cards from
that list, so adding or finishing a tool never touches the page layout or the menu. It is built like the games hub
([../games/README.md](../games/README.md)): same tiles, same drawings, same counts.

Unlike a game, a tool keeps its own address (`/baby-names`, `/sympathy`, …) and its own route in `src/App.tsx`, made
by the chain that builds it. The hub only links to it.

## When a tool is finished

Find its entry in [registry.ts](registry.ts) (all ten approved tools are already there; a tool proposed later adds its own entry, live from the start, as the biblical converter did) and make it live: change
`status` to `"live"` and add `path`, the address its route answers at in `src/App.tsx`:

```ts
{
  slug: "birthday-verses", status: "live", path: "/birthday-verses",
  title: "Birthday verses",
  …
},
```

That is all. Its card now says **Open** and links there, and the hub's counts (tools, ready to use, coming soon, for
churches) update by themselves. Leave its `category` and `art` lines as they are. The tests refuse a live tool whose
`path` has no route in `src/App.tsx`, so add the route first.

## The fields

| Field | What it is |
|---|---|
| `slug` | A name for the entry: lower case, words joined by hyphens. Unique. |
| `status` | `"coming-soon"`: a quiet card with no link. `"live"`: a card that links to the tool. |
| `path` | Live tools only (TypeScript refuses a live tool without it): the tool's own address, e.g. `/baby-names`. |
| `title` | The card's heading. |
| `description` | One line, at most 140 characters, shown on the card. |
| `audiences` | Who it is for, one or more of `"parents"`, `"families"`, `"churches"`, `"anyone"` (shown as Parents, Families, Churches and pastors, Anyone). |
| `category` | Which of the hub's categories it sits in: `"family"` (Family and life events), `"hard-times"` (Hard times), `"prayer"` (Prayer and the home), `"sharing"` (Sharing and churches) or `"study"` (Study and reference, added 2026-11-09 for sequence 41's study tools, first the biblical converter). Titles and one-line descriptions: `CATEGORIES` in [registry.ts](registry.ts). Tools in one category must have different colours (a test checks it), and there are seven, so a full category sends the next tool to another. |
| (picture) | A tool built after the first ten may keep its drawing in its own folder and import it into the registry (the converter's is `src/pages/converter/art.tsx`, described in `converter-art.ts`), so parallel builds never share a drawing file. |
| `art` | Its picture: `TOOL_ART.<name>` from [art/index.ts](art/index.ts). |

The hub shows the categories in that order, and in each the live tools first, then the rest, each group in the order
of the list. A category with no tools is left out.

## A tool's picture

The drawings use the games' drawing kit (`src/pages/games/art/`: the arched window, the stroke classes, the slow
living details), so the two hubs look like one site. How to draw one is in the games README, "A game's picture". The
tools' scenes are in [art/scenes.tsx](art/scenes.tsx), their colours and descriptions in [art/index.ts](art/index.ts),
and the hub's hero drawing (a table by a window) in [art/HeroArt.tsx](art/HeroArt.tsx).

## Translation

All the hub's words (the registry's titles, descriptions, category and audience names, the page's headings and
buttons) are plain text in the page code, so the translation collector (`content/translation/extract.py --pages`)
picks them up with the rest of the site, and the build's English check (`english_build_check.py`) sees nothing new.
The menu label "Tools" is seeded by hand in `content/translation/seed/<language>.json`, like the other menu labels.

## Checks

[tools.test.tsx](tools.test.tsx) (part of `npm test`) checks every entry: unique, address-safe slugs, a one-line
description, at least one audience, its own picture and a category; that every live tool's address has a route in
`src/App.tsx`; that the hub shows one card per tool with links only on live ones, in the right categories and order;
and that every picture is named for screen readers. Its counts come from the registry, so making a tool live needs no
test change.
