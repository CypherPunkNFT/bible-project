# Faith under pressure design

Study 03 · First design draft · Owner review pending · 2026-10-13

## Direction

Offer six clear ways into the letters' accounts of difficulty. Keep **the situation, the response and the ground for hope** together in each reading. These are distinct situations, not successive stages of a journey or measures of stronger and weaker faith.

Use [the completed content](content.md) and its [passage notes](passage-notes.md) as the wording and interpretation base. Preserve all six readings, their order, explanations and reflections. Continue the direct card disclosures proposed in [Life together](../life-together/design.md), but give this study a quieter visual rhythm and its own passage-context treatment. This is a reviewable specification, not a site implementation.

## Opening and artwork

Align the opening and subsequent sections with the shared content margins. Keep the site header stable through page transitions. The opening contains **Living the Christian Life**, a prominent **Faith under pressure**, and the existing subtitle **Endurance in trials. Help in temptation. Hope in sorrow.** Keep the number subordinate and typographically consistent with its adjacent label.

On wide screens, place the two existing introductory paragraphs beneath the title on the left. Give the full 1 Peter 5:7 quotation its own surface on the right, with its reference and KJV label. Its Scripture action opens 1 Peter 5:6–10, keeping care, humility and watchfulness in view. Retain the draft's 2 Corinthians 1:8–11 reference in the introduction; it is essential context for suffering beyond one's own strength.

Use an abstract sheltered-light illustration: a small warm light within two substantial curved forms, with a few quiet lines outside them. It represents care amid difficulty. Avoid a victorious summit, an ascending progress chart or a storm that visibly disappears when a card is clicked. Those would suggest an outcome or timetable the readings do not promise.

The artwork has definite shapes and readable edges, not a haze of transparent hairlines. A restrained hover glow can make the light more visible, but it does not pulse or respond to the reader's selections. Keep it away from the quotation's letters. On narrow screens, stack the quotation after the introduction and simplify the art before reducing the text size.

There is no full-screen opening or large empty band before the cards. Height follows the text and available width.

## Six independent reading cards

Show three columns and two rows on wide screens, two columns at intermediate widths, and one column on phones. All start closed. Each card has an icon, its existing number and title, one short question and a visible down arrow. Numbers indicate reading order, not levels of difficulty.

| Reading | Card question | Icon direction |
| --- | --- | --- |
| 01 Trials and endurance | Where does endurance find its direction? | A sturdy stem with visible roots |
| 02 Temptation | What helps us turn from wrongdoing? | A path with a clearly marked turn |
| 03 Anxiety and prayer | What concern can be brought before God? | Open hands beneath a small speech shape |
| 04 Persecution | What does suffering for doing good mean? | A steady light between opposing forms |
| 05 Grief and hope | How can hope accompany sorrow? | Two seated figures, neither elevated above the other |
| 06 Contentment | What sustains us in plenty and in need? | An open bowl beside a hand offering help |

Use filled silhouettes with a few substantial internal lines. Give the group one muted blue interaction accent and keep Scripture references gold. Do not colour grief or anxiety red, assign severity colours, or use reward-like treatment for endurance. Every card receives equal visual weight.

Headings use the display serif; questions and explanations use the ordinary body face. Reserve italic quotation styling for Scripture. Long card titles wrap naturally; each row can share a minimum height, but text is never truncated to force alignment.

## Reading panel and motion

The six cards control one shared panel immediately below the complete group. Selecting a card opens its reading directly, without subtabs or a page jump. Selecting the active card retracts it. Opening another reading replaces the existing one; it does not append six long panels.

A visible arrow communicates the closed state. Hover or keyboard focus strengthens it and adds a slight glow. The active card has an X and a clear selected edge. Repeat a labelled close control at the panel's top right and an upward-arrow circle at the bottom for someone who has read to the end.

Expand to natural height, then reveal the text with a short fade. For a switch, fade the outgoing text, adjust the height and reveal the replacement. Do not reserve the tallest reading's height. Initial prototype timing can follow the preceding designs: roughly 280–360 milliseconds for height changes and 120–160 milliseconds for text fades. Interruptions settle on the latest selection without queued animations.

Do not animate the artwork into calmness when opening Anxiety and prayer, or add celebratory effects after any reading. Motion communicates interface state only.

Closing while the cards remain visible leaves the viewport alone. Closing from the bottom returns the originating card to view only as far as needed, so the reader is not left among the footer. A panel close control returns keyboard focus to that card. Reduced-motion mode applies changes immediately and avoids animated scrolling.

Use an optional **Next reading** action that names its destination. Keep it subordinate to the reading and its reflection. Readers are free to choose another situation or close the study without completing a sequence. Scroll and swipe gestures never change the chosen reading automatically.

## The reading structure

At the top of the panel, show the reading's title, main passage references and close control. Follow with two content rows on wide screens: the two existing subdivisions side by side, then **Consider** and **Reflect**. Preserve paragraph order inside each subdivision. Allow shorter content to remain shorter rather than padding every reading to a fixed height.

Place each quotation within the explanation that introduces it. Use a separate gold reference line and KJV label. The reading should remain comfortable at approximately 55–70 characters per line. On phones, stack the first subdivision, second subdivision and reflection row in their reading order. The page itself scrolls; no internal vertical scrollbar is needed.

## Situation response and hope

Under the panel's title and references, use a compact three-part context strip. The complete proposed summaries are below. They are editorial summaries of the existing draft, not Bible quotations. All three parts are visible at once; no selector hides the reason for an instruction.

