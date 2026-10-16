# Parables content review

Implementation-plan step 3, authorized 11 October 2026. All 57 studies were reviewed against their linked KJV passages and their surrounding audience and setting. Forty-five studies received corrections or clarifications; twelve were retained at this stage. The collection, categories, form classifications and layout are unchanged. This is the baseline editorial review; it does not claim to complete the deeper treatments reserved for step 4.

## Corrections

Audience descriptions now distinguish the Gospel settings. In particular, Luke's temple discourse is not labelled a private Mount of Olives conversation merely because Matthew and Mark describe one. The lost sheep distinguishes Luke's complaining listeners from Matthew's disciples. The lamp, salt, fasting images and teaching about discernment identify their respective listeners without reconstructing a single occasion.

The notes no longer call the midnight visitor unexpected, describe the strong man's literal goods as captives, or carry Matthew's word “empty” into Luke's returning-spirit account. The faithful-servant comparison no longer requires a second servant where the text describes what happens if a servant acts wickedly. The patch comparison preserves Luke's cutting of a new garment rather than presenting all three accounts as the same repair sequence. Short comparison moments now include verse references, with Gospel names when the moments compare accounts.

Several explanations now retain an emphasis previously underdeveloped: judgment beside the two builders; repentance before the barren fig tree; exclusion at the end of the great supper; the net's severe conclusion; and God's promised vindication at the end of the persistent widow. These changes describe the texts' own statements. They do not select an eschatological timetable or resolve a disputed doctrine by implication.

## Evidence and method

Reviewer: Codex editorial pass, 11 October 2026; owner acceptance remains separate. Primary evidence is the registered local KJV corpus in `data/plain/kjv/`. Every linked range was read, together with adjoining verses and the setting anchors below. Original wording remains original editorial explanation, not a quotation from commentary. Reflection questions were assessed as applications rather than additional commands attributed to Jesus. The new repentance question is explicitly grounded in Luke 13:3, 5.

Additional setting anchors read: Matthew 5:1–2; 7:28–29; 11:7; 18:1–7; 19:23–30; 21:23–27; 24:1–3; Mark 4:33–34; 9:33–35; 11:27–28; 13:1–4; Luke 5:27–33; 6:17–20; 7:24–30; 11:1–2, 27–33; 12:1, 22–34, 54; 13:10–17; 14:1–4; 16:14–16; 17:1–5, 20–22; 20:1; 21:5–7, 37–38. Ezekiel 17:22–24; 31:3–9 and Daniel 4:10–12 were read when checking possible tree imagery.

### Interpretive sources actually consulted

All online sources below were checked 11 October 2026. Their perspectives and permitted roles are explained in the [source register](SOURCE-REGISTER.md). Sections identify the claims checked; consultation does not endorse every statement in those sections.

