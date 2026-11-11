# Redesign: Bible twenty questions (/games/twenty-questions)

**Written:** 11 November 2026, from the audit [twenty-questions.md](twenty-questions.md) and the shared brief [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md). Before-screenshots are in [twenty-questions/](twenty-questions/), after-screenshots in [twenty-questions/after/](twenty-questions/after/), named the same way so they pair up. My step's own brief and the shared brief did not disagree; the one thing my brief adds is that both modes keep working and the question selection and the character tags are untouched, and they are.

## 1. What changed

The game now has someone on the other side of the table. The thinking head from the start screen sits beside every question, in the game's teal, and its cloud reacts to each answer: a tick draws in for Yes, a cross for No, the question mark wobbles for Don't know, and from the fifteenth question three dots pulse while it thinks hard. Each new question slides in. The three answer buttons show their keyboard letters on a desktop, press down under the finger, and leave a short gold wash (Yes), a teal edge flash (No) or a soft grey wash (Don't know). When the site is ready to guess, the turn dots pulse gold, the cloud lights up with an exclamation mark and "I think I know…", and a beat later a card scales in with the name in large serif, the person's one-line brief, and "Yes, that's them!" in gold. Winning fills the dots gold one after another, bursts a little gold-and-cream confetti over the head, and counts "Got it in 17!" up from one. Losing gives the player the same burst under "You win!", because they beat the site. Where the answers and the notes disagreed, the lesson is now one card at a time with "2 of 5" in the corner, the question in serif, "You said" in red and "Our notes say" in teal, and the verse under them.

In "You ask the questions", the people still possible are a suspect board: a grid of small name cards under their count, and each answer turns the cards it rules out face down and shrinks them away while the next names fill in, so the net closing is something you watch. The log is an exchange rather than a transcript: the question in a quiet voice, the answer in large teal serif under it, the newest sliding in at the top, a wrong guess as a struck-through name. On a phone the question list no longer scrolls inside the page; the page scrolls, and the newest answer lands in a band pinned to the bottom of the screen with its "Why?" verse folded inside, so it is never above the list. The ending shows your trail of turns and, under it, the trail the site would have needed, so the comparison is a picture rather than a sentence; a win gets the burst. Quit asks in the site's own dialog instead of two inline links. Rules, data, scoring, saved games, the anonymous report, the address and the keys Y, N, D, U and Enter are unchanged.

## 2. The audit's list, item by item

1. **Bring the thinking head onto the question screen and let it react.** Built as asked. The drawing is a small copy of the hub's head and cloud (its own file, so the hub art is untouched), hidden from screen readers, with a tick, cross, wobble, dots and flash by mood, and the cloud bobs slowly on every screen so nothing plays once and stops. The question fades and slides in on each turn.
2. **Make the guess a reveal.** Built as asked. The trail pulses gold three times, the cloud lights up once (the one glow the rules allow, for a moment), "I think I know…" appears, and the card arrives a third of a second later. The guess buttons live inside the card, in a different place and shape from the answer buttons, so a stray second tap on Yes or No cannot answer the guess by mistake. Won: the dots fill gold in turn, one confetti burst, the count-up. Lost: "You win!" gets the burst too.
3. **Turn "People still possible" into a suspect board.** Built as asked, with the first forty names as cards and "and 104 more" under them. Eliminated cards flip face down and shrink in place, held for less than a second and then dropped; under reduced motion they are simply gone. This replaces the 218-row inline list.
4. **Make the log a conversation.** Built differently. The owner's rules forbid chat bubbles, so the exchange is shaped with type instead: the question in muted sans, the answer in large teal serif under it, a hairline between turns, the newest sliding in at the top, a wrong guess as "No, it isn't" with the name struck through. The "Why?" verse folds out of the answer.
5. **Give the three answer buttons character.** Built as asked: key tags (shown only on screens with a mouse), press-down scale, a gold wash with Yes, an edge flash with No, a grey wash with Don't know. Keyboard answers skip the wash, since there is no button under a key.
6. **Fill the phone's empty middle in guess mode.** Built as asked: the head and the question are centred in the space between the trail and the buttons, which stay at thumb height.
7. **Shape the lesson screen as cards you swipe or tap away.** Built as tap-away cards (no swipe: a swipe would have no keyboard equal). One disagreement at a time with "3 of 8", the two choices under it, and when all are answered a fold-out "What we went over" and the thanks line.

**My own additions.** The site's own route drawn as a second trail on the reverse-mode ending, so "the site would have needed about 9 turns" is also a row of dots next to yours. Quit through the kit's confirm dialog, which also keeps the letter keys quiet while it is open. The reverse-mode head reacts to the site's own answers (tick, cross, wobble) so the mode has a face too. The hint bars now say in words what they show ("Splits them almost in half"), for touch and screen readers.

## 3. Faults fixed

- The question list was a scroll box inside a scrolling page on phones: the inner scroll is gone, the page scrolls.
- The answer landed above the list, under the sticky header: on phones the newest answer is in a band pinned to the bottom of the screen, with its verse.
- The people list was a full-screen wall of 144 rows: it is a board of forty cards and a count.
- Tapped buttons kept their hover ring on phones: hover styles now apply only on screens with a mouse.
- The lesson screen was three screens of pills: it is one card at a time.
- Keyboard focus was invisible on every game button: focus now lifts the button and colours its edge, the same as hover, with no outline.
- The keyboard shortcuts were invisible: Y, N and D are printed on the buttons on a desktop.
- The hint bars explained themselves only by tooltip: they now carry words.
- The "nobody by that name" end after a loss read like an error: the two empty-list lines are softer and point to the way out.
- Not fixed, and not visual: the Easy game whose secret is James son of Zebedee still says the site could not find him in 20 turns, because that is true of the notes. The wording stays.

## 4. Before and after

| Stage | Before (desktop) | After (desktop) | Before (phone) | After (phone) |
|---|---|---|---|---|
| Start | [desktop-01](twenty-questions/desktop-01-start.png) | [after](twenty-questions/after/desktop-01-start.png) | [phone-01](twenty-questions/phone-01-start.png) | [after](twenty-questions/after/phone-01-start.png) |
| First question | [desktop-05](twenty-questions/desktop-05-guess-first-question.png) | [after](twenty-questions/after/desktop-05-guess-first-question.png) | [phone-05](twenty-questions/phone-05-guess-first-question.png) | [after](twenty-questions/after/phone-05-guess-first-question.png) |
| Mid play | [desktop-08](twenty-questions/desktop-08-guess-mid-play.png) | [after](twenty-questions/after/desktop-08-guess-mid-play.png) | [phone-08](twenty-questions/phone-08-guess-mid-play.png) | [after](twenty-questions/after/phone-08-guess-mid-play.png) |
| Thinking hard | [desktop-09](twenty-questions/desktop-09-guess-thinking-hard.png) | [after](twenty-questions/after/desktop-09-guess-thinking-hard.png) | [phone-09](twenty-questions/phone-09-guess-thinking-hard.png) | [after](twenty-questions/after/phone-09-guess-thinking-hard.png) |
| The guess | [desktop-10](twenty-questions/desktop-10-guess-the-guess.png) | [after](twenty-questions/after/desktop-10-guess-the-guess.png) | [phone-10](twenty-questions/phone-10-guess-the-guess.png) | [after](twenty-questions/after/phone-10-guess-the-guess.png) |
| Won | [desktop-11](twenty-questions/desktop-11-guess-won.png) | [after](twenty-questions/after/desktop-11-guess-won.png) | [phone-11](twenty-questions/phone-11-guess-won.png) | [after](twenty-questions/after/phone-11-guess-won.png) |
| Don't-know hint | [desktop-13](twenty-questions/desktop-13-guess-dont-know-streak-hint.png) | [after](twenty-questions/after/desktop-13-guess-dont-know-streak-hint.png) | [phone-13](twenty-questions/phone-13-guess-dont-know-streak-hint.png) | [after](twenty-questions/after/phone-13-guess-dont-know-streak-hint.png) |
| Out of questions | [desktop-14](twenty-questions/desktop-14-guess-out-of-questions.png) | [after](twenty-questions/after/desktop-14-guess-out-of-questions.png) | [phone-14](twenty-questions/phone-14-guess-out-of-questions.png) | [after](twenty-questions/after/phone-14-guess-out-of-questions.png) |
| You win, who was it | [desktop-17](twenty-questions/desktop-17-guess-lost-who-was-it.png) | [after](twenty-questions/after/desktop-17-guess-lost-who-was-it.png) | [phone-17](twenty-questions/phone-17-guess-lost-who-was-it.png) | [after](twenty-questions/after/phone-17-guess-lost-who-was-it.png) |
| The lesson | [desktop-20](twenty-questions/desktop-20-guess-lost-it-was-lesson-fullpage.png) | [after](twenty-questions/after/desktop-20-guess-lost-it-was-lesson-fullpage.png) | [phone-19](twenty-questions/phone-19-guess-lost-it-was-lesson.png) | [after](twenty-questions/after/phone-19-guess-lost-it-was-lesson.png) |
| Name not in list | [desktop-22](twenty-questions/desktop-22-guess-lost-not-in-list.png) | [after](twenty-questions/after/desktop-22-guess-lost-not-in-list.png) | [phone-22](twenty-questions/phone-22-guess-lost-not-in-list.png) | [after](twenty-questions/after/phone-22-guess-lost-not-in-list.png) |
| Reverse, empty | [desktop-24](twenty-questions/desktop-24-reverse-empty.png) | [after](twenty-questions/after/desktop-24-reverse-empty.png) | [phone-24](twenty-questions/phone-24-reverse-empty.png) | [after](twenty-questions/after/phone-24-reverse-empty.png) |
| Reverse, two answers | [desktop-25](twenty-questions/desktop-25-reverse-two-answers.png) | [after](twenty-questions/after/desktop-25-reverse-two-answers.png) | [phone-25](twenty-questions/phone-25-reverse-two-answers.png) | [after](twenty-questions/after/phone-25-reverse-two-answers.png) |
| Why? open | [desktop-26](twenty-questions/desktop-26-reverse-why-open.png) | [after](twenty-questions/after/desktop-26-reverse-why-open.png) | [phone-26](twenty-questions/phone-26-reverse-why-open.png) | [after](twenty-questions/after/phone-26-reverse-why-open.png) |
| Hints on | [desktop-27](twenty-questions/desktop-27-reverse-hints-on.png) | [after](twenty-questions/after/desktop-27-reverse-hints-on.png) | [phone-27](twenty-questions/phone-27-reverse-hints-on.png) | [after](twenty-questions/after/phone-27-reverse-hints-on.png) |
| People still possible | [desktop-28](twenty-questions/desktop-28-reverse-people-possible-open.png) | [after](twenty-questions/after/desktop-28-reverse-people-possible-open.png) | [phone-28](twenty-questions/phone-28-reverse-people-possible-open.png) | [after](twenty-questions/after/phone-28-reverse-people-possible-open.png) |
| Guess box | [desktop-31](twenty-questions/desktop-31-reverse-guess-box.png) | [after](twenty-questions/after/desktop-31-reverse-guess-box.png) | [phone-31](twenty-questions/phone-31-reverse-guess-box.png) | [after](twenty-questions/after/phone-31-reverse-guess-box.png) |
| After a wrong guess | [desktop-32](twenty-questions/desktop-32-reverse-after-wrong-guess.png) | [after](twenty-questions/after/desktop-32-reverse-after-wrong-guess.png) | [phone-32](twenty-questions/phone-32-reverse-after-wrong-guess.png) | [after](twenty-questions/after/phone-32-reverse-after-wrong-guess.png) |
| Reverse won | [desktop-33](twenty-questions/desktop-33-reverse-won.png) | [after](twenty-questions/after/desktop-33-reverse-won.png) | [phone-33](twenty-questions/phone-33-reverse-won.png) | [after](twenty-questions/after/phone-33-reverse-won.png) |
| Reverse lost | [desktop-36](twenty-questions/desktop-36-reverse-lost.png) | [after](twenty-questions/after/desktop-36-reverse-lost.png) | [phone-36](twenty-questions/phone-36-reverse-lost.png) | [after](twenty-questions/after/phone-36-reverse-lost.png) |
| Continue after reload | [desktop-38](twenty-questions/desktop-38-start-continue-after-reload.png) | [after](twenty-questions/after/desktop-38-start-continue-after-reload.png) | [phone-38](twenty-questions/phone-38-start-continue-after-reload.png) | [after](twenty-questions/after/phone-38-start-continue-after-reload.png) |
| Light, start | [desktop-40](twenty-questions/desktop-40-light-start.png) | [after](twenty-questions/after/desktop-40-light-start.png) | [phone-40](twenty-questions/phone-40-light-start.png) | [after](twenty-questions/after/phone-40-light-start.png) |
| Light, question | [desktop-41](twenty-questions/desktop-41-light-guess-question.png) | [after](twenty-questions/after/desktop-41-light-guess-question.png) | [phone-41](twenty-questions/phone-41-light-guess-question.png) | [after](twenty-questions/after/phone-41-light-guess-question.png) |
| Light, reverse | [desktop-42](twenty-questions/desktop-42-light-reverse.png) | [after](twenty-questions/after/desktop-42-light-reverse.png) | [phone-42](twenty-questions/phone-42-light-reverse.png) | [after](twenty-questions/after/phone-42-light-reverse.png) |

New stages with no before: the Yes wash just after an answer (45), the board a moment after an answer rules people out (47), a focused answer button (48), and the light-theme guess, win and reverse full page (43 to 46).

## 5. Checks

All run from the Website folder after the last change, with the native runtimes.

| Check | Command | Result |
|---|---|---|
| The game's tests, the hub's and the kit's | `npx vitest run src/pages/games/twenty-questions src/pages/games/games.test.tsx src/pages/games/kit` | 11 files, 116 tests passed, 0 failed (new: the board's sums, the thinker's mood, the lesson stepper, the quit dialog) |
| Types | `npm run typecheck` | exit 0 |
| Lint | `eslint src/pages/games/twenty-questions src/pages/games/kit --max-warnings 0` | 0 errors, 0 warnings |
| English check | `py -3.12 content/translation/english_build_check.py` | 0 unregistered, 0 new |
| Build | `npm run build` | exit 0, four times (the last after the final change) |
| Play-through | Playwright on the preview at 1440 and 390, dark and light, from a fresh storage: start, a right answer, a wrong answer, Undo, Quit, the don't-know hint, the guess, the win, the loss with the lesson and a disputed note, a name not in the list, both reverse-mode endings, hints and the board, the guess box, Continue after a reload, the keys Y, N, D and U | 97 after-screenshots; no sideways scroll at either size; every button in the game at least 44 pixels (the only smaller control is the site's own "All games" link); the only console errors are the anonymous end-of-game report's 404, because the local preview has no worker to receive it (the audit saw the same post) |

Two notes on method. Playwright's own click (move the mouse, wait, scroll into view, retry) fought the answer buttons' hover lift and scrolled the page under the sticky header, so the play-through sends the click event straight to the buttons the way a tap does; a real click in the browser, checked by hand in the same run, does not scroll. The phone screenshots are a desktop browser at 390 wide, so the "No" button in some of them still wears its mouse-hover edge; on a phone, where there is no mouse, that style no longer applies.

**Commit:** 21ec6b510 on main, pushed to origin (the hash is recorded in a small follow-up commit). Nothing released or deployed.

## 6. Left for later

- Sound: not added; the game never needed it and the brief leaves it optional.
- A swipe on the lesson cards: they are tapped away, which has a keyboard equal; a swipe does not.
- The hint count still counts the whole pool on Easy, as the design says; the board shows it honestly.
- The James son of Zebedee wording in reverse mode is a notes problem, outside a visual redesign.