| Reading | Situation | Response in the reading | Ground for hope |
| --- | --- | --- | --- |
| Trials and endurance | Faith tested in difficulty | Persevere and ask for wisdom | God's generous giving and love — James 1:2–8; Romans 5:1–5 |
| Temptation | Desire drawing toward wrongdoing | Be watchful and turn away from idolatry | God's faithfulness — James 1:12–18; 1 Corinthians 10:1–14 |
| Anxiety and prayer | Concerns that need to be named | Bring requests to God; attend to thought and practice | God's care and peace in Christ — Philippians 4:4–9; 1 Peter 5:6–10 |
| Persecution | Suffering for doing good | Answer gently and continue doing good | A faithful Creator — 1 Peter 3:13–17; 4:12–19 |
| Grief and hope | Concern for believers who have died | Comfort one another | Jesus' death and resurrection and being with the Lord — 1 Thessalonians 4:13–18 |
| Contentment | Plenty, hunger and need | Learn contentment and receive help gratefully | Christ's strength and God's presence — Philippians 4:10–20; Hebrews 13:5–6 |

Use three adjacent surfaces of equal legibility. Avoid a numbered arrow chain: a response is not a technique that manufactures a promised result. Each strip belongs to its own reading. Do not display all six summaries as an extra large table before the cards, which would duplicate the navigation and bury the reading.

On phones, stack the strip's three parts and keep their labels visible. The full passage and explanation follow immediately. The strip provides orientation, not a substitute for reading the context.

## Preserve each reading's qualifications

**Trials and endurance:** Keep James's invitation to ask for wisdom close to the discussion of testing. Show Romans 5's peace with God and grace before its account of suffering and hope. Do not render the sequence as a personal growth meter or imply that visible composure measures faith.

**Temptation:** The warning in 1 Corinthians 10:12, assurance in verse 13 and instruction in verse 14 stay in the same visible subsection. Keep the comparison with 2 Corinthians 1 beside the explanation. Do not lift the assurance into a universal slogan about every hardship remaining within personal capacity.

**Anxiety and prayer:** Keep the KJV vocabulary explanation beside the quotation. Prayer, thought and practice remain together. Do not add symptom ratings, breathing timers, streaks or promises about when distress will stop. This reading is Scripture exposition and reflection; its design does not create a treatment tool.

**Persecution:** Keep the distinction between suffering for doing good and consequences of wrongdoing at normal body size in the second subdivision. No badge automatically validates a reader's conflict as persecution. The existing reflective question invites examination of what prompted it.

**Grief and hope:** Let the complete passage remain available, including resurrection and being gathered with the Lord. Keep the comfort-directed conclusion prominent. No grief-stage tracker, loss questionnaire or countdown belongs here. Do not replace the passage with a future-events chart; the study preserves its consoling purpose.

**Contentment:** Place Philippians 4:13 inside the discussion of hunger and plenty. Keep the Philippians' material support visible in the same reading. A prominent quotation must not detach Christ's strength from these circumstances or imply that receiving help is a failure of contentment.

These qualifications are already part of the content. Their placement is a reading decision, not a new block of generic warnings.

## Scripture navigation and conclusion

References open their surrounding passage with book, chapter, verse range and KJV clearly identified, reusing the existing Scripture interaction where suitable. Preserve the selected reading and scroll position while it is open. An explicit **Open in reader** action can navigate away; returning restores the study state. Disclosure clicks never change routes.

Retain the existing **Receiving and sharing comfort** conclusion after the reading area. Both paragraphs remain visible even when all cards are closed. Its 2 Corinthians 1 reference offers the full 3–11 range, retaining comfort, suffering beyond strength, reliance on God and help through prayer together.

Offer **Life together** as the previous study and **Prayer in the letters** as the next. Contextual links to the study of temptation or future hope should remain modest and related to the current passage. The conclusion should not disappear beneath another large card gallery.

## Accessibility and prototype checks

Use named disclosure buttons with expanded state and a controlled panel. Keep focus on the triggering card when it opens; provide a visible **Read this section** action to focus the panel heading. Both close controls need accessible names. Focus rings follow the control shapes and remain visible. Give touch controls at least 44 pixels of target area. No meaning depends on hover, colour or motion alone.

Begin with three columns around 1100 pixels of available content width, two at intermediate widths and one below approximately 640 pixels. Verify against real text rather than assuming these thresholds fit every screen. At 200 percent zoom, reflow text and context strips with no clipping or horizontal page overflow.

A later prototype must show the closed page; Anxiety and prayer open; Grief and hope open; a switch to a shorter reading; all three context-strip parts on a phone; close from the bottom; return from Scripture; keyboard operation; and reduced motion. Inspect at 390, 768, 1366 and 1440 pixels wide plus 200 percent zoom. Check contrast with the actual theme. These are acceptance criteria, not completed browser checks.

## Decisions and handoff

Retain 1 Peter 5:7 as the opening quotation. Keep receiving help within the existing introduction, Contentment and conclusion instead of introducing a seventh card. Preserve the six names and all reader-facing content. New proposals are the card questions, artwork, interface labels and passage-summary strips; they require editorial review before implementation.

This design draft is ready for review. No website routes, components, styles, generated data or publication change in this step. The design queue has since advanced. Consult [progress](../../progress.json) and [the workflow](../../WORKFLOW.md).
