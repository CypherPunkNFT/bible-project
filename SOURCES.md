## Audio Bible verse timings — registered 25 October 2026 (local preview only; nothing published)

The Read alongside panel on `/listen/asv` highlights the verse being read. The verse start times were worked out
once, on this PC, from the public-domain LibriVox ASV recording and the public-domain ASV text already listed here.
The tools below made them and are not part of the site; only the resulting times
(`src/data/listen/asv-timing/`, about 400 KB) are. How: [Plans/AUDIO-FOLLOW-ALONG.md](../Plans/AUDIO-FOLLOW-ALONG.md).

| What | How it was used | Licence / terms |
|---|---|---|
| Qwen3-ASR-1.7B (Alibaba Qwen, Hugging Face `Qwen/Qwen3-ASR-1.7B`, revision `7278e1e70fe2`) | Speech-to-text of the recording, run locally | **Apache 2.0** |
| Qwen3-ForcedAligner-0.6B (`Qwen/Qwen3-ForcedAligner-0.6B`, revision `c7cbfc2048c4`) | The time of every spoken word, run locally | **Apache 2.0** |
| `qwen-asr` 0.0.6 (Python package from QwenLM) | Runs the two models | **Apache 2.0** |
| Whisper large-v3 (OpenAI) through `faster-whisper` 1.2.1 | An independent check of sampled verse starts | **MIT** (model and package) |

## Bible Guide phone app — registered 2026-10-24 (on the PC and the test emulator only; nothing published)

The app in [App/](../App/DESIGN.md) ships its own copy of six Bible texts, built from this site's generated
`data/text/` by `App/scripts/build-bible-db.py` into `App/assets/bible/bible.db`. Each text is already registered
below in the build source checksum registry. The app adds no new text and shows the same words as the site.

| Version in the app | Source file (registry row below) | Licence | Checksum |
|---|---|---|---|
| Berean Standard Bible (BSB, the default) | [engbsb](sources/ebible/engbsb/) | **Public domain** (dedicated 2023). Courtesy credit: *Berean Standard Bible, berean.bible* | `b77cc2d5161b0361…` |
| King James Version (KJV), with the Apocrypha | [eng-kjv](sources/ebible/eng-kjv/) | **Public domain** (in the US) | `0e0359e9e488582a…` |
| World English Bible (WEB) | [engwebp](sources/ebible/engwebp/) | **Public domain** | `99ea438ef8a6a20a…` |
| American Standard Version (ASV) | [eng-asv](sources/ebible/eng-asv/) | **Public domain** (1901) | `a9420074e1d96f87…` |
| Young's Literal Translation (YLT) | [engylt](sources/ebible/engylt/) | **Public domain** (1898) | `e50e55320bd5352e…` |
| Majority Standard Bible (MSB) | [engmsb](sources/ebible/engmsb/) | **Public domain** (dedicated 2023) | `fdaab9c32190ba0b…` |

What the app adds, all free to use and ship inside an app:

| What | Used for | Licence |
|---|---|---|
| **Literata** reading font (Type Together for Google), through `@expo-google-fonts/literata` 0.4.3 | The Bible text, as on the site | Font: **SIL Open Font License 1.1** (font may be bundled; credit shown in the app's Settings). Package code: MIT |
| Expo SDK 58 (`expo` 58.0.19, `expo-router` 58.0.26, `expo-sqlite` 58.0.14, `expo-font`, `expo-splash-screen`) | The app framework, pages, on-phone databases | MIT. SQLite itself is public domain |
| React 19.3 and React Native 0.88 | Drawing the app | MIT |
| Uniwind 1.13 and Tailwind CSS 4.3 | The site's palette and styling classes | MIT |
| Zustand 5.0 | Remembering the reading place and settings | MIT |
| `react-native-svg` 15.16.0, `@expo/vector-icons` 15.1.1 (Feather and Material Community icons) | Library charts, Home card art, icons | MIT |
| `expo-audio` 58.0.10, `@react-native-community/slider` 5.2.1 | Playing the ASV recording, with its seek bar | MIT |
| `react-native-webview` 14.0.1 | Showing the Streetlights videos through YouTube's privacy-enhanced embed, as the site does | MIT |
| `expo-file-system` 58.0.12, `expo-sharing` 58.0.20 | Saving the Scholars page's source index as a CSV file and handing it to the phone's share sheet, where the site downloads it | MIT |

Second round (2026-10-24): the Library, the reader's extras and Listen use the site's own registered data
(chapter figures, AI chapter summaries, OpenBible.info cross-references, places, topics, hymns, who ruled),
copied into the app's Bible database. Listen also uses two outside sources, the same ones the site's `/listen` uses:

| What | How the app uses it | Licence / terms |
|---|---|---|
| Complete ASV read by Ron Altman, LibriVox (`bible_asv_complete_2112_librivox`), 129 MP3 files | Streamed from archive.org when the listener presses play; nothing downloaded or bundled | **Public domain** (LibriVox recordings are dedicated to the public domain). Credit: *Ron Altman, LibriVox* |
| Streetlights videos on YouTube (the owner's selections, as on the site) | Played in YouTube's own embedded player; the app stores only video ids and playlist links | YouTube's embed terms; the videos remain Streetlights'. Credit shown beside the player |

Reading, search, the Library and everything you save work fully offline and send nothing anywhere. Only Listen
needs a connection, and it contacts only YouTube and archive.org, when you press play.

<!-- open-workbooks:start -->
## Open workbooks — registered 2026-10-24 (local preview only; nothing published)

Free study materials made by other people whose own terms let anyone share them, handed out on the learning page's doors with their makers' credit. The table, with the exact wording that allows sharing, is `Research/Resources/OpenWorkbooks/open-workbooks.json`; files are held in `Research/Resources/OpenWorkbooks/files/` (manifest.json there has every file's URL, size and SHA-256), fetched by `scripts/fetch-open-workbooks.py` and placed by `scripts/publish-open-workbooks.mjs`. Checksum: the first 16 hex of a SHA-256 over that title's sorted `name sha256` lines.

| Title | By | Licence | Files / bytes | Checksum |
|---|---|---|---|---|
| [Open Bible Stories (50 illustrated stories, Creation to Revelation)](https://www.openbiblestories.org/l/en/) | unfoldingWord / Door43 World Missions Community | CC BY-SA 4.0 (text); illustrations CC BY-SA 3.0 (Sweet Publishing) | 1 / 28,188,819 | 9dd072bdd08046e5 |
| [Open Bible Stories Study Questions](https://git.door43.org/unfoldingWord/en_obs-sq) | unfoldingWord / Door43 World Missions Community | CC BY-SA 4.0 | 1 / 53,842 | 5fb2fd31a1bfedf5 |
| [Sweet Publishing Bible Illustrations (Read'n Grow Picture Bible art)](https://unfoldingword.org/sweet-publishing/) | Jim Padgett (illustrator) | CC BY-SA 3.0 Unported | 1 / 464,738,208 | a3e853bf5faae179 |
| [Bible for Children — illustrated Bible story booklets (66 stories)](https://bibleforchildren.org/languages/english/stories.php) | Edward Hughes (writer); Byron Unger, Lazarus and others (illustrators) | Publisher permission | 66 / 21,410,377 | 03e78174e6745788 |
| [Bible for Children — colouring books (one per story)](https://bibleforchildren.org/languages/english/stories.php) | Edward Hughes (writer); Bible for Children illustrators | Publisher permission | 60 / 22,814,238 | 3508ba6398be778b |
| [100 Short Bible Memory Verses for Kids (BSB) — cut-apart cards and 52-week plan](https://ministry-to-children.com/bible-memory-verses/) | Ministry-to-Children (Tony Kummer) | CC BY-SA 4.0 (Scripture text BSB, public domain) | 1 / 1,224,886 | b0659d3b4941afe4 |
| [Books of the Bible colouring pages: New Testament (27 books)](https://kids-bible-lessons.org/old-testament-coloring-pages/) | Ministry-to-Children / Kids Bible Lessons (Tony Kummer) | CC BY-SA 4.0 | 1 / 2,934,535 | 9129221f8c32f284 |
| [A Catechism for Boys and Girls](https://www.chapellibrary.org/book/cfba/catechism-for-boys-and-girls-a-hulseerroll) | Erroll Hulse (simplified from the Baptist / Keach catechism line) | Publisher permission | 1 / 410,308 | 81db8d63c45afb93 |
| [Spurgeon's Catechism (A Puritan Catechism, 1855)](https://www.chapellibrary.org/book/scat/spurgeons-catechism-spurgeoncharlesh) | Charles H. Spurgeon | Public domain text (UK, 1855); Chapel Library edition by publisher permission | 1 / 174,606 | f10e17e70c2eea92 |
| [Watts' First Catechism (for a young child of three or four) and Second Catechism](https://archive.org/details/bim_eighteenth-century_the-first-catechism-of-t_watts-isaac_1788) | Isaac Watts | Public domain (1788) | 1 / 19,246,980 | fe5925d1d5c5791f |
| [The Peep of Day](https://www.gutenberg.org/ebooks/53894) | Favell Lee Mortimer | Public domain (first published 1833) | 2 / 2,714,884 | 2a43304aa6ac33e1 |
| [Line upon Line (second series of the earliest religious instruction)](https://archive.org/details/lineuponline00mortuoft) | Favell Lee Mortimer | Public domain (first published 1837) | 1 / 9,616,119 | 7ca41c14c5135df6 |
| [First Steps for Little Feet in Gospel Paths](https://archive.org/details/firststepsforlit00fost) | Charles Foster | Public domain (US, 1882) | 1 / 13,689,668 | cbcf8425d8f9b989 |
| [The Story of the Bible from Genesis to Revelation](https://archive.org/details/storyofbiblefrom00fost_1) | Charles Foster | Public domain (US, 1884/1901) | 1 / 64,351,828 | 248d8bfa217c43d3 |
| [Hurlbut's Story of the Bible (168 stories)](https://archive.org/details/cihm_76911) | Jesse Lyman Hurlbut | Public domain (US, 1904) | 1 / 32,141,522 | 8291a61a48587216 |
| [Hurlbut's Bible Lessons for Boys and Girls](https://www.gutenberg.org/ebooks/29067) | Jesse Lyman Hurlbut | Public domain (US, 1907) | 2 / 19,394,973 | 45d5e52750252a22 |
| [Hurlbut's Life of Christ for Young and Old](https://www.gutenberg.org/ebooks/40460) | Jesse Lyman Hurlbut | Public domain (US, 1915) | 2 / 31,437,405 | 329882d51e51ca92 |
| [Child's Story of the Bible](https://www.gutenberg.org/ebooks/25309) | Mary A. Lathbury | Public domain (US, 1898) | 2 / 58,518,273 | 1e5ad152568352aa |
| [The Boyhood of Jesus](https://www.gutenberg.org/ebooks/44531) | Anonymous (poem by Lillian Payson) | Public domain (US, 1905) | 2 / 2,140,126 | 9c45979d8fb3460c |
| [Divine Songs Attempted in Easy Language for the Use of Children](https://www.gutenberg.org/ebooks/13439) | Isaac Watts | Public domain (first published 1715) | 2 / 199,724 | 067f4f5f58ae7b9e |
| [The Pilgrim's Progress in Words of One Syllable](https://www.gutenberg.org/ebooks/7088) | Mary Godolphin (Lucy Aikin), after John Bunyan | Public domain (19th century) | 2 / 280,796 | 41e415864500677e |
| [Methods of Bible Study, Part 1 (Course MB1)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | Chapel Library (compiled) | Publisher permission (Chapel Library reprint notice) | 1 / 471,361 | 632a0ba86c0b899a |
| [The London Confession of Faith of 1689 (Course LBC)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | Chapel Library (text: 1689 Second London Baptist Confession) | Publisher permission (Chapel Library reprint notice) | 1 / 877,143 | 251730d4161d2fa3 |
| [Church Officers (Course COF)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | Nehemiah Coxe (d. 1688); questions by Chapel Library | Publisher permission (Chapel Library reprint notice) | 1 / 625,277 | 9ec8e10cf11fbf85 |
| [Guide to Bible Study (Course GBS)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | Harvey Newcomb (1803-1863); questions by Chapel Library | Publisher permission (Chapel Library reprint notice) | 1 / 465,750 | c7b01b06e59997b9 |
| [Minister's Self-Watch (Course MSW)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | C. H. Spurgeon (1834-1892); questions by Chapel Library | Publisher permission (Chapel Library reprint notice) | 1 / 578,953 | 0c155f239d34f772 |
| [Spiritual Foundations of Ministry (Course SFM)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | Horatius Bonar (1866 text 'Words to Winners of Souls'); guide by Chapel Library | Publisher permission (Chapel Library reprint notice) | 1 / 391,508 | 6d77f0bd71efea59 |
| [The New Covenant in Christ: A Survey of the New Testament (Course NT1)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | Stanford E. Murrell | Publisher permission (Chapel Library reprint notice) | 1 / 346,985 | 2e6fa6e10c43ef82 |
| [The Attributes of God (Course ATR)](https://www.chapellibrary.org/pdf/forms/courses/mzbi-course-catalog.pdf) | A. W. Pink (1886-1952); guide by Chapel Library | Publisher permission (Chapel Library reprint notice) | 1 / 374,639 | 945399794fcb0d08 |
| [You Can Understand the Bible! Study Guide Commentary Series](https://www.freebiblecommentary.org/) | Dr. Bob Utley | Publisher permission (copyright notice in each volume) | 13 / 16,820,048 | 8a6105022981f348 |
| [unfoldingWord Translation Words](https://git.door43.org/unfoldingWord/en_tw/releases) | unfoldingWord contributors | CC BY-SA 4.0 | 1 / 10,249,111 | 854bd0075ad181aa |
| [Convention Normal Manual for Sunday-School Workers (Baptist First Standard Course)](https://archive.org/details/conventionnormal01spil) | B. W. Spilman, L. P. Leavell and H. C. Moore | Public domain (US, 1909) | 1 / 17,888,972 | e97084b1505c9be2 |
| [The Seven Laws of Teaching](https://archive.org/details/sevenlawsofteach00gregrich) | John Milton Gregory | Public domain (US, 1886) | 1 / 6,291,544 | 12622bae299a6115 |
| [Teaching and Teachers: The Sunday-School Teacher's Teaching Work](https://archive.org/details/teachingandteac00trumgoog) | H. Clay Trumbull | Public domain (US, 1884) | 1 / 15,468,219 | 5cdadbc870aac2ae |
| [Syllabus for New Testament Study: A Guide for Lessons in the Class-room](https://archive.org/details/syllabusfornewte00robe) | A. T. Robertson | Public domain (US, 1915) | 1 / 7,621,622 | b36802e82f1b5925 |
| [Synthetic Bible Studies](https://archive.org/details/syntheticbiblest00gray) | James M. Gray | Public domain (US, 1906) | 1 / 19,844,846 | adac59e384ea56a5 |
| [How to Master the English Bible](https://www.gutenberg.org/ebooks/41900) | James M. Gray | Public domain (US, c.1904-1907) | 2 / 226,908 | f19647bc0b17ad26 |
| [How to Bring Men to Christ](https://archive.org/details/howtobringmentoc00torrrich) | R. A. Torrey | Public domain (US, 1893) | 1 / 5,352,417 | d622c61cc6413e28 |
| [What the Bible Teaches](https://archive.org/details/whatthebibletea00torruoft) | R. A. Torrey | Public domain (US, 1898) | 1 / 39,967,498 | db2200379c46f315 |
| [Lectures to My Students](https://archive.org/details/lecturestomystu00spuruoft) | C. H. Spurgeon | Public domain (US, 1875) | 1 / 13,602,350 | 7efe8bacac2566a5 |
| [A Treatise on the Preparation and Delivery of Sermons](https://archive.org/details/treatiseonprepar00broa) | John A. Broadus | Public domain (US, 1870) | 1 / 38,056,011 | 0f228dae220565a2 |
| [Abstract of Systematic Theology](https://archive.org/details/abstractofsystem00boyc_0) | James P. Boyce | Public domain (US, 1887) | 1 / 41,033,402 | 2e68a291b0180aaf |
| [The Great Doctrines of the Bible](https://www.gutenberg.org/ebooks/6038) | William Evans | Public domain (US, 1912) | 2 / 521,393 | 83ff4f4eae1b408d |
| [The Scofield Bible Correspondence School Course of Study, Vol. 1: The Old Testament](https://archive.org/details/scofieldbiblecor00scof) | C. I. Scofield | Public domain (US, 1907) | 1 / 15,838,271 | 95c6adb15d24df68 |
| [Thoughts on Family-Worship](https://archive.org/details/thoughtsonfami00alex) | James W. Alexander | Public domain (US, 1847) | 1 / 13,233,410 | 4a4bac07adcaae6a |
| [A Church in the House: or, Family Religion](https://archive.org/details/churchinhouseorf00henr) | Matthew Henry | Public domain (sermon 1704; this edition US 1824) | 1 / 2,837,164 | 2e81528bc50ae0b1 |
| [Family Worship](https://www.chapellibrary.org/) | J. H. Merle d'Aubigné | Publisher permission (Chapel Library; underlying 19th-c. text public domain) | 1 / 208,697 | 6f9b4fca1cc3978f |
| [A Book for Boys and Girls; or, Temporal Things Spiritualized](http://www.chapellibrary.org/book/bubfba) | John Bunyan | Public domain (England 1686/1701; author died 1688) | 1 / 122,855 | 86098ebe38cbfeff |
| [A Puritan Catechism, with Proofs](https://www.philmorgan.org/wp-content/uploads/2012/09/APuritanCatechism.pdf) | C. H. Spurgeon | Public domain (UK 1855; author died 1892) | 1 / 455,726 | 6a574581dc5ac80b |
| [The Baptist Catechism (Keach's Catechism)](https://archive.org/details/MN40248ucmf_4) | Attributed to Benjamin Keach and William Collins | Public domain (1693; American reprints 18th-19th c.) | 1 / 793,360 | b2584b63e17efc90 |
| [M'Cheyne Bible Reading Calendar (one-page and two-page printables, bookmarks)](http://www.edginet.org/mcheyne/printables.html) | Robert Murray M'Cheyne (plan, 1842); formatted by Ben Edgington; bookmarks by Dru Martin | CC0 1.0 (Ben Edgington's formatting); underlying 1842 plan public domain | 1 / 14,384 | 91afa7185fca5f7e |
| [Navigators Bible Reading Plan](https://www.ligonier.org/posts/bible-reading-plans) | The Navigators (adapted from the Discipleship Journal plan) | Publisher permission (The Navigators) | 1 / 463,212 | 320736c2839b9b47 |
| [Navigators Book-at-a-Time Bible Reading Plan](https://www.ligonier.org/posts/bible-reading-plans) | The Navigators | Publisher permission (The Navigators) | 1 / 250,106 | b901c5ea0ed5e3a0 |
| [Navigators 5x5x5 New Testament Bible Reading Plan](https://www.ligonier.org/posts/bible-reading-plans) | The Navigators (adapted from Discipleship Journal) | Publisher permission (The Navigators) | 1 / 499,862 | 68a886f306fc345d |
| [The Beginners Family Worship Handbook](https://ministry-to-children.com/family-worship/) | Tony Kummer | CC BY-SA 4.0 (site-wide) plus explicit permission in the PDF | 1 / 206,104 | 634b712a59409166 |
| [Kids Can! Devotions (six months of daily devotions)](https://ministry-to-children.com/kids-can-devotion-1/) | Ministry-To-Children.com writers | CC BY-SA 4.0 | 2 / 137,466 | 547de975d94589d3 |
| [Printable Bible Reading Chart for Kids](https://ministry-to-children.com/printable-bible-reading-chart-for-kids/) | Felicia Mollohan | CC BY-SA 4.0 (site-wide footer) | 1 / 142,769 | 5da5b2a7be22bd28 |
| [Morning and Evening: Daily Readings](https://www.ccel.org/ccel/spurgeon/morneve.html) | C. H. Spurgeon | Public domain (19th c.; author died 1892) | 1 / 4,757,810 | dcdb5b5869fa6445 |
| [Daily Light on the Daily Path](https://ccel.org/ccel/anonymous/daily_light) | Jonathan Bagster and family (Samuel Bagster & Sons) | Public domain (UK c.1875; US edition 1875; 1901 edition scanned) | 1 / 5,478,950 | 5ae19c214611abcd |
| [The Duties of Parents](https://www.monergism.com/thethreshold/sdg/dutiesofparents.html) | J. C. Ryle | Public domain (UK 1888; author died 1900) | 1 / 302,955 | f8be9486bebe56e9 |
| [Bible Mapper, Jr. (maps and map lessons for kids)](https://biblemapper.com/jr/maplist/) | David P. Barrett | Publisher permission (non-commercial) | 11 / 172,397,301 | 3ebc7614eb53cab8 |
| [Bible Atlas: A Manual of Biblical Geography and History](https://www.gutenberg.org/ebooks/41140) | Jesse Lyman Hurlbut (introduction by John H. Vincent) | Public domain (US, 1910 and earlier) | 1 / 18,954,981 | a0aaf539a8a24cbe |
| [Thoughts for Young Men (Course TYM)](https://www.chapellibrary.org/course/tym) | J. C. Ryle (1816-1900) | Publisher permission (notice printed inside the PDF) - Copyright 2006 Chapel Library: annotations, questions | 1 / 608,800 | d7e88862578a3391 |
| [Thoughts for Young Men (Christian Classic Series booklet)](https://www.chapellibrary.org/book/tfym) | J. C. Ryle (1816-1900) | Publisher permission (notice printed inside the PDF) - Copyright 2006 Chapel Library | 1 / 463,984 | fac078cca01ca1d9 |
| [All of Grace (Course AOG) - study guide](https://www.chapellibrary.org/course/aog) | Charles H. Spurgeon (1834-1892) | Publisher permission (notice printed inside the PDF) - Copyright 2000 Chapel Library | 1 / 383,549 | 5af002e67b291f58 |
| [Life of Jesus Christ - complete (Course LC3)](https://www.chapellibrary.org/course/lc3) | Chapel Library (compiled; Gospel readings) | Publisher permission (notice printed inside the PDF) - Copyright 2001 Chapel Library | 1 / 753,579 | 1a768191e9016aa4 |
| [What Is a Biblical Christian? (Course WBC)](https://www.chapellibrary.org/course/wbc) | Albert N. Martin (1934-2026) | Publisher permission (notice printed inside the PDF) - Copyright 2015 Chapel Library | 1 / 476,776 | a78df9dca6b17bb6 |
| [The Deity of Christ (Course DOC)](https://www.chapellibrary.org/course/doc) | William S. Plumer (1802-1880) | Publisher permission (notice printed inside the PDF) - Copyright 2015 Chapel Library: annotations, questions | 1 / 529,687 | 8321f5b4638f7117 |
| [Look to Jesus (Course LTJ)](https://www.chapellibrary.org/course/ltj) | William Reid (1822-1881) | Publisher permission (notice printed inside the PDF) - Copyright 1999 Chapel Library: annotations, questions | 1 / 819,785 | b5b89c21b533aa9e |
| [The Pilgrim's Progress (Course PL1P) - study guide](https://www.chapellibrary.org/course/pl1p) | John Bunyan (1628-1688) | Publisher permission (notice printed inside the PDF) - Copyright 2001 Chapel Library | 1 / 518,085 | a50dcde6311545cf |
| [Seek the Lord Early](https://www.chapellibrary.org/book/stle) | J. C. Ryle (1816-1900) | Publisher permission (notice printed inside the PDF) - Copyright 2018 Chapel Library: annotations (original text public domain) | 1 / 239,733 | cb6567086bb7186f |
| [How to Study the Bible for Greatest Profit](https://archive.org/details/howtostudybiblef00torr) | R. A. Torrey | Public domain (US, published 1896) | 1 / 8,952,639 | 510b50ce0695e2c0 |
| [How to Succeed in the Christian Life](https://www.gutenberg.org/ebooks/55743) | R. A. Torrey | Public domain (US, published 1906) | 2 / 236,269 | 7d1b92654cd77aa1 |
| [How to Pray](https://archive.org/details/howtopray00torr) | R. A. Torrey | Public domain (US, published 1900) | 1 / 5,460,741 | 1a3f65a18984c962 |
| [The Way of Life](https://archive.org/details/wayoflife00hodg) | Charles Hodge | Public domain (US, published 1841) | 1 / 14,994,828 | 26bd8c8e291ce338 |
| [The Life of Jesus Christ](https://archive.org/details/lifeofjesuschri00stal) | James Stalker | Public domain (US, published 1880) | 1 / 9,565,981 | 83791662e52f4fee |
| [The Life of St. Paul](https://www.gutenberg.org/ebooks/21828) | James Stalker | Public domain (US, published 1884) | 2 / 1,868,004 | 3ead1d38b7ceb74a |
| [The Pleasantness of a Religious Life](https://archive.org/details/pleasantnessare00henrgoog) | Matthew Henry | Public domain (US, published 1714) | 1 / 2,933,056 | 0fce6676aec48328 |
| [The Young Man from Home](https://archive.org/details/theyoungmanfromh00jameuoft) | John Angell James | Public domain (US, published 1844) | 1 / 7,692,135 | c5d547ab70434685 |
| [The Way to God and How to Find It](https://archive.org/details/waytogodhowtofin00mood) | D. L. Moody | Public domain (US, published 1884) | 1 / 7,728,949 | f56251fbe85dd8c3 |

<!-- open-workbooks:end -->

## Theology articles — registered 23 October 2026 (local only; nothing published)

The new Theology section (`/study/theology-articles`) and its first article, *The Trinity*
(`/study/theology-articles/the-trinity`), with its Study card in God & Christian Faith. **Built and
checked on the local preview only. Nothing here has been deployed.**

**No files were added to the repository for this.** Every quotation is typed into the article modules
under `src/pages/study/theology-articles/articles/`, each one carrying the work, the author, the
translation it was read in, a locator precise enough to look up, and a link to the edition. The
section's whole source register is the `SOURCES` array in
`src/pages/study/theology-articles/model.ts`, and it is shown to the reader at the foot of both the
landing and the article.

| Source | What was taken | Licence | Read in / checked against | Checksum |
|---|---|---|---|---|
| Augustine, *On the Trinity*, tr. Arthur West Haddan, Nicene and Post-Nicene Fathers (NPNF) first series vol. 3 | Five short extracts: V.9.10, VIII.10.14, X.11.18, XV.23.43, XV.28.51 | Translation published 1887, **public domain** | This project's held CCEL text export, `sources/library/source-patristic-ccel/npnf103.txt` (3,357,503 bytes) | `cc8d3ff7ce4d4ba2…` |
| Socrates Scholasticus, *Ecclesiastical History*, NPNF second series vol. 2 | The creed and anathemas of Nicaea 325 and Eusebius's report of them (I.8); the hundred and fifty bishops at Constantinople 381 (V.8) | Translation published 1890, **public domain** | `sources/library/source-patristic-ccel/npnf202.txt` (3,002,300 bytes) | `b78d178bd79b6264…` |
| Gregory of Nyssa, *On "Not Three Gods", to Ablabius*, tr. H. A. Wilson, NPNF second series vol. 5 | Four short extracts, including Ablabius's objection and the one-operation argument | Translation published 1893, **public domain** | `sources/library/source-patristic-ccel/npnf205.txt` (3,490,499 bytes) | `cef974043e48a52d…` |
| Gregory of Nazianzus, *Oration 31* (the fifth Theological Oration), tr. Browne and Swallow, NPNF second series vol. 7 | Five short extracts: §30, and §§31–33 rejecting the spring/fountain/river and sun/ray/light pictures | Translation published 1894, **public domain** | `sources/library/source-patristic-ccel/npnf207.txt` (3,388,014 bytes) | `56d84cfa94dee313…` |
| Basil of Caesarea, *On the Holy Spirit* and *Letter 236*, tr. Blomfield Jackson, NPNF second series vol. 8 | Two short extracts: 18.44–45 on not counting by addition, and Letter 236.6 on essence and hypostasis | Translation published 1895, **public domain** | `sources/library/source-patristic-ccel/npnf208.txt` (2,645,735 bytes) | `4f21a589be54f0c1…` |
| Thomas Aquinas, *Summa Theologiae*, First Part, tr. the Fathers of the English Dominican Province | Four short extracts: q. 27 a. 1 and a. 3 on the two processions; q. 32 a. 1 and its reply to objection 2 on what reason cannot prove | Translation second edition 1920, **public domain** | The published edition at [newadvent.org/summa/1027.htm](https://www.newadvent.org/summa/1027.htm) and `1032.htm` | — |
| Philip Schaff, *The Creeds of Christendom* | The Latin of the creed of 381 (Dionysius Exiguus) and Schaff's note on verse 4 of the Athanasian Creed | Published 1877, **public domain** | This site's own creeds collection, which already holds both pages: `/study/creeds/nicene-creed-381-schaff` and `/study/creeds/athanasian-creed-quicunque-schaff` | registered with the creeds collection |
| The Athanasian Creed and the Niceno-Constantinopolitan Creed | §§3–4 of the former; the article on the Holy Spirit from the latter | **Public domain** | This site's own copies, `/study/creeds/athanasian-creed-800` and `/study/creeds/nicene-creed-381` | registered with the creeds collection |
| *The Holy Bible, Berean Standard Bible* | 13 passages, quoted in full | **Public domain**, dedicated 2023 | This site's own `data/plain/bsb/`, re-checked verse by verse on every test run by `src/pages/study/theology-articles/theology.test.ts` | registered with the Bible data |
| C. S. Lewis, *Mere Christianity*, Book IV ("Beyond Personality") | **Nothing.** Three passages of his argument are described in our own words, labelled on the page as our summary, and cited by book and chapter | **Still in copyright** — described and cited, never reproduced | The published edition, cited for the reader to open | — |

**The CCEL question, stated plainly.** The five volumes above are this project's held text exports
from the Christian Classics Ethereal Library, whose own entry in this register records
personal/educational/non-profit electronic-edition terms and says that "public publication requires a
separate decision". What is published on the page is not CCEL's electronic edition: it is short
extracts of the underlying NPNF translations, every one of them published between 1887 and 1895 and so
in the public domain in their own right, with the translator named beside each quotation exactly as
that entry requires. The CCEL files were used to verify wording, and the link offered to the reader is
to ccel.org. The same corpus already supplies the published creeds collection on this site. **This is
the owner's call to confirm before anything is deployed, and nothing has been.**

**Copyright is enforced in code, not by good intentions.** Each source in `model.ts` carries a
`checked` field: `corpus` (verified against our held copy of the named edition), `edition` (verified
against the published edition linked) or `none` (in copyright — described, never reproduced). A test
asserts that no source marked `none` is ever used by a quotation block, and that any source so marked
appears only as a labelled summary. Adding a quotation from a work in copyright fails the suite.

## Old maps — registered 19 October 2026 (local only; nothing published)

The Atlas home's ninth card ("Old maps", `/study/atlas/old-maps`) and its Study card in History & archaeology. The counts on the
card come from the historical maps corpus in `Research/HistoricalMaps/` (every source, licence and checksum is in its
`MANIFEST.md`), as re-tagged by `design/old-maps-directions/build-data.py` and copied into
`src/pages/places/old-maps-summary.json`. Until the owner chooses the collection page's design, only the three maps below are
shown, as small previews.

| Source | What was taken | Licence | Files / bytes | Checksum |
|---|---|---|---|---|
| Historical maps corpus, `Research/HistoricalMaps/normalized/catalogue.json` (built 2026-10-17 from Wikimedia Commons, the Internet Archive incl. the David Rumsey Map Collection, the Library of Congress and the New York Public Library) | Counts only: 1,093 maps of the biblical world by title, 343 mapmakers, 10 libraries, dated 680–1928 | Per record; see the corpus `MANIFEST.md`. Counts are facts | 1 / 2,713,941 | `164ff533a1791b39…` |
| Library of Congress, Geography and Map Division: *Palestine*, Rudimentum Novitiorum, Lübeck 1475 ([2021668403](https://www.loc.gov/item/2021668403/)) | A 340 px preview, `public/images/old-maps/m0009.jpg` | **Public domain.** Courtesy credit: *Library of Congress, Geography and Map Division* | 1 / 21,289 | `06b055dd475259bc…` |
| Library of Congress, Geography and Map Division: Nicolaes Visscher, *Terra sancta sive promissionis*, 1659 ([2006629146](https://www.loc.gov/item/2006629146/)) | A 340 px preview, `public/images/old-maps/m0125.jpg` | **Public domain.** Courtesy credit as above | 1 / 14,611 | `da3a59a17af37afa…` |
| Library of Congress, Geography and Map Division: Johann Baptist Homann, *Ivdaea sev Palaestina*, 1748 ([99466737](https://www.loc.gov/item/99466737/)) | A 340 px preview, `public/images/old-maps/m0225.jpg` | **Public domain.** Courtesy credit as above | 1 / 24,970 | `78466ccdbca53ba5…` |
| Same corpus, matched to the Atlas map's places by `scripts/old-maps-places.py` (titles only, with old spellings as aliases; American towns, photographs and modern border maps left out) | The "Old maps of <place>" bar in the map's place panel: per place, how many maps name it and the earliest year (`src/components/atlas/old-maps-by-place.json`), and up to four 220 px previews, `public/images/old-maps/places/` | Previews only from maps that are **public domain, CC0 or with no known restrictions**; each keeps its holder's courtesy credit in its tooltip and links to its library page | 82 / 660,952 images; 1 / 45,668 data | images `de454525b76fd1bf…` (in name order), data `f164d552314a680c…` |

## Museum-Grade Archaeology — registered 17 October 2026 (local only; nothing published)

The museum and archive records behind `/study/museum-archaeology` and its 39 collection pages. **This
page is built and verified on the local preview only. Nothing here has been deployed.** The corpus is
`Research/Artifacts/` (built by Fortress job 34dfa4d0); the page data is generated from it by
`scripts/build-museums.py` into `data/museums/`, and nothing in `Research/` is written to by the
website build.

The corpus's own manifest records every downloaded file's URL, size and SHA-256:
`Research/Artifacts/manifest.json` (SHA-256 `10fbb1940f098bc5…`). The "checksum" column below is a
SHA-256 over that source's sorted `path sha256` lines from `Research/Artifacts/checksums/`, so a
whole source's downloads can be re-verified in one value.

| Source | What was taken | Licence | Files / bytes | Checksum |
|---|---|---|---|---|
| [The Metropolitan Museum of Art, Open Access](https://github.com/metmuseum/openaccess), retrieved 2026-10-17 | The Open Access CSV over git-LFS, verified against the SHA-256 in its own LFS pointer, then 400 objects asked of the per-object API. 35,836 records | **CC0 1.0** for all collection metadata; images CC0 for objects the museum flags public domain. Courtesy credit: *The Metropolitan Museum of Art, Open Access* | 708 / 342,191,482 | `79a1e624900b4335…` |
| [The Cleveland Museum of Art, Open Access API](https://openaccess-api.clevelandart.org/), retrieved 2026-10-17 | 24 pages of the public API, with the museum's own date filter. 2,377 records | **CC0 1.0** for metadata; images CC0 where the record's `share_license_status` says so. Courtesy credit: *The Cleveland Museum of Art, Open Access* | 24 / 12,308,328 | `13d951c37543228b…` |
| [The Art Institute of Chicago, Open Access API](https://api.artic.edu/api/v1/artworks), retrieved 2026-10-17 | The public search endpoint, filtered to the period locally. 1,035 records | **CC0 1.0** for metadata; images CC0 for public-domain works. Courtesy credit: *The Art Institute of Chicago, Open Access* | 256 / 42,629,503 | `14d55346a606e9fa…` |
| [Smithsonian Open Access](https://www.si.edu/openaccess), retrieved 2026-10-17 | The search API using api.data.gov's published `DEMO_KEY`, a documented demo token rather than a secret. 10 records | **CC0 1.0** for records the Smithsonian flags Open Access. Courtesy credit: *Smithsonian Open Access* | 10 / 8,746,749 | `60015cbe05d72319…` |
| [Europeana](https://api.europeana.eu/record/v2), retrieved 2026-10-17 | The record search API with the published `api2demo` key, thirty named queries. 111 records | Europeana metadata **CC0 1.0**; **each item keeps its own rights statement**, recorded per record, and that statement governs its image. Credit: *Europeana, and the data provider named in each record* | 53 / 5,119,088 | `f249d680e4d32408…` |
| [Wikidata](https://www.wikidata.org/w/api.php) and [Wikimedia Commons](https://commons.wikimedia.org/w/api.php), retrieved 2026-10-17 | Each of the 51 named objects resolved once to a Wikidata item, checked against its expected label, and its Commons photographs read. 50 records | Wikidata structured data **CC0 1.0**; **each Commons photograph carries its own licence and its own photographer**, recorded per file. Credit: *Wikidata (CC0) and the photographer named on each file* | 164 + 265 / 864,316 | `a31693e9b3f2914f…` · `a45eb9ae5643be81…` |
| [ORACC, the Open Richly Annotated Cuneiform Corpus](https://oracc.museum.upenn.edu/), retrieved 2026-10-17 | The published per-project JSON exports, taken only for projects this repository does not already hold, read in memory without unzipping. 4,883 records | **CC BY-SA 3.0 — credit and share-alike.** Credit: *Oracc, http://oracc.museum.upenn.edu, and the project editors named per corpus* | 10 + 14 / 58,007,895 | `3403aa4e8ec1f4ed…` · `d77c55e8357abcf1…` |
| [CDLI, the Cuneiform Digital Library Initiative](https://github.com/cdli-gh/data), retrieved 2026-10-17 | The published bulk catalogue dump over git-LFS, verified against the SHA-256 in its own pointer. Their robots.txt sets a 60-second crawl delay, so **their pages were not harvested at all**. 11,145 records | **CC BY-SA 4.0 — credit and share-alike.** Credit: *Cuneiform Digital Library Initiative, https://cdli.earth* | 1 / 154,768,722 | `4f2d3d6d96d5b183…` |
| This project's own archaeology catalogue, `KnowledgeBase/Biblical Archaeology/discovery-catalog.json` | Rows BA-001 to BA-140: each one's category, the proposition it supports, the extension it does not, and its claim assessment. 50 rows are matched to an object on these pages | The project's own research. Read only; the catalogue is not written to | 1 / 206,962 | — |

**The photographs.** 2,500 image files are held in the corpus, 0.61 GB, git-ignored. **158 resized
derivatives of 79 of them are committed** under `public/images/museums/`, 4.92 MB in total, each one
recorded with its licence, credit, byte count and the SHA-256 of the original in
`public/images/museums/manifest.json`. By licence: 25 CC0, 20 public domain, 13 CC BY 4.0, 11 CC BY-SA
4.0, 5 CC BY-SA 3.0, 2 CC BY 3.0, 2 GFDL and 1 CC BY-SA 2.0 fr. **19 of the 79 carry a share-alike
obligation and are marked as such on the page, beside their own credit** — the licences differ file by
file, so the credit sits with the record and never with the page.

**The test for showing an image is deny-by-default.** A file is shown only when the corpus recorded it
as downloaded *and* its own `image.licence` exactly matches that list. The record-level licence field
is never consulted for an image decision, because for the restricted Europeana items it contains the
text "CC0" while the item itself is not open. An attribution licence with no recorded photographer is
a build failure rather than an uncredited photograph.

**Deliberately not taken, and not shown.** Eight Europeana records state item rights that are not
open — six CC BY-NC-ND, one CC BY-NC-SA 4.0 and one rightsstatements.org "No Copyright — Other Known
Legal Restrictions". **No image was downloaded for any of the eight**, and the one asserting an explicit
restriction must not be fetched later without re-reading that statement. Nothing at all was requested
from britishmuseum.org, whose robots.txt reserves AI collection and whose own object photography is
CC BY-NC-SA; nothing from the Israel Antiquities Authority, which answers a Cloudflare challenge and
reserves all rights; nothing from the Israel Museum, which has no open API; and nothing from the
Rijksmuseum, whose old API is gone and whose replacement needs a registered key. The Art Institute's
image server refuses a non-browser client, so its 1,016 public-domain image addresses are stored and
no file was copied — spoofing a browser to get around that was not done.

**No museum logo appears anywhere on these pages.** A museum's name and mark are its trademarks and
almost none are openly licensed, so every emblem is this project's own line drawing.

## Christian writers corpus additions to the acquisition desk — 16 October 2026

Added to `/data_acquisition/` by `scripts/build-corpus-additions.py` and `scripts/apply-corpus-additions.mjs`, taken from `D:/FortressOfSolitude/christian-writers-corpus` (Fortress job 727d55dd; every file's URL, size, SHA-256 and licence is in that corpus's `manifest.json`). Only what the desk lacked: McClintock & Strong supplement volumes 11 and 12 (Internet Archive OCR, public domain); Catholic Encyclopedia volume 6, replacing the desk's failed download (English Wikisource dump; 1913 text public domain, Wikisource markup CC BY-SA 4.0, credited to Wikisource contributors; 4 of 723 articles are only scanned-page pointers and are marked); and 10,946 candidate people from Wikidata (CC0) with Wikipedia titles and the Wikipedia "List of Christian theologians" (CC BY-SA 4.0).

## Theological reference acquisition desk — 16 October 2026

**Latest reader presentation:** At the owner's request, every volume displays its full saved TXT continuously after its title, with Find and a top-right link to that exact TXT. Pagination and supplementary reader panels/notices were removed; underlying text, credits, source identities and review metadata remain preserved. Missing TXT has only a source download/open action. Six previously identified Schaff IA TXT witnesses (4, 5, 7, 8, 10, 11; 23,721,580 bytes) were downloaded for reading and remain unreviewed; only 3, 6 and 12 have sample comparisons. No new OCR or complete-coverage verdict was issued. The explicitly referenced held Catholic volume 6 Wikisource text is included with its existing source/attribution and four-article-gap metadata; other concurrent corpus additions remain local to their owner.

**Wace & Piercy bounded comparison:** The owner requested direct extraction of this held PDF and comparison of the reported French index issue. `scripts/extract-wace-text.py` extracted existing text from all 2,265 PDF pages in 36.382 seconds, without OCR. Canonical TXT, per-page offsets, source identity and evidence: `../Data/TheologicalReferenceLibrary/Extracted/Wace-Piercy/`. Three rendered body pages (PDF pages 100, 1133 and 2168) were visually inspected, with two normalized passage matches per page against the saved TXT. All seven French index phrases match after whitespace/apostrophe normalization. The PDF preserves index references 913/499; the original TXT uses hyperlink references `[4948]1`/`[4949]1`. Both cited French passages remain present in the TXT. PDF file pages 918/504 contain the passages; 913/499 are the CCEL PDF's displayed page numbers, not the file's page indices or original print edition's page numbers.

The original TXT's SHA-256 matches acquisition, decodes strictly as UTF-8 and contains correct `chargé`/`mérovingienne`; no `Ã` or replacement-character markers were found. The main public reader and served TXT were also checked: the response declares `text/plain; charset=utf-8` and displays the quoted accents correctly. The user's garbled example is not present in these saved bytes. PDF extraction retains running headers, side-page labels and line-break hyphens. These samples do not certify complete coverage or historical accuracy. The desk prefers the page-located PDF extraction while retaining the original TXT and provenance. `scripts/apply-wace-review.mjs` binds the evidence to the same two source IDs; coverage remains INCOMPLETE with comparison marked Samples only. No work was promoted to Reliable from these samples.

**Schaff completeness review:** The owner authorized extracting existing text layers from New Schaff–Herzog first, then comparing a few IA OCR witnesses. `scripts/extract-schaff-text.py` processed the 13 receipt-bound PDFs sequentially (8,557 PDF pages; 63.076 seconds total extraction runtime) with no new OCR. Outputs and page offsets are under `../Data/TheologicalReferenceLibrary/Extracted/Schaff-Herzog/`. Processing all files does not mean clean or complete text: volumes 3–8 and 10–12 have confirmed article-body gaps in the text layer; volumes 1, 2, 9 and 13 have substantial selectable text whose full coverage remains unverified. PDF preview images were rendered from the held CCEL PDFs; their scan layout is inherited from those files.

Only the already identified IA TXT witnesses for volumes 3, 6 and 12 were downloaded (12,522,423 bytes combined), preserving original bytes and separate SHA-256 receipts under `Extracted/Schaff-Herzog/IA/`. Three rendered PDF-page samples per volume were inspected, with located phrase checks against the IA and CCEL texts. The IA contains sampled prose absent from CCEL's text layers. This is not full-volume certification. Volume 12 has an unresolved appendix pagination difference (IA ending at printed page 599; CCEL's TXT page index ending at 576). Title OCR records 1910 for IA volume 6 and 1912 for volume 12; the earlier acquisition plan's blanket 1908 dates remain explicitly inherited and unverified. Separate printing identities and page locators are preserved.

`completeness-review.json` and CSV record the evidence and outstanding checks. The desk now presents COMPLETE/INCOMPLETE per reading representation, with text-saved, coverage, comparison and completion stages. INCOMPLETE distinguishes known gaps from unfinished checks. No Schaff representation has passed COMPLETE; sample matches, download success and nonempty extraction cannot pass that gate. Original acquisition statuses remain source provenance. The three sampled IA witnesses are preferred for reading their volumes, without changing the verdict on the original CCEL representations. `scripts/apply-completeness-review.mjs` applies the bounded evidence to existing IDs and validates the completion gate; the existing exporter invokes it after reference derivatives.

**Short-list author table:** `scripts/build-acquisition-authors.mjs` reads four existing derivatives, in ascending list length: IVP's 11 chapter subjects, Routledge's 47 contents entries, Carolina's 100 name/date rows, and Brad East's 153 main entries plus 25 additions. The era table accounts for all 336 source entries: 332 individual-name occurrences grouped into 290 provisional name rows, plus four book/collective/paired entries kept outside the author table. Exact spellings and exact existing `scholars.json` name/short-name aliases are grouped; other name variants remain separate. Existing profile IDs and inherited dates are explicit. Source dates and disagreements remain visible; grouping uses recorded birth year, not intellectual movement. No rank, verified identity census or holdings count is inferred. Canonical exports: `../Data/TheologicalReferenceLibrary/Derived/Author-Review/short-lists-by-era.{json,csv}`; public review copies: `public/data_acquisition/authors-by-era.{json,csv}`. No encyclopedias were processed.

The five formerly non-readable held reference entries now have attributed TXT derivatives under `../Data/TheologicalReferenceLibrary/Derived/`: Brad East's 153 main names/dates plus 25 suggested additions; all 100 name/date rows of the Carolina University handout (credited to Prof. Moore, with PDF page locators); Routledge's 47 named contents entries for *Fifty Key Christian Thinkers*; IVP's eleven chapter-subject names for *The Great Theologians*; and Lifeway's bibliographic facts for *131 Christians Everyone Should Know*. Publisher overviews are independently worded summaries. These derivatives expose factual lists and reference details, not complete commercial books or complete modern article prose. Exact source URLs, original-file hashes, derivative hashes, counts and scope are recorded beside the derivatives. Source names, spellings and dates remain as recorded, without identity reconciliation. Scripts: `extract-brad-east-list.mjs`, `extract-carolina-reference.py`, `extract-publisher-references.mjs`, with `apply-reference-texts.mjs` maintaining the existing reader bindings. No new downloads or OCR were run.

`/data_acquisition/` exposes the saved reference acquisition catalogue and 39 unmodified historical TXT files. Canonical originals, download hashes and receipts remain under `../Data/TheologicalReferenceLibrary/`. `scripts/build-data-acquisition.mjs` exports only that receipt and the nine identified alternatives; it does not start downloads or process the larger library. Counts represent files, not distinct works or authors. A successful download does not certify text completeness.

Text providers: [CCEL New Schaff–Herzog](https://www.ccel.org/ccel/schaff/encyc01.html), [CCEL Wace/Piercy](https://www.ccel.org/ccel/wace/biodict.html), and Internet Archive OCR for the historical Catholic Encyclopedia and McClintock–Strong Cyclopaedia. Individual exact source URLs and inherited edition notes are preserved in `public/data_acquisition/catalogue.json`; original notices remain in the TXT. Nine short CCEL files are explicitly marked as coverage unverified. Catholic material is identified as a historical Catholic reference, without implied doctrinal endorsement.

Modern scholar lists and commercial publisher pages are linked and described rather than republished in full: Brad East, Carolina University, Routledge, IVP and Lifeway. Their saved HTML/PDF status does not imply possession of a complete commercial book. St Andrews connection failures and the failed Catholic Encyclopedia volume 6 attempt remain visible. Owner explicitly authorized a fully open acquisition interface; no login is required.

## Parables final verification - 11 October 2026

The ten-step local revision is complete. See [Final review](docs/parables/FINAL-REVIEW.md) for source-link checks, Scripture validation, interface verification and limits. Current collection: 57 studies / 96 ranges / 610 verse references; 13 distinct public commentary/inventory links responded successfully. No publication. Earlier entries below remain the historical review trail.

## Parables Gospel parallels reviewed - 11 October 2026

Implementation-plan step 5: added Luke 11:33 to the lamp and Matthew 12:33-37 to the tree/fruit study. Each occurrence has its own setting note and full-reference selector. See [Gospel parallels](docs/parables/GOSPEL-PARALLELS.md) for Scripture and commentary checks. Current coverage is 57 studies / 96 passage ranges / 610 verse references. This supersedes earlier passage totals below. Steps 6 through 10 await authorization; no publication.

## Parables difficult passages reviewed - 11 October 2026

Implementation-plan step 4 completed: seven studies now have deeper explanations, reasons for their adopted readings, significant attributed alternatives and named source links. See [Difficult passages](docs/parables/DIFFICULT-PASSAGES.md) for the exact texts, independently authored treatments and limits. The source register adds Bock and a clearly identified comparative Catholic application from Benedict XVI. The collection remains 57 studies / 94 passage ranges / 604 verse references. Steps 5 through 10 await authorization. No publication.

# Sources

## Hymns — registered 17 October 2026 (local preview only; nothing published)

The hymn texts and the hymnal metadata behind `/study/hymns` and its 1,169 hymn pages (1,228 first lines; 59 are a second spelling of a hymn already held). Every hymn text here was first
published between 1707 and 1779 and is long out of copyright; what is credited is the **edition each was transcribed
from**. The corpus is `Research/Hymns/`; its manifest records every file's URL, size and SHA-256
(`Research/Hymns/manifest.json`, SHA-256 `d172ee8120482e59…`). The page data is generated from it by
`scripts/hymns/` and `scripts/build-hymn-pages.py` into `data/hymns/` (generated, not in git). The corpus's
`normalized/` and `raw/` folders are only read; the pipeline's own in-between files go to `Research/Hymns/pipeline/`.

The checksum column is the SHA-256 of the one downloaded file, or for Hymnary.org a SHA-256 over its sorted
`path sha256` lines, so the whole set can be re-verified in one value.

| Source | What was taken | Licence | Files / bytes | Checksum |
|---|---|---|---|---|
| [*Olney Hymns, in Three Books*](https://ccel.org/ccel/newton/olneyhymns), John Newton and William Cowper (London, 1779), Christian Classics Ethereal Library ThML edition 0.7, retrieved 2026-10-17 | The ThML XML: all 349 hymns (Newton 281, Cowper 68), with each hymn's author, metre, book and the passage printed above it | **Public domain** (1779; Newton died 1807, Cowper 1800). CCEL distributes it as a public-domain title. Courtesy credit: *Christian Classics Ethereal Library* | 1 / 1,205,373 | `de616012b61f32fe…` |
| [*The Psalms and Hymns of Isaac Watts*](https://ccel.org/ccel/watts/psalmshymns), Christian Classics Ethereal Library ThML edition, retrieved 2026-10-17 | The ThML XML of *The Psalms of David Imitated* (1719) and the three books of *Hymns and Spiritual Songs* (1707). Its passage markup is the first source for each Watts hymn's heading verse; its words are shown only for hymns the Gutenberg books below do not hold | **Public domain** (Watts died 1748). Courtesy credit: *Christian Classics Ethereal Library* | 1 / 2,644,854 | `b44344215aa5e177…` |
| [*Divine Songs Attempted in Easy Language for the Use of Children*](https://ccel.org/ccel/watts/divsongs), Isaac Watts (1715), Christian Classics Ethereal Library ThML edition, retrieved 2026-10-17 | The ThML XML: 44 divine and moral songs | **Public domain** (1715). Courtesy credit: *Christian Classics Ethereal Library* | 1 / 113,047 | `708e7bd752c24cc5…` |
| Project Gutenberg eBook [#13166](https://www.gutenberg.org/ebooks/13166), Watts, *The Psalms of David Imitated in the Language of the New Testament* (1719), retrieved 2026-10-17 | The plain-text eBook: the words of Watts's 391 psalm settings, each with its metre and the verses it sets | **Public domain in the United States.** The raw file keeps Project Gutenberg's header and footer; only the text between the start and end markers is used, so the pages carry the 1719 work and **credit the underlying hymn book, not Project Gutenberg**, as Project Gutenberg asks | 1 / 383,205 | `833372ea59a43d3d…` |
| Project Gutenberg eBook [#13341](https://www.gutenberg.org/ebooks/13341), Watts, *Hymns and Spiritual Songs* (1707), retrieved 2026-10-17 | The plain-text eBook: the words of the hymns of all three books | **Public domain in the United States**, on the same terms as #13166 | 1 / 366,780 | `da345a262661c9b2…` |
| [Hymnary.org](https://hymnary.org/) scripture-reference API (Calvin Institute of Christian Worship and the Hymn Society), queried 2026-10-17 | **Metadata only, no lyrics:** for each hymn, the passages hymnal editors attach to it and how many hymnals print it. Shown on the 24 of our hymns it covers ("Where hymnals place it"). Hymnary's robots.txt disallows its full-text pages, so none were fetched | Factual bibliographic metadata from a public API; no hymn text taken. Each hymn page links back to its Hymnary entry. Courtesy credit: *Hymnary.org* | 216 / 2,714,148 | `c763c78cd7633518…` |
| King James Version — **only to find** which verses a hymn's lines share wording with | The verse text from the site's generated `data/plain/kjv/`. These authors read and quoted the KJV, so matching is done in its wording; **no KJV text is shown on the hymn pages** | **Public domain** outside the United Kingdom (Crown copyright in the UK) | — | — |
| Berean Standard Bible — every verse **shown** on the hymn pages | The verse text from the site's generated `data/plain/bsb/` (from the project's own [engbsb](sources/ebible/engbsb/) copy, build checksum `b77cc2d5161b0361`) | **Public domain** (dedicated 2023). Courtesy credit: *Berean Standard Bible, berean.bible* | — | `b77cc2d5161b0361…` |

**How the verses beside a hymn's lines were found.** A script (`scripts/hymns/hymn-matcher.py`) scores every line
against every KJV verse by the rare words and phrases they share, and keeps up to three strong candidates per line;
no model is involved in that. One bare call per hymn to Claude Haiku 5.5 then chooses **only among those candidates**
(or none), and a check script drops any answer that names a verse it was not offered or is not marked high
confidence. The model writes no page text. Each page labels these as *verses that share wording with a line, found by
matching the words and checked; not the author's own notes*, kept apart from the heading verse the author printed.

**Held but not used.** The corpus also holds Project Gutenberg's *Otterbein Hymnal* (eBook #16455) and the Internet
Archive scan of the 1912 *Psalter*; neither is on these pages (no reliable per-hymn text). Four printed heading verses
point at verses that do not exist (for example *Glorious things of thee are spoken*, printed as "Isaiah 33:27"); they
are left off the pages and listed for the owner, never corrected by hand.

## Question Bank — registered 22 October 2026 (local preview only; nothing published)

The twelve sources behind the site's official Question Bank, shown at `/study/questions` (local preview only until
approved). The corpus is [content/questions/sources/](content/questions/sources/README.md) (moved there from `Research/BibleQuizCorpus/` on 24 October 2026; Fortress jobs 64bc483e and b88ef04a, 16–17 October 2026); the bank
is generated from its normalized files by `scripts/build-question-bank.py` into [content/questions/bank/question-bank.json](content/questions/bank/README.md)
(the official record, every question carrying its own licence and credit line) and `data/questions/bank.json` (the
page's copy). Nothing in the sources folder is written to by the build. Publishability follows the owner's rule of 17 October
2026, recorded in [content/questions/sources/MANIFEST.md](content/questions/sources/MANIFEST.md); the page lists every source's credit under the table.

The corpus manifest records every file's size and SHA-256: [content/questions/sources/manifest.json](content/questions/sources/manifest.json). The checksum below
is the first 16 hex of a SHA-256 over that source's sorted `path sha256` lines. "Questions" is how many of the bank's
4,962 questions are credited to that source after duplicates are folded together.

| Source | Questions | Licence and credit owed | Files / bytes | Checksum |
|---|---:|---|---|---|
| [Sunday school and catechism question books, 1692-1914 (Project Gutenberg)](https://www.gutenberg.org — 8 ebooks, each listed below), retrieved 2026-10-17 | 1,215 | Public domain in the United States — Project Gutenberg hosts nothing else.  | 16 / 3,907,186 | `d7fd68b56b4999a0` |
| [Bible trivia, Alpaca-formatted (liaaron1/bibile_trivia_alpaca)](https://huggingface.co/datasets/liaaron1/bibile_trivia_alpaca), revision `079b588e8c6a`, retrieved 2026-10-17 | 1,058 | apache-2.0, in the dataset card YAML and in the Hub's licence tag. Unsettled. If used at all, credit Ministry-To-Children.com for the overlapping questions; the provenance of the rest is unknown. | 3 / 178,040 | `a01021b4fbfbc7f3` |
| [Scripture Buzzer question set (AyandaNgubane/Bible-Quiz)](https://github.com/AyandaNgubane/Bible-Quiz), revision `f2341765d251`, retrieved 2026-10-17 | 1,005 | None. No licence states terms. Credit AyandaNgubane/Bible-Quiz if permission is ever obtained. | 45 / 541,777 | `f8d90e11a985f475` |
| [Reformed catechisms from Creeds.json](https://github.com/NonlinearFruit/Creeds.json), revision `2ae21a4c5387`, retrieved 2026-10-17 | 734 | Quoted from README.md: "This repo as a whole is not licensed for reuse due to the copyright right status of several texts (listed below) . The Unlicense requires nothing. Crediting NonlinearFruit/Creeds.json for the transcription is courteous. | 8 / 758,281 | `41827d672885cdf7` |
| [300 Bible Trivia Questions and Answers for Kids](https://ministry-to-children.com/kids-bible-trivia/), retrieved 2026-10-17 | 289 | CC BY-SA 4.0. Required by CC BY-SA 4.0: credit Ministry-To-Children.com (Tony Kummer) and license any adaptation under the same or a compatible licence. | 3 / 315,337 | `3eaaa6b6c7ef4ed9` |
| [OpenTriviaQA religion-faith category, Bible questions only](https://github.com/uberspot/OpenTriviaQA), revision `dcc1cdf36c29`, retrieved 2026-10-17 | 246 | CC BY-SA 4.0, stated in README.md, carried in full in the LICENSE file, and detected as CC-BY-SA-4.0 by GitHub's own licence API. Required by CC BY-SA 4.0: credit uberspot/OpenTriviaQA and license any adaptation under the same or a compatible licence. | 3 / 133,603 | `d701b63739699327` |
| [Westminster Shorter and Larger Catechisms with the Assembly's proof texts](https://github.com/Sundar1205/westminster-catechism), revision `8e7351d8e642`, retrieved 2026-10-17 | 122 | None. No licence states terms. The repository traces its own sources to a public gist of the 1647 Shorter Catechism text and to the Free Presbyterian Church of Scotland's edition of the 1648 Larger Catechism. | 6 / 1,842,981 | `a0ea5c12db1de567` |
| [Bible Quiz question bank (BRIANCHANDA/Bible-Quiz)](https://github.com/BRIANCHANDA/Bible-Quiz), revision `8d586f2661e2`, retrieved 2026-10-17 | 106 | MIT, with a full LICENSE file: 'MIT License, Copyright (c) 2025 Eric Sakala'. MIT requires the copyright notice and permission notice to be included: Copyright (c) 2025 Eric Sakala. | 3 / 50,830 | `7a7a264ce1ba208b` |
| [Bible Trivia Game question bank (DanielKorsah03/Bible-Trivia-Game)](https://github.com/DanielKorsah03/Bible-Trivia-Game), revision `6d7a71f5a63a`, retrieved 2026-10-17 | 97 | MIT, with a full LICENSE file: 'MIT License, Copyright (c) 2026 Daniel Korsah'. MIT requires the copyright notice and permission notice to be included: Copyright (c) 2026 Daniel Korsah. | 4 / 57,514 | `424f956423ae7b53` |
| [Know the Truth: 60 Questions and Answers on Christian Beliefs](https://baptiststudiesonline.com/wp-content/uploads/2007/11/catechism-bfm-2000.pdf), retrieved 2026-10-17 | 60 | Quoted from the PDF: "You may make copies and distribute freely. Credit: Know the Truth: 60 Questions and Answers on Christian Beliefs, Edition 2.1, used at First Baptist Church, Tallassee, Alabama; based on the 2000 Baptist Faith and Message. Permissions contact: Pastor Derek Gentle. | 4 / 466,697 | `105507c24bf350cb` |
| [el-cms Open-trivia-database, Bible questions only](https://github.com/el-cms/Open-trivia-database), revision `6026af588466`, retrieved 2026-10-17 | 27 | No licence. The README asks for a citation and a link to the repository. That is its own stated wish, not a licence condition, because there is no licence. | 3 / 5,683,840 | `eae95e8587836412` |
| [Open Trivia Database, Bible questions from the public API](https://opentdb.com/api.php), retrieved 2026-10-17 | 3 | CC BY-SA 4.0, as stated by opentdb.com for the Open Trivia Database. Required by CC BY-SA 4.0: credit the Open Trivia Database (opentdb.com) and license any adaptation under the same or a compatible licence. | 11 / 143,785 | `808677037769dd87` |

**Left out of the bank, still in the corpus:** the 67 scanned Internet Archive question books (machine-read, need
proofreading), the el-cms "uncategorized" trivia (pub quiz, often wrong), two Gutenberg books printed without answers,
the Roman Catholic Baltimore catechisms and the Seventh-day Adventist *Bible Readings for the Home Circle*
(outside the site's doctrinal scope, owner 2026-10-22; kept to mine for content later), and all of batch 1. Reasons per bank are in the bank file's `left_out` list.

**Written for the site (registered 23 October 2026, none published yet):** the bank `written-bsb` ("Written for the site
from the BSB") takes no outside source. Each question is written by Claude from one section of the Berean Standard
Bible (public domain; the project's own `data/text/bsb/` copy, the one every page reads), and its record names the
section, the cited verses and every model that reviewed it. Written by `scripts/question_writing.py` into
[content/questions/written/written.json](content/questions/written/README.md); see its README.

**Children's sources (registered 24 October 2026, local preview only; nothing published):** seven sources written for
children, banks `children-assu`, `children-boston`, `children-manly`, `children-little`, `children-boyce`,
`children-mtc` and `children-uw`. Their questions were extracted on 23 October 2026 into
[content/questions/children/children-batch4.json](content/questions/children/README.md) and, on 24 October 2026,
reworded by Claude Opus to the BSB and for a child of about 6 to 11, with four choices, then checked against the BSB
by a second Opus call (`scripts/question_children_sources.py`). Each question's record keeps the source's own wording
beside the new one. The checksum is worked out as for the table above, over the files in the folder named.
"In the bank" counts questions after exact duplicates are folded together; "shown" leaves out repeats of other
questions and the questions dropped as unfit for children.

| Source | In the bank / shown | Licence and credit owed | Folder (under `content/questions/sources/raw/`) / files / bytes | Checksum |
|---|---:|---|---|---|
| [Ministry-to-Children Sunday school lessons](https://ministry-to-children.com/), review questions from 768 lessons, retrieved 2026-10-23 | 2,478 / 1,427 | CC BY-SA 4.0. Required: credit Ministry-To-Children.com (Tony Kummer) and license any adaptation under the same or a compatible licence. The lessons quote Bible versions whose own terms the CC licence does not cover; the site's questions are reworded to the BSB. | `ministry-to-children-lessons` / 1,531 / 201,019,614 | `89785b883bb39e8f` |
| [*The Child's Scripture Question-Book* (American Sunday-School Union, 1907)](https://archive.org/details/childsscriptureq00amer), retrieved 2026-10-17 | 2,146 / 1,188 | Public domain in the United States: published before 1929. | `internet-archive-sunday-school-question-books/childsscriptureq00amer` / 3 / 7,462,038 | `1aa2a107cf4f9ad1` |
| [*The Child's Bible Question Book* (Massachusetts Sabbath School Society, Boston, 1880)](https://archive.org/details/childsbiblequest00bost), retrieved 2026-10-23 | 1,067 / 514 | Public domain in the United States: published before 1929. | `internet-archive-sunday-school-question-books/childsbiblequest00bost` / 3 / 7,186,359 | `9f1f8628aa8a4e1d` |
| [unfoldingWord *Open Bible Stories* translation questions](https://git.door43.org/unfoldingWord/en_tq), retrieved 2026-10-23 | 658 / 261 | CC BY-SA 4.0. Required: credit unfoldingWord (Open Bible Stories translation questions) and license any adaptation under the same or a compatible licence. | `unfoldingword-obs-tq` / 6 / 93,837 | `9e72265330e3c77e` |
| [Manly, *The Child's Question Book on the Four Gospels* (Southern Baptist Sunday School Board, 1864)](https://archive.org/details/childsquestionbo11manl), retrieved 2026-10-17 | 498 / 325 | Public domain in the United States: published before 1929. | `internet-archive-sunday-school-question-books/childsquestionbo11manl` / 3 / 1,847,493 | `a7509110771ccee2` |
| [*A Catechism for Little Children* (Baptist State Convention of North Carolina, 1864)](https://archive.org/details/catechismforlitt01bapt), retrieved 2026-10-23 | 181 / 89 | Public domain in the United States: published before 1929. | `internet-archive-sunday-school-question-books/catechismforlitt01bapt` / 3 / 1,213,625 | `b884d664787117e7` |
| [Boyce, *A Brief Catechism of Bible Doctrine* (1885)](https://repository.sbts.edu/handle/10392/5301), retrieved 2026-10-23 | 161 / 124 | Public domain in the United States: published before 1929. | `baptist-childrens-catechisms` / 5 / 1,050,259 | `fcbee6232799c663` |

## Catechisms & Creeds — published 17 October 2026

The 66 creeds, confessions and catechisms behind [/study/creeds](https://bibleproject.io/study/creeds). Every document
is a historic text long out of copyright; what is credited here is the **edition each one was transcribed from**. The
corpus itself is `Research/Creeds/` (built by Fortress job 425); the page data is generated from it by
`scripts/build-creeds.py` into `data/creeds/` and nothing in `Research/` is written to by the website build.

The corpus's own manifest records every file's URL, size and SHA-256: `Research/Creeds/manifest.json`
(SHA-256 `9d9642c758dd9ee2…`). The "checksum" column below is a SHA-256 over that source's sorted `path sha256` lines,
so the whole set of downloaded files can be re-verified in one value.

| Source | What was taken | Licence | Files / bytes | Checksum |
|---|---|---|---|---|
| [Creeds.json](https://github.com/NonlinearFruit/Creeds.json) (NonlinearFruit), revision `2ae21a4c5387ecc91f474c9d3d67c826d2a6b9d5`, retrieved 2026-10-17 | The structured JSON of 35 creeds, confessions and catechisms | **The Unlicense** (public-domain dedication) for every retained file. The repository README declines to license the repo as a whole because eight texts carry third-party copyright; **those eight were not copied** | 36 / 4,347,809 | `414ef0c82b0dbdd2…` |
| [Philip Schaff, *The Creeds of Christendom*, vols I–III](https://ccel.org/ccel/schaff/creeds1), Christian Classics Ethereal Library, ThML edition of the sixth edition revised by David S. Schaff (1931 printing), retrieved 2026-10-17 | The ThML XML and plain-text renderings of all three volumes | **Public domain** (first published 1877; the 1931 sixth edition's copyright was not renewed). CCEL distributes it as a public-domain text | 6 / 25,496,527 | `1191cd4fb64c5649…` |
| Project Gutenberg eBooks [#273](https://www.gutenberg.org/ebooks/273) (*The Smalcald Articles*) and [#1722](https://www.gutenberg.org/ebooks/1722) (*Luther's Large Catechism*), both the Bente and Dau translation from *Triglot Concordia* (Concordia Publishing House, 1921), retrieved 2026-10-17 | The two plain-text eBooks | **Public domain in the United States.** The raw files keep Project Gutenberg's header and footer; the normalized text is taken from between the start and end markers, so it carries only the public-domain 1921 translation. Project Gutenberg asks that its trademark not be used once its boilerplate is stripped, so the **public pages credit the underlying 1921 translation, not Project Gutenberg** | 2 / 386,237 | `93bf98cedae08960…` |
| Berean Standard Bible — every Scripture quotation and proof-text on these pages | The verse text, read from the project's own [engbsb](sources/ebible/engbsb/) copy (registered in the build source checksum registry below, checksum `b77cc2d5161b0361`) and from the site's generated `data/plain/bsb/` | **Public domain** (dedicated 2023); no attribution is legally required. Courtesy credit: *Berean Standard Bible, berean.bible* | — | `b77cc2d5161b0361…` |

**The modern Scripture layer.** Where one of these documents quotes a Bible verse in older English, the quotation is
shown in the Berean Standard Bible — 2,727 places. The matching was done by code alone (reference parsing plus token
alignment against eight older public-domain translations, used only to recognise *which* verse is quoted; none of their
wording is stored or shown). No language model was involved. Where the match could not be made without guessing, the
document keeps its own older wording and the page says so on the spot. Layer index SHA-256 `1210259aa99acd31…`; method
and counts: `Research/Creeds/normalized-modern/README.md` (SHA-256 `8af6ed77a339aacd…`).

**Deliberately not published.** Eight Creeds.json files were never copied into the corpus because they carry
third-party copyright — among them the Chicago Statement on Biblical Inerrancy (Alliance of Confessing Evangelicals)
and five short confessions whose only upstream English wording is the English Standard Version (Crossway). **No ESV
text is held anywhere in this project.** Those five confessions appear on the site with their passage supplied from the
public-domain Berean Standard Bible by reference; their titles, dates and Scripture references are not copyrightable.
Eleven proof-text references are to the Apocrypha or to verses the Berean text does not carry; each is shown as a
reference with no verse words rather than filled in from another translation.

## Parables content review — 11 October 2026

Implementation-plan step 3: [content review and study ledger](docs/parables/CONTENT-REVIEW.md). All 57 studies checked against their Gospel passages and setting anchors; 45 revised and 12 retained. The record distinguishes direct textual corrections, qualified interpretations and applications, and identifies the Christian commentary sections actually consulted. The seven deeper treatments remain for step 4. Collection counts and passage ranges are unchanged; this is a local revision with no publication.

## Parables inventory review — 11 October 2026

Implementation-plan step 2 completed locally: [inventory reconciliation and classification ledger](docs/parables/INVENTORY-REVIEW.md). The current collection has 57 studies in seven themes: 24 narrative parables, 31 brief comparisons and two related figurative teachings. Seven additions were checked against the Gospel text; 94 passage ranges / 604 verse references passed local KJV validation. This supersedes the historical collection counts below. No universal total or completed theological review is claimed. Steps 3–10 await their own authorization; no publication performed.


## Parables source policy review 11 October 2026

Implementation-plan step 1 completed: [source policy](docs/parables/SOURCE-POLICY.md) and [reviewed source register](docs/parables/SOURCE-REGISTER.md). These govern subsequent parables revisions and qualify the source roles in the historical acquisition notes below. No additional studies or public content changes are part of this step.

## Parables of Christ expansion ? 11 October 2026

Expanded to 50 original studies across six editorial themes, including shorter comparisons. This is a collection size, not a universal total. Validated 77 passage ranges / 546 verse references against the same KJV inputs recorded below. Content: `src/data/parables.ts` and `src/data/parables-expanded.ts`. Compact category icons use the existing Lucide dependency.

Inventory references (checked 11 October 2026):

- [R. C. Trench, Notes on the Parables of Our Lord, 1847](https://archive.org/details/notesonparableso00tren): all thirty numbered chapters are represented. Held public-domain text at `../sources/library/bulk/ia/notesonparableso00tren.txt`, SHA-256 `4704a7a226757a252adaa7cc3bea9bae88f6fdd1f66c7d06cd2874916e8c8eb1`. Original source notices retained.
- [Arland Hultgren, Preaching the Parables, Part One](https://www.workingpreacher.org/theology-and-interpretation/preaching-the-parables-part-one): counting varies with the definition and inclusion of short comparisons.
- [Crossway Gospel reference chart](https://www.esv.org/resources/esv-global-study-bible/chart-40-03/): supplementary reference comparison. We distinguish the talents/minas, royal wedding/great supper and growing seed/weeds.

No external commentary text is reproduced. Notes are original readings of the linked passages. John's shepherd and vine discourses are linked separately; no claim to enumerate every biblical figure of speech.


## Parables of Jesus study — 11 October 2026

Sixteen original editorial reading guides at `/study/gospels?guide=parables`, based on the already registered eBible KJV corpus (`eng-kjv`, public-domain text under the existing source terms). No new external text or artwork is reproduced. Four original SVG scenes and thematic groupings are project-authored. The notes distinguish textual observations, reading suggestions and interpretive cautions; no historical reconstruction or scholarly consensus is claimed.

Inputs: `data/plain/kjv/MAT.json`, `MRK.json`, `LUK.json`; 23 passage ranges and 205 referenced verses checked by `scripts/check-parables.ts`. SHA-256 fingerprints of the prepared text inputs:

- Matthew: `2b1c7219e7f3e72ae9f64aae00132142787b90cc8b8cacca4cff0ca870854895`
- Mark: `cf9ccb7d831b350c3ac5767be6a9da121b99d02abc4d70e808b3a1932c4349d9`
- Luke: `0f38e2a4658588636fcd0d044a054589fc44e6d96b69936e0b1b4c060f16baed`

Content: `src/data/parables.ts`. Public passage links open the existing Bible reader. These selected stories are not presented as a complete inventory of all parables.

## Reasonable Faith writings PDFs — RF01, 11 October 2026

Extraction completed: **177 PDFs, 2,597 pages, 1,092,719 word tokens**, using local CPU embedded-text extraction (33.4 seconds; no OCR/GPU/API). Per-document TXT and page-level JSONL retain source URLs, page boundaries and original checksums. All output files passed readback verification; 13 sparse/blank final pages were visually reviewed with no OCR needed. [Extraction report and text index](../Research/Apologetics/ReasonableFaith/EXTRACTION.md).

William Lane Craig is registered as `author-william-lane-craig`, placed in Scholars with an Apologetics tag, and linked from the Apologetics navigation to `/teachers/scholars/william-lane-craig/writings`. The website catalogue contains 177 source records with original PDF/article links; local PDF/text holdings remain outside public website assets. Biography and life dates: [Reasonable Faith biography/CV](https://www.reasonablefaith.org/william-lane-craig/), checked 11 October 2026. Registry `context-only` means inclusion as a scholar/apologist, not classification as a core Reformed preacher.

At the owner's request, catalogued the six Popular and seven Scholarly writings categories and downloaded every offered PDF sequentially: **183 article listings, 177 distinct PDF files, 28,255,742 bytes, 2,597 pages**. Five listings have no PDF offer; one PDF is shared by two article listings. All 177 files have distinct SHA-256 hashes. No retrieval failures remain.

Publisher/source: [Reasonable Faith](https://www.reasonablefaith.org/writings/popular-writings/apologetics/) and its linked ministry CDN hosts. The [catalogue](../Research/Apologetics/ReasonableFaith/CATALOGUE.md), [per-file acquisition manifest](../Research/Apologetics/ReasonableFaith/catalogue.json) and [verification](../Research/Apologetics/ReasonableFaith/verification.json) record every title, category, article/PDF URL, resolved URL, retrieval time, byte count, SHA-256, page count and local path. Originals: `sources/reasonable-faith-writings/pdfs/`, outside this Website repository.

Rights: author/ministry-offered downloads; copyright and edition-specific publisher notices retained. No blanket public redistribution licence inferred. Intended use: the owner's Bible Project source library. This acquisition did not publish full text or run database intake/embedding. Integrity checks: all checksums matched, every page opened in a second PDF engine, first/last-page text was sampled, three first pages were visually inspected, and every PDF link in all 13 category snapshots was accounted for.

Reconciled **7 October 2026** from the held-file stocktake and retained acquisition/policy records. Each acquisition provider has one canonical profile below. Source aliases, mirrors and ministry CDN hosts are consolidated; edition and translator notices remain in the original manifests. Counts refer to the stocktake snapshot, not later downloads.

**Private local indexing:** the owner authorizes importing and embedding all lawfully held text. Credit and licence fields remain metadata; no new evidenceOnly holds are created. This documentation grants no public hosting, redistribution or AI-training permission and does not override source terms. Missing policy evidence is recorded as a documentation task, not an automatic import hold.

**Inventory distinctions:** complete text, articles/sermons, item metadata, catalogue caches, images, ZIP/module packages and extracted derivatives remain separate. An offered page, preview, worksheet or advertisement is not automatically a book. CrossWire packages are not separately embedded when their text export is used. Catalogue/API caches under `../sources/bulk-catalogues/` document discovery/access rather than additional works.

[Source reconciliation report](content/library/reports/campaign-reconciliation/sources/REPORT.md) · [machine-readable source documentation](content/library/reports/campaign-reconciliation/sources/source-documentation.json) · [complete historical notes](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md).

## Canonical acquisition sources

<a id="source-9marks-org"></a>
### 9Marks

**Official channel:** [https://www.9marks.org/journal/archives/](https://www.9marks.org/journal/archives/). Official offered journal PDFs and article pages; the bulk archive/API 403 was deferred without bypass.
**Held formats:** .html, .json, .pdf; **20 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded historical journal issue permissions are conditional and issue-specific. Modern books can carry additional retrieval/distribution restrictions; no publisher-wide open licence is inferred.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/sources.json).

<a id="source-aomin-org"></a>
### Alpha and Omega Ministries

**Official channel:** [https://www.aomin.org/aoblog/](https://www.aomin.org/aoblog/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **4,097 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-archive-org"></a>
### Internet Archive

**Official channel:** [https://archive.org/services/docs/api/metadata.html](https://archive.org/services/docs/api/metadata.html). Official search/metadata/download APIs; institutional and microfilm collections; held existing TXT/EPUB/PDF and item metadata. No new OCR.
**Held formats:** .html, .json, .pdf, .txt, .xml, extensionless; **10,775 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Edition-specific historical public-domain assessments and item notices are recorded. Public availability or an unrestricted item flag alone is not a blanket licence. Retain digitizing-library, sponsor, publisher and contributor metadata.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/reformed-baptist-overnight/).

<a id="source-baptistcatechism-org"></a>
### SVRBC Baptist Catechism / Symbolics

**Official channel:** [https://baptistcatechism.org/](https://baptistcatechism.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **4 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-baptistdogmatics-com"></a>
### Baptist Dogmatics

**Official channel:** [https://www.baptistdogmatics.com/](https://www.baptistdogmatics.com/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-baptisthistoryhomepage-com"></a>
### Baptist History Homepage

**Official channel:** [https://baptisthistoryhomepage.com/](https://baptisthistoryhomepage.com/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **54 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-bcsmn-edu"></a>
### Bethlehem College and Seminary

**Official channel:** [https://bcsmn.edu/](https://bcsmn.edu/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-bible-helloao-org"></a>
### HelloAO Free Use Bible API

**Official channel:** [https://bible.helloao.org/docs/](https://bible.helloao.org/docs/). Official JSON API chapter/commentary endpoints; metadata responses are distinguished from text-bearing chapters.
**Held formats:** .json; **753 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** The official Free Use Bible API describes unrestricted API use, including modification/commercial use, with changed translations renamed. Retain the specific historical commentary/translation identity and do not extend that statement to unrelated linked content.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/campaign-reconciliation/sources/web-consultations.json); [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).

<a id="source-billygraham-org"></a>
### Billy Graham Evangelistic Association

**Official channel:** [https://billygraham.org/](https://billygraham.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **8 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

**Local sermon transcripts (2026-10-10):** 23 completed user-provided Billy Graham audio transcriptions from `C:\Users\lcladm\Desktop\YT_Transcriber\transcripts`, produced with Whisper large-v3; accuracy is unverified. Original TXT bodies are staged under `sources/library/source-billy-graham/yt-transcripts`; timestamped subtitles, segment/word metadata and review flags are preserved under `sources/billy-graham-transcripts/archive`. One unfinished transcription remains pending. No additional licence or original video URL is inferred. [Transcript manifest](content/library/reports/graham-transcripts-20261010/acquisition-manifest.json).

<a id="source-capitolhillbaptist-org"></a>
### Capitol Hill Baptist Church

**Official channel:** [https://www.capitolhillbaptist.org/](https://www.capitolhillbaptist.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **12 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/capitolhillbaptist.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-careycenter-wmcarey-edu"></a>
### William Carey Center

**Official channel:** [https://careycenter.wmcarey.edu/](https://careycenter.wmcarey.edu/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/careycenter.wmcarey.edu/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-ccel-org"></a>
### Christian Classics Ethereal Library (CCEL)

**Official channel:** [https://ccel.org/about/copyright.html](https://ccel.org/about/copyright.html). The official author catalogue and offered ThML/XML, TXT and other recorded editions.
**Held formats:** .html, .json, .txt, .xml, extensionless; baseline stocktake **526 files** including support/metadata representations, with subsequent Fathers additions recorded below. These are file counts, not book counts.
**Licence/terms and credit:** Recorded personal/educational/non-profit electronic-edition terms; underlying historical text and CCEL markup/editorial material have distinct rights. Preserve book/translator/editor and CCEL notices.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/modern-texts/ccel-expansion-policy-evidence.json).

**Fathers completion, 2026-10-09:** The [official Early Church Fathers catalogue](https://www.ccel.org/fathers) offers ANF text volumes 1–9 and NPNF Series I/II volumes 1–14 each; the unreproduced general-index volume is not counted as a body text. Existing whole-volume originals are reused by source ID; missing offered TXT exports are acquired with the shared robots-aware rate limiter, without retries. Volume contributors and CCEL notices remain in each original. [Acquisition manifest and completion status](content/library/reports/patristic-expansion-20261009/acquisition-manifest.json).

**Local PDF additions (2026-10-10):** Owner-provided ANF01 PDF (additional representation of the held anthology) and Thomas Aquinas, Summa Theologica. Aquinas is included with a Roman Catholic doctrinal-review label in the title, credit and metadata; philosophical contributions are assessed separately from theological endorsement. Original edition notices remain attached. [Local-download manifest](content/library/reports/local-downloads-20261010/acquisition-manifest.json). [Owner source-policy update](content/library/reports/local-downloads-20261010/source-policy-update.json).

<a id="source-chapellibrary-org"></a>
### Chapel Library

**Official channel:** [https://www.chapellibrary.org/literature](https://www.chapellibrary.org/literature). Official public literature catalogue, multilingual book pages and offered EPUB/PDF download endpoints.
**Held formats:** .epub, .json, .pdf; **1,683 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Official freely offered ebook editions; author, publisher, editor/abridgment and translator notices remain authoritative. Free downloads are distinguished from print ordering and from a general open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/sources.json).

<a id="source-content-cbtseminary-org"></a>
### Covenant Baptist Theological Seminary

**Official channel:** [https://content.cbtseminary.org/](https://content.cbtseminary.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **14 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/content.cbtseminary.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-crossway-org"></a>
### Crossway

**Official channel:** [https://www.crossway.org/permissions/](https://www.crossway.org/permissions/). Official public HTML pages recorded in the Kruger bibliography acquisition; these are not automatically books.
**Held formats:** .html; **4 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Official permissions distinguish limited quotation from permissions required for larger reproduction/translation. The held public HTML pages retain publisher/author notices; no whole-book or blanket reuse licence is inferred.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/campaign-reconciliation/sources/evidence/crossway.org/policy.html); [consulted_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/crossway.org/official.html); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/crossway.org/policy.html).

<a id="source-crosswire-org"></a>
### CrossWire SWORD

**Official channel:** [https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/](https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/). Official mods.d catalogue and rawzip packages; text exports are derivatives, not additional books.
**Held formats:** .zip; **102 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Each module’s mods.d DistributionLicense and copyright/credit fields govern the module. Held declarations include public domain; there is no blanket licence for all SWORD content.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/reformed-baptist-overnight/RB03/acquisition-manifest.json).

<a id="source-cslewisinstitute-org"></a>
### C. S. Lewis Institute

**Official channel:** [https://www.cslewisinstitute.org/](https://www.cslewisinstitute.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **18 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/cslewisinstitute.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-desiringgod-org"></a>
### Desiring God

**Official channel:** [https://www.desiringgod.org/permissions](https://www.desiringgod.org/permissions). Official John Piper written message/article archive, free offered books and authorized translation pages.
**Held formats:** .epub, .html, .json, .pdf; **14,785 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded personal/noncommercial permissions for John Piper resources have exceptions; other contributors and third-party/translation editions must retain their own notices. Contributor-wide policy coverage remains incomplete.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/modern-texts/piper-access.json).
**Unresolved evidence:** Contributor/third-party and translation exceptions need edition-specific coverage; the existing Piper permission is not a grant for all contributors.

<a id="source-earlychristianwritings-com"></a>
### Early Christian Writings

**Official channel:** [https://www.earlychristianwritings.com/](https://www.earlychristianwritings.com/). Official offered HTML transcriptions; named Lightfoot/Roberts/Donaldson translators remain attached.
**Held formats:** .html; **4 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Named historical translations are identified in the LC01 manifest; historical underlying text does not establish a blanket website/markup licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/letters-cited/LC01/acquisition-manifest.json); [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/earlychristianwritings.com/official.html).

<a id="source-en-wikisource-org"></a>
### Wikisource

**Official channel:** [https://en.wikisource.org/wiki/Wikisource:Copyright_policy](https://en.wikisource.org/wiki/Wikisource:Copyright_policy). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [robots_disallowed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-founders-org"></a>
### Founders Ministries / Founders Journal

**Official channel:** [https://founders.org/journals/](https://founders.org/journals/). Official journal archive, offered complete PDFs and public article/media API records.
**Held formats:** .html, .json, .pdf; **211 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded offered issue PDFs/HTML and historical public-domain witnesses; modern journal contributors retain copyright. Issue and contributor notices remain authoritative; no blanket open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/sources.json).

<a id="source-frame-poythress-org"></a>
### Frame–Poythress

**Official channel:** [https://frame-poythress.org/](https://frame-poythress.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json, .pdf; **12 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/frame-poythress.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-freechristianebooks-org"></a>
### Free Christian Ebooks

**Official channel:** [https://www.freechristianebooks.org/](https://www.freechristianebooks.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .epub, .json, .pdf; **8 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/freechristianebooks.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-github-lwalen"></a>
### lwalen Second London Baptist Confession

**Official channel:** [https://github.com/lwalen/lbcf/blob/235da776742a7956ebb678ec236382813dbe2c33/LICENSE](https://github.com/lwalen/lbcf/blob/235da776742a7956ebb678ec236382813dbe2c33/LICENSE). The pinned lwalen/lbcf public GitHub repository.
**Held formats:** .json, .md, extensionless; **4 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** CC0 dedication for the pinned repository witnesses; JSON and Markdown remain separate manifestations.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/sources.json).

<a id="source-github-nonlinearfruit"></a>
### NonlinearFruit Creeds.json

**Official channel:** [https://github.com/NonlinearFruit/Creeds.json/blob/2ae21a4c5387ecc91f474c9d3d67c826d2a6b9d5/README.md](https://github.com/NonlinearFruit/Creeds.json/blob/2ae21a4c5387ecc91f474c9d3d67c826d2a6b9d5/README.md). The pinned NonlinearFruit/Creeds.json public repository.
**Held formats:** .json, .md; **7 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded Unlicense applies only to eligible named files; listed exceptions, including Savoy, and modern translations need their own evidence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/sources.json).

<a id="source-github-textcreationpartnership"></a>
### Text Creation Partnership (EEBO, ECCO and Evans)

**Official channel:** [https://github.com/textcreationpartnership/Texts](https://github.com/textcreationpartnership/Texts). The official TCP catalogue and per-text public repositories; EEBO/ECCO/Evans collection identifiers remain separate.
**Held formats:** .json, .xml, extensionless; **20,353 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** TCP CC0-1.0 encoded transcriptions; this does not cover facsimile images. Original TEI contributor/header credits remain attached.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](../sources/bulk-catalogues/tcp.json).

<a id="source-gutenberg-org"></a>
### Project Gutenberg

**Official channel:** [https://www.gutenberg.org/policy/license.html](https://www.gutenberg.org/policy/license.html). Offline catalogue and documented robot-harvest/static mirrors; mirrorservice.org and mirrors.xmission.com are distribution channels for this source, not separate publishers.
**Held formats:** .htm, .json, .txt; **73 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded underlying U.S. public-domain editions plus the Project Gutenberg electronic licence/notices; do not describe the trademark or every edition as unrestricted.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/sources.json).

<a id="source-history-hanover-edu"></a>
### Hanover College Historical Texts

**Official channel:** [https://history.hanover.edu/texts/](https://history.hanover.edu/texts/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html; **1 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [invalid_robots_response](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-jimhamilton-info"></a>
### James M. Hamilton Jr.

**Official channel:** [https://jimhamilton.info/](https://jimhamilton.info/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **4 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/jimhamilton.info/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-ligonier-org"></a>
### Ligonier Ministries / Tabletalk

**Official channel:** [https://www.ligonier.org/copyright-policy](https://www.ligonier.org/copyright-policy). Official Ligonier/learn pages and Tabletalk articles actually held.
**Held formats:** .html; **3 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Existing policy evidence records hyperlink-based sharing and limits on re-upload/distribution, attribution, derivatives and revenue. Held Kruger HTML/Tabletalk pages retain contributor notices; no open licence is inferred.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/sources.json).

**Local study-guide addition (2026-10-10):** R. C. Sproul, What Did Jesus Do? Understanding the Work of Christ, original WHA31PDF1.pdf; copyright 2011 Ligonier and all source notices retained. Owner-provided private local indexing; counted as a study guide, not a book. [Local-download manifest](content/library/reports/local-downloads-20261010/acquisition-manifest.json).

<a id="source-london1644-info"></a>
### London 1644

**Official channel:** [https://www.london1644.info/](https://www.london1644.info/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/london1644.info/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-lwf-org"></a>
### Love Worth Finding

**Official channel:** [https://www.lwf.org/about-us/contact-us/copyright-information](https://www.lwf.org/about-us/contact-us/copyright-information). Official offered transcript/resource PDFs.
**Held formats:** .json, .pdf; **1,220 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded offered private reading copies; retain Adrian Rogers and Love Worth Finding copyright/credit notices. No open licence or broader redistribution grant is inferred.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/modern-texts/rogers-access.json).

<a id="source-michaeljkruger-com"></a>
### Michael J. Kruger / Canon Fodder

**Official channel:** [https://michaeljkruger.com/](https://michaeljkruger.com/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **675 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consultation_failed](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-monergism-com"></a>
### Monergism

**Official channel:** [https://www.monergism.com/monergism-copyright-permissions](https://www.monergism.com/monergism-copyright-permissions). Official complete free-ebook index and offered EPUB/PDF files; the whole-library page was checked and exposed no active ZIP link.
**Held formats:** .epub, .html, .json; **3,188 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded freely offered personal study, family, church and classroom reading editions; restrictions on external republication and curated external corpora remain recorded. Preserve publisher, original author and edition notices.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/modern-texts/monergism-library-policy-evidence.json).

<a id="source-onthewing-org"></a>
### On the Wing

**Official channel:** [https://www.onthewing.org/Copyright.html](https://www.onthewing.org/Copyright.html). Official offered text/PDF reading editions.
**Held formats:** .json, .pdf; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** The official notice permits free personal use and prohibits sale for profit, with some reimbursement restrictions. It describes its modernization of public-domain works as public domain while requiring no modification, sale, fundraising or false authorship claims. Preserve the author, modernizer and original notice.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/campaign-reconciliation/sources/evidence/onthewing.org/policy.html); [consulted_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/onthewing.org/official.html); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/onthewing.org/policy.html).

<a id="source-penelope-uchicago-edu"></a>
### LacusCurtius

**Official channel:** [https://penelope.uchicago.edu/Thayer/E/Roman/home.html](https://penelope.uchicago.edu/Thayer/E/Roman/home.html). LacusCurtius official HTML historical texts.
**Held formats:** .html; **1 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** The LC01 record identifies the historical 1914 Rolfe translation and local reading copy; host presentation and notices remain separate from underlying text rights.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/letters-cited/LC01/acquisition-manifest.json); [consulted_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/penelope.uchicago.edu/official.html).

<a id="source-reformedontheweb-com"></a>
### Reformed on the Web

**Official channel:** [https://www.reformedontheweb.com/](https://www.reformedontheweb.com/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **4 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [official_page_unavailable](content/library/reports/campaign-reconciliation/sources/official-consultations.json).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-reformedreader-org"></a>
### The Reformed Reader

**Official channel:** [https://www.reformedreader.org/](https://www.reformedreader.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **180 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/reformedreader.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-romans45-org"></a>
### Phil Johnson’s Bookmarks / Romans45

**Official channel:** [https://www.romans45.org/](https://www.romans45.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json; **4 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/romans45.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-sermonindex-net"></a>
### SermonIndex

**Official channel:** [https://www.sermonindex.net/md/copying-permissions/](https://www.sermonindex.net/md/copying-permissions/). Official held written sermon page; an archive index is not itself a downloaded sermon corpus.
**Held formats:** .html, .json; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** The official policy describes free personal/ministry and noncommercial sharing use; commercial packaging/sale is excluded. Retain each preacher/source identity and message integrity.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/campaign-reconciliation/sources/evidence/sermonindex.net/policy.html); [consulted_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/sermonindex.net/official.html); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/sermonindex.net/policy.html).

<a id="source-spurgeongems-org"></a>
### Spurgeon Gems

**Official channel:** [https://www.spurgeongems.org/about-us/](https://www.spurgeongems.org/about-us/). Official individual sermons, collected volume PDFs and Spanish translation catalogue.
**Held formats:** .html, .json, .pdf, .txt; **7,757 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded free, unchanged, attributed use; restricted permission rather than an unrestricted open licence. Preserve Spurgeon/source credit, numbered sermon identity, guest authors and named translators.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/spurgeon/source-access.json).

<a id="source-thecalvinist-net"></a>
### The Calvinist

**Official channel:** [https://thecalvinist.net/](https://thecalvinist.net/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/thecalvinist.net/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-thegospelcoalition-org"></a>
### The Gospel Coalition / Themelios

**Official channel:** [https://thegospelcoalition.org/](https://thegospelcoalition.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .html, .json, .pdf; **755 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-truthforlife-org"></a>
### Truth For Life

**Official channel:** [https://www.truthforlife.org/about/policies/](https://www.truthforlife.org/about/policies/). Official written sermon/resource pages and offered reading files; bibliographic pages are not automatically complete transcripts.
**Held formats:** .html, .json, extensionless; **3,066 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Recorded private noncommercial reading copies; preserve Alistair Begg, ministry and publication notices. No public hosting or AI-training permission is inferred.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/modern-texts/begg-policy-evidence.json).

<a id="source-tyndale-tms-edu"></a>
### The Master’s Seminary Journal

**Official channel:** [https://tyndale.tms.edu/](https://tyndale.tms.edu/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/tyndale.tms.edu/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-tyndalebulletin-org"></a>
### Tyndale Bulletin

**Official channel:** [https://www.tyndalebulletin.org/](https://www.tyndalebulletin.org/). Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.
**Held formats:** .json, .pdf; **2 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/tyndalebulletin.org/official.html).
**Unresolved evidence:** Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.

<a id="source-zwemercenter-com"></a>
### Zwemer Center for Muslim Studies

**Official channel:** [https://www.zwemercenter.com/](https://www.zwemercenter.com/). Official historic book PDFs, with impression and source notices preserved.
**Held formats:** .pdf; **3 files** including support/metadata representations. These are file counts, not book counts.
**Licence/terms and credit:** Three historic PDFs were officially offered for reading/download; two dated editions have recorded U.S. public-domain assessments. The undated ATS impression retains a narrower download-permission record and unresolved public reuse.
**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.
**Evidence:** [retained policy or edition evidence](content/library/reports/islam-studies/acquisition-manifest.json); [consulted_official_page_no_policy_link](content/library/reports/campaign-reconciliation/sources/official-consultations.json); [official-page snapshot](content/library/reports/campaign-reconciliation/sources/evidence/zwemercenter.com/official.html).

## Scripture, reference data, imagery and software sources

These sources are documented in the older source register outside the library stocktake. Their dataset/component counts are not added to the library-file totals.

<a id="source-ebible"></a>
### eBible.org

**Official channel:** [https://ebible.org/](https://ebible.org/). **Held formats:** USFM/USFX and edition copr.htm notices.
**Licence/terms and credit:** Edition-specific copr.htm is authoritative: recorded public-domain declarations, Hindi IRV CC BY-SA 4.0, and separate annotation/edition qualifications remain intact. Credit each translation and its named rights holder.
**Evidence:** [retained source/component records](../sources/ebible/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-openbible"></a>
### OpenBible.info

**Official channel:** [https://www.openbible.info/](https://www.openbible.info/). **Held formats:** cross-reference TSV/ZIP, geographical data and topic-score ZIP.
**Licence/terms and credit:** Recorded cross-references/topics CC BY; geographical dataset CC BY 4.0. Credit OpenBible.info. Topic verse quotations do not inherit dataset permission.
**Evidence:** [retained source/component records](../sources/openbible/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-stepbible"></a>
### STEPBible Data

**Official channel:** [https://github.com/STEPBible/STEPBible-Data](https://github.com/STEPBible/STEPBible-Data). **Held formats:** TIPNR proper-name/reference TXT; TAHOT tagged Hebrew Old Testament and TAGNT tagged Greek New Testament TXT; TBESH/TBESG brief lexicon TXT; TFLSJ full Liddell-Scott-Jones lexicon TXT; TVTMS versification TXT; TEHMC/TEGMC morphology-code expansion TXT.
**Licence/terms and credit:** Recorded CC BY 4.0 source data; retain STEP Bible / Tyndale House credit and the dataset licence/header. Every page built on any of it must credit "STEP Bible" with a link to [www.STEPBible.org](https://www.STEPBible.org).
**Do not re-publish the raw files.** Each file's own header asks readers to "refer others to github.com/STEPBible as the source of the data. Please do not redistribute it yourself." This repository honours that: `sources/` is in [.gitignore](.gitignore), so no STEP file is committed or served — [fetch-sources.py](scripts/fetch-sources.py) downloads them from STEP on demand, exactly as it already did for TIPNR.
**Two licence qualifications inside otherwise CC BY 4.0 files.** (1) TBESH/TBESG's long *Meaning* column is "based on the Abridged BDB by Online Bible, © Larry Pierce of OnlineBible.net … for guidance only. Permission should be gained from Online Bible before these are applied." The short Tyndale *Gloss* column carries no such note. For long Hebrew definitions prefer the full public-domain BDB the project already holds at [BrownDriverBriggs.xml](../sources/openscriptures/HebrewLexicon/HebrewLexicon-master/BrownDriverBriggs.xml). (2) TFLSJ's Greek *Meaning* text is Abbott-Smith / Middle Liddell / the full LSJ as formatted by Tyndale House, with Mounce's Teknia dictionary used by permission where the others have no entry.
**STEP's own descriptive prose is not a source.** The explanatory paragraphs in these files and on STEPBible.org are treated as commentary, not as data this site quotes or builds on.
**Pinned, unlike TIPNR.** The thirteen files added on 2026-10-17 are fetched at commit `94802ced31e63882ab42a86d79eb0017df4545e3` (2026-10-16), so a later fetch returns the same bytes. TIPNR still tracks `master`, as it has since 2026-10-03, guarded only by its recorded checksum — so the pinned files and TIPNR can drift apart over time. Nothing checks that the person and place identifiers they share still agree; anyone joining TIPNR to TAHOT/TAGNT should check that first.
**Evidence:** [retained source/component records](../sources/stepbible/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-theographic"></a>
### Theographic Bible Metadata

**Official channel:** [https://github.com/robertrouse/theographic-bible-metadata](https://github.com/robertrouse/theographic-bible-metadata). **Held formats:** repository ZIP/CSV/JSON.
**Licence/terms and credit:** Recorded CC BY-SA 4.0; credit Robert Rouse/Theographic and retain share-alike notice.
**Evidence:** [retained source/component records](../sources/theographic/theographic-bible-metadata-master/LICENSE); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-openscriptures"></a>
### Open Scriptures

**Official channel:** [https://github.com/openscriptures](https://github.com/openscriptures). **Held formats:** Strong’s/Hebrew lexicon ZIP/XML and Hebrew annotation data.
**Licence/terms and credit:** Recorded Strong’s text public domain; HebrewLexicon edition CC BY 4.0; separate Hebrew annotation data CC BY-SA. Preserve the specific dataset licence rather than extending one across the organization.
**Evidence:** [retained source/component records](../sources/openscriptures/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-nasa"></a>
### NASA GIBS / Blue Marble

**Official channel:** [https://earthdata.nasa.gov/](https://earthdata.nasa.gov/). **Held formats:** JPG imagery and request records.
**Licence/terms and credit:** Recorded NASA public-domain imagery; retain NASA/Blue Marble attribution and request provenance. This is imagery, not library prose.
**Evidence:** [retained source/component records](../sources/nasa-bluemarble/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-osm-protomaps"></a>
### OpenStreetMap / Protomaps distribution

**Official channel:** [https://www.openstreetmap.org/copyright](https://www.openstreetmap.org/copyright). **Held formats:** PMTiles, map extracts, fonts and sprites.
**Licence/terms and credit:** Recorded map data ODbL 1.0: © OpenStreetMap contributors; Protomaps distribution credit. Fonts SIL OFL, icons MIT and code licences are separate. This is mapping data, not book acquisition.
**Evidence:** [retained source/component records](../AtlasTiles/README.md); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-natural-earth"></a>
### Natural Earth

**Official channel:** [https://www.naturalearthdata.com/about/terms-of-use/](https://www.naturalearthdata.com/about/terms-of-use/). **Held formats:** GeoJSON world outlines.
**Licence/terms and credit:** Recorded public-domain geography; retain source attribution. This is map geometry, not library prose.
**Evidence:** [retained source/component records](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-census-jacksonville"></a>
### US Census Bureau TIGER/Line and population estimates (14 cities)

**Official channel:** [https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) and [https://www.census.gov/programs-surveys/popest.html](https://www.census.gov/programs-surveys/popest.html). **Held formats:** zipped shapefiles (TIGER/Line 2026, cartographic boundary 2025) and CSV (Vintage 2025 estimates); Jacksonville's files downloaded 2026-10-08, those for Miami-Dade, Hillsborough and Orange counties (and their neighbours' water) 2026-10-20.
**Licence/terms and credit:** US Government work, public domain; credit "US Census Bureau". Used on the Help for life page (/resources/life): each city's zoomable county map (land, water, roads, town labels) and the sourced facts beside the USA map (the county, county and city population for July 1, 2025, land and water area). Built by [scripts/build-city-maps.py](scripts/build-city-maps.py) into src/data/resources/jax-, mia-, tpa-, orl-, atl-, chs-, clt-, bna-, mem-, bhm-, sdf-, dal-, hou- and okc-map.json and -facts.json; the script refuses any file whose sha256 differs from [scripts/city-map-inputs.json](scripts/city-map-inputs.json), which is the table below.
**Evidence:** sha256 of each file read:

| File | What it is | sha256 |
|---|---|---|
| [cb_2025_us_county_500k.zip](https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_county_500k.zip) | Cartographic Boundary File 2025, counties 1:500,000 (shoreline-clipped) | `aa976c00b181939755d0da757f4c7c2dc0103c3b3b4530fb2a91c2bb62fc777c` |
| [tl_2026_12_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_12_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, Florida | `05d6fbc00795555ce9b909a10a3f05d83067f449ffab6d5210a46b97319ab324` |
| [tl_2026_12031_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12031_roads.zip) | TIGER/Line 2026, all roads, Duval County | `8d29fc4a6f40f7d6246aa351239325ac0e10c02cc858fb8e0f400e75cecb7577` |
| [tl_2026_12_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_12_place.zip) | TIGER/Line 2026, places, Florida (town labels) | `38a86feeb17300f9991d5c89b5fb1d61c42823cc4bacb1f7f0738605a22ed8ec` |
| [tl_2026_12031_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12031_areawater.zip) | TIGER/Line 2026, area water, Duval County | `bbb7f8b5f0f8d52d1585e7b0fdf28064907bb64242f70123416d64aba2c5e8d3` |
| [tl_2026_12089_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12089_areawater.zip) | TIGER/Line 2026, area water, Nassau County | `9cd005ef5b1f581296d8301054d789a989b333845d73bd3d8c7b25bfe8a89ec7` |
| [tl_2026_12003_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12003_areawater.zip) | TIGER/Line 2026, area water, Baker County | `9be0c494112ae281a82c463df738050ebcbbfbf4afba19293914ff98bc876a95` |
| [tl_2026_12019_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12019_areawater.zip) | TIGER/Line 2026, area water, Clay County | `52bf3a5a92dfbaa75c2360d2caa7589977457625b43a79755340a31b4685fd94` |
| [tl_2026_12109_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12109_areawater.zip) | TIGER/Line 2026, area water, St. Johns County | `dfcfa9924dbc721a4dc0ce1eca8f533a5c00df41396855c3880f00dafec5d2b6` |
| [co-est2025-alldata.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/counties/totals/co-est2025-alldata.csv) | Vintage 2025 county population estimates | `4f5a499d851e2cb48fd7a5405e5a9235453a8a66933657aacd10df0e264f35d5` |
| [sub-est2025_12.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_12.csv) | Vintage 2025 city and town population estimates, Florida | `7742b3514362d7b2a7c5301cb9e6e722eec40d8a76a817ba6e12ab073f21dab9` |
| [tl_2026_12086_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12086_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12086 | `6d81cb621110048bb86b0b6f81302c5d2fdda854591b2a0ae635004203305ba2` |
| [tl_2026_12086_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12086_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12086 | `52d86f8d3820542d97f1b13082690a0d26e3509b6e28f39ba4b4d90cda5bfe6d` |
| [tl_2026_12011_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12011_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12011 | `2faef746fb3a127074c91b5a838405437b96f10697af2f9319671522f420190e` |
| [tl_2026_12087_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12087_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12087 | `3edda0550b1bee47f210346c234480512d262af2bd0c3f4f8db1be4d899b736b` |
| [tl_2026_12095_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12095_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12095 | `b3ebecab4b34bec3a37ffd4ba4544c75a1fd62b8c7066cbcbd0b6d792abc37d1` |
| [tl_2026_12095_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12095_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12095 | `60805c3e0f8d1d0ee3dc2197ec1ea5fb105b1ea4fcfaf70cc85f2e941ebfa312` |
| [tl_2026_12117_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12117_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12117 | `205aa6529b7963998846fb22ce47222581e17116aa00ecef5f01082060f7ec75` |
| [tl_2026_12097_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12097_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12097 | `1d9ea4e1137b62284ba5ade4430603245c60439cc88eef3feadeea564171bcf7` |
| [tl_2026_12069_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12069_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12069 | `8ab1b83a12752a13447e3424c98dad878c8f2ef5ec9ebfbbeea90e1897e7df51` |
| [tl_2026_12057_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12057_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12057 | `30121cf935e408a10923c6e861b7ca2780016b1905eec5fd15743a23394e0dda` |
| [tl_2026_12103_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12103_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12103 | `15c20139dda3b952af845f826bca586a3ac16c6036d8a5d289e7213c313f3c6e` |
| [tl_2026_12057_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12057_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12057 | `68203113cd27726bedea67ff9e39db0a893d9f36bbcbc6653c677d8b3aa916b5` |
| [tl_2026_12103_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12103_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12103 | `c335275167e40b135f622bb3212dbd8bf7799f1694d9a4d09a242a2c0a9da92b` |
| [tl_2026_12101_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12101_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12101 | `98e8e98c4843cab0b7c5a738f25cb007ca05d17818ecb5ae1c9ed61a1956d3ce` |
| [tl_2026_12081_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12081_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12081 | `352b95dd976a6a34c73aa64e530019c3d9f3238dcf1a8bf0421f31d62536379d` |
| [tl_2026_12105_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12105_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12105 | `b2e5fb5650890e3dab79c3d22020c0bbdc945e9cb3dfad6233057ce4e41b7679` |
| [sub-est2025_13.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_13.csv) | Vintage 2025 city and town population estimates, state FIPS 13 | `55b20f811cc023177d556a6058029e516e9c5b79cd9ac39343fd29c6ac168972` |
| [tl_2026_13_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_13_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 13 | `e69c1eb2848c3375e26d9f6acf58c3ce5798716fe39570693d6cb896772af02f` |
| [tl_2026_13_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_13_place.zip) | TIGER/Line 2026, places, state FIPS 13 (town labels) | `1325e424664f8c0f517c0aa155e3806ca299785ccca4e1badc9fe4f3f4173e09` |
| [tl_2026_13067_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_13067_roads.zip) | TIGER/Line 2026, all roads, county FIPS 13067 | `f493ec9debb5fa5c717d57cac7f7736a41e51ba9f023c250a0d80a911324007c` |
| [tl_2026_13089_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_13089_roads.zip) | TIGER/Line 2026, all roads, county FIPS 13089 | `eb833fef81c517793271c3f64cdcd1a84fbf67f638f78d91dbe2f5f839e2b410` |
| [tl_2026_13121_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_13121_roads.zip) | TIGER/Line 2026, all roads, county FIPS 13121 | `0b51ddeb574a0424e3a0ed5d79b3046b389e983f3bafb58c156ee3d96a3f8c9a` |
| [tl_2026_13135_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_13135_roads.zip) | TIGER/Line 2026, all roads, county FIPS 13135 | `561eb844fa14a98639b2c1d7cba6d3e92824e73f4bd8c7ddc6ba863662d864cd` |
| [tl_2026_13067_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13067_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13067 | `beef8968bd5e748a0d1092150b98a592acd8d79ce05a1d8dbe8d996e8f42222b` |
| [tl_2026_13151_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13151_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13151 | `13486b8206a588de867e75ad4922c6b8d7cdd40157b0d8b2184cd53d52b7de86` |
| [tl_2026_13121_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13121_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13121 | `5136abc5f9e00aa00ccec96136578a1a852aff106b6ee78621e380aff025498a` |
| [tl_2026_13063_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13063_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13063 | `7598394a144284bc8ece96d938fff00e755b87c2dd3d3515ee7af118c43181ef` |
| [tl_2026_13247_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13247_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13247 | `baa161d8fd6e993d864db84dfdf8ef54dda6d59e4a9a45faadc7724b623bd2c3` |
| [tl_2026_13089_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13089_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13089 | `71bc1b1f0f93cc1fb77ac930a4b55df90735b484bb21d1f91f728af37cf24d4a` |
| [tl_2026_13097_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13097_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13097 | `e82251d1db616ba70a540b8c988f51c265edc5725ac1fb7f3bdcd610f2427f8e` |
| [tl_2026_13057_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13057_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13057 | `b50b91bebd30fe6267b6926981f742703b548c83ac0acec6a4073aa33f837224` |
| [tl_2026_13117_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13117_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13117 | `9cc939f7db3e1e9b010bed6020086f09f0349e2239283137135b1ad312dcf28b` |
| [tl_2026_13135_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13135_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13135 | `a8632bf172aa63fe12a6ab94ec2770b02590556e154ac955ab58dfaebad35097` |
| [sub-est2025_45.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_45.csv) | Vintage 2025 city and town population estimates, state FIPS 45 | `210321823d220644eb1bbbfc16aadb43029e9157680eea4cf1390343dace95b5` |
| [tl_2026_45_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_45_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 45 | `2ba35a2e821edf07b72760301efcdfdc9888a30c85f163971c742bbf3542c9fc` |
| [tl_2026_45_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_45_place.zip) | TIGER/Line 2026, places, state FIPS 45 (town labels) | `6311fd1255b1658f6f06de096840c6f121530d8922c63eadc035f55a49b6a579` |
| [tl_2026_45019_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_45019_roads.zip) | TIGER/Line 2026, all roads, county FIPS 45019 | `9fa116439be0e0e30ae7d86213a9d0e2f95df7522aafc196319156b6dc93dda3` |
| [tl_2026_45019_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_45019_areawater.zip) | TIGER/Line 2026, area water, county FIPS 45019 | `23ef680180907275b9b00066d797f4e1f71285c98918b6679cfe2024fbe0293c` |
| [tl_2026_45035_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_45035_areawater.zip) | TIGER/Line 2026, area water, county FIPS 45035 | `05107b2ae2d4cc05f93ec9dde8c8de8dbc93a13847945b0ca6b8e418de48a404` |
| [tl_2026_45015_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_45015_areawater.zip) | TIGER/Line 2026, area water, county FIPS 45015 | `be11345e47fe8f412c486b68c113d04c1dcecf02ee8298babd57a1e88be54dfc` |
| [sub-est2025_37.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_37.csv) | Vintage 2025 city and town population estimates, state FIPS 37 | `72dfbfd8fb4b6bf94ec64ed3c868d8a70e14d810f484725be12f531dead5ad14` |
| [tl_2026_37_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_37_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 37 | `41cb97bb0334b736b79eab40001f6788e3c81f19f41f2b80d7dc780c05f4daae` |
| [tl_2026_37_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_37_place.zip) | TIGER/Line 2026, places, state FIPS 37 (town labels) | `d309e8969e5535c3c66245fdd2ba194af9210128e4ab6e0716ec238bfb180328` |
| [tl_2026_37119_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_37119_roads.zip) | TIGER/Line 2026, all roads, county FIPS 37119 | `936abbac436e1dc8a94cac850a48785b4bafe3da623f46881090316609e9cf18` |
| [tl_2026_37119_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37119_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37119 | `ccb305892284dba9a593838a6d25450a3a891d1eabc1a847910f104f26350472` |
| [tl_2026_45091_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_45091_areawater.zip) | TIGER/Line 2026, area water, county FIPS 45091 | `113c92ea8a11361c0f9fe655326254116aaf09298c2a1757424f395825a01f7f` |
| [tl_2026_45057_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_45057_areawater.zip) | TIGER/Line 2026, area water, county FIPS 45057 | `6111807de90ef9f08391d27a8c73afd44143578ef3db49a8d0dd790c552aadc0` |
| [tl_2026_37159_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37159_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37159 | `d9a18f1388d8a9f309f17395c2f390bbd55371349d93e1e4ea35fd82dbbcb068` |
| [tl_2026_37025_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37025_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37025 | `449326aa32980e8e887e64da5dfcaed889bff9d4be74c85001d371cacad08350` |
| [tl_2026_37179_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37179_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37179 | `1331c2d4abf72b02314aef911792fbf5889da2499637a571b8b0d0437b14703b` |
| [tl_2026_37035_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37035_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37035 | `88e7c6a70f24b4be334001301d7c8977788847d4bc53c6d9de7f0187a7ea29e4` |
| [tl_2026_37097_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37097_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37097 | `cbaf694782743fa6a99eed4c9808343f647cb15fb42532eb452df8636cd51412` |
| [tl_2026_37109_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37109_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37109 | `520e37d0b4a6a59a6c6295f8ce5287bc1f9fb8cf73270c949334b6c612a5fe25` |
| [tl_2026_37071_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37071_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37071 | `93a042ffc2cca2b890ac5cf34c9e165a1de55b72b3a6444026df2fb1c6988d08` |
| [sub-est2025_47.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_47.csv) | Vintage 2025 city and town population estimates, state FIPS 47 | `783acb2b1da5bb1ae32bd4f1adcbac364d351e9045c2d31b344f162917592b68` |
| [tl_2026_47_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_47_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 47 | `6273fbb40232c2734984394d2c0d3c70b4988a00d8c710ca011d8d76fbdf62f6` |
| [tl_2026_47_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_47_place.zip) | TIGER/Line 2026, places, state FIPS 47 (town labels) | `c35ab60215badbb0e10e1ad2c5893e87497e20b98ea75c5a8473936513c4e3a0` |
| [tl_2026_47037_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_47037_roads.zip) | TIGER/Line 2026, all roads, county FIPS 47037 | `caba815df08c125bb4492fe7105ef125c0df06bb62de6edb7c9b612420d4821b` |
| [tl_2026_47147_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47147_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47147 | `6c65ceea6e0ac4bcb7581739fc0a55faa67339d03da8e4f92e4fc36700f0d109` |
| [tl_2026_47149_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47149_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47149 | `de5da108b9efa099db43302b00b19b83b9be0e36cdda607c8a20cfb4ce100001` |
| [tl_2026_47165_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47165_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47165 | `df2b85895450cb4069ed5dc0d9426e288a81bb1028a1ed210bbb5ec7e16a70d8` |
| [tl_2026_47189_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47189_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47189 | `73b3d4dfc10025a6fb9f306145b5c648ee99426ae75362f6b710210be334f3d0` |
| [tl_2026_47021_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47021_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47021 | `e6f1b5099849126452e2e4e77ef5160cf4ab87dd2f5ff7a187494e464625dc98` |
| [tl_2026_47187_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47187_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47187 | `d5ec40cd7d1caa5cc62b802bf64291a4c217bee5a8903f5ec2db03198484d7bf` |
| [tl_2026_47037_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47037_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47037 | `e0ce6af2582d1e8b6f36682d9fab46bcf9f2433412cf3823dc620f30dfa8eed1` |
| [tl_2026_05_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_05_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 05 | `1788782da99117e1a1f5d1407c96c2249114636b4244e0e4bf89d2251ca1c164` |
| [tl_2026_05_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_05_place.zip) | TIGER/Line 2026, places, state FIPS 05 (town labels) | `8a5af8be4f644ee1c72aa702bf538338b5ad4f1c02d0291522f7e40c3dfaba92` |
| [tl_2026_28_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_28_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 28 | `042b8ecf5d05cde9a6f49e207bfad83874eb2769e23470d63b5de5acdd4561ed` |
| [tl_2026_28_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_28_place.zip) | TIGER/Line 2026, places, state FIPS 28 (town labels) | `46c2945ff4ac58db2583f019e57574a96e76ced9fe0d02e81c165a632025de57` |
| [tl_2026_47157_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_47157_roads.zip) | TIGER/Line 2026, all roads, county FIPS 47157 | `494af7d1a26b9abdcb3a047bae5dd79ae9cb2947b360885e3929a39efdcec61b` |
| [tl_2026_28093_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_28093_areawater.zip) | TIGER/Line 2026, area water, county FIPS 28093 | `7898459d36415ff3f417501be75f15ade4a6f0582d0ca10b97b7ebb1b42a5955` |
| [tl_2026_28033_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_28033_areawater.zip) | TIGER/Line 2026, area water, county FIPS 28033 | `a4a276a259d664503f37b2e395845afa2a2000755a0a7d139d6a143af8cd4763` |
| [tl_2026_47157_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_47157_areawater.zip) | TIGER/Line 2026, area water, county FIPS 47157 | `42faba596958f8539124c4206ca90aefebfba72edb26d9946257d1092ee251f5` |
| [tl_2026_05035_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_05035_areawater.zip) | TIGER/Line 2026, area water, county FIPS 05035 | `ab38bf48ab134fe1dad4032a611099cf6a5a04636e374f37e5719301c3221874` |
| [sub-est2025_1.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_1.csv) | Vintage 2025 city and town population estimates, state FIPS 1 | `220436709a033c74b0f880198da0b24f96b6c51121ff064bfe4ccfc85e44c378` |
| [tl_2026_01_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_01_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 01 | `3be8deb8fe75a54b8f72d05bf81944241ff68a87ce896982265e335346f79a64` |
| [tl_2026_01_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_01_place.zip) | TIGER/Line 2026, places, state FIPS 01 (town labels) | `b47351eb605640dc81ab7fa569be9a0d9e0500fc51d58f26230586805c8f6219` |
| [tl_2026_01073_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_01073_roads.zip) | TIGER/Line 2026, all roads, county FIPS 01073 | `9fdde75de5a1544854678b6cf02bc023fd6b92e31a8449203741368b8ea05b77` |
| [tl_2026_01115_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_01115_areawater.zip) | TIGER/Line 2026, area water, county FIPS 01115 | `14beb595f7378680c26519fd5033bb1a9b3d6007a71ee61671b351615b4f9884` |
| [tl_2026_01073_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_01073_areawater.zip) | TIGER/Line 2026, area water, county FIPS 01073 | `f9897f5c10fe02afd584b5a2a8974a56ddc529fbfc74b8b3aeae2f950dcaa900` |
| [tl_2026_01117_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_01117_areawater.zip) | TIGER/Line 2026, area water, county FIPS 01117 | `46606a960aaf3825f7f7bc430235e794587bd78037d2c06e37d39f4920ee6e94` |
| [sub-est2025_21.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_21.csv) | Vintage 2025 city and town population estimates, state FIPS 21 | `9a15d3def94f90ba1e9f29004cf10c2967026da6b196f382df21e596e4215412` |
| [tl_2026_21_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_21_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 21 | `a38493d84d78bd59175613c1a09a213e3db824541dde253829903215bfcec76a` |
| [tl_2026_21_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_21_place.zip) | TIGER/Line 2026, places, state FIPS 21 (town labels) | `52e6b6876f49991d366936715a9251f7128734ed189376620f2543d41a87dbfd` |
| [tl_2026_18_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_18_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 18 | `d46ced97f7903cb141db495b16dcd443fcf3800b5949b7f0412d6a75cf64dec1` |
| [tl_2026_18_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_18_place.zip) | TIGER/Line 2026, places, state FIPS 18 (town labels) | `459568c61726b0fbeba8dba7435eff0a9ae20d33f196320754e4615257b8e015` |
| [tl_2026_21111_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_21111_roads.zip) | TIGER/Line 2026, all roads, county FIPS 21111 | `f8b2f9acc09ee8b0a2f0f6d3e4381035de632850229adec5f4295818e54597c6` |
| [tl_2026_18061_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_18061_areawater.zip) | TIGER/Line 2026, area water, county FIPS 18061 | `5545187c7f7754b20af84020cac08ec83ef8e81250fc975a99e50042d4fea939` |
| [tl_2026_21029_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_21029_areawater.zip) | TIGER/Line 2026, area water, county FIPS 21029 | `dd60ba7577b2c2d2caf2c97e920c0c8d240ec218892ff4f85b7025e76cb96913` |
| [tl_2026_21111_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_21111_areawater.zip) | TIGER/Line 2026, area water, county FIPS 21111 | `d6de356e022c18afb5595f74a6732e476468569eacf013c47230425c07c6e877` |
| [tl_2026_21211_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_21211_areawater.zip) | TIGER/Line 2026, area water, county FIPS 21211 | `ad7ed38efe9f0a41458981e4eb2391a440ba34b718df01e2978c355a8e927d3e` |
| [tl_2026_18043_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_18043_areawater.zip) | TIGER/Line 2026, area water, county FIPS 18043 | `b7387800c57ed2c9908f1c1c4433acef7444487f20fc95940cd20099dabd12d3` |
| [tl_2026_21215_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_21215_areawater.zip) | TIGER/Line 2026, area water, county FIPS 21215 | `d4c1c0bef3dc90aaeda8069a1ca833c3290ebdc212d8297d686415f2dacbcb4f` |
| [tl_2026_21185_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_21185_areawater.zip) | TIGER/Line 2026, area water, county FIPS 21185 | `05dfe464394fbcf7f8f9f6921877f3a00f89b47df36cf824bb28c5b57d0d9be8` |
| [tl_2026_18019_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_18019_areawater.zip) | TIGER/Line 2026, area water, county FIPS 18019 | `4badf44232d730499f741a2480618664f0f430b367cccaed6ae4d411bbe3b203` |
| [sub-est2025_48.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_48.csv) | Vintage 2025 city and town population estimates, state FIPS 48 | `744d8e1c5b480efbc3f0039ba6fbcd87d084c184f33e6639a03d2401625adf02` |
| [tl_2026_48_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_48_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 48 | `81cc61c06c126bb7c9f068f660c9e45a9fbfd030382f734d40ede489a21e139e` |
| [tl_2026_48_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_48_place.zip) | TIGER/Line 2026, places, state FIPS 48 (town labels) | `d6bbad505fd9b6b2e2c35512d05bf30858dfdfdf3dabf037537e28f0fbbc5269` |
| [tl_2026_48113_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_48113_roads.zip) | TIGER/Line 2026, all roads, county FIPS 48113 | `c39acdd3270a4d56c7dc3e22585615f6606f6c2e175feb6a2e07e409300efdc1` |
| [tl_2026_48257_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48257_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48257 | `dc7d3aa38cda82cb8b22deb29e2faecc4b66fb23c503539766a15122fc51cdcb` |
| [tl_2026_48121_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48121_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48121 | `21b27edd076e0cbe96ad482e916a9097f32b5c11bbb50241f5772e1f53ed7dbe` |
| [tl_2026_48397_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48397_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48397 | `c9ff3ae95778e067c7a0ff8b59bc65ff07c8f6dea846ed211b4d144fc9a05f49` |
| [tl_2026_48139_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48139_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48139 | `86e3d3088b9567ac79254234d41243db1facedf54d35e2ceb0ce1b6da30a6976` |
| [tl_2026_48439_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48439_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48439 | `71ab5d8959fd72df5d86ef863a5bd5c02225943109b5b8003b3dcd6fa2526268` |
| [tl_2026_48085_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48085_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48085 | `25cb9b334887bb831c6f533d40876982b9f6fda2124ade280b17ee9fec1ed17d` |
| [tl_2026_48113_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48113_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48113 | `e51bd0010054be326d234c73318edc5635e1655fde4ec4b5d273a1763f872bc7` |
| [tl_2026_48201_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_48201_roads.zip) | TIGER/Line 2026, all roads, county FIPS 48201 | `c72029decb19346c4fd58c4d21f43c3caa714f31690a11a07f5aea89bbb6a292` |
| [tl_2026_48039_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48039_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48039 | `a137fdb3c6e923a587ccb0608f88f1672628b80a1d15332f9960efff2504ae5b` |
| [tl_2026_48201_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48201_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48201 | `a6850a6d09b93638bbe5ae8f6772ee286373c3cdb6f6bf5dd0a6e55e2ffbbefe` |
| [tl_2026_48157_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48157_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48157 | `10c88485c1b629c98cc20a32ff0cddc2ede77491ea5caef6417b194f24620b7b` |
| [tl_2026_48167_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48167_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48167 | `2b10f998bfd629b59370436e84ed102bfc58fdec9aef7b4447ae83a57daca80a` |
| [sub-est2025_40.csv](https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_40.csv) | Vintage 2025 city and town population estimates, state FIPS 40 | `34c5b9e2e21dc0b7b2382b0c967c7cc3d0b4efc034c66cfc56459f1548c2564a` |
| [tl_2026_40_prisecroads.zip](https://www2.census.gov/geo/tiger/TIGER2026/PRISECROADS/tl_2026_40_prisecroads.zip) | TIGER/Line 2026, primary and secondary roads, state FIPS 40 | `9ac1546e2cd65e60986e7681c42c2e59def1dec6059ccb4f76bdca761a802b32` |
| [tl_2026_40_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_40_place.zip) | TIGER/Line 2026, places, state FIPS 40 (town labels) | `f54da470cce075bf68cbfefc0022de16e7e3d7acc4fde8a3af0fb0ce65bf1b6f` |
| [tl_2026_40027_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_40027_roads.zip) | TIGER/Line 2026, all roads, county FIPS 40027 | `0aae41b602233f58458db6f9a35d764af6fe51113285a438d4eb348cff794749` |
| [tl_2026_40109_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_40109_roads.zip) | TIGER/Line 2026, all roads, county FIPS 40109 | `2ffc134bbf6fb2dc8b26a1544c1a05482ea252277f0783f6f32b8eb2045bc8cb` |
| [tl_2026_40027_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_40027_areawater.zip) | TIGER/Line 2026, area water, county FIPS 40027 | `478df76b3af2e41f7e002dcb82c7b95ee76fe3b9d2c1414ea3663850eba05402` |
| [tl_2026_40087_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_40087_areawater.zip) | TIGER/Line 2026, area water, county FIPS 40087 | `901e45159cd69539ff1f906fdccf432f4ae654644b0df34a5595c17cf51e737c` |
| [tl_2026_40083_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_40083_areawater.zip) | TIGER/Line 2026, area water, county FIPS 40083 | `619dc09740cf1d7cd6d25fc63674e92a3452f5ae257cfcf50510f71da204f805` |
| [tl_2026_40109_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_40109_areawater.zip) | TIGER/Line 2026, area water, county FIPS 40109 | `183e0d90e1bc7c29c2fb0b6373eeca04bc766cb38e1316e9d80e7fe242c79d0d` |
| [tl_2026_40017_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_40017_areawater.zip) | TIGER/Line 2026, area water, county FIPS 40017 | `23d1950a8584ecdab96e174eb457b1639d78d157baee7875fffe8e7d5e2688f1` |
| [tl_2026_40051_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_40051_areawater.zip) | TIGER/Line 2026, area water, county FIPS 40051 | `c2ce593f038be70f6f06e34099fbc76b1cf171e838661e9c2f87a144ae3e7e15` |
| [tl_2026_40073_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_40073_areawater.zip) | TIGER/Line 2026, area water, county FIPS 40073 | `156340a28e1c1ab637f13b563286ca50cd6b6340989a282a78af8e1b4b4a3235` |
| [tl_2026_12019_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12019_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12019 | `90322808d89fd1a848aa715e5722afcc8a8acaf8da706c2620cc7f08090556ab` |
| [tl_2026_12089_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12089_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12089 | `25eadb572c2d9fad42d79a05810388bd7efe7c1015e90f9d0034c8945201fab7` |
| [tl_2026_12007_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12007_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12007 | `5fba40a12edc029032679350893c64b7baf16b99d6badb6ea37233787321f5ed` |
| [tl_2026_12049_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_12049_areawater.zip) | TIGER/Line 2026, area water, county FIPS 12049 | `a59c3ada20978a2ddef86df6b8d83576be142499efe279eb5edb1b4f15bc3880` |
| [tl_2026_12097_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12097_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12097 | `0c7c4b37636c1aa897f9a7fad3ba325718e007c3771837bca6a8cdcc9b0d5a0c` |
| [tl_2026_12117_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_12117_roads.zip) | TIGER/Line 2026, all roads, county FIPS 12117 | `3744ee8917cf6e15d59afe73021fa98c2798d2277f03b77b099f005048752f73` |
| [tl_2026_13063_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_13063_roads.zip) | TIGER/Line 2026, all roads, county FIPS 13063 | `a22c71b3edd5a66ca3e2f8e791b154fc018d96246c68ac7e731ad78ffe57cb64` |
| [tl_2026_13113_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13113_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13113 | `2f3f4d155bff392ea55aefdea5f24f4c249ec3de33763471dc60a120432a217f` |
| [tl_2026_13217_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13217_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13217 | `5e1d18604866b04d49742bbab3a08da62ced12e9e86f63f21ea677ea16d3b052` |
| [tl_2026_13077_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13077_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13077 | `240a47893b66ee013c37d439181e53c7b6742188bfe8c417b003ba3e0b0c2767` |
| [tl_2026_13015_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_13015_areawater.zip) | TIGER/Line 2026, area water, county FIPS 13015 | `4ca9ac1ac1990e365cd2690e8baa6fe7be90880b8458635a96dc0662089cee2f` |
| [tl_2026_45015_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_45015_roads.zip) | TIGER/Line 2026, all roads, county FIPS 45015 | `43d7998c545a264d3407648030572ea216b555ec68489a99825f7f23276ecf3a` |
| [tl_2026_45035_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_45035_roads.zip) | TIGER/Line 2026, all roads, county FIPS 45035 | `2826dd0f32ccc29b1615f90fc78fcf19d51ed44af8dffd3faa672b054ab13313` |
| [tl_2026_37097_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_37097_roads.zip) | TIGER/Line 2026, all roads, county FIPS 37097 | `2d4d23067b1e6b6fde7b59f8ee5de5f933679c23129240d6f0569245aa4f96ff` |
| [tl_2026_37179_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_37179_roads.zip) | TIGER/Line 2026, all roads, county FIPS 37179 | `01d5485d30a563a8b3146dc6b26f60e4961a4531bee9384d3ba9c00f809032ed` |
| [tl_2026_37167_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_37167_areawater.zip) | TIGER/Line 2026, area water, county FIPS 37167 | `b9e0c0119a4f79c262f8c17298084582fefd1f44fd47a3e51a0da30c58cea5c7` |
| [tl_2026_01127_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_01127_areawater.zip) | TIGER/Line 2026, area water, county FIPS 01127 | `0d31c88eb6ccd1242a22dab0c862eac48b8ed634c06caff06d9dd2a70c030250` |
| [tl_2026_48251_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48251_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48251 | `35d7ce8917e1ad2f5fad697fb97993b50c212e5e732d4305d73e7cca85e63b5e` |
| [tl_2026_48157_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_48157_roads.zip) | TIGER/Line 2026, all roads, county FIPS 48157 | `61de9c6df4b52719d625759bfc315be21ce6cd93ee4c12cec5d517134b48553f` |
| [tl_2026_48339_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48339_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48339 | `479c0f026778ac86ca84a2dcf8341353fb7a52bbab721e6738803bc3718506f0` |
| [tl_2026_48291_areawater.zip](https://www2.census.gov/geo/tiger/TIGER2026/AREAWATER/tl_2026_48291_areawater.zip) | TIGER/Line 2026, area water, county FIPS 48291 | `6ca33569f7f87ee6df7c5e1583bd9a053dcd92199254d24e32fc8c249e489a7b` |
| [tl_2026_40017_roads.zip](https://www2.census.gov/geo/tiger/TIGER2026/ROADS/tl_2026_40017_roads.zip) | TIGER/Line 2026, all roads, county FIPS 40017 | `c12b03bb4ac9b8c5eb846a2dd7d60b6d7085df7bd2643dc938e2f247f23b3742` |

<a id="source-qwen-model"></a>
### Qwen embedding model

**Official channel:** [https://huggingface.co/Qwen/Qwen3-Embedding-4B](https://huggingface.co/Qwen/Qwen3-Embedding-4B). **Held formats:** cached model weights/tokenizer.
**Licence/terms and credit:** Apache-2.0 model; current local configuration identifies Qwen3-Embedding-4B and its pinned revision. Retain model identity/licence. Model weights are implementation assets, not acquired theology texts.
**Evidence:** [retained source/component records](knowledge/config.json); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-lancedb-engine"></a>
### LanceDB search engine

**Official channel:** [https://github.com/lancedb/lancedb](https://github.com/lancedb/lancedb). **Held formats:** installed search software.
**Licence/terms and credit:** Recorded Apache-2.0 core; preserve component licence notices. Software installation is not a book or text acquisition.
**Evidence:** [retained source/component records](knowledge/README.md); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-granite-model"></a>
### IBM Granite browser embedding model

**Official channel:** [https://huggingface.co/ibm-granite/granite-embedding-small-english-r2](https://huggingface.co/ibm-granite/granite-embedding-small-english-r2). **Held formats:** int8 ONNX weights/tokenizer and browser model pack.
**Licence/terms and credit:** Recorded Apache-2.0 model and onnx-community conversion; retain both model/conversion identities, revision and licence. This is a software/model asset, not library prose.
**Evidence:** [retained source/component records](../MeaningPack/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-onnx-runtime"></a>
### ONNX Runtime Web

**Official channel:** [https://github.com/microsoft/onnxruntime](https://github.com/microsoft/onnxruntime). **Held formats:** browser JavaScript/WASM engine.
**Licence/terms and credit:** Recorded MIT runtime; retain Microsoft/component licence notices. This is an implementation asset, not an acquired book.
**Evidence:** [retained source/component records](../MeaningPack/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-transformers-js"></a>
### Hugging Face Transformers.js

**Official channel:** [https://github.com/huggingface/transformers.js](https://github.com/huggingface/transformers.js). **Held formats:** installed browser tokenizer/runtime package.
**Licence/terms and credit:** Recorded Apache-2.0 package; retain component licence notices. Software is not a theological source or acquired book.
**Evidence:** [retained source/component records](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

<a id="source-owner-selection"></a>
### Owner’s CypherPunk Faith selection

**Official channel:** local owner repository. **Held formats:** JSON snapshots of names and approved groupings.
**Licence/terms and credit:** Owner-authored selection; public-domain historical reference inputs retain their own identities. No third-party open licence is invented for the owner’s compilation.
**Evidence:** [retained source/component records](../sources/cypherpunk-faith/); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.

## Build source checksum registry

The data builders read these source IDs and SHA-256 prefixes directly from this file. Restored from the pre-reconciliation ledger; licence and edition notes are retained. These rows describe files, not additional acquisition providers.

| File | What | Licence | Checksum |
|---|---|---|---|
| [eng-kjv](sources/ebible/eng-kjv/) | King James Version (1769 text) with Apocrypha, with Strong's numbers | English | 39/27/14 | 2026-09-26 | 0e0359e9e488582a |
| [eng-kjv2006](sources/ebible/eng-kjv2006/) | King James Version, no Apocrypha, with Strong's numbers | English | 39/27/0 | 2026-09-26 | 2e698d1c6e865341 |
| [enggnv](sources/ebible/enggnv/) | Geneva Bible (1599) | English | 39/27/0 | 2024-03-16 | bbbd83ac1b3f019e |
| [engtnt](sources/ebible/engtnt/) | Tyndale New Testament (1534) | English | 0/27/0 | 2020-12-20 | f9ccffa0956bcad8 |
| [engWycliffe](sources/ebible/engWycliffe/) | Wycliffe Bible — five books of Moses and the Gospels only | Middle English | 5/4/0 | 2016-11-08 | eb71616d28ddf05b |
| [engDRA](sources/ebible/engDRA/) | Douay-Rheims (1899 American edition), Catholic, from the Latin Vulgate | English | 39/27/7 | 2022-11-03 | 2a4bbd180de4a7ca |
| [engwebster](sources/ebible/engwebster/) | Noah Webster Bible (1833) | English | 39/27/0 | 2024-08-01 | 505370352413cdf7 |
| [engylt](sources/ebible/engylt/) | Young's Literal Translation (1898) | English | 39/27/0 | 2019-10-20 | e50e55320bd5352e |
| [engDBY](sources/ebible/engDBY/) | Darby Translation (1890) | English | 39/27/0 | 2019-11-15 | 93fc531ac7f06d9a |
| [eng-rv](sources/ebible/eng-rv/) | Revised Version (1895) with Apocrypha | English | 39/27/14 | 2026-10-02 | ed587388c6a1935a |
| [eng-asv](sources/ebible/eng-asv/) | American Standard Version (1901) | English | 39/27/0 | 2026-10-02 | a9420074e1d96f87 |
| [engjps](sources/ebible/engjps/) | JPS Tanakh (1917), the Jewish Publication Society's Hebrew Bible | English | 39/0/0 | 2023-09-19 | 0161ec45dbb8eea4 |
| [eng-Brenton](sources/ebible/eng-Brenton/) | Brenton's English Septuagint (1844), the Greek Old Testament in English | English | 37/0/16 | 2024-09-17 | 03e4fc1f728326e8 |
| [engBBE](sources/ebible/engBBE/) | Bible in Basic English (1949/1964) | English | 39/27/0 | 2020-04-17 | b745b95462920b41 |
| [engwebp](sources/ebible/engwebp/) | World English Bible (modern English) | English | 39/27/0 | 2026-10-02 | 99ea438ef8a6a20a |
| [eng-web](sources/ebible/eng-web/) | World English Bible Classic, with Deuterocanon | English | 39/27/15 | 2026-10-02 | b09f8b9f197d05d5 |
| [engbsb](sources/ebible/engbsb/) | Berean Standard Bible (modern English; public domain since 2023) | English | 39/27/0 | 2026-10-02 | b77cc2d5161b0361 |
| [engmsb](sources/ebible/engmsb/) | Majority Standard Bible (the BSB following the Majority Greek text) | English | 39/27/0 | 2026-10-02 | fdaab9c32190ba0b |
| [hboWLC](sources/ebible/hboWLC/) | Westminster Leningrad Codex — the Hebrew Old Testament. ⚠ The *words* are public domain; the Strong's and grammar tags in the files are **CC BY-SA** (Open Scriptures Hebrew Bible) and are dropped by the build | Hebrew | 39/0/0 | 2017-12-27 | 8d59e50b9b576be8 |
| [grcbrent](sources/ebible/grcbrent/) | The Greek Septuagint (Brenton's edition) | Greek | | 2026-04-08 | cc6591b067fa69e0 |
| [grctr](sources/ebible/grctr/) | Textus Receptus — the Greek New Testament behind the KJV | Greek | 0/27/0 | 2026-10-02 | 723bd84183018497 |
| [grcmt](sources/ebible/grcmt/) | Byzantine / Majority Text Greek New Testament (Robinson-Pierpont 2018) | Greek | 0/27/0 | 2024-01-09 | c8b97cd0ace2d35e |
| [grcbyz](sources/ebible/grcbyz/) | 1904 Patriarchal Greek New Testament (Greek Orthodox) | Greek | 0/27/0 | 2026-08-08 | a39e54cf1cd228c4 |
| [grc-tisch](sources/ebible/grc-tisch/) | Tischendorf's 8th edition Greek New Testament | Greek | 0/27/0 | 2014-01-11 | 4bb15ed25a23d73e |
| [latVUC](sources/ebible/latVUC/) | Clementine Latin Vulgate (1598) | Latin | 39/27/7 | 2014-08-23 | f31ec8c0e1c38e07 |
| [spaRV1909](sources/ebible/spaRV1909/) | Reina-Valera 1909 — the classic Spanish Protestant Bible | Spanish | 39/27/0 | 2013-12-13 | 932c23472b2a919c |
| [fraLSG](sources/ebible/fraLSG/) | Louis Segond 1910 — the classic French Protestant Bible (numbers Psalm titles as verse 1) | French | 39/27/0 | 2026-10-03 | 3fc18c37af692d95 |
| [deu1912](sources/ebible/deu1912/) | Lutherbibel 1912 — Luther's German Bible, 1912 revision | German | 39/27/0 | 2025-12-29 | 8f6675ea399c3202 |
| [arb-vd](sources/ebible/arb-vd/) | Van Dyck (Smith–Van Dyck, 1865) — the standard Arabic Protestant Bible, right to left | Arabic | 39/27/0 | 2020-08-03 | 952c7e9725aeafdc |
| [cmn-cu89s](sources/ebible/cmn-cu89s/) | Chinese Union Version 和合本, simplified script, with the 1989 new punctuation. ⚠ eBible marks it Public Domain; the punctuation edition may carry a Hong Kong Bible Society copyright — settle before publishing | Chinese | 39/27/0 | 2021-10-15 | 9ddb4d15a4b85d3f |
| [cmnswcb](sources/ebible/cmnswcb/) | World Chinese Bible 世界中文圣经, simplified script — a new modern translation that follows the World English Bible closely; public domain beyond doubt. eBible calls it a draft (译本草稿) and has not yet certified it | Chinese | 39/27/0 | 2026-09-07 | dbdd2aa8b2896980 |
| [hin2017](sources/ebible/hin2017/) | Indian Revised Version (IRV) Hindi, 2019 — a revision of the long-standing Hindi Bible. ⚠ **Not public domain: CC BY-SA 4.0, © 2017, 2018, 2019 Bridge Connectivity Solutions** (the one openly licensed text; see NOTICE.md) | Hindi | 39/27/0 | 2023-04-11 | b32eac3abdda77d3 |
| [porbrbsl](sources/ebible/porbrbsl/) | Bíblia Portuguesa Mundial — Brazilian Portuguese, a translation of the World English Bible with the Deuterocanon; eBible calls it a draft still under review | Portuguese | 39/27/15 | 2026-08-19 | 9ba723320cc6eee3 |
| [russyn](sources/ebible/russyn/) | Russian Synodal Bible (1876) — the standard Russian Bible; Psalms numbered the Greek way, Psalm titles as verse 1 | Russian | 39/27/0 | 2022-11-25 | 9a61f073951b236b |
| [jpnm](sources/ebible/jpnm/) | Japanese Freedom Bible (フリーダム・バイブル) — a new modern translation; eBible calls it a draft | Japanese | 39/27/0 | 2026-08-19 | 4d48d03495728163 |
| [vie1934](sources/ebible/vie1934/) | Vietnamese Bible 1923 (Kinh Thánh) — the standard Vietnamese Protestant Bible | Vietnamese | 39/27/0 | 2022-06-09 | adf7ec3a944a822c |
| [pesOPV](sources/ebible/pesOPV/) | Old Persian Version (ترجمه قدیم, 1895) — the classic Persian Bible, right to left | Persian | 39/27/0 | 2015-04-21 | fe33d897e1eaaf48 |
| [ita1927](sources/ebible/ita1927/) | Riveduta 1927 — Giovanni Luzzi's revision of the Italian Diodati Bible | Italian | 39/27/0 | 2019-12-17 | e95a11617ef36d0c |
| [openbible](sources/openbible/) | Crowd-voted verse-to-verse cross-references, seeded from the public-domain Treasury of Scripture Knowledge | 344,799 | 224f28aae59812b7 |
| [openbible-geo](sources/openbible-geo/) | Bible places: 1,341 ancient places with their likely modern locations and the verses that mention them (licence **CC-BY 4.0**) | 1,341 | 2dfa8440f2da1f54 |
| [robertson-harmony](sources/gutenberg/robertson-harmony-36264-h.htm) | A. T. Robertson, *A Harmony of the Gospels for Students of the Life of Christ* (1922), Project Gutenberg #36264 — its contents list gives every part and numbered event with its Gospel references | Public domain in the US (published 1922); Project Gutenberg licence for the file | 105aac29a024f977 |
| [tipnr](sources/stepbible/TIPNR.txt) | STEP Bible's *Translators Individualised Proper Names with all References* — every person, place and other proper name, with description, family, tribe, era and every verse | **CC BY 4.0** — the page must credit "STEP Bible" with a link to www.STEPBible.org | 63a129dac8c34177 |
| [torrey-xml](sources/ccel/ttt.xml) | R. A. Torrey, *The New Topical Text Book* (1897), CCEL's marked-up edition with parsed references | Book public domain; CCEL claims its electronic markup, so only the book's facts (topics, references) are used | e49a064b857b186c |
| [torrey-txt](sources/ccel/ttt.txt) | Same, plain text | as above | 0999ab464a05a1d1 |
| [nave-xml](sources/ccel/bible.xml) | Orville J. Nave, *Nave's Topical Bible* (1896/1903), CCEL edition | as above | dc58dd4e37d5af63 |
| [nave-txt](sources/ccel/bible.txt) | Same, plain text | as above | d78906aead3f71b8 |
| [easton-xml](sources/ccel/ebd2.xml) | M. G. Easton, *Illustrated Bible Dictionary* (3rd ed., 1897), CCEL edition | as above | 10e3f432e38ee819 |
| [easton-txt](sources/ccel/ebd2.txt) | Same, plain text | as above | 291260d29a0ddef7 |
| [faith-names](sources/cypherpunk-faith/faith-names.json) | The owner's Names of God list from his CypherPunk NFT Faith page (322 names with KJV verses, compiled by the owner from Torrey's Topical Textbook and other references) — snapshot taken 2026-10-03 of the file last changed in CypherpunkNFT commit `cf44968` (2026-10-01) | Torrey public domain; the owner's own selection | 6f4a81addb2fb18c |
| [faith-names-approved](sources/cypherpunk-faith/faith-names-approved.json) | The owner's approved grouping (Father / Son / Holy Spirit, 302 names), display names and removals, from the same page | the owner's own | eefc8b30bb085be4 |
| [isbe](sources/crosswire/ISBE.zip) | James Orr (ed.), *International Standard Bible Encyclopedia* (1915), about 9,000 articles; CrossWire SWORD module, version 2.2 · **the in-depth article on person, place and topic pages** | Public domain (CrossWire: "DistributionLicense=Public Domain") | 4de747545d9c349a |
| [smith-xml](sources/ccel/smith-bibledict.xml) | William Smith, *Smith's Bible Dictionary* (1863/1884), CCEL edition · a second classic-dictionary voice on person, place and topic pages | Book public domain; CCEL claims its electronic markup, so the text is used, not CCEL's markup | f0aa85b544f70384 |
| [hitchcock-xml](sources/ccel/hitchcock-bible-names.xml) | Roswell D. Hitchcock, *Bible Names Dictionary* (1869), CCEL edition · **the meaning of each name** on person and place pages | as above | 43390f72248bb368 |
| [fausset-ocr](sources/archive-org/fausset-bible-encyclopedia-1900.txt) | A. R. Fausset, *Bible Encyclopaedia and Dictionary, Critical and Expository* (1900 printing), Internet Archive item `bibleencyclopedi0000arfa_c4x1`, machine-read (OCR) text · a third dictionary voice, **after cleaning** | Public domain (1900; author died 1910) | 1dd222ab3f21cb1f |
| [theographic](sources/theographic/theographic-bible-metadata.zip) | Robert Rouse, *Theographic Bible Metadata*: people, places, events, periods and dates linked to verses (GitHub `robertrouse/theographic-bible-metadata`, master) · dates for the people periods, events on person pages, a timeline, a cross-check of family links | **CC BY-SA 4.0**: credit Theographic; anything built from it is shared under the same licence | 16b4def7d1bf491a |
| [openbible-topics](sources/openbible-topics/topic-scores.zip) | OpenBible.info *Topical Bible*: modern topics with verse references ranked by reader votes (generated 2026-10-05; updated weekly) · today's topics beside Torrey's and Nave's, verses ranked by votes; **references only** (its quotations are ESV, which is under copyright) | **CC BY**: credit OpenBible.info | ba9c95ecc5377ca0 |
| [strongs](sources/openscriptures/strongs.zip) | James Strong's Hebrew and Greek dictionaries, Open Scriptures edition (GitHub `openscriptures/strongs`, master) · **word study pages**, keyed by the Strong's numbers already in our KJV | Public domain (files: "rights: Public Domain") | b462cb85fd7e825f |
| [hebrew-lexicon](sources/openscriptures/HebrewLexicon.zip) | Brown, Driver & Briggs, *Hebrew and English Lexicon* (1906) with Strong's Hebrew, Open Scriptures' Hebrew Lexicon (GitHub `openscriptures/HebrewLexicon`, master) · word study pages (Hebrew) | Text public domain; this edition **CC BY 4.0**: credit Open Scriptures | 907bcdcd507b40b9 |
| [thayer-ocr](sources/archive-org/thayer-lexicon-1889.txt) | Joseph Henry Thayer, *Greek-English Lexicon of the New Testament* (1889 printing), Internet Archive item `thayer-lexicon`, OCR text · word study pages (Greek), **after cleaning** | Public domain (Internet Archive marks it CC0) | 345d42ff7be84bdf |
| [josephus-antiquities](sources/gutenberg/josephus-antiquities-2848.txt) | Flavius Josephus, *Antiquities of the Jews*, tr. William Whiston, Project Gutenberg #2848 · "outside the Bible" history notes on person and place pages | Public domain in the US (Project Gutenberg edition) | bb2e32da8ba3adc1 |
| [josephus-wars](sources/gutenberg/josephus-wars-2850.txt) | Josephus, *The Wars of the Jews*, tr. Whiston, Project Gutenberg #2850 · as above | as above | 9a72663aefa6b22b |
| [josephus-life](sources/gutenberg/josephus-life-2846.txt) | Josephus, *The Life of Flavius Josephus*, tr. Whiston, Project Gutenberg #2846 · as above | as above | 7c4408526f781f67 |
| [josephus-apion](sources/gutenberg/josephus-apion-2849.txt) | Josephus, *Against Apion*, tr. Whiston, Project Gutenberg #2849 · as above | as above | b6791c018b1033ea |
| [tahot-gen-deu](sources/stepbible/TAHOT-Gen-Deu.txt) | STEP Bible *Translators Amalgamated Hebrew OT* (TAHOT), Genesis–Deuteronomy — the Leningrad Hebrew text one word per line, each word carrying its disambiguated Strong's number, ETCBC grammar code, English gloss and any scribal or manuscript variant · planned use: the Hebrew behind every Old Testament verse, for word tap, interlinear and original-beside-translation reading ([plan](../Pages/Study/ORIGINAL-LANGUAGES-PLAN.md)) | **CC BY 4.0** — credit "STEP Bible" with a link to www.STEPBible.org; do not redistribute the raw file | e9b8546ee48fe0bf |
| [tahot-jos-est](sources/stepbible/TAHOT-Jos-Est.txt) | Same, Joshua–Esther (STEP splits TAHOT into four files because one would be too large for GitHub) | as above | 195fee1dc3653bab |
| [tahot-job-sng](sources/stepbible/TAHOT-Job-Sng.txt) | Same, Job–Song of Songs | as above | bb508af3af07822f |
| [tahot-isa-mal](sources/stepbible/TAHOT-Isa-Mal.txt) | Same, Isaiah–Malachi | as above | f3ded203d2a74d63 |
| [tagnt-mat-jhn](sources/stepbible/TAGNT-Mat-Jhn.txt) | STEP Bible *Translators Amalgamated Greek NT* (TAGNT), Matthew–John — the Greek New Testament one word per line with Strong's number, full parsing, gloss, **which printed editions contain that word** (NA28, NA27, Tyndale, SBL, Westcott-Hort, Tregelles, Textus Receptus, Byzantine) and the reading each gives where they differ · planned use: the Greek behind every New Testament verse, plus the manuscript-variant notes | as above | ab8eaaeb68e17a1d |
| [tagnt-act-rev](sources/stepbible/TAGNT-Act-Rev.txt) | Same, Acts–Revelation | as above | 524e32375361e6d3 |
| [tbesh](sources/stepbible/TBESH.txt) | STEP Bible *Translators Brief lexicon of Extended Strongs for Hebrew* — 11,682 Hebrew/Aramaic entries: Tyndale gloss, Hebrew form, transliteration, simple grammar and a short definition · planned use: the word card shown when a reader taps a Hebrew word. ⚠ its long *Meaning* column is Abridged BDB © Online Bible and needs their permission; the short *Gloss* does not | **CC BY 4.0** as above, except the *Meaning* column — see the STEPBible Data section | 464dccadd95fd862 |
| [tbesg](sources/stepbible/TBESG.txt) | Same for Greek — 9,550 entries, definitions from Abbott-Smith, Middle Liddell and (by permission) Mounce's Teknia | as above | 312f723d7b8ef263 |
| [tflsj](sources/stepbible/TFLSJ-0-5624.txt) | STEP Bible *Translators Formatted full LSJ* — Liddell-Scott-Jones, the full scholarly Greek lexicon, 5,709 entries for Strong's 0–5624, formatted by Tyndale House with abbreviations expanded and citation dates added · planned use: the "go deeper" Greek entry behind the brief one | **CC BY 4.0** — credit "STEP Bible" with a link to www.STEPBible.org; do not redistribute the raw file | fcc2845412132a7b |
| [tflsj-extra](sources/stepbible/TFLSJ-extra.txt) | Same, the remaining 3,840 entries beyond Strong's 5624 | as above | fdb2840067faa113 |
| [tvtms](sources/stepbible/TVTMS.txt) | STEP Bible *Translators Versification Traditions with Methodology for Standardisation* — 28,049 mapping lines saying where the English, Hebrew, Latin, Greek and other traditions number the same verse differently (the Psalm-title problem, 3 John 14/15, Romans 16:25-27, and the rest) · planned use: making a reference work across every translation on the site, and showing the reader when a verse is numbered differently elsewhere | as above | 63058e0f20201af4 |
| [tehmc](sources/stepbible/TEHMC.txt) | STEP Bible *Translators Expansion of Hebrew Morphology Codes* — 921 grammar codes, each with a structured breakdown, a readable label, **a plain-English explanation and a worked example** · planned use: turning "HVqp3ms" into a sentence an ordinary reader understands | as above | 78779bea824b31d4 |
| [tegmc](sources/stepbible/TEGMC.txt) | Same for Greek — 1,644 codes (STEP's own filename spells it "Morphhology") | as above | 5f0416f7617019a6 |

## Discovery-only sources and historical mission references

[The existing source registry](content/library/sources.json) also contains discovery/link-only providers such as PRDL, publisher catalogues and MLJ Trust. Discovery entries are not proof of acquired full texts or permission to collect them. The historic Muslim-primary-text comparison references remain historical research records, not approved teaching-source acquisitions.

The headings below preserve earlier mission/reference anchors and link to the complete historical text. Historical counts and earlier indexing limitations describe those earlier runs; current private indexing follows the standing owner authorization above.

## LC01: works cited by the Letters study (2026-10-07)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#lc01-works-cited-by-the-letters-study-2026-10-07).

## Same-day private intake

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#same-day-private-intake).

## RB12 historical text acquisition

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb12-historical-text-acquisition).

## 2026-10-07: RB11 prayer and worship acquisitions

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#2026-10-07-rb11-prayer-and-worship-acquisitions).

## RB10: Christian ethics, conscience and practical obedience (2026-10-07)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb10-christian-ethics-conscience-and-practical-obedience-2026-10-07).

## RB09: genres, context and difficult passages (2026-10-07)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb09-genres-context-and-difficult-passages-2026-10-07).

## Reference directory and corpus dashboard (2026-10-06, local preview)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#reference-directory-and-corpus-dashboard-2026-10-06-local-preview).

## Bible texts — all from eBible.org, all marked "Public Domain" in their own copr.htm except the Hindi IRV (CC BY-SA 4.0)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#bible-texts--all-from-ebibleorg-all-marked-public-domain-in-their-own-coprhtm-except-the-hindi-irv-cc-by-sa-40).

## Cross-references — OpenBible.info, licence CC-BY

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#cross-references--openbibleinfo-licence-cc-by).

## Atlas satellite imagery — NASA, public domain

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#atlas-satellite-imagery--nasa-public-domain).

## Atlas street map — OpenStreetMap data via Protomaps, licence ODbL

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#atlas-street-map--openstreetmap-data-via-protomaps-licence-odbl).

## Meaning search model and engine — Apache 2.0 and MIT (added 2026-10-07)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#meaning-search-model-and-engine--apache-20-and-mit-added-2026-10-07).

## Testimonies world map outlines — Natural Earth, public domain (added 2026-10-07)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#testimonies-world-map-outlines--natural-earth-public-domain-added-2026-10-07).

## Resources USA map outline — Natural Earth, public domain (added 2026-10-08)

| File | What | Licence | Checksum |
|---|---|---|---|
| [ne_50m_admin_1_states_provinces_lakes.geojson](../sources/natural-earth/ne_50m_admin_1_states_provinces_lakes.geojson) | **Natural Earth** 1:50m admin-1 states and provinces (with lakes), v5.1.2, downloaded 2026-10-08 from the Natural Earth repository (`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_1_states_provinces_lakes.geojson`). Only the 50 US states and DC are kept; [scripts/build-us-states.mjs](scripts/build-us-states.mjs) checks the checksum and pre-draws them on an Albers USA projection into [src/data/resources/us-states.json](src/data/resources/us-states.json), the outline of the USA map on [/resources/life](https://bibleproject.io/resources/life) | **Public domain** ([terms](https://www.naturalearthdata.com/about/terms-of-use/)); credit Natural Earth | sha256 b92c3f709b691240 |

## Study resources — downloaded 2026-10-03 for the Study pages (TODO section G)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#study-resources--downloaded-2026-10-03-for-the-study-pages-todo-section-g).

## Reference library — downloaded 2026-10-07 (owner: "let's get everything")

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#reference-library--downloaded-2026-10-07-owner-lets-get-everything).

## Four Gospel portraits (2026-10-04)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#four-gospel-portraits-2026-10-04).

## Christian library collection desk (2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#christian-library-collection-desk-2026-10-05).

## Spurgeon published sermons acquired 2026-10-05

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#spurgeon-published-sermons-acquired-2026-10-05).

## Modern preaching source inventory (L04, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#modern-preaching-source-inventory-l04-2026-10-05).

## Sermon coverage research (L05, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#sermon-coverage-research-l05-2026-10-05).

## Commentary and biblical-theology collection (L06, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#commentary-and-biblical-theology-collection-l06-2026-10-05).

## Doctrinal collection (L07, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#doctrinal-collection-l07-2026-10-05).

## Historical standards (L08, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#historical-standards-l08-2026-10-05).

## Christianity and Islam collection (L10, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#christianity-and-islam-collection-l10-2026-10-05).

## Historical lives and missionary testimony (L13, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#historical-lives-and-missionary-testimony-l13-2026-10-05).

## Church, preaching and missions (L12, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#church-preaching-and-missions-l12-2026-10-05).

## Modern sermon text acquisition (2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#modern-sermon-text-acquisition-2026-10-05).

## Annotated study paths (L14, 2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#annotated-study-paths-l14-2026-10-05).

## Ordinary-print OCR and font repair (2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#ordinary-print-ocr-and-font-repair-2026-10-05).

## Historical collection-level ready text (2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#historical-collection-level-ready-text-2026-10-05).

## Considered and left out

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#considered-and-left-out).

## L11 pastoral care — text-first acquisition (2026-10-05)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#l11-pastoral-care--text-first-acquisition-2026-10-05).

## RB01 Baptist doctrinal and confessional acquisition (2026-10-07)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb01-baptist-doctrinal-and-confessional-acquisition-2026-10-07).

## 2026-10-07: RB02 Baptist covenants and ordinances

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#2026-10-07-rb02-baptist-covenants-and-ordinances).

## RB03: sustained commentary gaps (7 October 2026)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb03-sustained-commentary-gaps-7-october-2026).

## RB04: salvation, justification, assurance and sanctification (7 October 2026)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb04-salvation-justification-assurance-and-sanctification-7-october-2026).

## RB05: church membership, polity, discipline and ministry (7 October 2026)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb05-church-membership-polity-discipline-and-ministry-7-october-2026).

## RB06 pastoral care, prayer and households - 2026-10-07

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb06-pastoral-care-prayer-and-households---2026-10-07).

## RB07: Baptist missions, evangelical proclamation and historical witnesses (7 October 2026)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb07-baptist-missions-evangelical-proclamation-and-historical-witnesses-7-october-2026).

## RB08: Scripture authority, canon and focused apologetics (7 October 2026)

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb08-scripture-authority-canon-and-focused-apologetics-7-october-2026).

## RB00 shared bulk acquisition channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb00-shared-bulk-acquisition-channels).

## RB01 re-run: Baptist doctrine and confessions ? bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb01-re-run-baptist-doctrine-and-confessions--bulk-channels).

## RB02 re-run: covenants, baptism and ordinances - bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb02-re-run-covenants-baptism-and-ordinances---bulk-channels).

## RB03 re-run: commentaries - bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb03-re-run-commentaries---bulk-channels).

## RB04 re-run: salvation, justification, assurance and sanctification

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb04-re-run-salvation-justification-assurance-and-sanctification).

## RB09 re-run: interpreting genres and difficult passages - bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb09-re-run-interpreting-genres-and-difficult-passages---bulk-channels).

## RB10 re-run: Christian ethics - bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb10-re-run-christian-ethics---bulk-channels).

## RB13: catechisms, children, families and new believers - bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb13-catechisms-children-families-and-new-believers---bulk-channels).

## RB11 re-run: Prayer and worship - bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb11-re-run-prayer-and-worship---bulk-channels).

## RB12 re-run: Baptist history and primary records

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb12-re-run-baptist-history-and-primary-records).

## RB06 re-run: Christian life, prayer, family and pastoral care

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb06-re-run-christian-life-prayer-family-and-pastoral-care).

## RB05 re-run: church, polity, discipline and ministry

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb05-re-run-church-polity-discipline-and-ministry).

## RB14: authorized translations

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb14-authorized-translations).

## RB07 re-run: Missions, preaching and history

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb07-re-run-missions-preaching-and-history).

## RB08 re-run: Scripture authority and apologetics - bulk channels

[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#rb08-re-run-scripture-authority-and-apologetics---bulk-channels).


## Teachers pages — library catalogue, Natural Earth outlines, checked facts (added 2026-10-08)

The two Teachers subpages ([/teachers/preachers-and-authors](https://bibleproject.io/teachers/preachers-and-authors), [/teachers/scholars](https://bibleproject.io/teachers/scholars)) are built by [scripts/build-teacher-pages.ts](scripts/build-teacher-pages.ts) into [src/data/teachers/](src/data/teachers/) from:

| Source | Used for | Licence / terms |
|---|---|---|
| The Christian library catalogue ([content/library/](content/library/)): works, editions, assets, author registry, publication list | Works per person, genres, the Bible passage each work takes as its main text, Spurgeon's delivery dates, and the address where each work can be read. Every "Read ↗" link opens the work at its original host (Spurgeon Gems, CCEL, Internet Archive, Desiring God, Truth For Life, Ligonier and others); nothing is re-hosted. | As recorded per source in this file and in the catalogue |
| [content/teachers/lives.json](content/teachers/lives.json) and [content/teachers/scholars.json](content/teachers/scholars.json) | Life years, places with arrival years, one-line descriptions, best-known works, the documented teacher/colleague links, the scholars' faith labels and fields, the seven discoveries and the chain of the text. Written for the site, then fact-checked on 2026-10-08 against Wikipedia, Britannica, the Stanford Encyclopedia of Philosophy and other references; 17 errors corrected. | Site content (MIT with the code) |
| **Natural Earth** land outlines (1:50m and 1:110m) via the `world-atlas` 2.0.2 package | The maps on both pages, projected at build time. The Dead Sea and Sea of Galilee outlines are simplified shapes drawn for the site. | **Public domain** ([terms](https://www.naturalearthdata.com/about/terms-of-use/)); credit Natural Earth |
| [data/stats.json](data/stats.json) (the site's KJV book and chapter lengths) | The 1,189 chapter squares and the 66 book spokes | Public domain text |

## OpenGreekAndLatin — Corpus Scriptorum Ecclesiasticorum Latinorum (CSEL)

[Official repository](https://github.com/OpenGreekAndLatin/csel-dev), acquired 2026-10-09 at commit `2813e3a52b4206df0324299e5110e5bd0d95cee4`: historical Latin ecclesiastical texts in machine-corrected EpiDoc/TEI XML. The 271 work-level text headers explicitly specify [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); original editors, digital contributors, publishers, source-scan links, CTS identifiers and licence notices are retained in the XML and [acquisition manifest](content/library/reports/csel-20261009/acquisition-manifest.json). New work XML is held under `sources/library/source-ogl-csel/data` for private local intake. The complete upstream payload, including 81 volume-level XML texts, images and support files, is preserved under `sources/ogl-csel/repository`; these overlapping volumes and support assets are outside body intake. This historical subset does not contain every edition in the supplied CSEL bibliography through volume 107. No new OCR was performed; upstream transcription quality is not represented as fully proofread. [Holdings comparison and acquisition report](content/library/reports/csel-20261009/REPORT.md). No public full-text publication is authorized by this acquisition.

**Local older-release supplement (2026-10-10):** The owner supplied release directory csel-dev-v1.0/OpenGreekAndLatin-csel-dev-a485395. Ten additional CTS edition IDs are staged, preserving CC BY-SA 4.0 notices and upstream credits; 265 matching edition IDs and one exact-hash repository file are reused. Older bytes are not claimed equal to newer editions. New support files are archived outside body intake. [Local-download manifest](content/library/reports/local-downloads-20261010/acquisition-manifest.json).

## OpenGreekAndLatin — First Thousand Years of Greek

[Official First1KGreek repository](https://github.com/OpenGreekAndLatin/First1KGreek), acquired 2026-10-09 through its Git bulk channel. Ancient Greek literature, including biblical and patristic authors, with Latin and other-language editions where offered; original EpiDoc/TEI texts and CTS metadata are preserved. Repository licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); individual header notices, source editions, editors and digital contributors remain authoritative metadata. The full checkout is held under `sources/patristic-bulk/first1k/repository`; readable work XML is staged under `sources/library/source-patristic-first1k`, with local catalogues and exact-hash reuse. No new OCR is performed, and transcription quality is not represented as uniformly proofread. [Commit-pinned provenance, manifest and acquisition report](content/library/reports/patristic-expansion-20261009/REPORT.md). Private local intake only; public full-text publication requires a separate decision.

## Patristic Text Archive

[Official PTA data repository](https://github.com/PatristicTextArchive/pta_data) and [project](https://pta.bbaw.de/), acquired 2026-10-09 from the public Git branch. Ancient Christian source editions and translations, including biblical material, in TEI XML. Individual files carry different Creative Commons licences, including attribution, share-alike and noncommercial variants; exact licence URLs and statements are retained alongside editors, translators and contributors. Original `data` texts are used for private local study and embedding; duplicate tokenized/analyzed versions and support metadata remain in the archive under `sources/patristic-bulk/pta/repository`. Ready originals are under `sources/library/source-patristic-pta`. [Commit-pinned provenance, manifest and acquisition report](content/library/reports/patristic-expansion-20261009/REPORT.md). No new OCR or public full-text publication is performed.

## OpenGreekAndLatin — Greek Fathers' New Testament catenae

[Official catenae-dev repository](https://github.com/OpenGreekAndLatin/catenae-dev), acquired 2026-10-09 through its Git bulk channel. Eight XML volumes of *Catenae Graecorum Patrum in Novum Testamentum*, with Greek commentary and Latin editorial material. TEI headers explicitly specify [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); John Anthony Cramer's printed editions, source-scan links and digital contributors are retained. The full checkout is under `sources/patristic-bulk/catenae/repository`; readable originals are staged under `sources/library/source-patristic-catenae`. [Commit-pinned provenance, manifest and acquisition report](content/library/reports/patristic-expansion-20261009/REPORT.md). Existing upstream transcription is reused without new OCR; private local intake only, with any public full-text publication requiring a separate decision.


## Muslim-world country explorer (2026-10-09)

The Islam collection's rotating country globe uses a bundled, attributed snapshot of demographic and people-group facts. [Data, definitions and refresh procedure](content/missions/README.md). [Checksums and byte counts](content/missions/source-manifest.json). Immutable original inputs are held at `../sources/missions/muslim-world/2026-10-09`; raw Pew application code and the full IMB input are not served by the site.

| Source | Licence / terms | Use |
|---|---|---|
| [Pew Research Center: Religious Composition by Country, 2010–2020](https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/), public interactive dataset, published 2025 | [Pew terms](https://www.pewresearch.org/about/terms-and-conditions/); attributed statistical facts, not re-hosted narrative or interactive code | Select 53 places above 50% Muslim identification in 2020; display dated population estimates and rounded religious shares |
| [IMB Global Research / People Group Points](https://www.arcgis.com/home/item.html?id=4480316ef90c467ba30517809180c536), public `imbGIS` service, CaptureDate 2026-10-09 | Source item links [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/); retain attribution, licence link and the notice of aggregation | Sum active records by country and published Engagement Progress category; show three largest group examples and link to profiles. All religions are included; no individual-level location records are published |
| [NASA Blue Marble Next Generation via GIBS](https://gibs.earthdata.nasa.gov/), global equirectangular request | Public-domain NASA Earth imagery; credit NASA | Textured orthographic sphere, tinted for the site's themes. [Exact request and asset provenance](public/assets/muslim-world/README.md) |
| Natural Earth country boundaries, `world-atlas@2.0.2`, 1:50m | [Public domain](https://www.naturalearthdata.com/about/terms-of-use/) | Country outlines, selection and geographic centres; Mayotte's island polygons extracted from France's multipart geometry |

The globe adapts the owner's `design/apostle-directions-2/js/globe.js` mock. The demographic year (2020) and IMB snapshot date are shown separately. "No longer unreached" is IMB's people-group category, not a judgement about every person or a country-wide completion status.

### Muslim-world globe display optimization — 2026-10-09

Natural Earth 1:110m (`world-atlas@2.0.2`, public domain) is archived alongside the original 1:50m input; worldwide land is merged, with country outlines retained only at >=20% Muslim identification in the archived Pew 2020 estimates. The NASA original remains unchanged; the display texture is resized to 2048×1024 WebP. Both derivatives retain the original source licensing and attribution. Build scripts and transformations: [globe provenance](public/assets/muslim-world/README.md). Updated input and derivative checksums: [source manifest](content/missions/source-manifest.json). Local measurements: [performance notes](content/missions/README.md#local-performance-measurement--2026-10-09).

## Muslim-world outline globe — 2026-10-09

The current Islam atlas uses one Canvas 2D surface with Natural Earth coastlines and country outlines; no new source data was acquired. Existing atlas.json SHA-256 `a758fa13594085a305df1faf99644b4c4613c8b4ee18b7e1e5bab6c44756d6e3` and public-domain attribution remain in the display README and missions manifest. NASA earth.webp is retired from served assets; its hash/transformation remain in retiredDisplayDerivatives, with the immutable NASA original retained unchanged. See content/missions/README.md for fixed-circle 1–8× zoom, mobile idle behavior and measured performance.

## Muslim-world flat SVG view — 2026-10-09

The optional flat map derives its SVG coastlines and country borders from the existing atlas.json (SHA-256 `a758fa13594085a305df1faf99644b4c4613c8b4ee18b7e1e5bab6c44756d6e3`, Natural Earth public domain). No new external input was acquired. Globe and flat views share the same country facts and cached geometry; a vertical pair of view icons changes renderers. See content/missions/README.md and public/assets/muslim-world/README.md for interaction and provenance.

## Muslim-world country flags and complete IMB tables — 2026-10-09

Country flags: [lipis/flag-icons](https://github.com/lipis/flag-icons), pinned revision `086f7e97d657358203916dbe84f61c2bccaa81eb`, [MIT license](https://github.com/lipis/flag-icons/blob/086f7e97d657358203916dbe84f61c2bccaa81eb/LICENSE). Immutable originals and license are archived under `sources/missions/muslim-world/flag-icons-086f7e97d657358203916dbe84f61c2bccaa81eb/`. The 53 unmodified 4:3 SVGs are renamed to atlas country codes in `public/assets/muslim-world/flags/`, with the license. `content/missions/flag-manifest.json` records every source URL, byte count and SHA-256, plus license hash `8f1195d55a2fd315a07d812328470ca9ba2abb78c8d317ff19619d5125e00cea`. Builder: `scripts/build-muslim-world-flags.py`. Mayotte uses France's tricolour; flags do not determine disputed territorial status.

Complete group tables: 53 lazy country JSON derivatives under `public/assets/muslim-world/people-groups/`, built from the previously archived IMB snapshot `sources/missions/muslim-world/2026-10-09/imb-country-input.json`, SHA-256 `90cc30b356e1515878bd8136eecb6bea87eea2b94ba477432490598388d1833f`, under CC BY-NC 4.0. Every active group in the selected countries is retained with unchanged name, language, religion, population and the published EngagementProgress category, ordered by population. This includes non-Muslim groups. `content/missions/people-group-manifest.json` records the original input hash and per-country derivative hashes, sizes and counts. Only the selected country table is requested when its tab opens; source attribution remains visible. Builder: `scripts/build-muslim-world.py`. No immutable originals were modified.


## Bible Project authored learning materials

Owner-provided PDF export, Moses: Three forties, an eight-session Bible Project site-authored workbook with KJV quotations. Original title, source statements and study questions are retained for private local indexing; counted as learning material, not an acquired book. No outside author or licence is invented. [Local-download manifest](content/library/reports/local-downloads-20261010/acquisition-manifest.json).

## Quran JSON by Risan: Pickthall comparison text

[Official dataset](https://quran-json.risanb.com/) and [held English edition channel](https://quran-json.risanb.com/translations/en-pickthall/quran.json). Marmaduke Pickthall, The Meaning of the Glorious Koran (1930); the held translation index identifies this translation as public domain. Dataset packaging is CC BY-SA 4.0; upstream licence is retained in public/basis/QURAN-DATA-LICENSE.txt. The website indexes the held text by chapter and verse without rewriting it, credits Risan, and labels it as a comparison source, not a Christian teaching authority. [Reading-asset manifest](content/teachers/reading-assets-manifest.json) records the derivative hash, format, language and attribution. No other translations are implied to have the same rights.

## Debate transcripts and YouTube recordings — 2026-10-11

Nine debate pages link to external transcripts and matching YouTube recordings. Six new source documents cover Lennox–Dawkins, Bahnsen–Stein, Craig–Ehrman, Craig–Krauss, Craig–Grayling and Lennox–Shermer. Transcript publishers: The Singju Post, Justin Holcomb's hosted PDF, Reasonable Faith and bethinking.org. Uploader names, runtimes, source URLs and coverage notes are in [the media manifest](docs/debate-media-2026-10-11.json).

Rights: no redistribution licence assumed; external linking and site-authored summaries only. No complete external transcript body, audio or video is copied into public assets. Checksum of the authored metadata manifest: SHA-256 `07b3a349d38bccd832a9ab9571ed6717a104e1b8e3213329e93d9cedc41b27e9`; no source-body checksum is claimed. A nine-minute Concept of God excerpt was rejected in favour of the 91-minute recording. Metadata verification does not certify recording completeness or transcript accuracy.

## Manuscripts mock-up: five more open sources — registered 18 October 2026 (local preview only; nothing published)

The Manuscripts mock-up ([design/manuscripts-directions/](design/manuscripts-directions/)) is built by
[build-data.py](design/manuscripts-directions/build-data.py) from the open catalogue corpus
[Research/Manuscripts/](../Research/Manuscripts/). On 18 October 2026 the owner approved five more open sources for that
corpus; they are listed here because the mock-up now reads them. **Nothing here has been deployed.** Every downloaded file
keeps its URL, size and SHA-256 in the corpus ([MANIFEST.md](../Research/Manuscripts/MANIFEST.md),
[manifest.json](../Research/Manuscripts/manifest.json), `checksums/<source>.sha256`). The "checksum" column is a SHA-256
over that source's sorted checksum lines, so a whole source can be re-verified in one value; the main file's own hash
follows it. The corpus's all-rights-reserved CSNTM file is never read by the mock-up.

| Source | What was taken | Licence and credit | Files / bytes | Checksum | Planned use |
|---|---|---|---|---|---|
| [English Wikipedia, "List of manuscripts from Qumran Cave 1" to "Cave 11"](https://en.wikipedia.org/wiki/List_of_manuscripts_from_Qumran_Cave_1), retrieved 2026-10-18 | The eleven pages' wikitext through the MediaWiki API with revision ids; the Date/script cell of 415 table rows, matched to the ETCBC scrolls by siglum (370 matched, 89%) | **CC BY-SA 4.0 — credit and share-alike.** Credit: *English Wikipedia contributors*; page title and revision id on every record | 13 / 426,928 | `a1475fb06ce30d1d` | A scroll's date where nothing better exists: the period of its script (Herodian, Hasmonean...) read as a span of years, the source's own words shown beside it |
| [English Wikipedia, "Carbon dating the Dead Sea Scrolls"](https://en.wikipedia.org/wiki/Carbon_dating_the_Dead_Sea_Scrolls), retrieved 2026-10-18 | The table of 24 radiocarbon samples (1991 Zurich and 1994–95 Tucson), 2-sigma calibrated ranges; 17 scrolls matched | **CC BY-SA 4.0 — credit and share-alike.** Credit: *English Wikipedia contributors*, revision id recorded | 3 / 22,185 | `3b8017501735a15b` · page `94a3e2804f783108` | Radiocarbon dates for the scrolls tested in the 1990s |
| [Popović et al. 2025, "Dating ancient manuscripts using radiocarbon and AI-based writing style analysis", PLOS ONE 20(6): e0323185](https://doi.org/10.1371/journal.pone.0323185), retrieved 2026-10-18 | The article XML (for its licence statement) and two appendices: S12 (26 radiocarbon samples with 2-sigma ranges and the published palaeographic estimates) and S7 Table S11 (the Enoch AI estimate and the palaeographers' range for 135 manuscripts); 149 of 156 sigla matched. The Zenodo data files were **not** taken: their in-file notice reserves all rights | **CC BY 4.0 — credit.** Credit: *Popović M., Dhali M.A., Schomaker L., van der Plicht J., Lund Rasmussen K., La Nasa J., Degano I., Colombini M.P., Tigchelaar E. (2025), PLOS ONE e0323185* | 5 / 5,053,250 | `c938b7a32c759eb6` · S7 `a4e49f7fb1c78915` · S12 `27d4cc5b6b2439b9` | Radiocarbon, palaeographic and AI dates for the scrolls, each kept as its own claim; the page shows one, chosen by a stated rule (radiocarbon, then palaeography, then AI, then Wikipedia's period), and says which and from how many |
| [Wikidata](https://query.wikidata.org/) (and English Wikipedia articles where a new item has one), retrieved 2026-10-18 | 721 more biblical manuscripts by language: Latin 354, Hebrew 228, Church Slavonic 69, Armenian 57, Arabic 19, Georgian 10, Samaritan 3, Gothic 1 (already held), found by language and a stated keep/exclude rule; commentaries, Mishneh Torah, liturgy, Qur'ans and other non-biblical works excluded, each exclusion recorded with its reason. 49 more Wikipedia articles read | Wikidata **CC0 1.0**; Wikipedia details **CC BY-SA 4.0**, credited per record | 224 / 19,706,032 (all Wikidata responses held, old and new) | `967ce428c66dad7b` | New lanes and kinds: Arabic, Church Slavonic, Samaritan; more Hebrew, Latin, Armenian and Georgian copies |
| [Syriaca.org manuscripts, github.com/srophe/manuscripts](https://github.com/srophe/manuscripts/tree/master-2016), branch master-2016 at commit `7d2c65bae449`, retrieved 2026-10-18 | One zip of the branch, read without unpacking; 438 distinct records after removing the repository's duplicate copies; 194 kept as biblical (Bible books, Gospels, Epistles, Psalms, lectionaries of Scripture; commentaries, homilies and liturgies excluded). Mostly the British Library's Syriac manuscripts after Wright's catalogue | **CC BY 3.0 — credit.** Credit: *Syriaca.org: The Syriac Reference Portal (ed. David A. Michelson et al.), after William Wright's Catalogue of the Syriac Manuscripts in the British Museum* | 3 / 5,637,478 | `b768ef08018b9d2b` · zip `95f540090edc5bc4` | The Syriac lane and catalogue: date, holder, shelfmark and books for each manuscript |

**The scrolls' dates are claims, not one value.** The corpus keeps every claim on the scroll with its source and method;
the mock-up shows the chosen one and credits its source in the record sheet. 439 of the 955 scroll manuscripts now have
a date; most are script-period spans rather than measurements, and the record says so.

## Manuscripts page — registered 18 October 2026 (local preview only; nothing published)

The page [/study/manuscripts](src/pages/study/manuscripts/) is built from the open catalogue corpus
[Research/Manuscripts/](../Research/Manuscripts/) by [scripts/build-manuscripts.py](scripts/build-manuscripts.py) (`bun run manuscripts`),
with the record rules of the owner-approved mock-up ([design/manuscripts-directions/](design/manuscripts-directions/)), into
`data/manuscripts/collection.json` (git-ignored) and the 29 pictures under
[public/images/manuscripts/](public/images/manuscripts/) (committed, with a per-picture
[manifest.json](public/images/manuscripts/manifest.json): licence, credit, Commons page and the SHA-256 of the original). The
corpus's all-rights-reserved CSNTM file is never read. The five sources registered in the block above (Wikipedia's Qumran
lists and radiocarbon table, Popović et al. 2025, the 2026-10-18 Wikidata additions and Syriaca.org) are read the same way.
Every downloaded file keeps its URL, size and SHA-256 in the corpus ([MANIFEST.md](../Research/Manuscripts/MANIFEST.md)).
**Nothing here has been deployed.**

| Source | What the page reads | Licence and credit | Bytes | SHA-256 (prefix) |
|---|---|---|---|---|
| [Wikidata](https://www.wikidata.org/), via the corpus's `normalized/manuscripts/wikidata.json` | Catalogue records: siglum, date, material, contents as the catalogue words them, holder and shelfmark | **CC0 1.0** | 12,107,557 | `7c4218edfbaa9a83` |
| [English Wikipedia](https://en.wikipedia.org/), carried in the same file | Dates, materials and contents for the records that have an article; each record links its article by revision | **CC BY-SA 4.0 — credit and share-alike.** Credit: *English Wikipedia contributors*, linked per record | (in the above) | — |
| [ETCBC Dead Sea Scrolls](https://github.com/ETCBC/dss), via `normalized/manuscripts/etcbc-dss.json` | 954 Judaean Desert manuscripts: siglum, find site, books, fragments and lines | **CC BY-NC 4.0 — non-commercial.** Credit: *transcriptions by Martin G. Abegg, Jr., James E. Bowley and Edward M. Cook; Text-Fabric conversion by Jarod Jacobs, Martijn Naaijer and Dirk Roorda* | 3,585,139 | `63888ac10178bc8e` |
| [Syriaca.org](https://syriaca.org/), via `normalized/manuscripts/syriaca.json` | 194 Syriac biblical manuscripts | **CC BY 3.0.** Credit as in the block above | 625,118 | `0627cf1c31bd1b46` |
| The corpus's pinned identities, `tools/wikidata-pinned.json` | The tradition and, for five witnesses, the date of named non-Greek witnesses whose records lack them; each such date is marked "from the note" | The corpus's own research, from Wikidata (CC0) | 20,371 | `4f02b305fa23c2cd` |
| [Wikimedia Commons](https://commons.wikimedia.org/), via `raw/commons/_harvest.json` and `images/` | 29 pictures, resized to 560 px; 28 public domain, 1 CC BY 4.0 (Codex Argenteus, Magnus Hjalmarsson) | **Per picture**, shown under each picture with its author and Commons page | 25,188 (index) | `c3440f929492e7a8` |
| [Natural Earth](https://www.naturalearthdata.com/) 1:50m land, via the `world-atlas` 2.0.2 package already in `node_modules` | The land outline of the "Where are they now?" map, cut to the American east coast, Europe and the Near East | **Public domain** ([terms](https://www.naturalearthdata.com/about/terms-of-use/)); credit Natural Earth | 545,534 | `619477ff690c0868` |

**Editorial, and labelled as such on the page:** when each New Testament book was written (wide approximate ranges) and
the city and coordinates of each holder, both in [scripts/manuscripts/ms_tables.py](scripts/manuscripts/ms_tables.py). The
coverage percentages compare against the approximate Kurzgefasste Liste totals given in the corpus MANIFEST.
