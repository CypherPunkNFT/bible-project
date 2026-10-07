"""Map RB05 church-study articles and held book navigation; no network or DB work.

PDF page numbers are one-based file pages, not assumed printed pagination.
Private components are exact source slices and remain advisory until scoped intake.
"""
import hashlib
import json
import re
from pathlib import Path
from bible.paths import SOURCES
from importlib.util import spec_from_file_location, module_from_spec

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB05'
CACHE = SITE / '.local/library/run-rb05-2026-10-07'
spec = spec_from_file_location('rb04map', SITE / 'scripts/map-rb04.py')
old = module_from_spec(spec)
spec.loader.exec_module(old)


def write(name, data):
    (R / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


# title, attributed contributor(s), first/last PDF page, study topics.
SPECS = {
 'living-as-church': [
  ('Introduction: Unity, God\u2019s Goal for the Church', 'course-joint-credit', 4,10,'membership,unity'),
  ('Church Membership: The Context for Unity','course-joint-credit',11,15,'membership'),
  ('Preaching: The Foundation of Unity','course-joint-credit',16,20,'preaching'),
  ('Corporate Prayer: God\u2019s Power Creates Unity','course-joint-credit',21,27,'prayer,worship'),
  ('Church Government: Godly Authority Fostering Unity','course-joint-credit',28,33,'polity,elders,deacons'),
  ('Fellowship: Building a Bond of Unity','course-joint-credit',34,39,'membership,fellowship'),
  ('Discontentment: A Test of Unity','course-joint-credit',40,44,'membership,unity'),
  ('Church Leadership: Submission for the Sake of Unity','course-joint-credit',45,50,'elders,accountability'),
  ('Church Discipline: Preserving God-Glorifying Unity','course-joint-credit',51,57,'discipline'),
  ('Encouragement: Safeguarding Unity in Holiness','course-joint-credit',58,65,'membership,holiness'),
  ('Serving and Giving: Sacrifice for the Sake of Unity','course-joint-credit',66,72,'service,giving'),
  ('Worship: Praising God in Unity','course-joint-credit',73,77,'worship'),
  ('Evangelism: A Harvest of Unity','course-joint-credit',78,82,'evangelism')],
 'discipline-ii': [
  ('Why You Shouldn\u2019t Practice Church Discipline','Mark Dever',6,8,'discipline,teaching'),
  ('Before You Discipline, Teach This First','Greg Gilbert',9,11,'discipline,teaching'),
  ('Those Toxic Non-Attenders','Matt Schmucker',12,14,'membership,discipline'),
  ('The Preemptive Resignation: A Get Out of Jail Free Card?','Jonathan Leeman',15,17,'membership,discipline'),
  ('Grabbing a Dog by its Ears: The Role of Witnesses','Stephen Matteucci',18,19,'discipline,witnesses'),
  ('Pastors\u2019 and Theologians\u2019 Forum: Lessons Learned the Hard Way','Tom Ascol; Bob Johnson; Dennis Newkirk; Walter Price; Philip Ryken',20,23,'discipline,accountability'),
  ('Cleaning Up the Rolls','Matt Schmucker',26,27,'membership,discipline')],
 'deacons': [
  ('Deacons: Shock-Absorbers and Servants','Jamie Dunlop',5,7,'deacons,service'),
  ('The Biblical Qualifications and Responsibilities of Deacons','Benjamin Merkle',8,11,'deacons,qualifications'),
  ('Must We Use the Titles Elder and Deacon?','Benjamin Merkle',12,14,'elders,deacons,polity'),
  ('The Committee-Free, Task-Specific Deacon','Matt Schmucker',15,18,'deacons,service'),
  ('Moving from a Deacon-Led to an Elder-Led Church','Phil Newton',19,21,'elders,deacons,polity'),
  ('How to Separate Deacon Work from Elder Work','Matt Schmucker',22,24,'elders,deacons,polity'),
  ('A Deacon on a Deacon\u2019s Reward','John Ingold',25,27,'deacons,service')],
 'lay-elders': [
  ('A Job Description for Lay Elders','Jeramie Rinne',5,8,'elders,qualifications'),
  ('How Much Time Can a Lay Elder Give to Ministry?','Sebastian Traeger',9,12,'elders,service'),
  ('Raising Up Elders: Three Areas to Address','Mike McKinley',13,16,'elders,training'),
  ('Raising Up Elders: Four Foundational Principles','Garrett Kell',17,19,'elders,training'),
  ('Four Ways to Equip New Elders','Garrett Kell',20,23,'elders,training'),
  ('Besetting Sins of Lay Elders','Steve Boyer',24,27,'elders,accountability'),
  ('How Pastor Mark Passes Out Authority','Jonathan Leeman',28,32,'elders,accountability')],
 'journal-73': [
  ('Church Purity: A Baptist Insight','Tom Nettles',3,12,'membership,discipline'),
  ('Church Discipline: Its Importance','James P. Boyce',13,14,'discipline'),
  ('Commencement Address: 1879','James P. Boyce',15,18,'ministry,preaching'),
  ('Transformed by the Renewing of Your Minds','Tom Nettles',19,27,'membership,holiness'),
  ('Our Great Distinguishing Characteristic: H. H. Tucker and the Battle for Church Purity','Jeff Robinson',28,34,'membership,history')],
 'journal-90': [
  ('Singing in the Church: Editorial Introduction','Tom Ascol',4,4,'worship,singing'),
  ('Songs of Salvation: Exodus 15:1\u201321','Tom Ascol',6,16,'worship,singing'),
  ('Ten Principles for Church Music','Kevin DeYoung',17,23,'worship,singing'),
  ('What Then Shall We Sing?','Ken Puls',24,44,'worship,singing')],
 'journal-129': [
  ('Introduction: Baptists, Puritans, and Preaching','Tom Nettles',4,8,'preaching,history'),
  ('Revised, Because it\u2019s Regulated: Hercules Collins and An Orthodox Catechism on Credobaptism','Reagan Marsh',9,17,'baptism,covenants,history'),
  ('The Art of Listening to the Best Method of Preaching','Daniel Scheiderer',18,44,'preaching'),
  ('Why Baptists Don\u2019t Know They\u2019re Puritans','John Carpenter',45,60,'history'),
  ('John Smyth','Tom Nettles',61,70,'history')]
}


def main():
    manifest = json.loads((R/'acquisition-manifest.json').read_text(encoding='utf-8'))
    held = json.loads((R/'holdings-audit.json').read_text(encoding='utf-8'))['files']
    works, components = [], []
    for a in manifest['files']:
        w = {k:a[k] for k in ('assetId','workId','title','author','url','relativePath','edition')}
        w.update(status='new-witness', originalSha256=a['sha256'], derivative=a['derivedText'], locations=[])
        lines = (SITE/a['derivedText']['path']).read_text(encoding='utf-8').splitlines()
        if a['format'] == 'pdf':
            suffix = next(k for k in SPECS if a['workId'].endswith(k))
            starts = {int(s.split(': ')[1]):i+1 for i,s in enumerate(lines) if s.startswith('SOURCE PDF PAGE: ')}
            for n,(title,author,first,last,topics) in enumerate(SPECS[suffix],1):
                start,end = starts[first], starts.get(last+1,len(lines)+1)-1
                # Shared last pages contain news/reviews after an article's footnotes.
                stop = 'News' if suffix == 'journal-73' and n == 1 else 'Book Review' if suffix == 'journal-73' and n == 5 else None
                if stop:
                    end = next(i for i in range(start-1,end) if lines[i].strip()==stop)
                if author == 'course-joint-credit':
                    author = 'Jamie Dunlop; Papu Sandhu; Greg Gilbert (joint course credit; lesson authors not individually assigned)'
                c = dict(title=title,author=author,pdfFirstPage=first,pdfLastPage=last,
                    printedPagination='Use file pages; printed pagination is edition-specific.',
                    lineStart=start,lineEnd=end,locator=f'PDF:{first}-{last}; derivative-lines:{start}-{end}',
                    sourceLabel=lines[start-1],topics=topics.split(','),kind='course-lesson' if suffix=='living-as-church' else 'article',
                    readableWords=len(re.findall(r'\b[\w\x27-]+\b','\n'.join(lines[start-1:end]))))
                w['locations'].append(c)
                text='\n'.join(lines[start-1:end])+'\n'
                cid=f'component-rb05-{suffix}-{n:02d}'
                p=CACHE/'components'/(cid+'.txt');p.parent.mkdir(parents=True,exist_ok=True)
                p.write_text(text,encoding='utf-8',newline='\n')
                components.append(dict(c,componentId=cid,parentWitnessAssetId=a['assetId'],
                    originalSha256=a['sha256'],fullDerivativeSha256=a['derivedText']['sha256'],
                    componentText=dict(path=p.relative_to(SITE).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),wordCount=c['readableWords']),
                    integrated=False,eligibleForScopedIntake=False,
                    pending='Per-contributor six-anchor evidence and/or scoped rights review; integrate attribution/quotation boundaries before changing parent hold.',
                    sourceRoles=['named article argument','Scripture quotation','quoted historical/opposing material','editorial/permission matter'],
                    publicHostingAllowed=False))
        else:
            w['locations']=[dict(title='Introduction: Obedience to Christ',author='John Leadley Dagg',lineStart=1,lineEnd=len(lines),
                locator=f'derivative-lines:1-{len(lines)}',sourceLabel=lines[0],kind='historical-introduction',topics=['discipleship','church-order'],readableWords=a['derivedText']['wordCount'])]
        works.append(w)
    chosen={'asset-expanded-0c6f553a8dc895a20a62','asset-expanded-96713948a37b71f4700e',
        'asset-expanded-c5ca78e52521b221e390','asset-expanded-3556faffa9c9d1a56bd6',
        'asset-expanded-471411e012fff5000c50','asset-expanded-1f5cb300123c4aec6043','asset-expanded-17609ab469487019e1b3'}
    for a in held:
        if a['assetId'] not in chosen:continue
        works.append(dict(assetId=a['assetId'],title=a['title'],author=a['author'],url=a['url'],relativePath=a['relativePath'],
            status='already-held-reused',originalSha256=a['actualSha256'],derivative=a.get('auditDerivative'),locations=old.epub_locations(a)))
    prior=json.loads((R.parent/'RB01/acquisition-manifest.json').read_text(encoding='utf-8'))
    for a in prior['files']:
        if a['workId']!='work-rb01-dagg-church-order':continue
        d=(SITE/a['derivedText']['path']).read_text(encoding='utf-8').splitlines()
        works.append(dict(assetId=a['assetId'],title=a['title'],author=a['author'],url=a['url'],relativePath=a['relativePath'],
            status='already-held-reused',originalSha256=a['sha256'],derivative=a['derivedText'],
            locations=[dict(title=a['title'],author=a['author'],lineStart=1,lineEnd=len(d),locator=f'derivative-lines:1-{len(d)}',
                sourceLabel=d[0],kind='historical-component',readableWords=a['derivedText']['wordCount'])]))
    # Reuse the RB04 collected edition, with reviewed body boundaries rather than
    # running page headings (which can precede the end of a previous essay).
    fuller_manifest=json.loads((R.parent/'RB04/acquisition-manifest.json').read_text(encoding='utf-8'))
    fuller=next(a for a in fuller_manifest['files'] if 'fuller-collected' in a['workId'])
    lines=(SITE/fuller['derivedText']['path']).read_text(encoding='utf-8').splitlines()
    fw={k:fuller[k] for k in ('assetId','workId','title','author','url','relativePath','edition')}
    fw.update(status='already-held-reused',originalSha256=fuller['sha256'],derivative=fuller['derivedText'],evidenceOnly=True,locations=[])
    fc=[]
    for n,(start,end,title) in enumerate([
        (157802,161322,'Ecclesiastical polity: private judgment, creeds, church formation, dissent, discipline and union'),
        (161323,161811,'On Ordination: reordination, lay ordination, administering the Supper and counsel to a young minister'),
        (161812,163106,'On Terms of Communion: infant baptism/communion, Carter, Ward, Serampore and unbaptized communicants'),
        (163107,163530,'On Instrumental Music in Christian Worship'),
        (163531,163754,'Thoughts on Singing (including closing footnote)')],1):
        text='\n'.join(lines[start-1:end])+'\n';cid=f'component-rb05-fuller-polity-{n:02d}'
        p=CACHE/'components'/(cid+'.txt');p.write_text(text,encoding='utf-8',newline='\n')
        c=dict(title=title,author='Andrew Fuller',lineStart=start,lineEnd=end,locator=f'derivative-lines:{start}-{end}',
            sourceLabel=lines[start-1],kind='historical-essay-band' if n<=3 else 'historical-essay',readableWords=len(re.findall(r'\b[\w\x27-]+\b',text)))
        fw['locations'].append(c)
        fc.append(dict(c,componentId=cid,parentWitnessAssetId=fuller['assetId'],originalSha256=fuller['sha256'],fullDerivativeSha256=fuller['derivedText']['sha256'],
            componentText=dict(path=p.relative_to(SITE).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),wordCount=c['readableWords']),
            integrated=False,eligibleForScopedIntake=True,publicHostingAllowed=False,
            theologicalEvidence='../RB04/admission-decisions.json; THEOLOGICAL-DISTINCTIONS.md',
            limitations='Complete selected band/essay, not a new book. Rough existing OCR includes running headings and quoted correspondents/opponents. Preserve Fuller strict-communion and worship arguments as his own positions.',
            sourceRoles=['Fuller argument','Scripture','quoted correspondents/opponents','running page headings']))
    works.append(fw)
    write('fuller-components.json',dict(mission='RB05',components=fc,parentHoldUnchanged=True,dbIngested=False,embedded=False))
    write('chapter-map.json',dict(mission='RB05',works=works,countRule='Reading units include lessons, articles, essay bands, parts, book chapters and front matter; not a new-book count or Scripture coverage percentage.'))
    write('selected-components.json',dict(mission='RB05',components=components,integrationStatus='Prepared exact private slices only; no DB intake; all journal parents remain evidenceOnly.'))
    md=['# RB05: church-study reading map','',
        'Exact locations are tied to original and derivative hashes in [chapter-map.json](chapter-map.json). PDF numbers below are **file pages**, starting at one. Selected article slices are private, advisory and awaiting contributor/rights intake checks; journal parents remain held.','',
        '| Study question | Useful starting locations | Distinction to retain |','|---|---|---|',
        '| Who belongs to a church? | Living as a Church lessons 1–2; Church Purity pp.3–12; Dagg ch.II; Keach reception/covenant | Credible profession and regenerate membership; no claim to read every heart. |',
        '| Who holds authority? | Living as a Church lesson5; Dagg ch.VIII; Keach sections2–3,6; Deacons pp.5–24 | Congregational keys, elder oversight and deacon service remain separate. |',
        '| How are elders formed? | Lay Elders pp.5–32; Spurgeon Lectures; Broadus partsI–V | Paid and unpaid elders have the same biblical character requirements; prudent schedules are applications. |',
        '| How does discipline restore? | Living as a Church lesson9; Discipline II pp.6–23,26–27; Boyce pp.13–14; Dagg ch.IX; Keach sections7–12 | Teach first; distinguish witnesses, private/public offences, restoration and contested resignation practices. |',
        '| Why and what do we sing? | Singing in the Church pp.4,6–44; Dagg ch.VII; held Keach Breach Repaired | DeYoung is a Presbyterian comparison; lyrics, tune, congregational participation and worship regulation are distinct questions. |',
        '| How do we hear and preach? | Broadus all five parts; Spurgeon 28 numbered lectures; Founders129 pp.18–44; Living as a Church lesson3 | Rhetorical technique serves exegesis; authorial interpretation and historical editorial editions remain attributed. |',
        '| How does the church pray and serve? | Living as a Church lessons4,6,10–11,13; Deacons; held Only a Prayer Meeting/Pastor in Prayer/Soul Winner | Corporate worship, ordinary fellowship and evangelism overlap without becoming identical duties. |','']
    for w in works:
        md += ['## '+w['title'],'',w['status']+' · `'+w['assetId']+'` · [Offered source]('+w['url']+')','',
            '| Unit / attributed author | Exact source location |','|---|---|']
        for c in w['locations']:
            md.append('| '+c['title'].replace('|','/')+' / '+c.get('author',w['author'])+' | `'+c['locator']+'` |')
        md.append('')
    (R/'READING-MAP.md').write_text('\n'.join(md).rstrip()+'\n',encoding='utf-8',newline='\n')
    print('MAPPED',len(works),'witnesses;',sum(len(w['locations']) for w in works),'reading units;',len(components),'private journal slices')


if __name__=='__main__':main()
