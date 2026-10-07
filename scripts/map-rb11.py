"""Deterministic prayer/worship reading table and Psalm map, no network or DB."""
import hashlib,importlib.util,json,re,zipfile
from pathlib import Path
from bs4 import BeautifulSoup
from bible.paths import SOURCES
SITE=Path(__file__).resolve().parents[1];R=SITE/'content/library/reports/reformed-baptist-overnight/RB11';CACHE=SITE/'.local/library/run-rb11-2026-10-07'
s=importlib.util.spec_from_file_location('l',SITE/'scripts/map-rb04.py');l=importlib.util.module_from_spec(s);s.loader.exec_module(l)
def read(n):return json.loads((R/n).read_text('utf-8'))
def write(n,d):(R/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def sha(b):return hashlib.sha256(b).hexdigest()
HELD={'bunyan':'95206958417ae17aecee','pink-fervent':'c95bd085ec490fad1afb','pink-lord':'0fefd9c7b881e3eaa13b','spurgeon-meeting':'3556faffa9c9d1a56bd6','spurgeon-pastor':'1f5cb300123c4aec6043','watson-lord':'a08aadda11a797228758','owen-prayer':'a2118ce21bc943b69fb3','henry-method':'517c7414bd2a1c3a5f57','burroughs-worship':'b81ccea5afe46ebbaf65','keach-singing':'17609ab469487019e1b3','charnock-worship':'6dd50b143f402ae19b0b','alexander-family':'c17152ddf72a788ab047','fgb-family':'rb06-b31827789866393c629c','spurgeon-treasury-part2':'72330f20d97109e0a527','founders-worship':'rb01-6cb66fe34df3aed304e9','grier-psalmody':'859adbe720b9067a3f9a','westminster-directory':'3b278cea6aaadaedad96'}
def main():
    held=read('holdings-audit.json')['files'];acq=read('acquisition-manifest.json')['files']
    chosen={k:next(a for a in held if a['assetId'].endswith(v)) for k,v in HELD.items()};chosen.update({a['workId'].removeprefix('work-rb11-'):a for a in acq})
    works=[];by={};components=[]
    for k,a in chosen.items():
        d=a.get('auditDerivative') or a.get('derivedText');assert d and sha((SITE/d['path']).read_bytes())==d['sha256']
        text=(SITE/d['path']).read_text('utf-8');lines=text.splitlines()
        w={f:a.get(f) for f in ['assetId','workId','title','author','edition','url','relativePath']};w.update(key=k,originalSha256=a.get('actualSha256',a.get('sha256')),derivative=d,status='already-held-reused' if k in HELD else 'new-readable-original',locations=[])
        if a['relativePath'].endswith('.epub'):
            w['locations']=l.epub_locations(a)
            if k.startswith('spurgeon-treasury'):
                with zipfile.ZipFile(SOURCES/a['relativePath']) as z:
                    for u in w['locations']:
                        if not u['anchorPresent']:
                            candidates=[]
                            for n in z.namelist():
                                if not n.endswith(('.html','.xhtml')):continue
                                doc=BeautifulSoup(z.read(n),'html.parser')
                                for h in doc.select('h3'):
                                    if h.get_text(' ',strip=True)==u['title']:
                                        candidates.append((n,doc,h))
                            assert len(candidates)==1,(u['title'],len(candidates))
                            n,doc,h=candidates[0];number=re.fullmatch(r'Psalm (\d+)',u['title']).group(1);anchor='p'+number
                            assert doc.find(id=anchor) is not None
                            u.update(resolvedLocator=n+'#'+anchor,resolvedMember=n,resolvedAnchorPresent=True,sourceNavigationDefect='Original NCX member/anchor absent; actual unique Psalm heading and named anchor verified. Original NCX remains unchanged.')
        else:
            w['locations']=[dict(title=a['title'],sourceLabel=lines[0],locator=f'derivative-lines:1-{len(lines)}',lineStart=1,lineEnd=len(lines),kind='complete-offered-written-body')]
            if k.startswith('chbc-') or k.endswith('-corporate'):
                doc=BeautifulSoup((SOURCES/a['relativePath']).read_bytes(),'html.parser');node=doc.select_one(a['selector']);heads=[h.get_text(' ',strip=True) for h in node.select('h2,h3,h4')]
                starts=[]
                for h in heads:
                    matches=[i+1 for i,x in enumerate(lines) if ' '.join(x.split())==' '.join(h.split())]
                    if len(matches)==1:starts.append((matches[0],h))
                starts.sort()
                for i,(start,h) in enumerate(starts):
                    end=starts[i+1][0]-1 if i+1<len(starts) else len(lines)
                    w['locations'].append(dict(title=h,sourceLabel=lines[start-1],locator=f'derivative-lines:{start}-{end}',lineStart=start,lineEnd=end,kind='actual-heading-range'))
        if k=='spurgeon-treasury-part2':w.update(displayTitle='The Treasury of David: digital part 2, Psalms 88–150',identityNote='Actual EPUB NCX restricts this witness to Psalms 88–150; do not describe it as complete all-Psalms edition.')
        if k=='founders-worship':w.update(author='Jon English Lee',identityNote='Explicit displayed author link in held original; legacy institutional author field retained in original manifest/provenance. Office Admin is uploader; Stan Reeves is cited confession translator, not essay author. Nested Dawn/Brueggemann citations remain unapproved quotation roles.')
        if k in ['grier-psalmody','westminster-directory']:w['role']='already-held-disputed-practice-comparison-not-Baptist-default'
        works.append(w);by[k]=w
    psalms=[]
    for k in ['spurgeon-treasury-part1','spurgeon-treasury-part2']:
        w=by[k]
        for u in w['locations']:
            m=re.fullmatch(r'Psalm (\d+)',u['title'])
            if m:psalms.append(dict(book='Psalms',chapter=int(m[1]),assetId=w['assetId'],originalSha256=w['originalSha256'],sourceLocator=u['locator'],readableLocator=u.get('resolvedLocator',u['locator']),member=u.get('resolvedMember',u['member']),anchorPresent=u.get('resolvedAnchorPresent',u['anchorPresent']),originalNcxAnchorPresent=u['anchorPresent'],status=w['status'],coverageKind='Whole offered Psalm commentary unit; exposition plus attributed notes/hints, not all quotation voices approved'))
    psalms.sort(key=lambda p:p['chapter']);assert [p['chapter'] for p in psalms]==list(range(1,151))
    w=by['spurgeon-treasury-part1'];a=chosen['spurgeon-treasury-part1']
    with zipfile.ZipFile(SOURCES/a['relativePath']) as z:
        for number in [1,5,22,23,51,63,84,86]:
            u=next(u for u in w['locations'] if u['title']==f'Psalm {number}');doc=BeautifulSoup(z.read(u['member']),'html.parser');nodes=[x for x in (doc.body or doc).strings if x.strip()];strings=[str(x).strip() for x in nodes]
            heading=next(h for h in doc.select('h3') if h.get_text(' ',strip=True)==f'Psalm {number}')
            start=next(i for i,x in enumerate(nodes) if heading in x.parents)
            stop=next((i for i in range(start+1,len(nodes)) if any(p.name=='h3' for p in nodes[i].parents) and re.fullmatch(r'Psalm \d+',strings[i]) and strings[i]!=f'Psalm {number}'),len(strings));section=strings[start:stop]
            exposition=section.index('EXPOSITION');notes=next(i for i in range(exposition+1,len(section)) if 'EXPLANATORY NOTES' in section[i] and section[i]==section[i].upper())
            body='\n'.join(section[exposition:notes]);assert len(body.split())>200
            p=CACHE/'components'/f'{a["assetId"]}-psalm-{number}-exposition.txt';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body+'\n',encoding='utf-8',newline='\n')
            components.append(dict(parentAssetId=a['assetId'],parentSha256=a['sha256'],author='Charles H. Spurgeon',title=f'Psalm {number}: Exposition',sourceLocator=u['locator'],member=u['member'],startStringIndex=start+exposition,endStringIndexExclusive=start+notes,extraction='Exact stripped DOM text between uppercase EXPOSITION and EXPLANATORY NOTES headings within this Psalm; embedded quotations remain source quotations.',derivedText=dict(path=p.relative_to(SITE).as_posix(),sha256=sha(p.read_bytes()),wordCount=len(re.findall(r"\b[\w'-]+\b",body))),evidenceOnly=True,eligibleForScopedIntake=False,publicHostingAllowed=False))
    def entry(k,*needles):
        w=by[k];units=[]
        for n in needles:
            matches=[u for u in w['locations'] if n.casefold() in u['title'].casefold()];assert matches,(k,n);units.extend(matches)
        return dict(assetId=w['assetId'],work=w.get('displayTitle',w['title']),author=w['author'],originalSha256=w['originalSha256'],status=w['status'],locations=units)
    paths=[]
    def path(topic,q,benefit,limits,*e):paths.append(dict(topic=topic,question=q,benefit=benefit,limitations=limits,entries=list(e),coverageKind='Qualified source reading path, not exhaustive passage exposition or project worship policy',inferredFromVectors=False))
    path('private-prayer','What is prayer, and how do we pray through Christ by the Spirit?','Join Bunyan’s definition, Owen’s Scripture exposition and a Baptist written lesson to Mathis’s gospel ground.','Bunyan’s polemic on prescribed forms and Owen’s historical controversy retain their own context.',entry('bunyan','What Prayer Is','What it is to Pray in the Spirit'),entry('owen-prayer','Chapter III.','Chapter IV.'),entry('chbc-prayer1','Class 4'),entry('mathis-habits','Chapter 7'))
    path('private-prayer','How can private prayer become steady rather than mechanical?','Read practical secret-prayer and constancy chapters with the whole hindrances lesson.','Habits are means of grace, not meritorious techniques or a promise of immediate desired outcomes.',entry('mathis-habits','Chapter 8','Chapter 9'),entry('chbc-prayer2','Class 5'))
    path('scripture-shaped-prayer','How do apostolic prayers shape our petitions?','Follow Hebrews, Peter and Jude with praise, confession and intercession.','Pink is a contextual Baptist writer, not a substitute for the passage itself.',entry('pink-fervent','Chapter 1:','Chapter 3:','Chapter 5:'),entry('henry-method','Adoration','Confession','Intercession'))
    path('corporate-prayer','Why pray as a congregation rather than only as individuals?','Compare biblical-theology mediation, shared dependence and historic prayer meetings.','Hamilton’s leader typology is an analogy; Christ remains the sole saving mediator.',entry('hamilton-corporate','Biblical Theology'),entry('dever-corporate','Use and Importance'),entry('spurgeon-meeting','Prayer-meetings:'))
    path('corporate-prayer','How should a church prepare public prayers and intercession?','Use an actual Baptist interview, pastoral prayers and Scripture-shaped categories.','Dever’s service arrangement and timings are illustrative; samples are not a prescribed liturgy.',entry('dever-corporate','Use and Importance'),entry('spurgeon-pastor','INTERCESSION FOR SAINTS','INTERCESSION FOR ONE ANOTHER'),entry('henry-method','Intercession','Some forms'))
    path('family-worship','What warrants family worship, and how can a household begin?','Reuse a substantial complete treatise and actual FGB family-prayer sections.','Alexander is Presbyterian; historical family authority, infant-baptism premises and disciplinary conventions do not become Baptist policy.',entry('alexander-family','CHAP. 1.','CHAP. 14.','CHAP. 18.'),entry('fgb-family','Nature, Warrant','Implementing','Women Leading'))
    path('family-worship','How can Scripture, singing and prayer serve children and an afflicted household?','Locate reading, psalmody, children and affliction chapters rather than recollect another tract compilation.','Family service order and household leadership examples are attributed applications, not a single universal script.',entry('alexander-family','CHAP. 4.','CHAP. 8.','CHAP. 15.','CHAP. 16.'),entry('fgb-family','Word of God','Seven Reasons'))
    path('psalms','How can the Psalms teach lament, repentance, trust and praise?','Add missing commentary and locate Psalms 5, 22, 23, 51, 63, 84 and 86; all 150 source units mapped separately.','Spurgeon’s own exposition and attributed historic notes retain separate roles. Exegetical commentary is not an exclusive-psalmody prescription.',entry('spurgeon-treasury-part1','Psalm 5','Psalm 22','Psalm 23','Psalm 51','Psalm 63','Psalm 84','Psalm 86'),entry('spurgeon-treasury-part2','Psalm 130','Psalm 145','Psalm 150'))
    path('lords-prayer','What do the Lord’s Prayer’s petitions teach us to desire?','Compare concise Pink exposition, sustained Watson treatment and Henry’s paraphrase.','Pink enumerates seven petitions; Watson’s headings use a six-petition structure. Do not merge numbering or silently settle Matt.6:13 textual traditions.',entry('pink-lord','Chapter 1:','Chapter 2:','Chapter 6:','Chapter 8:','Chapter 9:'),entry('watson-lord','First Petition','Fifth Petition','Sixth Petition'),entry('henry-method','Paraphrase'))
    path('reverent-worship','How can worship be reverent, spiritual and shaped by Scripture?','Read Burroughs on preparation and prayer, Charnock’s argument and the held confessional chapter with Mathis.','Burroughs/Charnock are non-Baptist Puritans. Source doctrine of worship is retained; no new binding service order inferred.',entry('burroughs-worship','Sermon III','Sermon XIV'),entry('charnock-worship','General Propositions','Why we must'),entry('founders-worship','Chapter 22'),entry('mathis-habits','Chapter 14','Chapter 15'))
    path('disputed-worship-practices','How should psalms, hymns, written prayers and church practices be compared?','Keep Keach’s singing case, Grier’s exclusive-psalmody objections, Dever’s prayer practice and the historic Directory distinct.','Already-held comparison only. No exclusive psalmody, instrument policy, prescribed prayer book or Presbyterian sacramental polity is adopted as Baptist consensus.',entry('keach-singing','Chapter 9.','Chapter 13.','Chapter 14.'),entry('grier-psalmody','Objections','Supplementary'),entry('dever-corporate','Use and Importance'),entry('westminster-directory','Publick Prayer','Singing of Psalms'))
    write('chapter-map.json',dict(mission='RB11',works=works,unitCount=sum(len(w['locations']) for w in works),qualification='NCX and exact derivative ranges; navigation count is not new works, passages or DB records.'))
    write('reading-paths.json',dict(mission='RB11',paths=paths));write('psalm-coverage.json',dict(mission='RB11',chapters=psalms,newChapters=87,reusedChapters=63,notOriginalSevenVolumeCollation=True))
    write('selected-components.json',dict(mission='RB11',components=components,componentCount=len(components),ingested=False,embedded=False))
    rows=['# RB11: prayer and worship — question-to-work/section table','','Six new witnesses join seventeen selected held witnesses. Exact source locations and hashes are in [chapter-map.json](chapter-map.json) and [reading-paths.json](reading-paths.json). These are source-supported study routes, not imposed worship rules.','','| Study question | Actual works and sections | Benefit / distinction |','|---|---|---|']
    for p in paths:
        es=[x['work']+' — '+str(x['author'])+': '+'; '.join(u['title']+' (`'+u['locator']+'`)' for u in x['locations']) for x in p['entries']]
        rows.append('| '+p['question']+' | '+'<br>'.join(es).replace('|','/')+' | '+p['benefit']+' '+p['limitations']+' |')
    rows+=['','The [150-Psalm table](PSALM-COVERAGE.md) joins the newly acquired digital part 1 (Psalms 1–87) to held part 2 (88–150). This is complete chapter navigation for the offered two-part digital edition, not verification of every page of the original seven print volumes. Eight private exposition samples have exact DOM boundaries in [selected-components.json](selected-components.json); neither these nor parents are admitted DB inputs.','','See [THEOLOGICAL-SCOPE.md](THEOLOGICAL-SCOPE.md) and [INTAKE-NOTES.md](INTAKE-NOTES.md) for quotation, edition, practice and permission boundaries.']
    (R/'READING-MAP.md').write_text('\n'.join(rows)+'\n',encoding='utf-8',newline='\n')
    rows=['# Treasury of David: readable Psalm coverage','','New digital part 1: Psalms 1–87. Held digital part 2: Psalms 88–150. Whole Psalm units include Spurgeon exposition, attributed explanatory notes and preaching hints. Scripture chapter coverage is not approval of every quoted commentator.','','| Psalm | Witness | Source locator |','|---|---|---|']
    rows += ['| '+str(p['chapter'])+' | '+p['status']+' / '+p['assetId']+' | `'+p['readableLocator']+'`'+(' (original NCX link defective; corrected reading locator)' if not p['originalNcxAnchorPresent'] else '')+' |' for p in psalms]
    (R/'PSALM-COVERAGE.md').write_text('\n'.join(rows)+'\n',encoding='utf-8',newline='\n')
    print('MAPPED',len(works),'witnesses',sum(len(w['locations']) for w in works),'units',len(paths),'questions',len(psalms),'Psalms',len(components),'private exposition samples')
if __name__=='__main__':main()
