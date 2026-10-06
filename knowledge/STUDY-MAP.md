# Bible Project study map: relationships, collections and topics

Generated from local inputs at 2026-10-06T14:01:18.912219+00:00. Corpus build: `2026-10-06T08:27:52.542399+00:00`. Vocabulary date: 2026-10-05.

**Purpose:** a tabular map for deliberate study. Tables are the primary interface; a graph is an optional exploration of selected rows. This inventory is generated from actual inputs. Proposed interface work is specified in [STUDY-TABLES.md](STUDY-TABLES.md).

## 1. Relationships already stored

| Stored relation | Rows | Direction | Meaning | Evidence source |
| --- | --- | --- | --- | --- |
| cross_reference | 344,799 | Passage -> passage/range | OpenBible source cross-reference; KJV numbering, range and votes retained | Imported OpenBible data |
| sibling | 5,262 | Person -> their sibling | A recorded sibling relationship | Imported STEP-based people data |
| parent | 1,932 | Person -> their parent | A person has the target as a parent; Aaron -> Amram is an actual example | Imported STEP-based people data |
| child | 1,926 | Person -> their child | A person has the target as a child | Imported STEP-based people data |
| spouse | 288 | Person -> their spouse | A recorded spouse relationship | Imported STEP-based people data |

**Total: 354,207 directed rows.** These are not unique undirected pairs. Reciprocal family entries and passage links are separate rows. Parent/child totals need not match; preserve and audit the imported asymmetries rather than manufacture inverse edges. These rows do not represent extracted doctrinal agreement, influence or topic similarity.

## 2. Separate document-to-Scripture register

`references_to` contains **32,259 rows across 5,054 distinct documents**, separate from the relationship total above. Here “document” includes a person/place record or authored study record; it does not necessarily mean a book or sermon.

| Source record kind | Reference rows |
| --- | --- |
| person | 21,599 |
| place | 8,647 |
| study | 1,352 |
| guide | 351 |
| authored_document | 310 |

These references are imported from structured records. They are not a completed citation-extraction pass over all library bodies. Exact reference, numbering basis, source record and future located evidence must remain inspectable.

## 3. Eight collection categories

| Collection ID | Collection | Scope | Direct formal-catalogue works |
| --- | --- | --- | --- |
| sermons | Sermons & exposition | Complete sermons and series, with main-text and exposition indexing. | 3,987 |
| scripture | Understanding Scripture | Commentary, interpretation, biblical theology and language helps. | 202 |
| theology | Theology & doctrine | Systematic and particular doctrinal treatments. | 181 |
| apologetics | Apologetics & other beliefs | Questions, arguments, objections, debates and sourced comparison. | 45 |
| christian-life | Christian life & devotion | Prayer, holiness and spiritual or pastoral concerns. | 1 |
| ministry | Church & ministry | Preaching, pastoral care, discipleship, worship and missions. | 60 |
| history | History & lives | Historical works, biographies, letters and first-person records. | 428 |
| standards | Confessions & reference | Identified confessions, catechisms, dictionaries and bibliographies. | 493 |

Counts are assignments in the **5,380-work formal catalogue**, not downloads, body-text matches or the larger acquisition bibliography. A work can belong to multiple collections. Collections describe library organization; subjects below describe what a work discusses. Do not treat these as one hierarchy.

## 4. Topic-family overview

| Family | Defined topics including heading | Topics below the heading |
| --- | --- | --- |
| Scripture and interpretation | 12 | Theological method; Authority of Scripture; Inspiration; Inerrancy; Canon; Textual transmission; Hermeneutics; Biblical languages; Biblical theology; Typology; Promise and fulfillment |
| God and his works | 9 | Person and work of the Holy Spirit; Angels and spiritual creatures; Trinity; Attributes of God; Creation; Providence; Divine decrees; Common grace |
| Humanity and sin | 6 | Image of God; The fall; Original sin; Total depravity; Moral responsibility |
| Person and work of Christ | 8 | Incarnation; Deity of Christ; Humanity of Christ; Atonement; Penal substitution; Resurrection of Christ; Ascension and intercession |
| Salvation | 14 | Election; Effectual calling; Regeneration; Repentance; Faith; Justification; Imputation; Adoption; Union with Christ; Sanctification; Assurance; Perseverance; Glorification |
| Covenant and redemptive history | 8 | Covenant of works; Covenant of grace; Law and gospel; Kingdom; Temple; Sacrifice; Exile and restoration |
| The church | 9 | Means of grace; Church government; Baptism; Lord's Supper; Church discipline; Worship; Spiritual gifts; Christian unity |
| Last things | 7 | Return of Christ; General resurrection; Judgment; Heaven and hell; New creation; Millennium |
| Apologetic questions | 10 | Existence of God; Evil and suffering; Miracles; Science and faith; Religious pluralism; Naturalism; Christianity and Islam; Revelation and prophethood; Comparative accounts of salvation |
| Christian life and care | 13 | Prayer; Holiness; Temptation; Doubt; Grief; Suffering and comfort; Contentment; Marriage and family; Parenting; Family worship; Vocation; Christian ethics |
| Ministry practice | 7 | Preaching; Pastoral care; Discipleship; Evangelism; Missions; Catechesis |
| Historical study | 7 | Reformation; Puritanism; Revival; Biography; Church history; Historical theology |

