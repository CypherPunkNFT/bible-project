# Israel among the empires — illustrated study

14 October 2026. History & archaeology. Implemented locally at http://127.0.0.1:8931/study/israel-among-the-empires. No public deployment.

## Design decision

The central question is how imperial power affected different places and people. A king's victory, a city's survival, a family's legal record and a community's return are different kinds of evidence. The organizing idea is a journey from monumental royal claims to communities in surviving records. A full illustrated landing precedes the synchronized atlas; later chapters change visual language with their evidence.

Three approaches were considered: a continuous imperial timeline would clarify sequence but risk invented continuous territorial control; an object-only inspection desk would make genres tangible but obscure political geography; a geographical atlas followed by distinct illustrated comparisons connects place, claim and consequence. The third is implemented. The atlas remains the signature historical workspace; the 701 comparison is its substantial close-reading counterpart. This revision supersedes the earlier compact atlas-first composition and flat witness matrix.

References inspected include the current GospelPortraits narrative lanes, the routed Letters collections and Paul page, Preachers' Through radial chart, Scholars' Built relationships, Surviving witnesses and the current teacher landings. Browser captures and source inspection informed the overview–selection–evidence progression; their geometry was not copied or supplied with invented quantities.

## Composition and content-to-design map

| Existing material | Current presentation | What the visual explains |
|---|---|---|
| Study introduction | Full two-column landing: large Literata title, importance paragraph, prism over two cities, atlas invitation | Royal commemoration and lived consequences are different perspectives |
| Six chapter destinations | Icon-and-label navigation immediately below landing, before atlas | Reader can see the whole study before beginning chapter 01 |
| 01 eight periods, geography, political status and human experience | Synchronized regional/local maps, timeline selection, optional evidence; illustrated authority chain | Tribute, provincial rule and Persian administration are not interchangeable political arrangements |
| 02 Samaria, Jerusalem 597, destruction 587/586 and regnal counting | Existing chronological comparisons retained, with optional counting table | Recorded dates and reconstructions have different certainty |
| 03 campaign, tribute, theological interpretation | Two-city illustrated scene; counted tribute discs; paired royal/textual explanations | Lachish and Jerusalem have different outcomes; accounts agree on gold and differ on silver; explanations have distinct purposes |
| 03 prism, relief, siege ramp; four evidence questions | Three substantial illustrated object selectors and source detail; full matrix retained in optional disclosure | Different material witnesses answer different questions; royal text and relief are not independent royal perspectives |
| 04 palace, rural archives and petition | Clay/papyrus forms with provisioning, family or petition relationships; original record, inference and limits retained | The document's purpose and social sample constrain what it reveals |
| 04 family 561–488, change of empire 539 | Existing documentary timeline retained | Political succession can cut across a family's surviving documentation; spans are not lifespans |
| 04 land after conquest, competing arguments, Ramat Rahel | Selectable capital/countryside/sampling landscape preceding paired arguments | Destruction of a capital is not a census of the countryside; sampling affects conclusions |
| 05 Cyrus and return | Cylinder and textual account separated by an explicitly broken comparison link, then inference exercise | General restoration rhetoric provides context, not direct attestation of every particular return |
| 06 seven research works, access notes, 32 sources and gaps | Illustrated research shelf with selected full annotation; optional all-annotations view; full source register | A source edition, excavation report and historical argument do different research jobs |

## Art direction and evidence

Use the existing Archivo body and Literata headings, aligned margins, fixed site header and page transitions. Gold/ochre monuments, sage details, copper documents and dark filled surfaces give objects mass without photographic claims. Desktop landing art occupies roughly half the content width: a faceted prism above two hill-city silhouettes, restrained contours and labels. No perpetual animation, particles or glow effects.

EmpireArt.tsx supplies original SVG forms for the landing, city comparison, tribute, objects, authority, archives, landscape and restoration. Facets, silhouettes and layers are substantial; guide lines are abstract surface marks, not invented ancient writing. Captions explicitly identify schematic objects, architecture and sampling grids. City silhouettes are not archaeological reconstructions; no building represents a counted household. The research shelf uses illustrative jackets, not original covers.

Tribute is the only new quantitative visual. Sennacherib reports 800 silver talents, Kings 300; both report 30 gold. Each silver disc means 100 reported talents; each gold disc means 10. The two keys are stated together. These are account figures, not verified weights or claims that weight standards were equivalent. Nearby citations identify the prism and 2 Kings 18. Other diagrams show relationships and sequence, not numerical scores.

