# Christianity and Islam — L10 collection

Verified 2026-10-05. This selected-source batch contains **13 primary holdings, 21 indexed chapters/lectures, three acquired historical PDFs, nine question maps and five collated translation excerpts**. Ten primary holdings are source links only. No whole work has been promoted to reviewed teaching, and none of this batch has been published on the website.

Start with [the nine question maps](QUESTIONS.md): God, Trinity, Christ, crucifixion, resurrection, Scripture, revelation, salvation and prophethood. Each includes both positions, premises, a serious objection, a Christian response, precise source locators, Scripture anchors and remaining uncertainties. These are editorial reconstructions, not invented quotations or debate transcripts. Christian conviction and accurate representation of the other position belong together. [Structured data](questions.json) preserves the same comparisons for later integration.

## What was gathered

| Holding | Form and identity | Access / review |
|---|---|---|
| Samuel M. Zwemer, *The Moslem Doctrine of God* | American Tract Society, copyright 1905; eight chapters | PDF acquired; title/copyright/contents visually checked; preface and selected passages inspected |
| Zwemer, *The Moslem Christ* | Undated American Tract Society impression; eight chapters | PDF acquired under the host’s reading/download offer; date and republication rights unresolved |
| Zwemer, *The Disintegration of Islam* | Five missionary lectures; Princeton delivery October 1915; acquired impression copyright 1916 | PDF acquired and contents indexed; **historical context**, not a present-day prediction |
| James R. White, *What Every Christian Needs to Know About the Qur’an* | Bethany House, 2013; ISBN 9780764209765 | Publisher link; chapter inventory and full text not acquired |
| White / Shabir Ally, *Did Jesus Claim Deity?* | Toronto, March 22, 2012 | Official event page exposes named video and embedded player; playback/completeness unverified |
| White / Ally, *Sin and Salvation* | Erasmia, October 7, 2013 | Official event listing; current recording availability and duration unverified |
| White / Yusuf Bux, *Trinity and Tawhid* | Johannesburg, October 4, 2013 | Official event listing; source spells title “Tawid” and tag “Tux”; heading identifies Bux |
| White / Zakir Hussain, *Is Muhammad Prophesied in the Bible?* | London, September 17, 2012 | Official event listing; recording body unviewed |
| White / Adnan Rashid, *Bible or the Quran?* | Dublin, February 26, 2013 | Heading names Trinity College; URL says University College; institution unresolved |
| White, *Opening and Closing Statements: Shabir Ally Debate* | Published October 25, 2007; author-side statements for the Seattle exchange | Text consulted; **not the complete debate transcript** |
| White, *A Quick Report from Canada* | March 23, 2012 participant report | Selected argument inspected; paired with Ally’s response |
| John Piper, *The Great Offense: Was Jesus Really Crucified?* | Site displays January 1, 1994; current footnote cites access November 26, 2003 | Text consulted; revision history unresolved; authorized destination only |
| Shabir Ally, *Did Jesus Claim Deity? My Reflections on the Ally-White Debate* | Attributed reflection, March 27, 2012; posted by nazam44 | **Contextual Muslim argument**; byline observed, personal blog control and live-exchange recollections not independently authenticated |

Full bibliographic links, edition IDs and chapter starts are in [inventory.json](inventory.json). The acquisition bibliography was written before downloading; its initial year leads are preserved as leads, with scan findings taking precedence in the canonical editions. In particular, do not assign 1912 to the undated *Moslem Christ* impression or confuse the 1915 lectures with the 1916 copyright.

## Source and theological distinctions

White passes **initial eligible-author screening** on his Reformed Baptist self-identification and publisher/institutional reception; this is the registry’s `eligible` status, not human approval of every statement. Zwemer’s Reformed ministry and theological commitments meet the same initial screening. Piper was already eligible. Muslim debate participants are `context-only`; Ally’s article is `opposing-position`. Mixed-speaker debates are `historical-context`, so their Muslim contributions cannot accidentally become recommended Christian teaching.

