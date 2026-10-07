"""Rebuild RB04 bibliographic reading locations from verified local witnesses.

No fetching, OCR, database mutation, embeddings or inferred verse coverage.
Source labels and one-based derivative line ranges remain witness-specific.
"""
import hashlib
import json
import posixpath
import re
import zipfile
from pathlib import Path
from urllib.parse import unquote
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB04'


def write(name, data):
    (R / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def epub_locations(asset):
    """Resolve actual NCX targets, including IDs; retain defective source labels."""
    entries = []
    with zipfile.ZipFile(SOURCES / asset['relativePath']) as z:
        for name in z.namelist():
            if not name.endswith('.ncx'):
                continue
            root = ET.fromstring(z.read(name))
            for nav in root.iter():
                if not nav.tag.endswith('navPoint'):
                    continue
                label = next((e.text for e in nav.iter() if e.tag.endswith('text')), '')
                src = next((e.attrib['src'] for e in nav if e.tag.endswith('content')), '')
                path, _, anchor = unquote(src).partition('#')
                member = posixpath.normpath(posixpath.join(posixpath.dirname(name), path))
                assert member in z.namelist(), (asset['assetId'], member)
                doc = BeautifulSoup(z.read(member), 'html.parser')
                present = not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name': anchor}) is not None
                body = (doc.body or doc).get_text(' ', strip=True)
                entries.append(dict(title=' '.join((label or '').split()), sourceLabel=label,
                    locator=src, member=member, anchorPresent=present, memberCharacters=len(body),
                    titleDefect=('undefined' in (label or '') or bool(re.search(r'\b[a-zA-Z]$', label or '') and len(label or '') >= 94)),
                    kind='source-navigation-unit-not-necessarily-chapter'))
    return entries


def line_units(asset, starts, titles, last, kind, pages=None):
    raw = (SITE / asset['derivedText']['path']).read_bytes()
    assert sha(raw) == asset['derivedText']['sha256']
    lines = raw.decode('utf-8').splitlines()
    assert starts == sorted(set(starts)) and last <= len(lines)
    return [dict(title=title, sourceLabel=lines[start-1].strip(),
        locator=f'derivative-lines:{start}-{end}', lineStart=start, lineEnd=end,
        printedStartPage=pages[i] if pages else None, kind=kind,
        readableWords=len(re.findall(r'\b[\w\x27-]+\b', '\n'.join(lines[start-1:end]))))
        for i, (start, end, title) in enumerate(zip(starts, [x-1 for x in starts[1:]] + [last], titles))]


def main():
    manifest = json.loads((R / 'acquisition-manifest.json').read_text(encoding='utf-8'))
    held = json.loads((R / 'holdings-audit.json').read_text(encoding='utf-8'))['files']
    new = {a['assetId']: a for a in manifest['files']}
    works = []
    chosen = {
        'asset-expanded-d34dad3a1d294f76f629',  # Andrew Fuller, not Francis
        'asset-expanded-a497d3552b2832f26404',  # Booth: Reign of Grace
        'asset-expanded-ebaafc39ee2de0c4b492',  # Owen: justification
        'asset-expanded-cc625a129188762da130',  # Owen: unabridged mortification
        'asset-expanded-ebf47f62c5fb3deb801a',  # Owen: books III-V
        'asset-expanded-817756febca459947b73',  # Owen: communion
        'asset-expanded-b687299f2607bc432ae2',  # Goodwin: justifying faith
        'asset-expanded-2314958d6d49162ad3bc',  # Goodwin: holiness
        'asset-expanded-0d49e5451e6bc1ec0371',  # Goodwin: assurance
        'asset-expanded-fd110c90bff4ac46f343',  # Watson: body of divinity
        'asset-expanded-be0769a721109e5fd07e',  # Watson: repentance
        'asset-expanded-6b5ea32bcdb274a1cc54',  # Watson: Christian's charter
        'asset-expanded-a9ec8ae00c0e43939202',  # Sibbes: bruised reed
        'asset-expanded-5f852d84c9e03da65b92',  # Sibbes: soul's conflict
        'asset-expanded-9d69242aa3331f4783b9',  # Pink: justification
        'asset-expanded-9dff1e5aa3f648fcad4d',  # Pink: assurance
        'asset-expanded-b910c50681d52cdbbb05',  # Pink: sanctification
        'asset-expanded-d4b0fbc1202643fa3554',  # Pink: saving faith
        'asset-expanded-f0bc8d2450fe7659f3d8',  # Pink: regeneration
        'asset-expanded-789ec34bb17b4332a5b9',  # Pink: repentance
        'asset-expanded-d2cb934d3e98b128c661',  # Bunyan: justification
        'asset-expanded-37d4fd71fc7113c856c9',  # Bunyan: saved by grace
        'asset-expanded-27894ae8250c0dcca19f',  # Bunyan: come and welcome
        'asset-expanded-840aae06b308b95a2bcd',  # Spurgeon: all of grace
    }
    assert chosen <= {a['assetId'] for a in held}
    for a in held + manifest['files']:
        if a['assetId'] not in chosen and a['assetId'] not in new:
            continue
        item = {k: a.get(k) for k in ('assetId', 'workId', 'title', 'author', 'url', 'relativePath', 'edition')}
        item.update(status='new-witness' if a['assetId'] in new else 'already-held-reused',
            originalSha256=a.get('sha256', a.get('actualSha256')),
            locations=epub_locations(a) if a['relativePath'].endswith('.epub') else [])
        if a.get('derivedText'):
            item['derivative'] = a['derivedText']
        elif a.get('auditDerivative'):
            item['derivative'] = a['auditDerivative']
        works.append(item)
    by = {a['assetId']: a for a in works}
    def add(aid, starts, titles, last, kind, pages=None):
        by[aid]['locations'] += line_units(new[aid], starts, titles, last, kind, pages)

    add('asset-rb04-301261b5901ffd76b7d8',
        [109,623,1656,2343,2957,3695,4608,5395,6283,6840,7644,7987],
        ['Letter I. Introduction',
         'Letter II. Containing a general view of the system, with its leading points of difference from the systems which it opposes',
         "Letter III. Containing a more particular inquiry into the consequences of Mr. Sandeman's notion of justifying faith",
         'Letter IV. On the faith of devils and nominal Christians',
         'Letter V. On the connection between repentance toward God, and faith toward our Lord Jesus Christ',
         'Letter VI. On the connection between knowledge and disposition',
         'Letter VII. An inquiry whether, if believing be a spiritual act of the mind, it does not presuppose the subject of it to be spiritual',
         'Letter VIII. An inquiry whether the principles here defended affect the doctrine of free justification by faith in the righteousness of Christ',
         'Letter IX. On certain New Testament practices',
         'Letter X. An inquiry into the principles on which the Apostles proceeded in forming and organizing Christian Churches',
         'Letter XI. Of the kingdom of Christ',
         'Letter XII. The spirit of the system compared with that of primitive Christianity'],
        8585, 'letter', [1,16,45,64,82,103,129,151,176,192,215,225])
    add('asset-rb04-6339f233634df788103c', [345,747,2431,4158,6199],
        ['Introduction', 'Chapter I. The genuine gospel a complete warrant for the most ungodly person to believe in Jesus',
         'Chapter II. No degree of holiness previously necessary to warrant our believing in Jesus Christ',
         'Chapter III. Objections answered', 'Chapter IV. The salutary and practical tendencies of the principle maintained'],
        7269, 'introduction-or-chapter', [1,18,55,93,139])
    add('asset-rb04-1315bc3e91e3702213c9', [16972,17103,17533,18858,19207,19784,20156],
        ['Section I. What law it was to which the apostle was dead',
         'Section II. Unregenerate sinners alive to the law as a covenant',
         'Section III. Believers dead to the law, considered as a covenant',
         'Section IV. Of the law, as dead to believers',
         'Section V. Believers dead to the law, that they might live to God',
         'Section VI. We must be dead to the law as a covenant before we can live to God in holy and acceptable obedience',
         'Section VII. Of the law, as a rule of moral conduct to believers'],
        20814, 'section', [341,344,355,387,396,409,419])
    # Curated contextual blocks, not a blanket intake approval for the whole anthology.
    full = 'asset-rb04-f9ea063dff9952ca931d'
    blocks = [
        (65926,67422,'Three Conversations on Imputation, Substitution, and Particular Redemption','three-conversation-work'),
        (67423,68830,'Six Letters to Dr. Ryland respecting the Controversy with the Rev. A. Booth','six-letter-series'),
        (70490,72530,'Antinomianism contrasted with the religion taught and exemplified in the Holy Scriptures','two-part-treatise'),
        (104397,104466,'Regeneration by the Word of God; 1 Peter 1:23','expository-essay'),
        (117726,118491,'Sermon XVI. The Reception of Christ the Turning Point of Salvation; John 1:10-12','sermon'),
        (118492,119053,'Sermon XVII. On Justification; Romans 3:24','sermon'),
        (119054,119530,'Sermon XVIII. On Justification; Romans 3:24','sermon'),
        (119531,120124,'Sermon XIX. On Justification; Romans 3:24','sermon'),
        (142037,144062,'Letters on Systematic Divinity: nine completed letters only','unfinished-authorial-series'),
        (171074,172590,'On Spiritual Declension and the Means of Revival','pastoral-treatise'),
        (172591,174590,'The Backslider: Nature, Symptoms, Effects of Religious Declension, with Means of Recovery','four-section-work'),
        (174591,175073,'On the Progressiveness of Sin and of Holiness','two-essay-unit'),
        (178486,178711,'On the Doctrine of Imputed Righteousness; Jeremiah 33:16','essay'),
        (178712,178901,'Defence of the Doctrine of Imputed Righteousness; reply in 1799','controversial-essay'),
        (178902,179269,"Remarks on God's Justifying the Ungodly; reply to Joseph Jenkins",'controversial-essay'),
        (179270,179368,'Nature of Imputation; reply to Ignotus','controversial-essay'),
        (179369,179510,'On Imputation; undated author manuscript','essay'),
    ]
    for lo,hi,title,kind in blocks:
        add(full, [lo], [title], hi, kind)
    add(full,[71053,71638], ['Part I. Containing a Brief View of Antinomianism, with Arguments against the Leading Principle from which It Is Denominated','Part II. The Influence of Antinomianism in Perverting Some of the Principal Doctrines of the Gospel'],72530,'treatise-part')
    add(full,[65932,66481,66942], ['Conversation I. On Imputation','Conversation II. On Substitution','Conversation III. On Particular Redemption'],67422,'conversation')
    add(full,[67432,67724,68031,68308,68450,68675], ['Letter I. Narrative','Letter II. On Imputation','Letter III. On Substitution','Letter IV. On Change of Sentiments','Letter V. On Calvinism','Letter VI. Baxterianism'],68830,'dated-letter')
    add(full,[172663,173231,173574,173952], ['Section I. On the General Nature and Different Species of Backsliding','Section II. On the Symptoms of a Backsliding Spirit','Section III. On the Injurious and Dangerous Effects of Sin Lying upon the Conscience Unlamented','Section IV. On the Means of Recovery'],174590,'section')
    add(full,[142051,142083,142484,142681,142910,143167,143374,143539,143744], ['Letter I. Importance of Systematic Divinity','Letter II. Importance of a True System','Letter III. Plan Proposed to Be Pursued','Letter IV. On the Being of God','Letter V. On the Necessity of a Divine Revelation','Letter VI. On the Inspiration of the Holy Scriptures','Letter VII. On the Uniform Bearing of the Scriptures on the Person and Work of Christ','Letter VIII. On the Perfections of God','Letter IX. On the Trinity; or, on the Father, Son, and Holy Spirit Being One God'],144062,'letter')
    murray = new['asset-rb04-0309d1a642bea2895f0a']
    lines = (SITE / murray['derivedText']['path']).read_text(encoding='utf-8').splitlines()
    titles = ['THE FACT OF DEFINITIVE SANCTIFICATION','THE CHARACTER OF DEFINITIVE SANCTIFICATION','THE AGENCY IN DEFINITIVE SANCTIFICATION']
    starts = [next(i+1 for i,l in enumerate(lines) if l.strip() == title) for title in titles]
    add(murray['assetId'],starts,titles,len(lines),'essay-section')
    write('chapter-map.json',dict(mission='RB04',schemaVersion=1,works=works,
        cautions=['NCX units include front matter, parts and subheadings: not a chapter count.',
          'Source labels may be truncated or contain OCR defects. Normalized line-unit titles are identified separately.',
          'Locators are edition-specific, not yet a public reader interface or verse-level coverage.',
          'Collected Fuller and Booth volumes require segmented intake; current importer cannot enforce this map.']))
    md = ['# RB04: exact reading locations', '',
        'New witnesses and existing books are distinguished below. Original bytes and full extracts remain private. One-based line ranges refer to the hashed derivative in `chapter-map.json`; EPUB targets resolve within the named edition. These are reading locations, not automatic doctrinal endorsements or Scripture-coverage percentages.', '',
        '## Seven study paths', '',
        '| Subject | Baptist starting point | Scoped comparison | Distinction to preserve |',
        '|---|---|---|---|',
        '| Justification | Keach, *Marrow*, sermons 1-2; Booth, *Reign*, ch.6; Fuller, sermons XVII-XIX | Owen, *Justification*; Watson, *Body*, Justification | Forensic acceptance/imputation differs from inward sanctification; faith receives Christ, not merit. |',
        '| Regeneration | Fuller, *Strictures*, letters VI-VIII; Booth, *Glad Tidings*, ch.III; Pink, *Regeneration* | Owen, *Pneumatologia*, book III, ch.I-VI | Preserve the Fuller/Booth debate about Spirit, Word, disposition and believing; do not collapse terms or causal order. |',
        '| Repentance | Fuller, *Strictures*, letter V; Pink, *Repentance* | Watson, *Doctrine of Repentance*, ch.2-4 and 9 | Evangelical repentance and counterfeit/legal terror differ; repentance does not purchase justification. |',
        '| Saving faith | Held Fuller, *Gospel Worthy*, parts I-III; new *Strictures*, letters III-IV and VIII | Goodwin, *Justifying Faith*, part II, books I-II | Duty faith/free gospel offer, assent, heart disposition and assurance require separately attributed definitions. |',
        '| Adoption | Booth, *Reign*, ch.7; Fuller, sermon XVI, especially lines 118170-118234 | Watson, *Body*, Adoption; *Christian Charter* | New filial status and inheritance are distinct from regeneration/new nature. |',
        '| Assurance | Pink, *Assurance*; Fuller, *Backslider*, sections I-IV; Spurgeon, *All of Grace* | Goodwin, *Child of Light* and *Justifying Faith*, part II book II; Sibbes, *Bruised Reed* | Assurance can fluctuate without becoming the meritorious basis of salvation; past profession alone is not assurance. |',
        '| Sanctification | Booth, *Reign*, ch.8-10; *Death of Legal Hope*, sections V-VII; Pink, *Sanctification* | Owen, *Pneumatologia*, book IV; *Mortification*; Murray essay | Definitive break with sin, progressive holiness, mortification and perseverance differ; moral law as covenant differs from rule of conduct. |', '',
        '## Edition and attribution rules', '',
        '- Booth: the 1813 historical witness retains seven sections in rough existing OCR. Chapel Library 2017 explicitly labels its edition an **abridgment and annotations**; its seven sections are not proof of an unabridged historical text. New subheadings, definitions and notes belong to the editor unless identified as Booth notes.',
        '- Fuller: the anthology includes editor Andrew Gunton Fuller, biography, quotations and opponents. *Three Conversations* is Fuller\'s constructed dialogue, not verbatim independently authored Booth/Ryland correspondence. The six letters are **to Dr. Ryland about Booth**, not letters addressed to Booth.',
        '- Fuller\'s nine *Systematic Divinity* letters are an unfinished planned series. Letter I deliberately refers to material elsewhere in this edition, pp.559-560. The imputation essay\'s editor flags a later changed formulation (lines 178779-178781); preserve chronology rather than harmonize the statements.',
        '- Owen/Goodwin/Sibbes/Watson/Murray are scoped conservative Reformed comparisons. Their baptism, covenant and polity arguments do not replace the Baptist reference. John Murray is not Andrew Murray; Andrew Fuller is not Francis Fuller.',
        '- An unresolved EPUB anchor or damaged/truncated NCX title is disclosed in the machine map. Use the actual member heading for precise study; no generated completion of a truncated source label is presented as original.', '']
    for a in works:
        md += ['## ' + a['author'] + ': ' + a['title'], '',
            f"**{a['status']}**; `{a['assetId']}`. [Source]({a['url']}).", '',
            '| Source unit | Exact edition locator | Check / kind |', '|---|---|---|']
        for c in a['locations']:
            title=c['title'].replace('|','\\|')
            flags = c['kind']
            if c.get('anchorPresent') is False:
                flags += '; source anchor missing - use member'
            if c.get('titleDefect'):
                flags += '; source label needs body-heading verification'
            md.append(f"| {title} | `{c['locator']}` | {flags} |")
        md.append('')
    (R / 'READING-MAP.md').write_text('\n'.join(md), encoding='utf-8', newline='\n')
    print('MAPPED',len(works),'witnesses;',sum(len(a['locations']) for a in works),'source navigation/reading units')
    print('SOURCE ANCHOR DEFECTS',sum(c.get('anchorPresent') is False for a in works for c in a['locations']))


if __name__ == '__main__':
    main()