- **Douglas Sean O'Donnell**, *TGC Bible Commentary: Matthew*, online edition, [“The Parables of Jesus” (13:1–53) and “Warnings” (7:1–29)](https://www.thegospelcoalition.org/commentary/matthew/). The mustard birds are read as the nations; the builders are read within final judgment. Used as reasoned interpretations, not claims that Jesus explicitly supplies those symbolic definitions.
- **Mark L. Strauss**, *TGC Bible Commentary: Mark*, online edition, [“More Parables” (4:21–34)](https://www.thegospelcoalition.org/commentary/mark/). Consulted for the kingdom-growth setting and the alternative readings of the birds as nations or simply evidence of the plant's size. His historical botanical assertions were not adopted.
- **Matthew Henry**, *Commentary on the Whole Bible*, Volume V, CCEL electronic edition, [Matthew VII, verses 21–27, discussion of the two builders](https://www.ccel.org/ccel/henry/mhc5.Matt.viii.html). The site identifies the work and chapter; the underlying print impression is not established here. Henry includes present trials as well as death and judgment. This independently reasoned historic treatment supports retaining judgment while allowing present-trial application. His wider allegorical identifications and period illustrations were not imported.
- **Peter G. Bolt**, *TGC Bible Commentary: Luke*, online edition, [sections 6:46–49; 7:36–50; 11:5–13; 12:35–48; 18:1–8](https://www.thegospelcoalition.org/commentary/luke/). Consulted for the stated settings and interpretive questions. His reading of the midnight request's key word and his eschatological chronology were not adopted in this step.

### Decisions on material interpretations

**Mustard seed:** The possible tree-and-birds echo is identified as a possibility, with Ezekiel 17 and Daniel 4 references. O'Donnell supplies a nations reading; Strauss also presents the simpler size-and-shelter reading. The notes retain the visible growth and shelter without declaring the birds' identity settled. Confidence: high for the textual comparison, qualified for the allusion. No detailed allegory is installed.

**Two builders:** Matthew 7:21–23 makes judgment an immediate context for 7:24–27. O'Donnell foregrounds that judgment, while Henry also applies the storm to present trials. The revision restores the judgment setting and leaves room for the secondary pastoral application. It does not use a person's disaster as a diagnosis of their faith. Confidence: high for the context; the exact extent of the storm's symbolism remains interpretation.

**Midnight friend:** The correction is limited to what Luke actually narrates. Removing “unexpected” and the question's presupposition of repeated asking does not rule out persistence as an interpretation of verse 8. The competing explanations of importunity remain for step 4, with the Father's good gifts still controlling the immediate reading context.

**Persistent widow:** The text's own promise of speedy vindication and its final question about faith are now explicit. A caution about personal timetables must not suppress that promise. No detailed timing model is adopted.

**Returning spirit:** Matthew's empty house and collective application are distinguished from Luke's wording and adjoining call to hear and keep God's word. The application concerns response to Jesus, not a clinical diagnosis or a promised technique against possession.

## Boundaries for the next steps

Step 4 still owns the full treatments of talents, minas, the wedding garment, shrewd manager, midnight friend, Lazarus and sheep/goats. This review does not certify those debates as resolved. In those studies, baseline factual clarifications are complete; existing interpretive limits remain visible.

Step 5 still owns missing Gospel parallels and account-specific presentation, including Luke 11:33 for the lamp and Matthew 12:33–37 for the tree and fruit. No linked passage was added or removed in step 3. Navigation, search, typography and overall editorial flow remain for steps 6–9. The current three-moment structure remains an editorial aid, not a claim that every passage has three narrative events.

## Study ledger

Validation completed: the full frontend TypeScript check, the focused parables data typecheck and Vite build passed. The initial shared-workspace checks encountered errors in concurrently edited scholars files; those were corrected by the ongoing work there, without changes from this parables task. The final checks pass. The Scripture checker verified all 94 linked ranges and 604 verse references. A before/after integrity check confirmed unchanged IDs, titles, ordering, categories, classifications and Scripture ranges, with exactly 45 revised records and twelve retained.

Browser verification passed all 57 studies and 171 story moments at 1440, 1024 and 390 pixels in both themes, including form labels, Gospel tabs and links, seven filters, searches and reader navigation. No horizontal overflow or browser exceptions were reported. Desktop and phone screenshots were inspected. The generated parables CONTENT page is refreshed and the rebuilt local preview remains at `http://127.0.0.1:8931/study/gospels?guide=parables`. No publication was performed. Technical checks do not substitute for theological review or owner acceptance.

Every row records a human-readable editorial finding. The verses in the linked passages, the setting anchors above and the named interpretive sections form its evidence. **O** means textual observation; **I** means interpretation or inference; **A** means application. A retained entry has been read, not merely passed by a script. High confidence applies to the textual corrections; explicitly identified interpretive questions remain qualified.

| Study | Status | Finding |
| --- | --- | --- |
| The sower & the soils | Revised | O/I: Distinguish boat settings from Luke's gathering; distinguish the disciples' questions and the accounts' descriptions of fruitful hearing. |
| The mustard seed | Revised | O/I: Name the three settings, remove almost invisible hyperbole and qualify the prophetic tree echo; see the interpretive decision above. |
| The leaven in the dough | Revised | O/I: Name both settings and avoid implying that the single verse narrates three separate episodes. |
| The wheat & the weeds | Retained | O/I retained: Public story and private explanation are distinct; the field remains the world and final separation belongs to the stated explanation. |
| The lost sheep | Revised | O: Separate Matthew's disciple audience and conditional finding from Luke's search until recovery and joy over repentance. |
| The lost coin | Retained | O/I retained: Search and shared joy follow Luke's account; the caution correctly avoids an asserted wedding-headdress custom. |
| A father & two sons | Retained | O/I/A retained: Both sons and the unresolved elder son's response remain central; the mercy reflection is an application rather than an invented ending. |
| The neighbour on the road | Revised | O: Restore the lawyer's expressed desire to justify himself and the named road; leave the priest's and Levite's motives unstated. |
| Treasure in a field | Revised | O: Include the finder hiding the treasure again; no unsupported property-law explanation added. |
| The pearl of great price | Retained | O/I retained: Seeking, finding and selling are all present; the adjacent treasure comparison does not become a payment theory of salvation. |
| The rich fool | Retained | O/I retained: Inheritance dispute, covetousness, interrupted plans and being rich toward God are all present; no condemnation of every plan or harvest is inferred. |
| Workers in the vineyard | Retained | O/I retained: Peter's reward question and the first/last frame support the reading; the agreed wage and generosity remain distinct. |
| The two builders | Revised | O/I: Specify the audiences and restore Matthew's immediate judgment context. Present trials remain an application, not the whole meaning; see sources above. |
| The unforgiving servant | Revised | O/I: Restore the severity of the ending and Jesus' explicit application to forgiveness from the heart without deciding broader doctrinal disputes. |
| The ten bridesmaids | Revised | O: State oil in vessels and the later complaint about lamps going out; retain the fact that all ten sleep. |
| Two men at prayer | Retained | O/I retained: Luke names self-trust and contempt; the verdict is justified, not simply emotionally comforted. The caution does not generalise blame to all Pharisees. |
| The seed growing secretly | Revised | O/I: Locate listeners within Mark's public/private discourse and ground the explanation in the man's limited understanding and timely harvest. |
| The net & the catch | Revised | O: Retain the furnace and grief in the interpretation Jesus gives, not merely a neutral sorting image. |
| The two sons & the vineyard | Revised | O/I: Restore the authority controversy and the named responses to John; do not reduce the application to generic promise keeping. |
| The tenants & the beloved son | Revised | O/I: Identify the respective temple audiences and preserve the listeners' answer, rejected-stone quotation and leaders' recognition. |
| The king’s wedding feast | Revised | O: Restore the preceding leaders, murder, burning city and gathering of bad and good. Interpretation of the garment remains step 4. |
| The entrusted talents | Revised | O/I: Call the money an entrusted responsibility and distinguish the servant's stated fear from the master's assessment. Full treatment remains step 4. |
| The two debtors | Revised | O: Simon questions Jesus' prophetic discernment, not only the woman. Identify the other listeners and avoid naming the unnamed woman as Mary Magdalene. |
| The friend at midnight | Revised | O/I: Remove unexpected arrival and the question's presupposed repeated asking. The meaning of importunity remains explicitly unresolved for step 4. |
| The barren fig tree | Revised | O/I/A: Include both tragedies and the repeated command to repent; connect the extra time and the reflection to that setting. |
| The great supper | Revised | O/I: Specify the Sabbath meal and retain exclusion at the end alongside the widened invitation. |
| The shrewd manager | Revised | O: Change the first movement from completed dismissal to the accounting and threatened loss stated in 16:1–2. Deeper interpretation remains step 4. |
| The rich man & Lazarus | Revised | O: Replace a setting phrase masquerading as an audience with the continuing exchange after 16:14–15; describe the request to send Lazarus to five brothers. Deeper treatment remains step 4. |
| The servant’s duty | Revised | O: Use livestock rather than specifying sheep where the displayed KJV says feeding cattle. The humility reading and caution about exploitation are retained. |
| The persistent widow | Revised | O/I: Identify the preceding disciple audience and restore the promise of speedy vindication alongside persevering prayer; no chronology adopted. |
| The ten minas | Retained | O/I retained: Luke's stated expectation of immediate kingdom arrival governs the setting; distinct initial distribution and royal opposition remain. Full treatment remains step 4. |
| The lowest place at the feast | Revised | O: Specify invited guests at the Sabbath meal; the example's wedding is not asserted to be the actual occasion. |
| The servants ready to welcome | Retained | O/I retained: Luke's disciple setting, lamps, immediate opening and master serving are accurate; the reflection remains an application of hopeful readiness. |
| The faithful & unfaithful servant | Revised | O/I: Use the conditional wicked conduct rather than requiring another servant; preserve judgment and Luke's accountability distinctions. |
| The unfinished tower | Revised | O/I: Bring family loyalties, one's own life, the cross and possessions back into the setting; do not turn cost counting into avoiding demanding commitments. |
| The king weighing a conflict | Retained | O/I retained: The embassy is a conditional response in a cost-counting comparison; detailed allegorical identities for the armies remain unasserted. |
| The budding fig tree | Revised | O/I: Separate the named/private audiences from Luke's questioners; retain this generation, enduring words and the uncertainty of the hour without choosing a timetable. |
| The absent master & the doorkeeper | Revised | O: Name Mark's four questioners and preserve the concluding extension to all. |
| The lamp on its stand | Revised | O/I: Locate each teaching setting and anchor the three image observations in named verses. Missing Luke 11:33 coverage remains step 5. |
| The new patch & the old garment | Revised | O: Specify the fasting questioners and distinguish Luke's new garment being cut from Matthew/Mark's worsening tear. |
| New wine & old wineskins | Revised | O: Specify the fasting setting and add references to the hypothetical sequence; retain Luke's old-wine complication without simplifying it away. |
| The children in the marketplace | Revised | O/I: Distinguish the actual crowd from the generation criticised; describe the children's complaint and the explicit accusations without deciding every child's symbolic identity. |
| The strong man’s house | Revised | O/I: Separate the accounts' accusers and images; goods remain goods in the observations, with rescue identified as a contextual interpretation. |
| The blind leading the blind | Revised | O: Matthew's immediate interlocutors are disciples; Luke's audience comes from 6:17–20. Use the question and stated consequence rather than inventing an inability to notice a particular pit. |
| The speck & the beam | Revised | O/I: Identify the audiences and describe the speck/beam image before interpreting the intended correction; add verse anchors. |
| The tree & its fruit | Revised | O/I: Remove the unmentioned root, preserve Matthew's judgment and Luke's heart/speech connection. Missing Matthew 12 coverage remains step 5. |
| The householder’s new & old treasures | Retained | O/I retained: Jesus' understanding question, instructed scribe and new/old store are accurate; no unsupported rejection of a testament is asserted. |
| The returning unclean spirit | Revised | O/I/A: Preserve Matthew's empty and generation wording as Matthew's; retain Luke's surrounding calls to respond to Jesus and revise the reflection accordingly. |
| The householder & the thief | Revised | O: Add references and explicitly connect readiness to the Son of Man's unexpected arrival. |
| The dispute on the way to court | Revised | O/I: Distinguish Matthew's sermon listeners from Luke's crowd and anchor the conditional legal journey in verses. |
| The sheep & the goats | Retained | O/I/A retained: The judgment scene, repeated questions, needs and final outcomes are represented; disputed brethren and deeds/salvation questions remain for step 4. |
| Salt that loses its savour | Revised | O: Identify Matthew's sermon audience, Mark's Twelve and Luke's travelling crowds; preserve differing settings without speculative salt chemistry. |
| The bridegroom & the guests | Revised | O: Name Matthew's questioners and distinguish Mark's question from Luke's continuing meal controversy. |
| A kingdom divided | Revised | O: Do not import Matthew/Luke's immediately preceding deliverance scene into Mark's introduction; identify the different accusers. |
| The eye & the light | Revised | O/I: Specify Matthew's sermon listeners and Luke's crowd after the sign demand; retain the distinct wealth and light settings without a medical reading. |
| A father’s good gifts | Revised | O: Identify the sermon and prayer-teaching audiences; retain Matthew's good gifts and Luke's explicit Holy Spirit conclusion. |
| The measure you use | Revised | O/I: Identify the distinct discourses; judgment, hearing and generosity remain their own contexts rather than a single financial formula. |
