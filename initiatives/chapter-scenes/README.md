# Chapter scenes: the key moments of every chapter, ready to become pictures

For each of the 1,189 chapters, a model picks the key scenes a picture could show and describes how each picture is
composed, ending in a ready-to-paste prompt for an image generator. The owner reads them in the
[Chapter Summary Studio](../chapter-summaries/README.md) under a **Scenes** switch, beside the chapter's Scripture.
Each scene's picture is then drawn on this PC (see [Pictures](#pictures)) and shown in the scene's frame. Nothing
is published.

**State (2026-11-07):** pilot done, waiting for the owner to compare. Both writers wrote all 12 pilot chapters and every
answer passed the script checks (Qwen needed a second try once, on Ezekiel 1). Haiku cost $0.05 in total, about
$0.003 a chapter, so a full Haiku run projects to about $4 at list price; Qwen took about 100 seconds a chapter at 12
at once. To look: start the Studio (`python scripts/chapter_summary_studio.py --data-dir
.local/chapter-summary-studio/claude`, http://127.0.0.1:8947), choose **Scenes** in the dark **Pipelines** panel on the far left, then a pilot chapter (its square is underlined in gold).

**Haiku runs without `--schema`:** BatchRunner's job canary sends the task with "OK" as the item, and Haiku answers that
in prose, so a schema run fails the canary. The task asks for JSON only and `chapter_scenes.py import` checks every
answer, rejecting any call that ran past `--max-output` (`num_turns` > 1).

## The owner's decisions (2026-11-07)

1. **Up to 3 scenes per chapter, fewer for shorter chapters.** Under 250 words of BSB text: 1 scene (83 chapters).
   250–449 words: up to 2. 450 words or more: up to 3. A chapter with fewer distinct moments (a list of names) may
   return fewer. The first scene is the main one.
2. **Pilot both writers** on the same 12 chapters: the local Qwen model (HyperQwen, $0) and Claude Haiku 5.5 through
   [BatchRunner](../../../../../Tools/BatchRunner/README.md) (under $1). The owner compares them side by side in the
   Studio and picks one for the full run.
3. **No special rules for drawing God or Jesus yet.** The children's picture rules
   ([STANDARD.md](../../../AnswerPictures/STANDARD.md)) do **not** apply here. The owner will judge from the pilot.
   Faithfulness to the BSB still applies: no halos, no apple in Eden, nothing later tradition added.
4. **Wide frames (16:9).**

## What a scene holds

Defined in [scene-schema.json](scene-schema.json); the instructions every writer gets are [scene-task.md](scene-task.md).

| Field | What it is |
|---|---|
| title, kind | Short name; one of event, imagery (poetry's pictures), vision, setting |
| verse_start, verse_end | Where the moment is in the chapter |
| moment | The one frozen instant the picture shows |
| why | Why this is a key scene of the chapter |
| shot, viewpoint, focal_point | Wide/medium/close; where the camera is; what the eye lands on and where it sits in the frame |
| foreground, midground, background | What fills each layer |
| people | Who is there, how many, what each is doing |
| light, mood | Time of day and light (from the text when it says), palette and feeling |
| from_text | Details the verses state, each with its verse |
| added | Details invented for the picture (clothing, buildings, landscape), so the owner can see them |
| avoid | What must not appear because the text does not say it |
| prompt | The image prompt, 60–160 words, natural language, no art style (a style line may be added later for all) |

## How it runs (the assistant does all of this)

| Step | Code |
|---|---|
| Build one input per chapter: the BSB chapter, its Claude summary and outline, its scene limit | [chapter_scenes.py](../../scripts/chapter_scenes.py) `items` |
| Local writer: HyperQwen on 127.0.0.1:18020, thinking off, one retry with the error when an answer fails the checks | `chapter_scenes.py local` |
| Haiku writer: BatchRunner over the same inputs, with the same instructions and schema | BatchRunner, then `chapter_scenes.py import` |
| Script checks: valid JSON, scene count within the limit, verse ranges inside the chapter, every field filled | `chapter_scenes.py` (both writers) |
| Storage: `.local/chapter-scene-studio/scenes.sqlite3`, one row per chapter and writer; the summaries database is never written | `chapter_scenes.py` |
| Display: a primary panel on the far left lists the pipelines (Summaries, Scenes); beside it a secondary panel holds the chosen pipeline's workspace and settings; Scenes has its own heading, counts and preview card, showing each writer's scenes for the chapter; a verse chip highlights its verses | [chapter_scenes_view.py](../../scripts/chapter_scenes_view.py), wired into [chapter_summary_studio.py](../../scripts/chapter_summary_studio.py) |

**Pilot chapters (12):** Genesis 22, Exodus 14, Leviticus 16, 1 Chronicles 1, 1 Samuel 17, Psalm 23, Psalm 117,
Ezekiel 1, Mark 4, John 11, Romans 8, Revelation 21. Stories, law, a list of names, two poems (one of 2 verses),
visions, Gospel scenes with Jesus, a letter.

**Full run (after the owner picks):** Qwen is $0 and about an hour of the graphics card; Haiku is quoted from the pilot's
measured cost before it runs.

## Pictures

The owner asked for pictures made from the prompts, starting with what exists (2026-11-07), and chose FLUX.3 Image
Klein. It is the best open image model that runs on the 4090 and whose licence allows the site to use the pictures
(FLUX Kommunity licence: commercial use is free under $5M yearly revenue).
The best model overall is closed and paid (OpenAI's GPT Image 2.6 Sunburst, about $0.21 a picture), and it was not chosen.

| What | Where |
|---|---|
| Model, 20 GB: the image model (bf16), its Qwen3-VL-4B text reader, the decoder | `F:\intelligence models\FLUX.3-image-klein`, from the ungated Unsloth copy `unsloth/flux-3-image-klein` (all 41 files byte-identical to Black Forest Labs' gated repo except the readme; `modular_model_index.json` points at the local folder, the original is kept as `modular_model_index.official.json`) |
| Python environment: torch 2.14.1 + CUDA 13.0, diffusers 0.42.1, transformers 5.22.2 | `Website/.local/flux3-venv` (git-ignored) |
| Picture maker | [chapter_pictures.py](../../scripts/chapter_pictures.py), run with the venv's Python (or the Studio's Make pictures button); store and themes: [scene_pictures.py](../../scripts/scene_pictures.py) |
| Pictures: WebP, 1344 × 768 (16:9), 16 steps, a fixed seed per scene | `.local/chapter-scene-studio/pictures/<theme>/<writer>/<CODE>-<chapter>-<scene index>.webp` and a 480 × 270 copy under `thumbs/`, plus a `pictures` table in `scenes.sqlite3` |
| Shown in the Studio | the scene's frame and the Gallery; click opens it large ([chapter_scenes_view.py](../../scripts/chapter_scenes_view.py), [chapter_scenes_themes.py](../../scripts/chapter_scenes_themes.py), route `/pictures/...`) |

How it works. The prompt goes to the model exactly as the writer wrote it; FLUX.3's own prompt rewriter, a separate
19 GB model, is left off because the scene prompts are already detailed. Each theme puts its style text in front of the prompt (none for Photographic). To keep the
card free, the text reader and the image model are never loaded at the same time. For each batch of 100 scenes, the
text reader reads all the prompts, then the image model draws them all. That takes 6.3 seconds a picture and at most
14.4 GiB of the card's memory. Loading both together, as the standard pipeline does, takes 36 seconds a picture. The
pictures come out identical, checked pixel by pixel on a test scene. All 3,100 or so pictures for every chapter would
take about 6 hours.

A picture counts as made only while its stored hash still matches the scene's current prompt plus its theme's style and the recipe (model,
size, steps) and its file exists. A rewritten scene or a changed recipe therefore gets a new picture on the next run,
and a stopped run carries on where it left off. The run stops itself in three cases: the card has less than 16 GiB
free (HyperQwen running, for example); three pictures in a row fail (out of memory, or a blank frame); or another run
already holds the lock.

## Themes and the gallery (owner 2026-11-07: "make it work to the best of your ability")

The owner wants the same scenes drawn in different art styles ("themes"), picked in the side panel beside Pipelines,
and a gallery of only the pictures in each theme. The first two cartoon themes come from two example pictures the
owner sent; the 63 photographic pictures become the theme "Photographic".

**A theme** is an id, a name, a one-line plain description and a style text placed in front of every scene prompt
(`<style>\n\nScene: <prompt>`; Photographic has no style text, so its 63 pictures stay valid). Themes are listed in
[themes.json](themes.json), in panel order; the assistant writes a new theme from the owner's examples in chat. The
example pictures are kept in `.local/chapter-scene-studio/themes/<id>/` (one is a watermarked stock image, so they are
not committed).

**Pictures per theme.** The pictures table gains a `theme` column (key, writer, scene, theme). Files move to
`pictures/<theme>/<writer>/<CODE>-<N>-<i>.webp`. The hash covers recipe + style + prompt, so editing a theme's style
redraws that theme only. `chapter_pictures.py --theme ID` draws one theme (default: every theme in order).

**The side panel (Scenes).** "Your workspace · Scenes" stays. Below it the Themes list replaces Scene settings: each
theme is a row with a small sample picture, its name and "made / total" pictures, and the chosen one is highlighted.
Under the list come the chosen theme's description and a **Make pictures** button. While a run is going, the button
reads **Stop**, with "Drawing 12 of 63" beside it, refreshed every 2 seconds. When the theme is complete the button
reads "All 63 made". The Writers note stays at the bottom. The chosen theme is remembered in the browser.

**Runs from the page.** `POST /api/pictures/start {theme}` starts `chapter_pictures.py --theme ID` with the image
venv's Python as a child of the Studio (one at a time; the maker's own lock also guards it), logging to
`.local/chapter-scene-studio/pictures-<theme>.log`. `POST /api/pictures/stop` ends it; finished pictures are kept.
`GET /api/pictures/state` gives running, theme, the last log line and the exit message. Code:
`chapter_pictures_runner.py` (standard library only).

**Scenes | Gallery tabs** at the top of the Scenes page.
- Scenes: the scene cards as now, with each frame showing the chosen theme's picture. Under the frame a strip of
  small thumbnails, one per theme that has this scene drawn; clicking one switches the chosen theme for the page.
- Gallery: the chapter explorer, Scripture panel and scene card are hidden. All pictures of the chosen theme fill the
  page as a grid, grouped by chapter in Bible order ("1 Samuel 17"), with writer chips (Both / Claude Haiku / Local
  Qwen) and a count. Clicking a picture opens it large over the page with its title, chapter and verses, and writer;
  the arrow keys and on-screen arrows step through, and Esc or a click outside closes it.
  `GET /api/gallery?theme=ID` returns every scene; a scene not drawn yet has no picture URLs.
- **All | Finished** (owner 2026-11-07): All lists every scene, with a dashed "Not drawn yet" tile where the theme has
  no picture; Finished lists only drawn pictures. The choice is remembered.
- **▶ Speed run** (owner 2026-11-07: "speed run through all the images"): opens the large view at the first picture of
  what the gallery shows (filter and writer chips apply), with a "12 / 63" counter; ← → step through, wrapping at the
  ends. A not-drawn scene shows an empty frame in the run.

**Not now:** a "New theme" form on the page, thumbnails at a smaller size (the WebP files are about 300 KB and load
lazily), publishing anything.

**Built 2026-11-07.** After review, the run state lives in `pictures/.run.json`, which the maker writes while it holds
the lock. A restarted Studio therefore still sees and can stop a run, and Stop ends the whole process tree. The
63 photographic pictures were moved by a one-off migration into `pictures/photographic/`, and their rows got
`theme='photographic'`. A database backup was taken first:
`F:\Backups\BibleProject\chapter-scene-studio\scenes-2026-11-07-before-themes.sqlite3`. Their hashes still match,
which a test checks. Gallery copies (480 × 270) are made with each picture and backfilled at the start of every run.
The gallery adds chapters 30 at a time as you scroll.
