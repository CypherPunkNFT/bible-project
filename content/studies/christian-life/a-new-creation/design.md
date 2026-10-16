# A new creation design

Study 01 · First design draft · Owner review pending · 2026-10-13

## Direction

A passage-led study connecting what God has done in Christ with the life believers are called to live. Its defining interaction is a comparison of **what to put away, what to practise, and the reason the passage gives**. The reason remains visible alongside the change; conduct must not look detached from grace, shared membership or forgiveness received.

This specification develops [the completed content](content.md). It preserves the six section names, order, explanations, Scripture references and reflection prompts. It proposes presentation and behaviour for review; no site implementation or publication is included.

## Opening

Use the same content edges as the site's header and neighbouring study sections. A compact opening has the category **Living the Christian Life**, the title **A new creation**, and the existing line **What God has made new. The life we are called to live.** Keep the title prominent, with its number subordinate and in the same font family. Do not add an extra instruction heading above it.

On a wide screen, the title and short introduction occupy the left of the opening, with the opening Scripture on the right. The full two-paragraph introduction remains available here, in ordinary body type. The right-hand surface contains the complete existing quotation of 2 Corinthians 5:17, its reference and KJV label. The reference offers the surrounding paragraph, 5:14–21. This prevents the large verse from becoming isolated from its argument.

The accompanying art is a small woven-cloth motif: overlapping threads, a loose edge and a more ordered weave. Use definite shapes and a few substantial lines, with gold highlights against the dark surface. It refers to the study's clothing language without presenting renewal as an instantaneous mechanical process. Keep it behind or beside the quotation's empty space, never behind the letters. A faint settling of the threads on hover may be explored; the text remains stationary. No continuous motion.

The opening should lead into the six cards without a large empty band. Do not impose full-screen height on the introduction or any reading. On a laptop, the next choices should be visible soon after the introduction; exact first-screen fit depends on font size and viewport height and must be checked in a later prototype.

## Six reading cards

Use a three-column, two-row arrangement on a wide screen. All six are initially closed. Each card has a substantial icon, its number, its existing name, one short question and an expand control. Within a row the cards share a minimum height; titles can wrap naturally without clipping. Long descriptions remain in the reading panel.

| Order and name | Short question | Art direction |
| --- | --- | --- |
| 01 In Christ | What has God made new? | A complete ring with an illuminated centre; abstract and quiet |
| 02 The old and the new | What do the letters tell us to put off and put on? | Two overlapping folds of cloth, one receding and one illuminated |
| 03 Words that build up | What do our words give the hearer? | A speech shape made of three solid, rising blocks |
| 04 Anger and forgiveness | What response does forgiveness received call for? | An open hand with an unclenched silhouette |
| 05 Desires and habits | What does it mean to walk in the Spirit? | A branch carrying fruit, with a substantial central stem |
| 06 Walking in love | How does Christ's love take shape in our lives? | Two hands extending a small gift between them |

Use warm gold as the shared accent rather than assigning a new colour to each card. Shape and label distinguish the subjects. Filled shapes with a few internal details should read clearly at small sizes; avoid six thin outline drawings. The symbols are editorial aids, not illustrations claiming to depict a biblical event.

Card titles use the site's display serif. Questions and controls use its body sans serif. Reserve italic Scripture styling for actual quotations. Normal prose, questions and cautions remain upright. Scripture references are gold, and readable without depending on hover.

## Opening a reading

The cards form one group of disclosure controls. Only one reading is open at a time. The shared reading panel sits directly after the whole card group, so the cards retain their order and position when someone changes readings. Opening a card does not scroll or change the page route. Selecting the open card closes it.

Each closed card has a visible small down arrow; hover or keyboard focus increases its contrast and adds a restrained glow. The arrow is never the sole explanation of the control. The open card has an X and a clear selected treatment. The open panel also has a labelled close control at the top right. A small upward-arrow circle at its bottom provides a convenient way to close after a long reading.

Opening expands the panel first and brings its contents into view with a short fade. Changing readings fades the outgoing text, adjusts the panel to its new natural height, then reveals the incoming text. It must not reserve the height of the longest reading. Proposed timing is approximately 280–360 milliseconds for expansion and 120–160 milliseconds for text fades; these are prototype starting values, not measured performance claims. Rapid clicks should settle on the latest choice without queuing animations.

Closing while the card group is still visible leaves the viewport alone. Closing from the bottom of a long reading keeps the selected card as the reader's return point, adjusting the viewport only enough to make that card visible. This avoids leaving the reader down at unrelated material. Reduced-motion mode makes state changes immediate and uses no animated scrolling.

Give each reading an optional **Next reading** action at the end, naming its destination. The final one offers **Return to the beginning**. Neither a horizontal swipe nor a scroll wheel silently changes the selected reading. The cards can be explored independently, while the explicit next action supports the content's order.

## Inside the reading panel

The top line contains the reading name, its main passage references and the close control. Do not repeat its number as a fraction or introduce a second row of tabs. Both existing subheadings appear in the same open panel.

