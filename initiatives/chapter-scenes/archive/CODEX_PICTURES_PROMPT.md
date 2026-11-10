# Prompt for Codex: draw every scene picture (headless loop)

Paste everything below the line as the prompt. It is written so that each loop iteration can start cold, do one
bounded chunk of work, record it and exit. The loop ends when an iteration writes `ALL DONE` in the progress file.

---

You are running headless, in a loop, on a Windows 11 PC with an RTX 4090 (24 GB). Each time you are started you do
ONE chunk of picture-making, record it, and exit. You have no memory of earlier iterations: the progress file and
the database tell you where things stand.

## The job

A Bible study website project has, for every one of the 1,189 Bible chapters, 1 to 3 "key scenes" already written
by Claude Haiku: 3,213 scenes in all. Each scene has a finished image prompt. Your job is to turn every scene into
a picture, in each of the 3 art styles ("themes"), using a local image model (FLUX.3 Image Klein) through an
existing script. You do NOT write scenes, prompts or code. The script does the drawing; you run it in chunks, watch
it, handle stops, and keep a progress record.

Total work: about 3,182 pictures per theme still to draw x 3 themes = about 9,550 pictures, at about 6.3 seconds a
picture, about 17 hours of the graphics card. Cost: $0 (everything is local).

## Where everything is

Project root (run every command from here):
`D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website`

