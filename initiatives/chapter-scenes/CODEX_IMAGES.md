# Codex image run: the "Painterly realism" theme, drawn by headless Codex, in 7 sections

Instructions for the agent that runs one section of this job. Read all of it before doing anything. The owner pastes
a short block that starts with **PHASE N** (N = 1 to 7); that number is your section. This file is the whole brief.

**The job (owner, 2026-11-10).** Draw every scene of every Bible chapter in the "Painterly realism" style: 3,213
pictures. The chapters are cut into **7 sections that run at the same time, one chat per section**. You run only your
section, in your section's folder, and never touch another section's files. Keep going until every picture in your
section is in the Studio or blocked, or a real blocker stops you (section 6).

| Phase | Chapters | Pictures | Left when cut |
|---|---|---|---|
| 1 | Genesis 1 – 1 Samuel 9 | 727 | 415 (296 drawn by the first run, 16 blocked, 2 drawn but not yet checked) |
| 2 | 1 Samuel 10 – 2 Chronicles 20 | 417 | 417 |
| 3 | 2 Chronicles 21 – Psalm 95 | 415 | 415 |
| 4 | Psalm 96 – Jeremiah 6 | 417 | 417 |
| 5 | Jeremiah 7 – Micah 6 | 415 | 415 |
| 6 | Micah 7 – Acts 23 | 415 | 415 |
| 7 | Acts 24 – Revelation 22 | 407 | 407 |

The cut is fixed in `initiatives/chapter-scenes/sections.json`.

## 1. What this project is

A Bible study website project picks, for each of the 1,189 Bible chapters, 1 to 3 key scenes and writes a detailed
picture prompt for each (3,213 scenes, all written by Claude Haiku). The owner looks at them in a local web app, the
Chapter Summary Studio (http://127.0.0.1:8947: choose **Scenes** in the dark panel on the far left, then the
**Gallery** tab). There is one art style ("theme"), `painterly-realism`, and it is drawn by **headless Codex using
its built-in image tool on the owner's ChatGPT login**. That is this job.

Project root: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website`
Your section folder (N = your phase):
`D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website\.local\chapter-scene-studio\codex\painterly-realism\section-N`

| What | Where |
|---|---|
| Background and design | `initiatives/chapter-scenes/README.md` (project root) |
| The theme and its style text | `initiatives/chapter-scenes/themes.json`, entry `painterly-realism` |
| **Your manifest: your section's pictures, one entry each** | `section-N\manifest.json` |
| Your tools (ready, tested) | `section-N\runner.py`, `finalize.py`, `reject.py`, `block.py`, `watch.py` |
| Where each original goes (the entry's `output`) | `section-N\originals\haiku\<BOOK>-<chapter>-<scene>.png` |
| Your batch logs and reports | `section-N\batches\<batch>\` (the runner creates them) |
| Your progress notes (the runner and your tools append to it) | `section-N\progress.md` |
| Studio import and status | `scripts/codex_pictures.py` (project root, system `python`) |
| The first single run's files (history; do not write there) | `painterly-realism\` itself: `manifest-before-sections.json`, `batches\`, `progress.md`, its helper scripts |
| Codex's image skill (each worker reads it) | `C:\Users\lcladm\.codex\skills\.system\imagegen\SKILL.md` |
| Where Codex saves what it generates (keep them) | `C:\Users\lcladm\.codex\generated_images\<thread id>\exec-*.png` |

## 2. The manifest

Each entry, in Bible order, in batches of 3 (`b001`, `b002`, ... numbered within your section):

| Field | Meaning |
|---|---|
| `id` | e.g. `haiku/GEN-22-0`: writer / book code - chapter - scene index (0-based) |
| `key`, `writer`, `scene`, `title`, `verses` | which scene this is |
| `prompt` | **the exact text to draw**: the theme's style, a blank line, `Scene: ` and the scene's prompt |
| `sha` | the Studio's hash of that prompt; do not edit |
| `output` | the absolute path where the original PNG must end up |
| `status` | `pending` → `generated` (file saved) → `verified` (you checked it) → `in_studio` (imported). Or `blocked` |
| `attempts`, `session_id`, `artifact`, `file_sha256`, `last_error` | filled by the tools |

Change the manifest **only through the tools** in your folder (they write it whole, safely, and refuse while a worker
runs). `python scripts/codex_pictures.py status --theme painterly-realism --section N` (from the project root) counts
your statuses. `... manifest --theme painterly-realism --section N` rebuilds it, keeping every entry's progress; use
it only if the file is lost or damaged.

## 3. How Codex is called (proven, already built into runner.py)

`runner.py` launches one headless worker per batch with the proven method: the Codex executable from the VS Code
extension (it falls back to the newest one if the folder changed), `exec --json --ignore-user-config
--skip-git-repo-check --sandbox workspace-write -c approval_policy="never" -c forced_login_method="chatgpt" -c
allow_login_shell=false -c windows.sandbox="elevated" -C <your section folder> -o <batch>\result.txt -`, the worker
prompt on stdin, events to `events.jsonl`, `OPENAI_API_KEY` removed, a 900-second deadline, and only one worker per
section at a time. Reference for the method: `D:\FortressOfSolitude\.tmp\run_headless_eden.py`.

- Windows: shell commands go through `C:\Windows\System32\cmd.exe` with login off. **PowerShell is blocked by
  Bitdefender.** Do not disable antivirus, add exclusions or bypass the sandbox.
- No API key and no Images API, ever; never the imagegen skill's CLI fallback; never paid API billing; not the
  Fortress Orchestrator.
- Each worker reads about 100,000 tokens of the owner's ChatGPT plan, and 7 sections run at once, so usage limits and
  "at capacity" answers are likely. Section 6 says what to do.

## 4. The worker prompt (one per batch of 3)

`runner.py` reads this block from this file and fills in the three entries. Do not change it.

```
You are making 3 pictures for a Bible study project, one native image-generation call per picture. First read and
follow C:\Users\lcladm\.codex\skills\.system\imagegen\SKILL.md and use its built-in image_gen tool (default mode).
Never use its CLI fallback, an API key, or the Images API. Never reuse existing images, stock images, SVG or images
drawn with code. Do not install anything or start other agents. Use cmd.exe with login off for shell commands;
PowerShell is blocked on this machine. Write only inside your working directory.

