"""Publish RB06 metadata and concern routes; private source bodies stay local."""
import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB06'


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def write(name, value):
    text = json.dumps(value, ensure_ascii=False, indent=2) if not isinstance(value, str) else value.rstrip()
    (R / name).write_text(text + '\n', encoding='utf-8', newline='\n')


def main():
    works = read('chapter-map.json')['works']
    by = {w['assetId']: w for w in works}
    new = read('acquisition-manifest.json')['files']
    work_ids = {w['workId']: w['assetId'] for w in works if w['status'] == 'new-witness'}
    cr = work_ids['work-rb06-cripplegate-vol2']
    fg = work_ids['work-rb06-fgb-188-family-worship']
    fa = work_ids['work-rb06-fgb-217-comfort-affliction']
    ca = work_ids['work-rb06-9marks-counseling']
    st = work_ids['work-rb06-steele-marital-duties']
    ad = work_ids['work-rb06-adams-parent-child-duties']
    routes = []

    def add(concern, need, limits, selections):
        entries = []
        for aid, pattern, role in selections:
            w = by[aid]
            targets = [c for c in w['locations'] if re.search(pattern, c['title'], re.I)]
            assert targets, (concern, aid, pattern)
            entries.append(dict(assetId=aid, title=w['title'], author=w['author'], status=w['status'],
                originalSha256=w['originalSha256'], sourceUrl=w['url'], role=role,
                readingUnits=[dict(title=c['title'], locator=c['locator'], **({'componentId': c['componentId']} if c.get('componentId') else {})) for c in targets]))
        routes.append(dict(concern=concern, purpose=need, limitations=limits, entries=entries,
            status='curated-source-map-not-implemented-public-feature', inferredFromVectors=False))

    add('Bereavement and fear of death', 'Lawful grief, consolation, and hope grounded in Christ; distinguish bereavement from fear of one\'s own death.',
        'Flavel begins from parental bereavement and permits lawful sorrow. Historical discussion of excessive grief is not a diagnosis. Spurgeon treats Zion\'s mourners more broadly. Contemporary bereavement/trauma support remains a gap.', [
        ('asset-expanded-83ddfa911e67a4a9513b', 'Weep not|Considerations|^Rules$', 'start: full held bereavement treatise'),
        ('asset-expanded-355fc207a25bb22422f9', 'Beauty for Ashes|Oil of Joy', 'continue: held sermon collection'),
        (cr, r'SERM\. 30\.|SERM\. 31\.', 'new: Sylvester and Hook on approaching death; contributors pending')])
    add('Suffering and affliction', 'Providence, endurance and comfort, with persecution distinguished from general adversity.',
        'Bunyan primarily addresses suffering for Christian obedience. Providence is not a claim to know why a particular person suffers, nor permission to leave preventable harm unaddressed.', [
        ('asset-expanded-f190d4048e00ae160bdd', '^ADVICE TO SUFFERERS$|FIRST', 'start: held full work'),
        ('asset-expanded-9c163e2a6edb0d752ffc', r'^Proposition I\.|^Proposition III', 'continue: held contextual providence'),
        ('asset-expanded-4ff17eb26ad29e64fa88', '^Chapter XII:|^Chapter XVI:', 'continue: prayer and support for trembling souls'),
        ('asset-expanded-8d4168fda1f1fa6bd5db', '^Meditation 2:|^Meditation 6:|^Meditation 12:', 'continue: already-held complete Buchanan comfort work; journal excerpt overlaps'),
        (fa, 'Bible and Consolation|Fountain of Comfort', 'new: Buchanan and Winslow edited articles, not whole source books'),
        (cr, r'SERM\. 27\.', 'new: Bates complete offered sermon, contributor pending')])
    add('Prayer', 'What prayer is, praying with understanding, and scriptural petitions rather than isolated formulas.',
        'Prayer is not a guarantee of a requested temporal outcome. Pink includes Hebrews, Peter, Jude and Revelation prayers; it is not limited to Pauline prayers.', [
        ('asset-expanded-c43e16c2fd5805a53acf', r'^1\. What Prayer|^3\. Praying|Submission to', 'start: Bunyan held full work'),
        ('asset-expanded-c95bd085ec490fad1afb', '^Chapter 1:|^Chapter 3:', 'continue: Pink Hebrews13 and 1Peter5'),
        ('asset-l11-gill-practical-xml', 'OF PUBLIC PRAYER|OF THE LORD', 'continue: held Gill chapters'),
        (cr, r'SERM\. 14\.', 'new: Lee sustained private-prayer sermon, contributor pending')])
    add('Doubt, assurance and discouragement', 'Distinguish saving faith from felt assurance, and spiritual darkness from unbelief.',
        'Historic accounts of despair and melancholy are attributed pastoral arguments, not universal explanations of mental illness. Follow-up on modern grief, anxiety and trauma remains.', [
        ('asset-expanded-0d49e5451e6bc1ec0371', '^CHAPTER I:|^USE IV|^TEN DIRECTIONS', 'start: Goodwin held full work'),
        ('asset-expanded-5f852d84c9e03da65b92', r'^CHAPTER II\.|^CHAPTER III\.|^CHAPTER XIV\.|^CHAPTER XVIII\.', 'continue: Sibbes inward/outward discouragement and comforters'),
        (cr, r'SERM\. 24\.|SERM\. 25\.', 'new: Cole and Fowler sustained sermons, contributors pending')])
    add('Temptation', 'Understand temptation, vigilance, and Christ\'s sympathy; being tempted is distinguished from consenting to sin.',
        'Self-destruction is a historically framed chapter, not a modern crisis-care protocol. Charnock\'s thoughts sermon has a distinct contributor review.', [
        ('asset-l11-owen-temptation-xml', r'^Chapter I\.|^Chapter VIII\.|^Chapter IX\.', 'start: Owen held original XML; nine chapters, not eight'),
        ('asset-expanded-117db3cbe83b54410e21', r'^2\.|^7\.|^8\.', 'continue: Winslow providence, sympathy and final overthrow'),
        (cr, r'SERM\. 19\.', 'new: Charnock complete offered sermon')])
    add('Family worship', 'Establish Scripture reading, prayer and singing with practical household directions and help in affliction.',
        'Alexander is James W., not Archibald, and is Presbyterian. Family worship does not mechanically regenerate children. Slater and historic household assumptions need context; confessional differences remain visible.', [
        ('asset-expanded-c17152ddf72a788ab047', r'CHAP\. 1\.|CHAP\. 8\.|CHAP\. 14\.|CHAP\. 15\.|CHAP\. 16\.|CHAP\. 18\.', 'start: held full eighteen-chapter book'),
        ('asset-expanded-e317c10a38c4cc9817b4', r'^IV\.|^V\.', 'continue: held full family-religion work'),
        (cr, r'SERM\. 15\.', 'new: Doolittle full offered family-prayer sermon'),
        (fg, 'Women Leading|Implementing', 'new: Howe and Beeke contextual articles, not whole books')])
    add('Marriage', 'Mutual duties, love, respect, forgiveness and forbearance in sustained treatments.',
        'Steele\'s Chapel edition is a modern paraphrase with Douglas Wilson additions in II and VI: those are not Steele\'s words. Gouge is a historic Presbyterian witness. Piper\'s divorce/remarriage position must be compared separately, not presented as the 1689 default; household counsel must not excuse coercion or abuse.', [
        (cr, r'SERM\. 16\.', 'start: new full offered Steele source sermon; editor notes separate'),
        (st, r'^III\.|^IV\.|^V\.', 'accessible comparison: modern abridged/paraphrased edition'),
        ('asset-expanded-5a292f1b4784594679df', '^The Second Treatise Part II|^The Fourth Treatise', 'continue: held substantial historical mutual/husband duties'),
        ('asset-modern-piper-0cfbb291a67c007735f5-epub', '^Chapter Four|^Chapter Fourteen|^Chapter Fifteen', 'held modern comparison with explicit divorce/remarriage distinction')])
    add('Parenting', 'Tenderness, Scripture, prayer, example and mutual parent/child responsibilities.',
        'Ryle is Anglican and differs from the working Baptist theology on ordinances/atonement. The edition\'s opening Proverbs 23:6 citation should be normalized to 22:6 with an explicit correction, never silent original editing. Discipline and obedience must not become blanket approval of harshness or abuse.', [
        ('asset-expanded-4060d054a2a5dbc08d39', r'^II\.|^V\.|^VI\.|^XIV\.|^XVII\.', 'start: full held seventeen-direction tract'),
        (cr, r'SERM\. 17\.', 'new: Adams full offered source sermon'),
        (ad, r'^II\. The Duty of Parents|^III\. How|^Conclusion', 'accessible comparison: deliberately abridged/revised edition'),
        ('asset-expanded-5a292f1b4784594679df', '^The Sixth Treatise', 'continue: full held parental treatise')])
    add('Contentment', 'Learn contentment under ordinary circumstances and adversity, distinct from complacency.',
        'This area already has substantial complete coverage; acquiring another short quotation booklet would add little. Burroughs\' appended Saints\' Duty is a separate work; Watson is not Richard Allestree.', [
        ('asset-expanded-a678daec0c2e95589c4e', '^Sermon 1:|^Sermon 4:|^Sermon 11:', 'start: held Rare Jewel sermons'),
        ('asset-expanded-6a41e8103fbcb7515140', '^Showing the Nature|^Three Cautions|^A Christian Directory', 'continue: held Watson full work'),
        ('asset-l11-gill-practical-xml', 'OF CONTENTMENT', 'continue: held Gill chapter'),
        (cr, r'SERM\. 26\.', 'new: Jacombe substantial sermon, contributor pending')])
    add('Repentance and restoration', 'Godly sorrow, confession, restitution, receiving reproof and the blessedness of forgiveness.',
        'Repentance is not the meritorious basis of justification. Reuse RB04 Fuller backsliding components; parent holds remain. No new work count for reused material.', [
        ('asset-expanded-be0769a721109e5fd07e', r'^3\. THE NATURE OF TRUE|^Ingredient 2:|^Comfort for the Repenting', 'start: held Watson full work'),
        ('asset-l11-gill-practical-xml', 'REPENTANCE TOWARDS GOD', 'continue: held Baptist doctrinal chapter'),
        (cr, r'SERM\. 28\.|SERM\. 29\.', 'new: Owen and Vincent complete offered sermons; contributors scoped separately')])
    add('Vocation and care in the church', 'Justice and truth in work; discipleship and accountable support within a church.',
        'Steele\'s 1823 edition is an adapted/revised Tradesman, not an identical unabridged Tradesman\'s Calling. 9Marks interviews are historical 2008 counsel with named interviewees; medication/physical-spiritual discussion is not automatically a clinical directive. Journal reviews are excluded.', [
        ('asset-expanded-eb7ad9ce89c3bc19e6d5', '^CHAPTER II:|^CHAPTER V:|^CHAPTER VI:|^CHAPTER VIII:', 'start: held revised historical whole edition'),
        (ca, '^Five Advantages|^Counseling and Discipleship|^Twenty Ways|^Sorting Out', 'new: exact articles/interview PDF 6-12,16-17,27-30; contributor review pending')])
    write('concern-map.json', dict(mission='RB06', concerns=routes, implemented=False,
        countRule='Eleven manually curated reading paths; bibliographic coverage, not clinical adequacy or unique Scripture coverage.'))

    lines = ['# RB06 concern-to-work/chapter map', '',
        f'Eleven source-based paths across {len(works)} edition witnesses. Begin with complete held texts where appropriate, then follow newly acquired sustained treatments. New mixed/edited parents remain held pending scoped intake. This map is metadata, not an implemented reader feature or a claim of clinical adequacy.', '',
        '| Concern | Useful starting point and exact chapters/sermons | What still needs care |', '|---|---|---|']
    for route in routes:
        e = route['entries'][0]
        lines.append('| ' + route['concern'] + ' | ' + e['title'] + ': ' + '; '.join(c['title'].replace('|', '/') for c in e['readingUnits']) + ' | ' + route['limitations'].replace('|', '/') + ' |')
    lines += ['', '## Exact edition-specific routes', '', 'Each locator resolves against the SHA-256 identified original in [chapter-map.json](chapter-map.json). Source heading typos/truncations are preserved. Navigation units include subheadings/front matter;581 units are not 581 chapters. Private text slices are described in [selected-components.json](selected-components.json), not committed as bodies.', '']
    for route in routes:
        lines += ['### ' + route['concern'], '', route['purpose'], '', route['limitations'], '', '| Work / edition role | Exact source unit | Source locator |', '|---|---|---|']
        for e in route['entries']:
            for c in e['readingUnits']:
                lines.append('| ' + e['title'].replace('|', '/') + ' - ' + e['role'] + ' | ' + c['title'].replace('|', '/') + ' | `' + c['locator'] + '` |')
        lines += ['']
    lines += ['## Full source-navigation inventory', '', 'The machine-readable inventory preserves all 581 resolved navigation units for 28 witnesses. It includes 107 Watson repentance headings and 60 Gill practical-divinity divisions; these are not separate acquired books. See [chapter-map.json](chapter-map.json). Fuller salvation/church components remain in RB04/RB05; link those instead of downloading or embedding them again.', '',
        '[Work overlaps](work-overlaps.json) records 21 targeted source-attributed comparisons with literal eight-word-shingle corroboration. The score is not semantic duplicate detection or a unique-word count. Modern paraphrases can have little literal overlap while remaining editions of the same historical sermon.', '']
    write('READING-MAP.md', '\n'.join(lines).replace('581', str(sum(len(w['locations']) for w in works))).replace('for 28 witnesses', f'for {len(works)} witnesses'))

    scope = []
    for a in new:
        scope.append(dict(assetId=a['assetId'], relativePath=a['relativePath'], originalSha256=a['sha256'],
            title=a['title'], author=a['author'], evidenceOnly=True, publicHostingAllowed=False,
            publicFullTextIndexAllowed=False, candidateRole=a['admissionRole'],
            sourceRoles=['historical or modern author argument', 'Scripture quotation', 'other quoted voices', 'modern abridger/editor notes', 'publisher/front matter'],
            ingestionRequirement='Metadata-only parent until contributor, editorial/quotation, work-overlap and rights scopes are enforced in aggregate intake. Prepared slices are not integrated or approved by preparation.',
            excludedRoles=['book reviews and incidental reviewed books', 'promotional matter', 'confession-preface duplicates', 'miscellaneous quotation collections', 'unselected baptism/polity comparison sermons']))
    write('intake-scope.json', dict(mission='RB06', files=scope, parentHoldsRequired=True, integrated=False))
    write('bibliography.json', dict(works=[dict(workId=a['workId'], title=a['title'], author=a['author'], assetIds=[a['assetId']],
        sourceUrls=[a['url']], editions=[dict(assetId=a['assetId'], edition=a['edition'], format=a['format'], completeness=a['completeness'], sha256=a['sha256'])],
        kind='new-offered-edition-not-necessarily-unique-underlying-work', scope='Private readable witness; mixed contributor/editorial scopes pending.') for a in new],
        overlapRule='Two Chapel abridgments derive from two sermons in the same new Cripplegate volume; FGB excerpts also overlap held works. Six files are not six wholly unique books.'))

    write('decision-queue.json', dict(mission='RB06', decisions=[
        dict(candidate='Cripplegate selected thirteen pastoral sermons', state='private-body-prepared-parent-held', next='Resolve individual contributors against six anchors; split editor notes and quotations. Edward Veal sermon 5 supports anchors but is not evidence for all 27 authors.'),
        dict(candidate='Steele/Adams Chapel editions', state='held-modern-abridgments', next='Separate D. Scott Meadows revision and Douglas Wilson additions; prefer historical source sermon route. No wholesale Wilson author admission.'),
        dict(candidate='FGB188/217 contributors', state='held-pending-work-specific-scope', next='Link Alexander/Pink/Spurgeon/Buchanan/Confession overlaps; evaluate Heywood, Doolittle, Howe, Beeke, Paton, Buchanan, Brooks and Zanchius within precise articles; quotations/editorial voices separate. Complete Buchanan Comfort and substantial Brooks works already held.'),
        dict(candidate='9Marks counseling journal', state='held-nine-private-article-slices', next='Retain bylines and interviewees; CCEF primary confession supports conservative Reformed framework, not exclusively Baptist polity. Exclude reviews39-47. Assess2008 claims in context.'),
        dict(candidate='FGB253 Death and Dying / Christopher Bogosh', state='discovered-not-acquired', next='Work-specific doctrinal and medical-claim review; do not prioritize brain-death claims as bereavement care.'),
        dict(candidate='FGB213 Contentment; Chapel Ryle Parents; Gouge parts; D\'Aubigne Family Worship', state='not-acquired-low-marginal-coverage', next='Reconsider only if a distinct question or edition warrants it; complete held texts and contextual new FGB family collection already available.'),
        dict(candidate='Contemporary bereavement, abuse/trauma and household safety', state='genuine-depth-gaps-not-filled-by-historic-tags', next='Hunt substantial author-offered confessional treatments with eligible terms in a separately authorized follow-up; commercial CCEF books remain discovery candidates only.'),
        dict(candidate='Baxter Christian Directory held file', state='extent-correction-required', next='Catalog as Part II Christian Economics only; preserve original SHA. Doctrinal justification differences require comparison scope, not default parenting doctrine.')], globalAuthorRegistryChanged=False))
    write('source-exceptions.json', dict(mission='RB06', exceptions=[
        dict(kind='held-extent', assetId='asset-expanded-10e04ffe1cad8d5665ec', correction='Christian Directory Part II Christian Economics,31 chapters; not whole four-part Directory', originalChanged=False),
        dict(kind='held-reference-error', assetId='asset-expanded-4060d054a2a5dbc08d39', correction='Opening train-up-a-child Proverbs 23:6 should be22:6; preserve source and record explicit normalized correction'),
        dict(kind='edited-voice', assetId=st, correction='Modern paraphrase; Douglas Wilson additions in divisionsII andVI are editor voice, not Richard Steele'),
        dict(kind='abridgment', assetId=ad, correction='Modern revision omits original details/references; complete offered booklet, not complete historical sermon'),
        dict(kind='digital-transcription', assetId=cr, correction='Publisher describes existing API/Claude Opus 4.6 transcription and editorial checking. No new model/OCR run here; critical collation not claimed.'),
        dict(kind='rights-tension', source='Monergism', correction='Current hosted-file policy permits private study/indexing but internal older boilerplate may prohibit retrieval storage. Retain both notices; no external corpus/public hosting permission inferred.'),
        dict(kind='access', source='Chapel public app', correction='HTML responds with JavaScript shell; use observed public book API/free download links, not invented private endpoints. Public getdetail codes ddfg/cafffg returned404; correct ciaffg/fworfg records succeeded. No selected acquisition failed.'),
        dict(kind='prior-cache', assetId=ca, correction='PublicPDF response retrieved2026-10-07T09:00:45.218284+00:00 duringRB05 discovery; first preserved immutable inRB06, not newly fetched twice.')]))
    write('THEOLOGICAL-DISTINCTIONS.md', '''# RB06 theological and editorial boundaries

The 1689 confession remains the working Baptist reference. No global author approval, doctrinal-document replacement, new Catholic/progressive teaching-source target, or public text publication occurred.

## Primary evidence and limits

- [Chapel Library's doctrinal guide](https://www.chapellibrary.org/about) explicitly uses the 1689 confession and says publication on one subject does not endorse every author's position. Its own examples distinguish Ryle's universal-atonement language and Calvin's baptism. Offered free EPUBs supply readable acquisition; editorial copyrights remain.
- [Calvary Baptist Church's beliefs](https://cbcexeterreformed.org/whatwebelieve/) and [history](https://cbcexeterreformed.org/about/) identify D. Scott Meadows and wholehearted 1689 subscription, adopted 1999. This supports the named abridger's framework; it does not transform his modern paraphrase into Steele's original or approve Douglas Wilson's inserted explanation/book recommendation.
- [Capitol Hill Baptist's own statement](https://www.capitolhillbaptist.org/about-us/what-we-believe/statement-of-faith/) supplies Scripture, Trinity, divine/human Christ, substitution, grace through faith and bodily-resurrection anchors for the journal's church context. [9Marks's own account](https://www.9marks.org/about/) explains its church/discipleship purpose. Those are ministry-context evidence, not blanket approval of every contributor, interviewee or reviewed book.
- [CCEF's own beliefs](https://www.ccef.org/about/beliefs-and-history/) affirms Scripture's unique authority, historic creeds and Reformation confessions, including Westminster and London Baptist. This supplies an explicitly conservative Reformed context for named interviews; it does not make CCEF exclusively Baptist or turn every historical physical/spiritual assertion into current clinical guidance. Its historical generalizations remain its own claims.
- Cripplegate Volume II, Edward Veal sermon 5, derivative lines 118,121,123-127,130 and 133 directly support Trinity; eternal Son/divine-human Christ; satisfaction by obedience/death; resurrection; imputed righteousness through faith alone; and Scripture's sufficiency. Exact body and original SHA are local. These are Veal's statements, not a substitute for individual review of all 27 ministers. Thirteen pastoral source slices are prepared; all parent/slice intake decisions remain pending.
- Previously held Owen, Watson, Goodwin, Sibbes, Bunyan, Pink and Spurgeon source locations and RB04 reviews are reused. Existing registry status is evidence context, not an author-wide new approval.

## Preserve the distinctions

Historical Presbyterians Alexander, Gouge, Slater and several anthology ministers supply scoped pastoral treatments; baptism, covenants and government are not silently recast as Baptist teaching. Manton's infant-baptism sermon 10 is not selected. Baxter's sermon 22 and Directory are not selected default pastoral routes; his distinct justification account requires a comparison decision. The held Directory is Part II only.

Piper's marriage chapters 14-15 retain his restrictive divorce/remarriage position for explicit comparison rather than harmonization with the 1689 working reference. Steele's complete offered historical sermon is distinct from Meadows's shortened 1999 paraphrase. Wilson's contemporary insertions are neither historical Steele voice nor a new approved author. Adams's revised booklet similarly omits detail and Scripture references from the source sermon.

Paton's household narratives retain their historic missionary/colonial vocabulary as attributed source language. FGB issues contain excerpts, editing and notes, not complete editions of every quoted author's work. Burroughs's appended Saints' Duty in Times of Extremity is a separate work. James W. Alexander is not Archibald Alexander; Richard Adams is not Thomas Adams; Richard Steele is not Richard Allestree; Thomas Watson's contentment work is not Allestree's similarly titled book.

Lawful grief is distinguished from inordinate sorrow in the historic texts. Do not diagnose a reader from a topic tag, infer an individual's reason for suffering, promise a requested recovery through prayer, claim household worship guarantees regeneration, or use historic authority/discipline vocabulary to excuse coercion or abuse. The concern map explicitly records contemporary bereavement, abuse/trauma and household-safety depth as remaining gaps.

## Rights and intake

[Monergism's current hosted-file policy](https://www.monergism.com/monergism-copyright-permissions) permits private study/indexing while prohibiting unauthorized external ebook/corpus redistribution. Preserve conflicting older internal boilerplate as edition evidence. The Cripplegate offered transcript was already produced using AI by its publisher; source completeness checks are not critical-edition collation.

The 2008 9Marks journal contains article-end conditional reproduction notices on PDF pages 9,12,15,17,21,26,30,34,38,41,44,47: wording unchanged, credited, cost only, no more than 1,000 physical copies, and web linking preferred. This mission authorizes private acquisition only. Pages 39-47 are book reviews and are not selected teaching sources. Modern 2025 permissions from RB05 are not generalized from this issue.

All six acquired parents are `evidenceOnly:true`. 52 exact private components have `eligibleForScopedIntake:false` and `integrated:false`. These are conservative holds while the importer cannot enforce contributor/editorial/quotation boundaries, not a claim that all six works are theologically rejected. Source bodies remain private and no new DB/vector/graph/enrichment process was launched.
''')
    write('INTAKE-NOTES.md', '''# RB06 aggregate-intake handoff

Do not ingest or embed this mission independently. Follow the newer fourteen-mission gate in HANDOFF. The existing completed vector snapshot predates RB06 and does not prove these six files are embedded.

1. Reconcile six source-first identities in bibliography/acquisition-manifest and the immutable provenance files. Six offered editions include three periodical issues, a 27-sermon anthology and two abridgments of sermons in that anthology; do not count six wholly unique books.
2. Preserve all six parent holds in intake-scope.json. 52 source-hashed bodies exist locally: 13 historical sermons, 11 family-worship articles, 8 affliction articles, 6 Steele divisions, 5 Adams divisions and 9 counseling articles/interviews. Preparation is not admission. Modern notes, quoted voices and each named contributor still require scoped integration. Buchanan's article member ends with Brooks/Owen quotations; a whole-member slice is not a single-author paragraph mask.
3. Link duplicate confession/Alexander/Pink/Spurgeon/Buchanan/Brooks/Zanchius excerpts to existing work identities and Doolittle articles to the full newly acquired sermon. The 21 source-attributed comparisons in work-overlaps.json corroborate literal overlap; low paraphrase scores do not establish a new work. Prefer sustained original source sermons over shortened editions for historical attribution. Retain abridger/editor identity and rights separately. Exclude 9Marks reviews 39-47 and anthology unselected baptism/polity material from default teaching intake.
4. Correct Baxter held-file extent to Part II Christian Economics and Ryle's introductory Proverbs reference only in normalized metadata with explicit source-error provenance; immutable original bytes remain unchanged. Preserve Piper divorce/remarriage, Presbyterian ordinances and other comparison scopes.
5. Reuse eleven concern paths and 595 original-hashed navigation units, not inferred vector tags. Publish a table-first study interface only in a separately authorized implementation task; no graph launch here. Source headings include source typos/truncations.
6. Import eligible text delta after contributor/role/rights enforcement, reuse unchanged vectors, verify original-to-chunk/vector parity, and update the sources dashboard snapshot explicitly. No embedding completeness claim before that later verification.

Resume with checkpoint.json and decision-queue.json. RB07 does not start automatically from this mission.
''')
    # Keep API/discovery evidence metadata-only, omitting publisher descriptions and quotations.
    for filename in ['discovery-evidence.json', 'chapel-book-evidence.json', 'chapel-search-evidence.json']:
        data = read(filename)
        def compact(value):
            if isinstance(value, list):
                return [compact(v) for v in value]
            if isinstance(value, dict):
                return {k: compact(v) for k, v in value.items() if k not in {'description', 'links', 'shortDescription', 'translations'}}
            return value
        write(filename, compact(data))
    print('DOCUMENTED eleven concern paths, six bibliography/intake records and explicit contributor queues; no bodies published')


if __name__ == '__main__':
    main()