The five modern debates have **zero body-reviewed recordings**, no verified durations and no timestamped claims. Preference for complete exchanges is recorded in the review queue; an official event listing is not proof that a playable rendition contains every round. No clip has been represented as a complete debate. Coverage is strongest in source identity and textual comparison, and weaker in modern lectures, historical corroboration and rendition-level debate review.

The contextual Qur’anic evidence is linked by surah and verse with named translation. It is not a newly ingested translation corpus. [The quotation audit](quotation-audit.json) collates five short English excerpts at 4:157, 4:171 and 112:3 against the named translators in the [Quranic Arabic Corpus](https://corpus.quran.com/translation.jsp?chapter=4&verse=157). It explicitly preserves supplied brackets and distinguishes literal wording from interpretive translation. English collation is not independent Arabic philological certification.

Historical missionary vocabulary is retained in source titles for fidelity. Zwemer’s characterizations of Islamic life, politics and doctrine remain his historical claims. The tradition narratives in *The Moslem Christ* must not be cited as though all occur in the Qur’an. Current Muslim beliefs require their own contextual sources.

## Findings that affect later teaching

- Qur’an 5:116 names Jesus and Mary as objects of deification; it does not explicitly define the Christian Trinity as God, Jesus and Mary. The Trinity map addresses the actual Christian doctrine and the stronger Muslim objection to any divine Son.
- Ally acknowledges high Christology in the Gospels and argues for development; a reply must address that argument, not claim he sees no high Christology. His fourth parallel cites Mark 3:31 / Matthew 12:46, the beginnings of episodes; the relevant sayings are Mark 3:35 / Matthew 12:50. His citations of Bruce and Bauckham still need original-source checking.
- Crucifixion as an event, its saving significance, resurrection after death and being raised to God are distinct claims. The maps keep them separate.
- Muslim salvation is represented with mercy, repentance and the Qur’anic warning about association with God. “Works with no grace or mercy” would misrepresent the selected evidence.
- White’s Ignatius quotation and Piper’s Tacitus quotation remain secondhand in this batch. Precise original-edition verification is queued; no historical consensus or conclusive proof is inferred merely from an apologist’s assertion.

## Rights, storage and reproducibility

Three original PDFs, **22,060,863 bytes**, are retained unchanged under `BibleProject/sources/library/source-zwemer-center/`; their SHA-256 values and retrieval metadata are in [acquisition-manifest.json](acquisition-manifest.json). Two identified historic texts have a scoped U.S. public-domain assessment. The undated scan has only the host’s explicit reading/download permission recorded; public reuse remains unresolved. Modern text, media and translation records remain links; private verification HTML is not a public full-text collection.

[Desiring God’s policy](https://www.desiringgod.org/permissions) permits specified excerpts/embeds under conditions, not blanket text republication. No media was downloaded or transcribed. AOMin’s robots endpoint returned 404 and the conservative script skipped acquisition; this is recorded as unresolved access policy, not a prohibition. The Corpus robots endpoint redirected to HTML, which is not a valid robots policy. The acquisition script now rejects that response; the three bounded research snapshots are retained as evidence, not as authorization for further retrieval.

Rebuild offline from Website:

```text
D:/Python/python.exe -X utf8 scripts/catalog-islam-studies.py
D:/Python/python.exe -X utf8 scripts/index-islam-questions.py
D:/Python/python.exe -X utf8 -m unittest discover -s scripts -p test_islam_studies.py
node scripts/validate-library.mjs
```

Checks cover file hashes, canonical links, author/role boundaries, all nine topics, actual retained quotation wording, edition dates, page starts and the absence of invented media review. [The checkpoint](checkpoint.json) gives the next review/acquisition actions. [The app crosswalk](app-crosswalk.json) points to existing guides without altering their publication state; the Craig–Ally records remain contextual and do not make Craig an eligible core author.

The batch is concentrated on White, Zwemer and Piper. It is a usable foundation, not an exhaustive collection of Christian–Muslim apologetics. Full debate review, wider eligible authors, modern lectures, complete translation verification and public integration remain explicit work.