For each picture below, in order:
1. Call the image tool once with the PROMPT exactly as given. Ask for a wide landscape picture, 16:9 if the tool
   allows it, otherwise its widest landscape size. No text, letters, captions, signatures or watermarks in the
   picture.
2. As soon as it is generated, copy the generated file (keep the original where the tool saved it) to the OUTPUT path
   with cmd.exe `copy /B`, creating the folder first with `mkdir` if needed. Do this before starting the next
   picture.
3. If a call fails, retry that picture once. If it fails again, report the exact error and move on.

At the end, report for each picture: ID, OUTPUT path, the original generated file's full path, and done or failed
with the exact error.

PICTURE 1
ID: <id>
OUTPUT: <output>
PROMPT:
<prompt>

PICTURE 2
...

PICTURE 3
...
```

## 5. The loop (run every command from your section folder, with the system `python`)

1. **Start / restart: reconcile.** `python runner.py` with no batch. It refuses if a worker of your section is still
   running (then wait for it; never start a second attempt at a picture that might still be drawing) and prints
   `NEEDS_VISUAL <id>` for any saved picture not yet checked. Check those first (steps 4–5) using their `batch`.
2. **Pick the next batch:** the lowest batch with an entry that is `pending` and has fewer than 3 attempts.
3. **Draw it:** `python runner.py bNNN`. It returns when the worker ends or after 900 seconds, printing `GENERATED`
   lines. If it prints `CAPACITY`, see section 6.
4. **Look at every new picture yourself** (open the image file at its `output`). Pass it only if it shows the entry's
   `title` and `prompt`: the right event, people and key details (numbers that matter, who does what, which way
   people face or move), the painterly style, **no text, letters or inscriptions anywhere** (tablets, plates, scrolls
   and signs must be blank or illegible), and nothing grossly wrong (extra limbs, melted faces, blank or unrelated).
   - Fail: `python reject.py <id> "<what is wrong>"`. It moves the file aside and puts the entry back to `pending`
     (or `blocked` after its third attempt). The next `python runner.py bNNN` redraws it.
   - Refused by OpenAI's safety system twice (`moderation_blocked`): `python block.py <id> "<the exact error>"`.
5. **Record the passes and import:** write `batches\bNNN\visual-reviews.json` as `{"<id>": "<one line on what you
   saw>", ...}` for the pictures that passed, then `python finalize.py bNNN`. It re-checks each file, finds its
   original in `.codex\generated_images`, marks it `verified`, imports it into the Studio (cropped to 16:9, plus the
   gallery copy), writes `report.md` and a progress line. If it says "not imported", read why and fix the cause.
6. **Go straight to the next batch.** Do not stop after one batch, and do not wait for anything else.

## 6. Problems

- **"At capacity" / too many requests** (the runner prints `CAPACITY`; the attempts are given back): wait 5 minutes and
  run the same batch again; then 10, then 20 minutes. After 4 capacity pauses in a row, stop and report it.
- **Timeouts or network errors:** wait 60, then 120, then 240 seconds and retry.
- **Stop the whole section at once, without retrying,** when the runner prints `BLOCKER`: a usage limit or quota
  message, a login or authentication error, the image tool being unavailable, or a permission or sandbox refusal. The
  runner writes `blocker.txt` and leaves the batch's undrawn entries `pending` with the attempt not counted, so a
  later restart of the phase simply carries on. Report the exact message and stop.
- An entry that keeps failing (3 attempts) becomes `blocked`: record the reason and carry on with other entries.

## 7. Never

- Never touch another section's folder, the first run's files, or `manifest-before-sections.json`.
- Never change code in `scripts/`, `themes.json`, `sections.json`, the scenes, or the database by hand (the import
  script is the only writer of pictures into the Studio).
- Never delete pictures or anything under `.codex\generated_images`; rejected pictures are moved aside, not deleted.
- Never run `scripts/chapter_pictures.py` or `scripts/chapter_scenes.py`.
- Never stop the Studio or any process that is not a worker of your own section.
- Never change global Codex settings (`~\.codex\config.toml`) or git state (no commit, push, stash, reset), and never
  publish anything.

## 8. When finished

Report, in plain words: your phase and its chapters, pictures in the Studio / your section's total, the `blocked`
entries with their reasons, and your section folder's path. The owner checks the pictures in the Studio:
http://127.0.0.1:8947 → **Scenes** → **Gallery** → **Finished** or **▶ Speed run**.
