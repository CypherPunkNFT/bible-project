"""Deterministic, source-hashed RB10 ethics reading map; no fetch/model/DB writes."""
import hashlib
import importlib.util
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import unquote
from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB10'
CACHE = SITE / '.local/library/run-rb10-2026-10-07'
sp = importlib.util.spec_from_file_location('locations', SITE / 'scripts/map-rb04.py')
lib = importlib.util.module_from_spec(sp)
sp.loader.exec_module(lib)
def read(name): return json.loads((R / name).read_text(encoding='utf-8'))
def write(name, value): (R / name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
def sha(raw): return hashlib.sha256(raw).hexdigest()

HELD = {
 'watson-law':'asset-expanded-28f606b1d75204c407c5',
 'watson-beatitudes':'asset-expanded-7a3ec2d6ad154f5650e0',
 'watson-contentment':'asset-expanded-6a41e810',
 'watson-godly':'asset-expanded-8a34bac',
 'ryle-practical':'asset-expanded-9a36485f458d25880bdf',
 'ryle-forgiveness':'asset-expanded-406adfda0365ff1667a5',
 'plumer-law':'asset-expanded-055d90ed37da03c9cfb5',
 'piper-light':'asset-modern-piper-a750dc8708d67b661255-epub',
 'steele-tradesman':'asset-expanded-eb7ad9ce89c3bc19e6d5',
 'perkins-vocations':'asset-expanded-a1eb952f4be6ebda9e59',
 'owen-mortification':'asset-expanded-cc625a129188762da130',
 'murray-sanctification':'asset-rb04-0309d1a642bea2895f0a',
}
CONTRIBUTORS = {
 'fgb-conscience':['Arthur W. Pink','Richard Sibbes','William Perkins','William Fenner','Arthur W. Pink','John Flavel','William Fenner','John Flavel','Arthur W. Pink','J. C. Ryle','Charles H. Spurgeon'],
 'fgb-forgiveness':['Jay E. Adams','J. C. Ryle','Charles H. Spurgeon','John MacArthur, Jr.','Jim Wilson','John Flavel'],
 'fgb-good-works':['Charles H. Spurgeon','D. Martyn Lloyd-Jones','Arthur W. Pink','Horatius Bonar','Ebenezer Erskine','Thomas Manton','Ebenezer Erskine','John Bunyan','John Bunyan'],
}
CHAPTERS = [(11,'Being Radically Christian'),(19,'The Story of Redemption'),(31,'Reasons for Obeying Christ'),(41,'Serving Christ in Our Knowledge'),(49,'Contrasts with the World'),(63,'Basic Spiritual Resources'),(67,'Resources from Theology, Especially the Reformation'),(73,'Abraham Kuyper and His Successors'),(81,'Newer Resources'),(95,'Christ the Lord of Life and Religion'),(103,'Politics'),(111,'Science'),(117,'Art'),(119,'The Future'),(123,'Education'),(127,'Work'),(137,'Traps in Motivation'),(145,'Traps in Norms'),(153,'Traps in Situations'),(159,'Traps in Our Future Hopes'),(173,'Conclusion'),(175,'Appendix: The Two Kingdoms View'),(209,'Bibliography'),(214,'General Index'),(220,'Scripture Index')]

def main():
    acquired = read('acquisition-manifest.json')['files']
    held = read('holdings-audit.json')['files']
    selected = {key: next(a for a in held if a['assetId'].startswith(aid)) for key, aid in HELD.items()}
    selected.update({a['workId'].removeprefix('work-rb10-'): a for a in acquired})
    works = []; by = {}; components = []
    for key,a in selected.items():
        d = a.get('auditDerivative') or a.get('derivedText')
        assert d and sha((SITE/d['path']).read_bytes()) == d['sha256']
        text = (SITE/d['path']).read_text(encoding='utf-8'); lines = text.splitlines()
        w = {k:a.get(k) for k in ['assetId','workId','title','author','edition','url','relativePath']}
        w.update(key=key, originalSha256=a.get('actualSha256',a.get('sha256')), derivative=d,
          status='already-held-reused' if key in HELD else 'new-readable-original', locations=[])
        if key=='ryle-practical': w.update(displayTitle='Practical Religion',identityNote='Preserve legacy source-catalogue typo Practical Relgion; no original metadata rewrite.')
        if a['relativePath'].endswith('.epub'):
            w['locations'] = lib.epub_locations(a)
            if key in CONTRIBUTORS:
                article_units = w['locations'][2:-1]
                assert len(article_units)==len(CONTRIBUTORS[key])
                with zipfile.ZipFile(SOURCES/a['relativePath']) as z:
                    for u,author in zip(article_units,CONTRIBUTORS[key]):
                        doc = BeautifulSoup(z.read(u['member']),'html.parser'); body = (doc.body or doc).get_text('\n',strip=True)
                        u.update(kind='complete-issue-article-or-contextual-excerpt',author=author,underlyingCompleteBook=False)
                        name = a['assetId']+'-'+Path(u['member']).stem+'.txt'; p = CACHE/'components'/name
                        p.parent.mkdir(parents=True,exist_ok=True); p.write_text(body,encoding='utf-8',newline='\n')
                        components.append(dict(parentAssetId=a['assetId'],parentSha256=w['originalSha256'],title=u['title'],author=author,
                          sourceLocator=u['locator'],member=u['member'],derivedText=dict(path=p.relative_to(SITE).as_posix(),sha256=sha(p.read_bytes()),wordCount=len(re.findall(r"\b[\w'-]+\b",body))),
                          scope='Article/excerpt includes editor annotations, quotations and author bio; linked note members remain in the parent. Not a new whole underlying book.',
                          eligibleForScopedIntake=False,evidenceOnly=True,publicHostingAllowed=False,
                          holds=['Per-contributor and annotation/quotation integration','Modern compilation/contributor rights','Reconcile overlap with already held full works']))
        elif a['relativePath'].endswith('.pdf'):
            starts = {int(s.removeprefix('SOURCE PDF PAGE: ')):i+1 for i,s in enumerate(lines) if s.startswith('SOURCE PDF PAGE: ')}
            assert len(starts)==226
            for page,start in starts.items():
                w['locations'].append(dict(title=f'Source PDF page {page}',sourceLabel=lines[start-1],locator=f'pdf-page:{page}',sourcePdfPageStart=page,sourcePdfPageEnd=page,lineStart=start,lineEnd=starts.get(page+1,len(lines)+1)-1,kind='source-pdf-page-not-chapter'))
            for i,(printed,title) in enumerate(CHAPTERS):
                end=CHAPTERS[i+1][0]-1 if i+1<len(CHAPTERS) else 225
                start=starts[printed+1];last=starts.get(end+2,len(lines)+1)-1
                w['locations'].append(dict(title=title,sourceLabel=lines[start-1],locator=f'printed-pages:{printed}-{end}',printedPageStart=printed,printedPageEnd=end,sourcePdfPageStart=printed+1,sourcePdfPageEnd=end+1,lineStart=start,lineEnd=last,kind='chapter-or-apparatus-range'))
            w['printedPageOffset']=1
        else:
            w['locations'].append(dict(title=a['title'],sourceLabel=lines[0],locator=f'derivative-lines:1-{len(lines)}',lineStart=1,lineEnd=len(lines),kind='complete-authored-text'))
            if key in ['bingham-conscience','lawrence-scrupulous','reju-conscience']:
                doc=BeautifulSoup((SOURCES/a['relativePath']).read_bytes(),'html.parser')
                headings=[h.get_text(' ',strip=True) for h in doc.select('.article-content-wrap h2,.article-content-wrap h3,.article-content-wrap h4')]
                points=[]
                for heading in headings:
                    start=next(i+1 for i,s in enumerate(lines) if ' '.join(s.split())==heading)
                    points.append((start,heading))
                for i,(start,title) in enumerate(points):
                    end=points[i+1][0]-1 if i+1<len(points) else len(lines)
                    w['locations'].append(dict(title=title,sourceLabel=lines[start-1],locator=f'derivative-lines:{start}-{end}',lineStart=start,lineEnd=end,kind='actual-source-heading-range'))
        works.append(w);by[key]=w
    def e(key,*needles):
        w=by[key];units=[]
        for needle in needles:
            matches=[u for u in w['locations'] if needle.casefold() in u['title'].casefold()]
            assert matches,(key,needle)
            units.extend(matches)
        return dict(assetId=w['assetId'],work=w.get('displayTitle',w['title']),author=w['author'],originalSha256=w['originalSha256'],status=w['status'],locations=units)
    paths=[]
    def path(topic,question,purpose,limits,*entries):
        paths.append(dict(topic=topic,question=question,purpose=purpose,limitations=limits,entries=list(entries),inferredFromVectors=False,coverageKind='Qualified source reading path, not an exhaustive ethical verdict'))
    path('gospel-and-good-works','Why pursue good works if salvation is by grace alone?','Read redemption and motives before duty; distinguish saving merit, fruit of faith and final rewards.','Anthology voices and source excerpts retain their own arguments; reward is not a second basis of justification.',e('fgb-good-works','Works, Grace','Good Works and the Justified','Best Way'),e('poythress-lordship','Story of Redemption','Reasons for Obeying'),e('murray-sanctification','Definitive'))
    path('conscience','How can a conscience be corrected rather than merely obeyed?','Compare scriptural formation, corrupted conscience, testimony and gospel peace.','Conscience is fallible and subordinate to Scripture; historic fear language is not automatically a pastoral prescription.',e('bingham-conscience','1.','2.','3.','4.'),e('fgb-conscience','Nature of Conscience','Duties of Conscience','Corrupted Conscience','Peaceful Conscience'),e('plumer-law','Rules for Conscience'))
    path('christian-freedom','When may a pastor bind my conscience?','Trace biblical warrant, personal prudence and the difference between private counsel and public teaching.','The schooling case is a worked example, not a compulsory school policy; freedom does not erase responsibility.',e('reju-conscience','An Example','Private Ministry','Public Ministry'),e('poythress-lordship','Traps in Norms','Traps in Situations'))
    path('scrupulous-conscience','How should a tender or excessively fearful conscience be cared for?','Compare gospel resources, patient care, self-examination and reassurance in Christ.','Lawrence clinical/OCD/medication observations remain author context; no medical inference or project diagnosis. Fear alone neither proves guilt nor innocence.',e('lawrence-scrupulous','Two Categories','Three Resources','One Posture'),e('fgb-conscience','Sin-Burdened','Peaceful'))
    path('truthfulness','What does truthfulness require in speech and business?','Read the ninth commandment alongside a sustained tradesman treatment of truth.','Historic cases, oath language and commercial conventions require context; commercial integrity is not exhausted by avoiding literal falsehood.',e('watson-law','Ninth Commandment'),e('plumer-law','Ninth Commandment'),e('steele-tradesman','Of Truth'))
    path('money','How should I judge wealth, coveting and the use of money?','Join the eighth/tenth commandments to love of wealth, spiritual danger and deployment of resources.','Owning possessions and greed are distinct; do not turn historic economic assumptions into universal modern policy.',e('watson-law','Eighth Commandment','Tenth Commandment'),e('piper-light','Dangers of Money','Deployment'),e('ryle-practical','Riches and Poverty'))
    path('generosity','How do mercy and generosity address the needs of others?','Read positive duties of mercy and love together with riches, poverty and use of resources.','Source applications require context; these are not comprehensive present-day relief, budgeting or public-policy manuals.',e('watson-beatitudes','merciful'),e('ryle-practical','7. Love','Riches and Poverty'),e('piper-light','Deployment'),e('fgb-good-works','Zealous of Good Works'))
    path('work','Why does ordinary work matter to Christ, and how should I do it?','Compare modern gospel-based vocation with choosing a calling, diligence and useful loving labor.','Perkins and Steele retain historic social hierarchies and occupational assumptions; Poythress is Presbyterian, not a Baptist polity manual.',e('poythress-lordship','Work'),e('steele-tradesman','Choosing a Calling','Of Diligence'),e('perkins-vocations','Personal Calling','Right Use of Callings','profitable','(2) Love.'))
    path('justice','What do justice and fairness require in everyday dealings?','Begin with business justice, protection of life, property and truthful treatment rather than partisan commentary.','This path covers moral duties and fair dealings, not a complete theory of state policy; older examples need legal/historical context.',e('steele-tradesman','Of Justice'),e('watson-law','Sixth Commandment','Eighth Commandment','Ninth Commandment'),e('perkins-vocations','(2) Injustice.'))
    path('forgiveness','How do forgiveness, repentance, reconciliation and bitterness relate?','Compare Adams and MacArthur with Spurgeon, Flavel and Ryle while retaining distinct senses of forgiveness.','Do not collapse a forgiving disposition, formal forgiveness and restored trust. Wilson is a scoped contributor under integration hold, not author/family-wide approval; no demand to conceal harm or remove accountability is inferred.',e('fgb-forgiveness','What Is Forgiveness','Conditional or Unconditional','Divine Forgiveness','Father, Forgive','How to Be Free'),e('ryle-forgiveness','Way of Forgiveness','Marks of Having'))
    path('sexual-holiness','How do sexual holiness and purity involve both heart and conduct?','Read the seventh commandment, purity of heart, desire and Spirit-dependent mortification.','Historic gender/social descriptions remain attributable; these sections do not constitute a modern clinical or safeguarding manual.',e('watson-law','Seventh Commandment'),e('watson-beatitudes','pure in heart'),e('piper-light','Dangers of Sex','Deployment'),e('owen-mortification','Chapter III','Chapter VI','Chapter IX'))
    path('neighbors','What does love require toward neighbors and in conflict?','Trace love, mercy, peacemaking, truth and the refusal of vindictive bitterness.','Peace and charity do not erase justice, confession or appropriate accountability; distinguish source teaching from inferred project policy.',e('watson-law','Of Love','Sixth Commandment'),e('watson-beatitudes','merciful','peacemakers'),e('watson-godly','Good in His Relationships'),e('ryle-practical','7. Love'),e('fgb-forgiveness','Divine Forgiveness'))
    path('contentment','How can contentment resist coveting without neglecting duty?','Pair a full contextual treatment with the tenth commandment and practical business contentment.','Contentment is not permission to ignore injustice or the needs of dependents; historical examples remain situated.',e('watson-contentment','Resolving of Some Questions','Nature of Contentment','Three Cautions','RULES about Contentment'),e('watson-law','Tenth Commandment'),e('steele-tradesman','Contentment'))
    write('chapter-map.json',dict(mission='RB10',works=works,unitCount=sum(len(w['locations']) for w in works),qualification='Locations include PDF pages, NCX entries and source heading ranges; not a count of unique new chapters or admitted DB passages.'))
    write('reading-paths.json',dict(mission='RB10',paths=paths,scope='Source-supported ethics paths covering every requested topic; table before any graph.'))
    write('selected-components.json',dict(mission='RB10',components=components,componentCount=len(components),notNewUnderlyingBooks=True,ingested=False,embedded=False))
    rows=['# RB10: Christian ethics - question-to-work/section table','','Thirteen qualified reading paths join seven new readable witnesses to twelve selected held witnesses. Each source entry has its original SHA-256 and exact locations in [reading-paths.json](reading-paths.json) and [chapter-map.json](chapter-map.json). A reading path records source arguments; it does not turn every historic application into project policy.','','| Ethical question | Work / author and actual sections | Benefit and limits |','|---|---|---|']
    for p in paths:
        entries=[]
        for x in p['entries']:
            sections='; '.join(u['title']+(' - '+u['author'] if u.get('author') else '')+' ('+u['locator']+')' for u in x['locations'])
            entries.append(x['work']+' - '+x['author']+': '+sections)
        rows.append('| '+p['question']+' | '+'<br>'.join(entries).replace('|','/')+' | '+p['purpose']+' '+p['limitations']+' |')
    rows+=['','## Keep the voices distinct','','FGB 184 retains Adams on forgiveness as a promise, MacArthur on conditional/unconditional senses, Spurgeon on imitating divine forgiveness, Flavel on Luke 23:34 and Ryle on pardon in Christ. Their applications are compared rather than synthesized into an unqualified reconciliation rule. Jim Wilson remains a scoped Ephesian bitterness witness with a contributor hold.','','FGB 261 contains eleven articles/excerpts by seven historical authors; FGB 184 six by six authors; FGB 199 nine by seven authors. The [26 component records](selected-components.json) retain bylines, members, parent hashes and private derivative hashes. Linked endnotes remain in the full parent; components are not self-contained editions or licensed DB input.','','Poythress chapter 16 Work begins on printed p.127 / source PDF p.128. Its mapped range runs through printed p.136 / source p.137, retaining the following part separator and blank page before chapter 17. PDF page offset is +1. His Politics chapter and two-kingdom appendix are preserved in the whole acquired book, attributed in scope, and excluded from these daily-ethics paths.','','John Murray is represented by the already-held Definitive Sanctification essay. A missing authorized Principles of Conduct / Sanctity of Truth witness remains a rights gap, not a fabricated acquisition. Ryle legacy catalogue spelling Practical Relgion is preserved with the display correction separately recorded.','','Personal-reading offers do not settle retrieval-system or republication permission. See [THEOLOGICAL-SCOPE.md](THEOLOGICAL-SCOPE.md), [INTAKE-NOTES.md](INTAKE-NOTES.md) and [checkpoint.json](checkpoint.json). No new DB, embedding or graph run.']
    rows += ['', '[Eighteen explicit Scripture/source connections](SCRIPTURE-GROUNDS.md) show selected biblical grounds with exact citation positions; a citation does not by itself establish complete passage exposition.']
    (R/'READING-MAP.md').write_text('\n'.join(rows)+'\n',encoding='utf-8',newline='\n')
    print('MAPPED',len(works),'witnesses;',sum(len(w['locations']) for w in works),'locations;',len(paths),'questions;',len(components),'private issue components')
if __name__=='__main__': main()