**110 topic definitions**, including 12 root headings. Parentage is an editorial vocabulary relationship, not a new finding from the texts. A child topic does not yet create inherited work assignments.

## 5. Complete topic register

| Topic ID | Hierarchy | Definition | Aliases | Direct catalogue works |
| --- | --- | --- | --- | --- |
| apologetics | Apologetic questions | Study of apologetic questions. | None recorded | 12 |
| islam | Apologetic questions > Christianity and Islam | Sourced Christian engagement with Islamic beliefs and texts; this tag does not confer teaching-authority status. | Christianity and Islam | 34 |
| comparative-salvation | Apologetic questions > Comparative accounts of salvation | Substantial treatment of comparative accounts of salvation within apologetic questions. | None recorded | 1 |
| evil-suffering | Apologetic questions > Evil and suffering | The apologetic question of evil and suffering in relation to God's goodness and power. | problem of evil | 0 |
| existence-of-god | Apologetic questions > Existence of God | Substantial treatment of existence of god within apologetic questions. | None recorded | 9 |
| miracles | Apologetic questions > Miracles | Substantial treatment of miracles within apologetic questions. | None recorded | 2 |
| naturalism | Apologetic questions > Naturalism | Substantial treatment of naturalism within apologetic questions. | None recorded | 0 |
| religious-pluralism | Apologetic questions > Religious pluralism | Substantial treatment of religious pluralism within apologetic questions. | None recorded | 0 |
| revelation-prophethood | Apologetic questions > Revelation and prophethood | Substantial treatment of revelation and prophethood within apologetic questions. | None recorded | 13 |
| science-faith | Apologetic questions > Science and faith | Substantial treatment of science and faith within apologetic questions. | None recorded | 2 |
| christian-life | Christian life and care | Study of christian life and care. | None recorded | 7 |
| ethics | Christian life and care > Christian ethics | Substantial treatment of christian ethics within christian life and care. | None recorded | 72 |
| contentment | Christian life and care > Contentment | Substantial treatment of contentment within christian life and care. | None recorded | 1 |
| doubt | Christian life and care > Doubt | Substantial treatment of doubt within christian life and care. | None recorded | 0 |
| family-worship | Christian life and care > Family worship | Substantial treatment of family worship within christian life and care. | None recorded | 5 |
| grief | Christian life and care > Grief | Substantial treatment of grief within christian life and care. | None recorded | 0 |
| holiness | Christian life and care > Holiness | Substantial treatment of holiness within christian life and care. | None recorded | 5 |
| marriage-family | Christian life and care > Marriage and family | Substantial treatment of marriage and family within christian life and care. | None recorded | 2 |
| parenting | Christian life and care > Parenting | Substantial treatment of parenting within christian life and care. | None recorded | 1 |
| prayer | Christian life and care > Prayer | Substantial treatment of prayer within christian life and care. | None recorded | 41 |
| suffering | Christian life and care > Suffering and comfort | Pastoral instruction and comfort in affliction; use evil-suffering for the philosophical objection. | affliction | 2 |
| temptation | Christian life and care > Temptation | Substantial treatment of temptation within christian life and care. | None recorded | 1 |
| vocation | Christian life and care > Vocation | Substantial treatment of vocation within christian life and care. | None recorded | 1 |
| covenant | Covenant and redemptive history | Study of covenant and redemptive history. | None recorded | 5 |
| covenant-of-grace | Covenant and redemptive history > Covenant of grace | Substantial treatment of covenant of grace within covenant and redemptive history. | None recorded | 13 |
| covenant-of-works | Covenant and redemptive history > Covenant of works | Substantial treatment of covenant of works within covenant and redemptive history. | None recorded | 6 |
| exile-restoration | Covenant and redemptive history > Exile and restoration | Substantial treatment of exile and restoration within covenant and redemptive history. | None recorded | 1 |
| kingdom | Covenant and redemptive history > Kingdom | Substantial treatment of kingdom within covenant and redemptive history. | None recorded | 16 |
| law-and-gospel | Covenant and redemptive history > Law and gospel | Substantial treatment of law and gospel within covenant and redemptive history. | None recorded | 29 |
| sacrifice | Covenant and redemptive history > Sacrifice | Substantial treatment of sacrifice within covenant and redemptive history. | None recorded | 2 |
| temple | Covenant and redemptive history > Temple | Substantial treatment of temple within covenant and redemptive history. | None recorded | 1 |
| god | God and his works | Study of god and his works. | None recorded | 15 |
| angels | God and his works > Angels and spiritual creatures | Created spiritual beings, their nature and service, including fallen angels; distinguished from the divine persons. | angelology | 3 |
| attributes-of-god | God and his works > Attributes of God | Substantial treatment of attributes of god within god and his works. | None recorded | 10 |
| common-grace | God and his works > Common grace | God's non-saving kindness and restraint of sin; distinguish it from regeneration and saving grace. | None recorded | 0 |
| creation | God and his works > Creation | Substantial treatment of creation within god and his works. | None recorded | 8 |
| divine-decrees | God and his works > Divine decrees | Substantial treatment of divine decrees within god and his works. | None recorded | 13 |
| providence | God and his works > Providence | Substantial treatment of providence within god and his works. | None recorded | 9 |
| trinity | God and his works > Trinity | Substantial treatment of trinity within god and his works. | None recorded | 20 |
| holy-spirit | God and his works > Trinity > Person and work of the Holy Spirit | The Spirit's person, deity and operations; specific saving benefits also receive their own salvation subjects. | pneumatology | 1 |
| history | Historical study | Study of historical study. | None recorded | 0 |
| biography | Historical study > Biography | Substantial treatment of biography within historical study. | None recorded | 0 |
| church-history | Historical study > Church history | Substantial treatment of church history within historical study. | None recorded | 0 |
| historical-theology | Historical study > Historical theology | Substantial treatment of historical theology within historical study. | None recorded | 17 |
| puritanism | Historical study > Puritanism | Substantial treatment of puritanism within historical study. | None recorded | 0 |
| reformation | Historical study > Reformation | Substantial treatment of reformation within historical study. | None recorded | 0 |
| revival | Historical study > Revival | Substantial treatment of revival within historical study. | None recorded | 0 |
| humanity | Humanity and sin | Study of humanity and sin. | None recorded | 3 |
| image-of-god | Humanity and sin > Image of God | Substantial treatment of image of god within humanity and sin. | None recorded | 6 |
| moral-responsibility | Humanity and sin > Moral responsibility | Substantial treatment of moral responsibility within humanity and sin. | None recorded | 5 |
| original-sin | Humanity and sin > Original sin | Substantial treatment of original sin within humanity and sin. | None recorded | 2 |
| fall | Humanity and sin > The fall | Substantial treatment of the fall within humanity and sin. | None recorded | 37 |
| total-depravity | Humanity and sin > Total depravity | Substantial treatment of total depravity within humanity and sin. | None recorded | 0 |
| last-things | Last things | Study of last things. | None recorded | 15 |
| general-resurrection | Last things > General resurrection | The future resurrection of the dead; distinct from the historical resurrection of Jesus. | None recorded | 4 |
| heaven-hell | Last things > Heaven and hell | Substantial treatment of heaven and hell within last things. | None recorded | 3 |
| judgment | Last things > Judgment | Substantial treatment of judgment within last things. | None recorded | 3 |
| millennium | Last things > Millennium | Substantial treatment of millennium within last things. | None recorded | 0 |
| new-creation | Last things > New creation | Substantial treatment of new creation within last things. | None recorded | 2 |
| return-of-christ | Last things > Return of Christ | Substantial treatment of return of christ within last things. | None recorded | 2 |
| ministry | Ministry practice | Study of ministry practice. | None recorded | 2 |
| catechesis | Ministry practice > Catechesis | Substantial treatment of catechesis within ministry practice. | None recorded | 7 |
| discipleship | Ministry practice > Discipleship | Substantial treatment of discipleship within ministry practice. | None recorded | 7 |
| evangelism | Ministry practice > Evangelism | Substantial treatment of evangelism within ministry practice. | None recorded | 8 |
| missions | Ministry practice > Missions | Substantial treatment of missions within ministry practice. | None recorded | 13 |
| pastoral-care | Ministry practice > Pastoral care | Substantial treatment of pastoral care within ministry practice. | None recorded | 22 |
| preaching | Ministry practice > Preaching | Substantial treatment of preaching within ministry practice. | None recorded | 39 |
| christ | Person and work of Christ | Study of person and work of christ. | None recorded | 57 |
| ascension-intercession | Person and work of Christ > Ascension and intercession | Substantial treatment of ascension and intercession within person and work of christ. | None recorded | 2 |
| atonement | Person and work of Christ > Atonement | Christ's reconciling work; use more specific tags when a particular theory or aspect is treated. | None recorded | 18 |
| deity-of-christ | Person and work of Christ > Deity of Christ | Substantial treatment of deity of christ within person and work of christ. | None recorded | 4 |
| humanity-of-christ | Person and work of Christ > Humanity of Christ | Substantial treatment of humanity of christ within person and work of christ. | None recorded | 0 |
| incarnation | Person and work of Christ > Incarnation | Substantial treatment of incarnation within person and work of christ. | None recorded | 4 |
| penal-substitution | Person and work of Christ > Penal substitution | Substantial treatment of penal substitution within person and work of christ. | None recorded | 1 |
| resurrection-of-christ | Person and work of Christ > Resurrection of Christ | The bodily resurrection of Jesus Christ and its significance; distinct from general resurrection. | None recorded | 3 |
| salvation | Salvation | Study of salvation. | None recorded | 21 |
| adoption | Salvation > Adoption | Substantial treatment of adoption within salvation. | None recorded | 6 |
| assurance | Salvation > Assurance | The believer's knowledge and confidence of salvation; distinguish this from perseverance as God's preserving work. | assurance of salvation | 9 |
| effectual-calling | Salvation > Effectual calling | Substantial treatment of effectual calling within salvation. | None recorded | 15 |
| election | Salvation > Election | Substantial treatment of election within salvation. | None recorded | 7 |
| faith | Salvation > Faith | Substantial treatment of faith within salvation. | None recorded | 14 |
| glorification | Salvation > Glorification | Substantial treatment of glorification within salvation. | None recorded | 0 |
| imputation | Salvation > Imputation | Substantial treatment of imputation within salvation. | None recorded | 14 |
| justification | Salvation > Justification | Substantial treatment of justification within salvation. | None recorded | 42 |
| perseverance | Salvation > Perseverance | Substantial treatment of perseverance within salvation. | None recorded | 5 |
| regeneration | Salvation > Regeneration | Substantial treatment of regeneration within salvation. | None recorded | 5 |
| repentance | Salvation > Repentance | Substantial treatment of repentance within salvation. | None recorded | 6 |
| sanctification | Salvation > Sanctification | Substantial treatment of sanctification within salvation. | None recorded | 12 |
| union-with-christ | Salvation > Union with Christ | Substantial treatment of union with christ within salvation. | None recorded | 2 |
| scripture | Scripture and interpretation | Study of scripture and interpretation. | None recorded | 4 |
| authority-of-scripture | Scripture and interpretation > Authority of Scripture | Substantial treatment of authority of scripture within scripture and interpretation. | None recorded | 17 |
| biblical-languages | Scripture and interpretation > Biblical languages | Substantial treatment of biblical languages within scripture and interpretation. | None recorded | 0 |
| biblical-theology | Scripture and interpretation > Biblical theology | Substantial treatment of biblical theology within scripture and interpretation. | None recorded | 12 |
| canon | Scripture and interpretation > Canon | Substantial treatment of canon within scripture and interpretation. | None recorded | 4 |
| hermeneutics | Scripture and interpretation > Hermeneutics | Substantial treatment of hermeneutics within scripture and interpretation. | None recorded | 12 |
| inerrancy | Scripture and interpretation > Inerrancy | Substantial treatment of inerrancy within scripture and interpretation. | None recorded | 0 |
| inspiration | Scripture and interpretation > Inspiration | Substantial treatment of inspiration within scripture and interpretation. | None recorded | 3 |
| promise-fulfillment | Scripture and interpretation > Promise and fulfillment | Substantial treatment of promise and fulfillment within scripture and interpretation. | None recorded | 7 |
| transmission | Scripture and interpretation > Textual transmission | Substantial treatment of textual transmission within scripture and interpretation. | None recorded | 0 |
| theological-method | Scripture and interpretation > Theological method | Sources, reasoning and organization of theological knowledge; distinct from rules for interpreting particular texts. | prolegomena | 5 |
| typology | Scripture and interpretation > Typology | Substantial treatment of typology within scripture and interpretation. | None recorded | 2 |
| church | The church | Study of the church. | None recorded | 12 |
| baptism | The church > Baptism | Substantial treatment of baptism within the church. | None recorded | 14 |
| unity | The church > Christian unity | Substantial treatment of christian unity within the church. | None recorded | 2 |
| church-discipline | The church > Church discipline | Substantial treatment of church discipline within the church. | None recorded | 2 |
| church-government | The church > Church government | Substantial treatment of church government within the church. | None recorded | 5 |
| lords-supper | The church > Lord's Supper | Substantial treatment of lord's supper within the church. | None recorded | 17 |
| means-of-grace | The church > Means of grace | Word, sacraments and prayer as means of grace, retaining differences concerning their operation and efficacy. | None recorded | 26 |
| spiritual-gifts | The church > Spiritual gifts | Substantial treatment of spiritual gifts within the church. | None recorded | 0 |
| worship | The church > Worship | Substantial treatment of worship within the church. | None recorded | 63 |

