# Written — questions written for the site from the BSB

The owner, 23 October 2026: "we're gonna have to start creating our own questions and our own answers", through
several independent reviews, with parallel writers that never write the same questions.
[question_writing.py](../../../scripts/question_writing.py) writes them one **BSB section** at a time: the BSB's own
headings ("The Creation", "Cain and Abel") divide the Bible into 3,016 sections. [writing-map.json](writing-map.json)
lists each one with its verses, its related sections, how many shown questions already land in it (1,396 had none),
and how many to write: one per 60 words of text, two to eight, less those already asked.

**[written.json](written.json)** holds every question written, as the bank "Written for the site from the BSB", each
with its section, cited verses and the full review history; rejected ones are kept too, with the stage and the reason.

**6,414 written questions are shown**, every one checked against the BSB twice (Claude Sonnet, then Claude Opus) and
grounded in Scripture.

## No overlap by construction

One call owns one section, and every question must cite verses inside it, so two calls never write from the same
verses. Each call is shown the questions the site already asks about its section. Sections the BSB links as related
passages ("(Mark 1:1-8; Luke 3:1-18)") wait for each other in Bible order, five waves in all (Matthew before Mark
before Luke), and each writer is shown what was written for its linked sections. What still repeats is caught by the
repeat check over the whole bank, which hides a written question behind any bank question it repeats.

## Five checks, or rejected, never patched by hand

1. the script's own rules ([question_writing_gate.py](../../../scripts/question_writing_gate.py)): the cited verses lie
   in the section; every name and number of the answer is in them exactly ("75" is not "seventy-five") and most of its
   other words; quotations word for word; four distinct choices, no "all of the above"; no King James wording; it
   names whom it is about; it does not hold its answer; the right choice is not plainly the longest;
2. a blind quiz with the section's text: another model must pick the writer's answer and call no other choice right
   by the section or anywhere in the Bible ([question_writing_review.py](../../../scripts/question_writing_review.py));
3. a blind quiz with no text at all: the question must be clear on its own, and no other choice right anywhere;
4. the site's own BSB check ([../checks/](../checks/README.md#checked-against-the-bsb)), by a fresh model. A suggested
   fix sends the fixed wording through every check once more; a second fault rejects it;
5. after publishing, grounding as for every question: a written question it finds is not answered by Scripture, or
   whose answer it doubts, is hidden.

## The runs

**The pilot, 23 October 2026** (15 sections): Claude Sonnet wrote 54 questions; 44 passed every check. $0.31.

**The full run, 23 October 2026** (owner: "do a good job and fill everything out", then "no caps"). Every BSB section
with something to write, in five waves, run unattended by [question_writing_run.py](../../../scripts/question_writing_run.py)
(`.local/question-writing/full-w1` to `full-w5`):
- **8,020 written** with the pilot, **6,670 passed every check**, 1,350 rejected. In wave 1, the script's rules
  rejected 778 (an answer over 12 words 334, the right choice plainly the longest 265, the answer's words not in the
  cited verses 149), the blind quiz with the text 208, without it 68, and the BSB check 11.
- The repeat check then hid 242 as repeats, and grounding hid 7 whose answer it doubted.
- **A second check by Claude Opus at high effort** of all 6,425 shown: 6,125 kept, 300 fixed (a wrong choice also
  right 158, a question giving its answer away and other 88, a misquote 43, other translation's wording 28, the
  reference 4, an imprecise answer 3). It found no answer that was simply wrong. 7 fixes failed the writing rules and
  were hidden; the 128 reworded were grounded again.
- Cost at list price on the Max plan: writing and reviews $254.90, the Opus check $119, follow-ups about $10.

## Codex (ChatGPT) on the owner's subscription

Owner, 23 October 2026: can Codex run on a subscription too? **Yes, measured the same day** with 14 small calls:

- **Signed in with ChatGPT, not an API key.** Codex is the OpenAI extension in VS Code (`codex-cli 0.162`), on ChatGPT
  Pro with a weekly Codex allowance (3% used at the time, resetting 29 October 2026 at 16:05). The account has no paid
  credits, so reaching the limit stops the work; it never buys more.
- **Runs headless,** one call at a time with no chat window (`codex exec`).
- **Minimal calls.** Codex always sends its own instructions and tools: 14,479 tokens for a one-word prompt. These
  options bring it to its floor of about 4,500 tokens (against under 1,000 for Claude through BatchRunner):
  - `--ignore-user-config --ignore-rules --ephemeral -s read-only --skip-git-repo-check`;
  - every optional feature off (`--disable` each one `codex features list` shows on);
  - `-c model_instructions_file=TASK` replaces Codex's own instructions with the task;
  - `-c include_permissions_instructions=false -c include_environment_context=false -c include_apply_patch_tool=false
    -c web_search="disabled"`.
- **Models:** GPT-6-Luna (fast, like Haiku), GPT-6.1-Sol (the workhorse, like Sonnet), GPT-6-Astra (the frontier
  model); `-m` sets it, `-c model_reasoning_effort=low|medium|high` the effort.
- **The site's reply format works** (`--output-schema` with the writers' schema.json, `-o` for the reply); four calls
  at once ran in 4 seconds; each saved call's session log carries `rate_limits`, so a runner can stop before the limit.

**The real job, once** (the writers' exact instructions, the section "Rebekah Is Chosen", Genesis 24:15-61, scored by
the site's script checks in `.local/question-writing/codex-test/`): GPT-6-Luna 4 of 4 passed in 6 seconds;
GPT-6.1-Sol 3 of 4 in 31 seconds, the fourth rightly refused ("She agreed to go" is not in the verse, which says "I
will go").

**Why it matters:** every reviewer of a written question so far is a Claude model checking another Claude model. A GPT
model taking the blind quizzes (checks 2 and 3) would be truly independent, and would run on the ChatGPT plan.
**Next:** a runner for `codex exec` beside BatchRunner (one call per item, several at once, resume after a stop, stop
when the weekly allowance nears its limit).
