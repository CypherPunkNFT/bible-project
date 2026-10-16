# Prayer in the letters design

Study 04 · First design draft · Owner review pending · 2026-10-13

## Direction

Keep the prayer whole. Let the reader notice its recipients, requests, reasons and surrounding thanksgiving without extracting each into an isolated quotation. The distinctive feature is a complete Scripture passage with a small set of adjacent reading notes. These notes guide attention while the text remains in its original order.

Retain the six themes in [the content draft](content.md). They are entry points into complete readings, not six fragments of a reconstructed prayer. The [passage notes](passage-notes.md) remain the guide to boundaries and reference ranges. This specification develops presentation and interaction for review; it does not implement or publish a page.

## Compact opening

Align the opening, cards, reading panel and conclusion with the site's shared content edges. Keep the site header stable during page transitions. The title **Prayer in the letters** is prominent, with **Living the Christian Life** above it and the existing line **Giving thanks. Making request. Seeking the good of others.** below. Use the same font family for the small study number and its adjacent label.

The two existing introductory paragraphs occupy the left side of a wide opening. The right holds the complete Colossians 4:2 quotation, its gold reference and KJV label. The reference offers Colossians 4:2–6, not only the isolated opening sentence. Stack these areas when the width no longer permits comfortable text measures.

The illustration is an open letter with a few strong lines and several small marks in its margin. Use warm paper-coloured shapes, a restrained gold edge and quiet blue annotation marks. The drawn lines are abstract decoration, not invented Scripture or simulated Greek. No handwriting animation or automatic typing. Hover may reveal a soft edge glow while the letter remains still.

Avoid a full-screen introduction or a separate large prayer banner before the cards. The art belongs to the opening; the complete passage reader belongs within the chosen theme.

## Six theme cards

Use three columns and two rows on wide screens, two columns at intermediate widths and one column on phones. Each closed card contains a filled icon, its existing title and number, a short question and a visible downward arrow. All begin closed. Preserve the order of the content draft.

| Theme | Card question | Icon direction |
| --- | --- | --- |
| 01 Wisdom and understanding | What does Paul ask believers to know? | An open book with a clear point of light |
| 02 Strength within | What strength is requested for the community? | A rooted plant inside a substantial open circle |
| 03 Growing in love | How does love grow with discernment? | A branching stem with two leaves |
| 04 A worthy walk | How does understanding become a way of life? | Two clear footprints continuing along a short path |
| 05 Thanksgiving | What already prompts thanks? | Open hands receiving a small gift |
| 06 Prayer for others | Whose good are we asked to seek? | Several figures joined by an open arc |

Use one warm gold selection accent across the group. Let icons and wording distinguish the subjects rather than six different colours. Scripture remains gold; annotation notes can use muted blue with sufficient contrast. Labels carry meaning independently of colour.

Card headings use the display serif and questions use the body sans serif. Filled shapes provide recognisable art at small sizes, with a few substantial internal details. Do not turn every icon into thin line art. Quotes alone receive the site's Scripture quotation styling; explanatory notes remain upright.

## Direct opening and closing

Use one shared reading panel after the full card group. Selecting a card opens that theme directly. Selecting the active card closes it; selecting another replaces its reading. Card selection does not navigate or scroll the document. Do not add a second menu for the two subdivisions within each theme.

Closed cards have visible down arrows that strengthen on hover and keyboard focus. The selected card has an X and a clear edge treatment. The panel provides a labelled close control at the top right and an upward-arrow circle at the bottom.

Expand to natural height and fade the text in. When switching, fade out the old content, adjust height and reveal the replacement. Start prototype tuning around 280–360 milliseconds for expansion and 120–160 milliseconds for fades. Do not reserve the height of the largest reading, use internal vertical scrolling or queue animations after rapid selections.

Closing near the cards preserves the viewport. Closing from the bottom makes the originating card visible with the smallest necessary adjustment, then returns focus to that card when a close control was used. Reduced-motion mode avoids animated scrolling and fading. Optional **Next reading** controls name the next theme; gestures and scroll wheels never switch it automatically.

## Whole passage with reading notes

At the top of an open theme, show the title and main passage references. The primary passage is available in full within the reading panel, using the existing KJV source. Keep verse order, verse numbers and all text visible. Do not substitute a string of highlighted extracts for the full reading.

On a wide screen, give Scripture approximately two thirds of the passage area and the notes the remaining third. Cap the text measure rather than stretching long verses across the full page. Use ordinary readable Bible text for the complete passage; reserve enlarged italic treatment for the draft's short anchor quotation. The complete passage needs neither oversized type nor a fixed-height scrolling box.

Beside the text, display four short notes where the passage supports them:

- **For whom:** the people addressed or prayed for.
- **What is asked:** the actual requests.
- **Why it is asked:** the stated purpose or desired result.
- **What gives confidence:** the divine action or character named in the passage.

These are editorial summaries with verse references. The headings should not force a passage to supply four equally sized answers. Thanksgiving or praise can appear as an additional note when it helps explain the prayer's movement. Do not invent a reason that the text does not state.

Selecting a note applies a restrained underline or edge marker to its associated verses in the same passage. It does not reorder the text, dim the remaining verses into illegibility or scroll to another part of the page. A note's verse reference remains usable without selecting it. Clicking the note again or using **Clear emphasis** removes the marker. Multiple ideas can share verses; do not imply every verse belongs to exactly one category.