A direct catalogue tag is a bibliographic classification, not a located passage finding or an endorsement. Zero means no direct assignment in this catalogue; it does not mean the corpus lacks discussion of the topic. Parent totals are not automatically sums of child assignments.

## 6. Other existing catalogue facets

| Facet | Defined values | Values |
| --- | --- | --- |
| traditions | 8 | reformed; continental-reformed; presbyterian; congregational; puritan; baptist; anglican; calvinist-evangelical |
| genres | 21 | sermon; commentary; treatise; systematic-theology; lecture; article; debate; confession; catechism; devotional; prayer; hymn; biography; autobiography; letter; journal; history; dictionary; bibliography; study-guide; collected-works |
| occasions | 9 | ordinary-worship; evangelistic; communion; baptism; ordination; funeral; missions; conference; family-worship |
| audiences | 9 | general; new-believers; students; pastors; elders; ministry-leaders; families; children; seekers |
| depths | 5 | introductory; intermediate; advanced; mixed; unknown |
| eras | 8 | reformation; post-reformation; eighteenth-century; nineteenth-century; twentieth-century; twenty-first-century; multiple; unknown |
| formats | 8 | html; text; pdf; epub; image-scan; audio; video; other |
| roles | 5 | core-teaching; confessional-standard; historical-context; opposing-position; editorial-guide |