On wide screens, use two columns for the two subdivisions, followed by a second row containing **Consider** and **Reflect**. Preserve paragraph order inside each subdivision. This yields two meaningful rows without splitting a paragraph or inventing content to equalize heights. On narrow screens the order is first subdivision, second subdivision, Consider, Reflect. Height follows content, with no fixed-height inner scrolling area.

Quotes sit within the subsection that explains them. Use a slightly larger serif with an understated gold rule, a separate reference line and the KJV label. Explanation remains readable at roughly 55–70 characters per line. Wide page margins do not require body text to run across the full screen.

The full explanations from the content draft remain visible when the reading opens. Reflection is visually distinct but not hidden behind another disclosure. Do not introduce a journal form, saving account, progress score or completion badge. These prompts invite attention to Scripture, not an assessment of a reader's spiritual condition.

## The comparison in The old and the new

Below the two explanatory subdivisions in reading 02, introduce four compact comparison rows. This is an additional presentation of material already in the working notes and other readings, not a replacement for their explanations. The headings are **Put away**, **Practise**, and **The reason given**. Mark the wording as passage summaries, not KJV quotations.

| Put away | Practise | The reason given |
| --- | --- | --- |
| Lying | Speak truth to a neighbour | We are members of one another — Ephesians 4:25 |
| Stealing | Work honestly and share | Have something to give to someone in need — Ephesians 4:28 |
| Corrupt speech | Speak what builds up | Benefit those who hear — Ephesians 4:29 |
| Bitterness and malice | Kindness and forgiveness | God has forgiven you in Christ — Ephesians 4:31–32 |

All three parts of each row are visible together. An optional **Read the paragraph** action opens the relevant Scripture context. Do not require three clicks to discover an instruction's reason, and do not make a left/right slider that hides half of the comparison.

Use a muted neutral tone for what is put away and warm gold for the positive practice. The reason gets an equally readable surface rather than being demoted to small footnotes. On phones, each row becomes one vertical unit in the same three-part order. This comparison is the study's central visual relationship; it should not become a red-versus-green moral score.

Reading 03 retains its own existing speech table. Do not repeat the whole four-row comparison in it. Reading 04 keeps its qualifications about conflict, wrongdoing and trust alongside the reflection where they already appear. Reading 05 retains the context of grace, continuing struggle and confession. Compact presentation must not remove these qualifications.

## Scripture and navigation

Selecting a reference should offer the relevant paragraph in a distinct Scripture panel, with book, chapter, verse range and KJV clearly shown. Opening this panel must preserve the selected reading and its scroll position. The action **Open in reader** then navigates to the existing Bible reader. Returning restores the study and selected reading. This is proposed behaviour; reuse the site's existing Scripture interaction where it already satisfies it.

The site header remains stable during page transitions. Reuse the established transition treatment for entering and leaving the study rather than adding a study-specific page animation. Ordinary disclosure clicks affect only the study panel. No automatic scroll-to-heading on card selection.

After the cards and any open reading, show the existing **Return to the beginning** conclusion as a compact closing passage, followed by one clear onward link to **Life together**. The conclusion is available even with every reading closed. Preserve its invitation to reread 2 Corinthians 5 and Ephesians 2.

## Responsive and accessible behaviour

At approximately 1100 pixels of available content width and above, use three cards per row and two columns inside a reading. At intermediate widths, use two cards per row; below approximately 640 pixels, use one column. Treat these as design thresholds to verify against actual typography, not rigid device classifications. The Scripture opening stacks beneath the introduction before its text becomes cramped.

Use semantic buttons with expanded state and a named controlled panel. Keyboard focus stays on the selected card when it opens; a visible **Read this section** link can move focus to the panel heading. When a panel close control is used, focus returns to its card. Keep a clear focus ring that follows the control's shape. Icons alone do not communicate state. Touch controls have at least a 44-pixel target, and no action depends on hover.

At 200 percent zoom, the layout reflows and body copy remains fully available. On a phone there is no horizontal page overflow, no clipped comparison column and no nested vertical scrollbar. The primary document scrolls normally.

## Review and implementation handoff

This design draft resolves the initial six-card question by retaining all six, with direct disclosures rather than nested navigation. It keeps reflections with their readings and retains **Desires and habits** as the existing label. The only proposed reader-facing additions are card questions, interaction labels and the comparison presentation; the content draft itself is unchanged.

A later prototype should demonstrate the closed state, reading 02 open, the comparison on a phone, a switch to a shorter reading, close from the bottom, return from the Bible reader, keyboard operation and reduced motion. Check at 390, 768, 1366 and 1440 pixels wide, plus 200 percent zoom. Check contrast and readability against the actual site theme. These checks are acceptance criteria and have not been claimed as completed by this document.

This first design draft is complete and the queue has since advanced. It remains a proposal for review, not approval for deployment. Consult [progress](../../progress.json) and [the workflow](../../WORKFLOW.md) for the current position.
