# Notice: data and its licences

The code in this repository is MIT-licensed (see [LICENSE](LICENSE)). The data it downloads and displays is not
the project's own, and keeps its publisher's terms. Full list, with checksums: [SOURCES.md](SOURCES.md).

| Data | Licence | What you must do if you reuse it |
|---|---|---|
| Every Bible text except the Hindi IRV (eBible.org) | Public domain | Nothing. Note that the King James Version is under a perpetual Crown patent in the United Kingdom. |
| Hindi: Indian Revised Version (IRV) Hindi 2019, © 2017, 2018, 2019 Bridge Connectivity Solutions, via eBible.org | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Credit it as written here, link the licence and the source (https://ebible.org/details.php?id=hin2017), and share any adaptation under CC BY-SA 4.0. Changes made here: converted from USFM to this site's JSON, book introductions omitted; the Bible text is otherwise unchanged. The generated files `data/text/irv/` and `data/plain/irv/` are under CC BY-SA 4.0, not MIT. |
| Cross-references and Bible places (OpenBible.info) | CC-BY / CC BY 4.0 | Credit "OpenBible.info" |
| Proper names (STEP Bible, TIPNR) | CC BY 4.0 | Credit "STEP Bible" with a link to www.STEPBible.org |
| The tagged Hebrew Old Testament and Greek New Testament, the Hebrew and Greek lexicons, the full Liddell-Scott-Jones, the verse-numbering traditions and the grammar-code explanations (STEP Bible: TAHOT, TAGNT, TBESH, TBESG, TFLSJ, TVTMS, TEHMC, TEGMC) | CC BY 4.0 | Credit "STEP Bible" with a link to www.STEPBible.org. STEP also asks that you point people at github.com/STEPBible rather than hand the raw files on yourself, so this project downloads them and does not republish them. Two parts carry an extra condition: the long Hebrew and Greek *definitions* in TBESH/TBESG come from the Abridged BDB © Online Bible and need Online Bible's permission before they are shown, and TFLSJ uses Mounce's Teknia dictionary by permission where Abbott-Smith and Middle Liddell have no entry. The short Tyndale glosses, the grammar tags and the verse-numbering tables carry no such condition. |
| Robertson, *A Harmony of the Gospels* (1922; Project Gutenberg) | Public domain in the US | Nothing (Project Gutenberg's licence covers its file, not the facts used here) |
| Torrey, *The New Topical Text Book* (1897; CCEL edition) | Book public domain | Only facts (topics, references) are used, not CCEL's markup |
| Names of God list | The site owner's own selection, drawn from Torrey and Scripture | Free to use with the rest of this project |
| Satellite imagery (NASA Blue Marble Next Generation, via GIBS) | Public domain | Credit "NASA" is appreciated |
| Coastlines (Natural Earth, via world-atlas) | Public domain | Nothing |
| Fonts: Literata, Archivo, Noto Serif Hebrew | SIL Open Font License | Keep the licence with the font files |

The Westminster Leningrad Codex's words are public domain. Its word-by-word grammar tags are CC BY-SA, so the
build drops them.