On phones, place notes after the passage, with their verse ranges printed clearly. Disable distant hover effects rather than requiring readers to shuttle repeatedly between a note and an off-screen verse. Notes still function as explanations; their Scripture links can open the referenced context. The reading works fully without highlighting.

## Passage allocation

| Theme | Primary complete reading | Additional reading and presentation |
| --- | --- | --- |
| Wisdom and understanding | Ephesians 1:15–23 | Keep thanksgiving, requests and Christ's exaltation in one passage |
| Strength within | Ephesians 3:14–21 | Keep the closing praise with the requests it follows |
| Growing in love | Philippians 1:3–11 | Offer 1 Thessalonians 3:9–13 through a plainly labelled comparison disclosure |
| A worthy walk | Colossians 1:3–14 | Offer 2 Thessalonians 1:3–12 in full, including the setting before the prayer |
| Thanksgiving | Philippians 1:3–11 | Revisit the same passage with notes about thanksgiving; offer Colossians 1:3–14 alongside it |
| Prayer for others | 1 Timothy 2:1–6 | Show Ephesians 6:18–20 and Colossians 4:2–6 under their own passage headings |

Comparison disclosures have explicit passage names and visible arrows. They add a second whole text directly below the primary one and close with an X. They do not create another tab bar. Explanations of the comparison in the content draft remain visible even when the additional Scripture text is closed.

In **Prayer for others**, keep the three shorter passages in reading order, open by default. Label their roles: instruction to pray in 1 Timothy; instruction and a request for prayer in Ephesians; instruction and a request for prayer in Colossians. Do not label them as three reported prayers. The four-note scheme can adapt to **Who is included**, **What is requested**, and **The stated purpose** here.

Thanksgiving uses the same source passage text as the earlier readings. It changes the adjacent editorial emphasis, not the wording, range or order of Scripture. This lets the design answer the content outline's question about themes versus whole prayers: retain themes while making every encounter a whole-passage reading.

## Explanation and reflection

After the Scripture area, retain both existing explanatory subdivisions. On wide screens, arrange them as two columns, followed by a second row with **Consider** and **Reflect**. On phones, stack them in source order. These two content rows have natural heights; do not pad shorter explanations to match the longest theme.

Keep the anchor quotations with their explanations even when the verse also appears in the complete passage. Avoid a second decorative banner around the repeated quotation. This repetition serves exposition; it need not compete with the main reading surface.

In Ephesians 3, the note beside verse 20 must retain its connection to strength, love and fullness. In Philippians, thanksgiving and affection remain before the request for discerning love. In Colossians, God's saving action remains beside the worthy walk. Keep the setting in persecution, judgment and rest available in the Thessalonian comparison. Do not turn any of these prayers into a promise that a reader's chosen ambition will succeed.

Reflection prompts are visibly editorial application. Do not generate a personalised prayer from a form, introduce names to be saved, record prayer streaks or mark a request as completed. The study invites readers to consider an actual person or community without needing to collect their information.

## Conclusion and navigation

Retain **Learning to make request** after the reading area, visible even when every card is closed. Preserve its invitation to choose one complete prayer, notice thanks, requests and reasons, and pray with attention to a real person's circumstances. A short **Return to the readings** action can return to the card group when needed.

Offer **Faith under pressure** as the previous study and **Faith in daily life** as the next. Keep related-study links modest and attached to a relevant explanation rather than adding a competing gallery at the bottom.

The explicit **Open in reader** action navigates to the existing Bible reader. Returning restores the selected theme, comparison state and scroll position. Ordinary card and annotation selections never change the route. Use the established site transition and retain the header during navigation.

## Accessibility and verification plan

Use named disclosure buttons with expanded state and a controlled panel. Keep focus on a card when opening it, with a visible **Read this section** action for moving to the panel heading. Annotating a verse must not move keyboard focus away from the note. Give selected notes a programmatic pressed state and a visible marker, not colour alone. Bible text remains selectable and readable throughout.

Provide labelled close controls, clear focus rings and touch targets of at least 44 pixels. At roughly 1100 pixels of content width use three cards per row; below that use two, and below approximately 640 use one. Stack passage and notes before either becomes cramped. These are prototype starting thresholds rather than guarantees about every device.

A later prototype must demonstrate: closed cards; Ephesians 1 open with one note selected; emphasis cleared; a comparison opened and retracted; Thanksgiving revisiting Philippians; the distinct instruction/request presentation in Prayer for others; a short-to-long theme switch; close from the bottom; keyboard access; reduced motion; and return from the Bible reader. Inspect 390, 768, 1366 and 1440 pixel widths and 200 percent zoom. Verify contrast, full passage ranges, annotation references and absence of horizontal overflow. These checks have not been performed by writing this specification.

## Decisions and handoff

Retain all six theme names and the existing Colossians 4:2 opening quotation. Add a whole-passage presentation and adjacent editorial notes without rewriting the source content. Exact annotation wording and verse mappings must be checked against the KJV during prototyping; the categories specified here are not a finished annotation dataset. No new prayers outside the content draft's selected readings are added.

This first design draft is ready for review. No routes, components, styles, generated data or publication change in this step. The design queue has since advanced. Consult [progress](../../progress.json) and [the workflow](../../WORKFLOW.md).