| What | Path (relative to the project root) |
|---|---|
| Full design and history: read the sections "Pictures" and "Themes and the gallery" first | `initiatives/chapter-scenes/README.md` |
| The scenes (all 1,189 chapters, writer `haiku`; 12 trial chapters also have writer `qwen`) | `.local/chapter-scene-studio/scenes.sqlite3`, table `scenes` (key, writer, payload JSON with a `scenes` list; each scene's `prompt` field is what gets drawn) |
| Picture records (one row per key, writer, scene, theme) | same database, table `pictures` |
| The 3 themes, in drawing order, each with its style text | `initiatives/chapter-scenes/themes.json` (`watercolour-storybook`, `flat-cartoon`, `photographic`; a fourth, `painterly-realism`, has `"engine": "codex"` and is not yours) |
| The picture maker (run it, do not edit it) | `scripts/chapter_pictures.py` |
| Its store and helpers | `scripts/scene_pictures.py` |
| The Python to run the maker with (has torch + CUDA + diffusers) | `.local/flux3-venv/Scripts/python.exe` (NOT the system Python) |
| The image model, 20 GB | `F:\intelligence models\FLUX.3-image-klein` |
| Finished pictures | `.local/chapter-scene-studio/pictures/<theme>/<writer>/<BOOKCODE>-<chapter>-<scene index>.webp`, 1344 x 768, plus a 480 x 270 copy under `thumbs/` |
| Live run state the maker writes while it runs | `.local/chapter-scene-studio/pictures/.run.json` |
| One-run-at-a-time lock | `.local/chapter-scene-studio/pictures/.lock` |
| Your progress file (create it on the first iteration) | `initiatives/chapter-scenes/pictures-progress.md` |

How the maker works (so you can trust it): a picture counts as done only while its stored hash still matches the
scene's prompt + the theme's style + the recipe, and its file exists. Done pictures are skipped, so any stopped run
simply resumes. It loads the text reader, reads 100 prompts, unloads it, then loads the image model and draws those
100: peak 14.4 GiB of card memory. It stops itself, with a message, when: the card has under 16 GiB free; 3 pictures
in a row fail (out of memory or a blank frame); or another run holds the lock.

The owner looks at the pictures in a local web app, the Chapter Summary Studio (`http://127.0.0.1:8947`, a Python
process started from `scripts/chapter_summary_studio.py`). It may be running. Leave it alone; it reads the same
database and will show your pictures as they appear. Its "Make pictures" button starts the same maker, so the lock
may be held by a run the owner started; that is fine.

## Each iteration, do exactly this

1. **Read state.** Read `initiatives/chapter-scenes/pictures-progress.md` if it exists. Then count what is left per
   theme with the system Python:
   ```
   python -c "import sys;sys.path.insert(0,'scripts');import scene_pictures as sp;p=sp.Pictures();[print(t,len(p.pending([t]))) for t in p.flux_ids]"
   ```
   If every theme shows 0, write `ALL DONE` with the final counts at the top of the progress file and exit.

2. **Check the card is free.** `nvidia-smi --query-gpu=memory.used,memory.total --format=csv`. The maker needs 16 GiB
   free. If it is not free, find out what holds it (`nvidia-smi`; `docker ps` for the local language model
   "HyperQwen"). Do NOT stop HyperQwen, Docker containers or other programs; the owner may be using them. Record
   "waiting: card busy (what holds it)" and exit; a later iteration will try again.

3. **Check no run is already going.** If `.local/chapter-scene-studio/pictures/.run.json` says `"state": "running"`
   and its process is alive, a run is in progress (maybe the owner's). Record "a run was already going" with its
   numbers and exit. Do not kill it.

4. **Run one chunk** of the first theme in that list that still has pictures left (the list leaves out the "Painterly realism" theme, which Codex draws a different way; never run the maker for it):
   ```
   .local/flux3-venv/Scripts/python.exe scripts/chapter_pictures.py --theme <THEME_ID> --limit 300
   ```
   300 pictures take about 35 minutes including model loading. Run it in the foreground and let it finish. If your
   command timeout is shorter, use a smaller `--limit` (each 100 takes about 11 minutes) rather than letting the
   command be killed; a killed run is still safe (it resumes) but wastes the model load.

5. **Check the result.**
   - Read the last lines it printed and `.run.json` (`state`, `done`, `failed`, `message`).
   - Count again (step 1) and confirm the theme's number went down by about the number made.
   - Look at 3 of the newest pictures (the newest `.webp` files under that theme's folder, or their `thumbs/` copies)
     and check each is a real picture of a scene, not blank, black, noise or garbled. Note what you saw in one line.

6. **Handle a stop.**
   - "card has X GiB free": treat as step 2 (record, exit).
   - "3 failures in a row": run the same command once more with `--limit 20`. If it fails again, record the exact
     message and the scene keys involved and write `BLOCKED` at the top of the progress file, then exit. Do not
     change code or delete files to get past it.
   - "Another picture run holds the lock": record and exit.
   - Any Python traceback: record the last 30 lines in the progress file, write `BLOCKED`, exit.
   - If the progress file already says `BLOCKED` at the start of an iteration, do not run anything; exit at once.

7. **Record and exit.** Append one entry to `initiatives/chapter-scenes/pictures-progress.md`:
   ```
   ## <date time>
   - Theme: <id>; made <n>, failed <n>; left per theme: watercolour-storybook <n>, flat-cartoon <n>, photographic <n>
   - Spot check: <one line>
   - Problems: <none, or what happened>
   ```
   Keep a short summary block at the very top of the file (overall state, pictures left per theme, estimated hours
   left at 6.3 s a picture, last update time), rewritten each iteration. Write plain English; the owner reads this
   file and does not read code.

## Never do these

- Never edit any code, `themes.json`, the scenes, or the database by hand. The maker is the only writer of pictures.
- Never run `scripts/chapter_scenes.py` (it writes scenes) or anything that calls a paid API.
- Never delete pictures, the database, the lock file or anything under `.local/` (the maker clears its own `.tmp`
  files).
- Never stop, restart or kill other processes: the Studio server, HyperQwen, Docker, other Python programs.
- Never run two makers at once, and never pass `--keys` or change the recipe.
- Never download models or install or upgrade packages in `.local/flux3-venv`. If an import fails, record it and
  write `BLOCKED`.
- Never commit, push, stash or reset in git. Other sessions work in this repository at the same time.
- Never publish or upload pictures anywhere. Everything stays on this PC.