These facets are independent filters, not edges asserting doctrine. A tradition assigned to an author does not settle every position in every work. Current era values do not include dedicated patristic or medieval labels; comparative-belief topics and historical periods need deliberate expansion as the collection warrants. Generic topic definitions and sparse aliases need review before becoming executable enrichment rules.

## 7. What remains to be built

| Connection | Present state | Required evidence before study use |
| --- | --- | --- |
| Author -> work -> edition -> asset | Catalogue structure exists; graph crosswalk planned | Stable IDs and source-backed attribution; preserve anonymous/disputed identities |
| Work -> collection / subject | Catalogue classifications exist | Label as catalogue classification; do not present as full-text extraction |
| Located passage -> topic | Planned deterministic enrichment | Rule, exact text span, intended sense and match/review status |
| Located passage -> Scripture citation | Full-library extraction planned | Literal citation, valid range, numbering basis and exact source location |
| Section/work -> shared references | Planned analysis | Contributing citations, scope, duplicate handling and weighting |
| Author/work -> supports / opposes a claim | Deferred interpretive layer | Attributed claim, quoted speakers, qualifications and reviewed evidence |
| Author/work -> influenced another | Deferred historical layer | Direct historical/source-dependence evidence; similarity alone is insufficient |

## Refresh

From `Website`, run `python -m knowledge.study_map`. The command opens the corpus read-only and regenerates this document from the database and library vocabulary/catalogue. It does not infer relationships, modify the database, re-embed text or publish a website.