The atlas uses existing Natural Earth geography and attributed source data. Lines are schematic relationships, not exact journeys. No imperial border polygons, guessed Yahudu location or exact destruction date are introduced. All original Scripture links, evidence/reconstruction distinctions, source access statuses and research gaps remain. Josephus material is absent.

## Interaction states and representative copy

- Landing: title and importance paragraph are immediately visible; “Explore the historical atlas” moves to the atlas. Six labeled chapter links precede it.
- Atlas: 701 BCE initially selected unless restored from URL. Eight dated buttons change both maps, relationship statements and selected evidence while geography stays fixed. “At the level of people” changes perspective. Evidence opens in normal flow and retracts to its origin; movement arrows can be toggled. Period persists in URL.
- Authority: three political arrangements select a king, administrative document or provincial/temple form between imperial authority and communities. Labels and original supporting explanation remain explicit. The link is administrative, not a causal claim about every person.
- Royal comparison: “What happened?”, “What was paid?”, “Who explains victory?” select city, quantity and interpretation compositions. The overall campaign remains fixed. City buttons select Lachish or Jerusalem and reveal different outcomes and citations. Clicking the other city reverses selection; no hidden hover information or modal is required.
- Objects: prism initially selected, unless restored. Clicking relief or ramp changes the evidence detail. Full four-question matrix is closed initially and available under “Compare all four evidence questions”. It is supporting reference rather than the primary experience.
- Archives: palace initially selected; switching to rural records or petition changes the object and relationship diagram, source and limits. Inference starts closed after switching and can be expanded/retracted. Family documentation is qualified as selected attestation, not a complete genealogy.
- Landscape: capital initially emphasized; countryside and archaeological sample change emphasis and the explanatory statement. Each choice remains visible and keyboard reachable.
- Return: both source forms remain visible. The broken connector reads “Context is not direct attestation”. Three radio choices reveal bounded explanations; no score is produced.
- Research shelf: first work initially selected unless restored. Seven jacket buttons reveal full title, contribution, actual consultation status and source. “Read all seven annotations together” preserves uninterrupted reading access.

Ordinary selections do not navigate or deliberately scroll. Native buttons use aria-pressed, radios use ordinary radio semantics, and details use native disclosure controls. Persistent section selections use sessionStorage; period uses the URL. No account, collection of personal information or new storage service is introduced.

## Responsive, motion and access

Desktop uses a two-column landing, paired maps, wide city comparison and seven-work shelf. Phone stacks the landing and maps, gives navigation two columns and the shelf three columns, and stacks account prose. Both city drawings fit the viewport; essential city names and outcomes also appear in full-size native controls and prose. The regional atlas retains its existing labeled horizontal viewport and textual relationship alternative. There are no nested vertical reading scrollers.

Touch does not require hover. Controls have visible keyboard focus and accessible names; SVGs have descriptive alternatives and adjacent plain-text explanations. Selection is indicated by state, border and text as well as colour. Short opacity/selection transitions are removed for reduced motion. Header and shared page-transition components are unchanged. No statistical meaning is assigned to opacity or decorative object size.

## Reuse, dependencies and limits

The two research dossiers, existing map data, chronology, family timeline, Bible reader links and source register are reused. No newly licensed photograph or external asset dependency is required. Exact campaign topography, full epigraphic collation, excavation provenance for unprovenanced tablets and complete territorial boundaries remain research limits, not design tasks silently completed.

## Artifacts and executed acceptance checks

The live page and original SVG components are the current reviewable interactive artifact. Current captures are under ../../../.local/empires-revamp-qa/. The isolated prototype.html, desktop.png and mobile.png beside this document are retained as the earlier atlas proposal; they do not represent this illustrated revision.

Executed in Edge on the existing 8931 preview: all eight atlas periods; movement toggle; all three chronology, witness, archive and royal modes; both city selections; three landscape/authority selections; all seven research works; archive inference; Cyrus choices; 32 source records; internal anchors; keyboard activation and focus; reduced motion; no document overflow at 320/390/768; desktop at 1440; Academic route out and back; persisted shelf selection after reload. Visual inspection covered desktop/light/dark opening, city and tribute scenes, objects, archive, return and research shelf; the phone city crop was corrected and rechecked. No browser page errors were recorded. TypeScript check, preview build and editorial source policy check passed.

Receipts: ../../../.local/empires-revamp-qa/results.json and visual-results.json. The local build retains existing large-bundle warnings. These checks are not a screen-reader audit or a test on physical mobile devices. No public deployment was performed.
