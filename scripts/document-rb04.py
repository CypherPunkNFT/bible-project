"""Prepare RB04 source-first bibliography and scoped components; no intake launch.

Run after map-rb04.py. This deliberately does not write the final completion
REPORT or checkpoint: those signal the owner's fourteen-mission runtime gate.
"""
import hashlib
import json
import re
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB04'
CACHE = SITE / '.local/library/run-rb04-2026-10-07'


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    manifest = json.loads((R / 'acquisition-manifest.json').read_text(encoding='utf-8'))
    chapter_map = json.loads((R / 'chapter-map.json').read_text(encoding='utf-8'))
    files = manifest['files']
    bibliography = {}
    for a in files:
        w = bibliography.setdefault(a['workId'], dict(workId=a['workId'], title=a['title'],
            author=a['author'], assetIds=[], sourceUrls=[], editions=[],
            kind='collected-edition-witness' if 'fuller-collected' in a['workId'] else 'focused-work',
            scope='Source-first identity; admission and attribution limits are in admission-decisions.json and intake-scope.json.'))
        if a['sourceId'] == 'source-chapel-library':
            w['title'] = 'The Death of Legal Hope, the Life of Evangelical Obedience'
        w['assetIds'].append(a['assetId'])
        w['sourceUrls'].append(a['url'])
        w['editions'].append({k:a[k] for k in ('assetId','edition','format','completeness','sha256')})
    write(R / 'bibliography.json',dict(works=list(bibliography.values()),
        countRule='Five focused logical works plus one mixed collected-edition witness. Multiple editions, formats and embedded duplicate works do not inflate new-book totals.'))
    components = []
    fuller = next(a for a in files if 'fuller-collected' in a['workId'])
    lines = (SITE / fuller['derivedText']['path']).read_text(encoding='utf-8').splitlines()
    mapped = next(w for w in chapter_map['works'] if w['assetId'] == fuller['assetId'])
    kinds = {'three-conversation-work','six-letter-series','two-part-treatise','expository-essay',
        'sermon','unfinished-authorial-series','pastoral-treatise','four-section-work','two-essay-unit','essay','controversial-essay'}
    for c in mapped['locations']:
        if c['kind'] not in kinds:
            continue
        key = 'component-rb04-fuller-' + str(c['lineStart'])
        text = '\n'.join(lines[c['lineStart']-1:c['lineEnd']]) + '\n'
        path = CACHE / 'components' / (key + '.txt')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8', newline='\n')
        components.append(dict(componentId=key, title=c['title'], author='Andrew Fuller',
            parentWitnessAssetId=fuller['assetId'], originalSha256=fuller['sha256'],
            fullDerivativeSha256=fuller['derivedText']['sha256'],
            sourceLocator=c['locator'], lineStart=c['lineStart'], lineEnd=c['lineEnd'],
            componentText={'path':path.relative_to(SITE).as_posix(),
                'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                'wordCount':len(re.findall(r'\b[\w\x27-]+\b', text))},
            kind=c['kind'], eligibleForScopedIntake=True, integrated=False,
            limits='Retain quotations, speaker roles and editor notes. A component is not automatically a distinct new book; resolve work-level deduplication before aggregate intake.'))
    write(R / 'selected-components.json',dict(mission='RB04',components=components,
        integrationRequired='Advisory components only; current generic planner does not ingest this shape. Keep parent collected witness evidenceOnly until component integration preserves original locators and contributor roles.'))
    scopes = []
    for a in files:
        scopes.append(dict(assetId=a['assetId'], relativePath=a['relativePath'], originalSha256=a['sha256'],
            title=a['title'], author=a['author'], candidateRole=a['admissionRole'],
            evidenceOnly=bool(a.get('evidenceOnly')), publicHostingAllowed=False,
            coreScope='Historical Baptist salvation study' if a['author'] != 'John Murray' else 'Scoped conservative Reformed sanctification comparison',
            sourceRoles=['author argument','Scripture quotation','quoted interlocutors/opponents','editor/publisher matter'],
            contributorBoundary='Do not attribute biography, modernization, subheadings, definitions, annotations or quoted opponents to the arguing author.',
            ingestionRequirement='Segment components before body intake' if a.get('evidenceOnly') else 'Preserve source attribution, edition/OCR limits and quotation context; no blanket endorsement.',
            limitations=a.get('limitations', a['completeness'])))
    write(R / 'intake-scope.json',dict(mission='RB04',files=scopes,
        currentImporterEnforcesAllScopes=False,
        enforcedSafeguard='Three mixed/editorially annotated witnesses explicitly evidenceOnly; current library importer recognizes this as metadata-only.',
        componentsRequireIntegration=True, dbIngested=False, embedded=False))
    prior = json.loads((R.parent / 'RB02/admission-decisions.json').read_text(encoding='utf-8'))
    decisions = []
    for author, ids, finding in [
        ('Benjamin Keach',['work-rb04-keach-marrow'],'Two sermons reject works as the ground of justification and treat faith as receiving Christ. Postscript limits the published unit to two first sermons.'),
        ('Abraham Booth',['work-rb04-booth-glad-tidings','work-rb04-booth-death-legal-hope'],'Glad Tidings gives ungodly hearers a gospel warrant without qualifying holiness. Death distinguishes law as covenant from moral rule; holy obedience follows acceptance, not its purchase.')]:
        old = next(d for d in prior['decisions'] if d['author'] == author)
        decisions.append(dict(author=author, workIds=ids,
            decision='admit-scoped-historical-Baptist-study',
            sixAnchorBasis=dict(reusedReview='RB02/admission-decisions.json', primaryEvidence=old['evidence'][0]),
            workBodyFinding=finding, globalAuthorApproval=False,
            limits=['AI-assisted bounded body sampling, not exhaustive human review.',
                'Exact edition and contributor boundaries apply; opposing quotations are not new admitted sources.',
                'Chapel Booth witness is explicitly abridged/annotated; 1813 OCR is rough.'] if author == 'Abraham Booth' else
                ['2026 editor lightly modernizes historical text; do not claim diplomatic 1692 wording.',
                 'Two offered sermons, not all sermons Keach contemplated.']))
    decisions.append(dict(author='Andrew Fuller', workIds=['work-rb04-fuller-strictures','work-rb04-fuller-collected-1846'],
        decision='admit-focused-treatment-and-scoped-collected-components', globalAuthorApproval=False,
        sixAnchors=[
            dict(anchor='Scripture authority',witness=fuller['assetId'],locator='lines 143167-143373; Systematic Divinity letter VI',finding='Divine inspiration and authority of the biblical writings defended.'),
            dict(anchor='Trinity',witness=fuller['assetId'],locator='lines 143744-144062; letter IX',finding='Father, Son and Holy Spirit one God, distinguished beyond mere redemption roles.'),
            dict(anchor='Christ deity and humanity',witness=fuller['assetId'],locator='lines 143921-143988; 176683-176705; 177202-177260',finding='Pre-incarnate divine Son takes human nature; Godhead/manhood and atoning suffering explicitly affirmed.'),
            dict(anchor='Substitutionary atonement',witness=fuller['assetId'],locator='Conversation II, lines 66481-66941; sermon XVII, 118558-118584',finding='Christ redemption/righteousness grounds acceptance; atoning suffering is distinct from sinner merit.'),
            dict(anchor='Bodily resurrection',witness=fuller['assetId'],locator='lines 34108-34120; 56655-56675; 176683-176705',finding='Resurrection of Christ as man and raising the Davidic Christ from death affirmed, not reduced to metaphor.'),
            dict(anchor='Grace through faith alone',witness=fuller['assetId'],locator='sermon XVII, 118492-119053; Strictures letter VIII',finding='Justification freely by grace through Christ redemption; faith receives righteousness, not a meritorious substitute for it.')],
        limits=['Andrew Fuller is distinct from held Francis Fuller. No Francis attribution imported.',
            '1846 collected edition contains already-held Gospel Worthy and newly acquired Strictures: deduplicate at work/component level.',
            'Three Conversations is Fuller-authored dialogue. Six letters are to Ryland about Booth. Opponent claims and editor notes remain attributed.',
            'Nine Systematic Divinity letters are a historically unfinished series; editor omission/reference to pp.559-560 is disclosed.',
            'Earlier imputation phrasing and later charging/reckoning phrasing remain chronologically distinct; see editor note 178779-178781.',
            'Mixed anthology remains evidenceOnly until scoped component intake.']))
    decisions.append(dict(author='John Murray',workIds=['work-rb04-murray-definitive-sanctification'],
        decision='admit-scoped-conservative-Reformed-comparison-essay',globalAuthorApproval=False,
        sixAnchors=[
            dict(anchor='Scripture authority',url='https://wm.wts.edu/read/the-reformed-faith-and-modern-substitutes',locator='Part I: subscription and infallible rule; paragraphs beginning The root cause and These vows',finding='Murray argues for binding biblical authority and rejects the Auburn Affirmation departures.'),
            dict(anchor='Trinity',url='https://www.monergism.com/nature-union-christ',locator='It is Spiritual: paragraph comparing kinds of union',finding='Three divine persons in one God expressly affirmed.'),
            dict(anchor='Christ deity and humanity',url='https://www.monergism.com/nature-union-christ',locator='It is Spiritual; It is Mystical',finding='Two natures in one person, Son becoming man, expressly affirmed.'),
            dict(anchor='Substitutionary atonement',url='https://wm.wts.edu/read/the-reformed-faith-and-modern-substitutes',locator='Part I: central tenets; Part III Purchase and Application',finding='Substitution, debt discharge and satisfaction through Christ obedience/death defended.'),
            dict(anchor='Bodily resurrection',url='https://wm.wts.edu/read/the-reformed-faith-and-modern-substitutes',locator='Part I: central tenets; acquired essay Character section',finding='Bodily resurrection essential; acquired essay appeals to resurrection from Joseph tomb.'),
            dict(anchor='Grace through faith alone',url='https://www.monergism.com/thethreshold/articles/onsite/justification_murray.html',locator='Free grace, imputation and final faith/works paragraphs',finding='Christ obedience is ground; faith is instrument rather than meritorious cause; works excluded.')],
        limits=['John Murray (1898-1975), not Andrew Murray or the American universalist namesake.',
            'Presbyterian covenant/ordinance context remains a comparison, not Baptist default. Water/Spirit baptism interpretations must remain attributed.',
            'Complete offered essay, not a complete Redemption Accomplished and Applied book or Collected Writings volume.',
            'Definitive sanctification does not mean sinless perfection or erase progressive holiness; Romans 6:7 usage must remain distinguished from forensic justification.',
            'Evidence excerpts and WTS historical polemic are read for screening, not acquired as whole commercial books.']))
    write(R / 'admission-decisions.json',dict(review=dict(date='2026-10-07',reviewer='Codex',kind='ai-assisted',
        scope='Bounded work/edition screening using actual source passages and earlier RB02 primary reviews; no exhaustive human review, global registry approval or Baptist-model selection.'),decisions=decisions))
    exceptions = [
        dict(kind='author-identity',status='resolved',detail='Two earlier Fuller records are one Andrew Fuller and one Francis Fuller. Other surname matches in audit (Philip Goodwin, Jacob Watson, Stockton Owen, Robert Murray M Cheyne) are discovery context, not target author approvals.'),
        dict(kind='archive-stream-format',status='resolved',assets=['asset-rb04-301261b5901ffd76b7d8',fuller['assetId']],detail='Stream URLs ending djvu.txt return HTML containing OCR in pre. Corrected format/filename and private extraction; original response SHA unchanged; website navigation excluded.'),
        dict(kind='ocr-heading-defects',status='retained',detail='Fuller IT/VIIT, Booth Glad CHAPTER.17, Booth Works SectIoK It/VIL and damaged page labels remain in immutable originals. Map normalizes identities using sequence, TOC and actual body; printed numbers are not guessed from malformed OCR.'),
        dict(kind='booth-abridgment',status='retained',detail='Chapel 2017 explicitly abridgment and annotations, despite all seven sections. It is not proof of an unabridged historical witness; historical 1813 volume retained separately.'),
        dict(kind='download-approval-review',status='resolved-with-primary-evidence',detail='Initial Chapel EPUB fetch rejected automatically because public record price 2.33 appeared paid. Publisher literature page explicitly says ebooks always free and PDF/EPUB downloads free. Review then allowed offered unauthenticated EPUB; no workaround, login or purchase bypass.',evidence=['https://www.chapellibrary.org/literature','https://www.chapellibrary.org/about','chapel-book-evidence.json','chapel-client-evidence.json']),
        dict(kind='marker-validation',status='resolved',detail='Glad Tidings failed preliminary SECTION and THE END heuristics. Actual genre is four chapters; verified chapter IV body, printed page162 and closing text before publisher catalogue. Same cached response was validated and promoted; no repeated network hammering.'),
        dict(kind='murray-full-book',status='not-acquired',detail='Redemption Accomplished and Applied page offers purchase; Banner Collected Writings article is explicitly extracts. Neither completes a full-book gap.',evidence=['https://www.monergism.com/content/redemption-accomplished-and-applied','https://banneroftruth.org/us/resources/articles/2011/definitive-and-progressive-sanctification/']),
        dict(kind='epub-anchor',status='source-defect',detail='Held Sibbes Bruised Reed navigation Back To Top points to absent #top. Body member exists; this is not a missing chapter. Some held NCX labels truncate headings; exact original source label retained.'),
        dict(kind='mixed-witness',status='intake-held',detail='Fuller anthology, Booth Works I and Chapel annotated abridgment explicitly evidenceOnly until contributor/component integration. Current generic importer does not enforce full role scopes.'),
        dict(kind='rights',status='private-only',detail='No external fulltext publication authorized. Monergism reserves electronic-editor rights and prohibits external file distribution/AI-corpus republication; Chapel freely offers ebook download but retains 2017 abridgment/annotation copyright. Archive public-domain underlying editions do not license all later editorial additions.')]
    write(R / 'source-exceptions.json',dict(mission='RB04',exceptions=exceptions))
    # Register only the new content host, with deliberately bounded automation scope.
    source_path = SITE / 'content/library/sources.json'
    source_registry = json.loads(source_path.read_text(encoding='utf-8'))
    if not any(s['id'] == 'source-chapel-library' for s in source_registry['sources']):
        source_registry['sources'].append(dict(id='source-chapel-library',name='Chapel Library literature',
            url='https://www.chapellibrary.org/',role='content-host',automation='manual-only',
            acquisitionNote='Individual offered free ebook downloads reviewed in RB04. Price applies to printed copies. Edition/abridgment/annotations and private-only publication limits apply; no blanket bulk automation or author approval.',
            evidence=[dict(url='https://www.chapellibrary.org/literature',locator='Free ebook/PDF/EPUB notice',note='Ebooks always free; public book detail and client expose offered download links. Print ordering is separate.',checkedOn='2026-10-07'),
                dict(url='https://www.chapellibrary.org/about',locator='Doctrine and differing theological views',note='1689 reference and explicit warning that not every author view is endorsed.',checkedOn='2026-10-07')],reviewedOn='2026-10-07'))
        source_registry['updated']='2026-10-07'
        write(source_path,source_registry)
    print('DOCUMENTED',len(bibliography),'bibliographic groups;',len(components),'private Fuller components;',len(scopes),'scopes')


if __name__ == '__main__':
    main()
