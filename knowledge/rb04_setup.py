"""Set up the approved RB04 author batches; preserve the initial report."""
import json, shutil
import bulk_collect as b

R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB04'
names=[('Owen','John',[1616,1683]),('Goodwin','Thomas',[1600,1680]),
 ('Sibbes','Richard',[1577,1635]),('Sibbs','Richard',[1577,1635]),
 ('Watson','Thomas',[1620,1686]),('Brooks','Thomas',[1608,1680]),
 ('Flavel','John',[1630,1691]),('Boston','Thomas',[1676,1677,1732]),
 ('Bunyan','John',[1628,1688]),('Fuller','Andrew',[1754,1815]),
 ('Booth','Abraham',[1734,1806]),('Edwards','Jonathan',[1703,1758])]
authors=[x for last,first,years in names for x in [last+', '+first,first+' '+last]]
rules=[{'namePattern':last+r',?\s+'+first+'|'+first+r'\s+'+last,'lifeYears':years}
 for last,first,years in names]
failed={}
for mission in ['RB00','RB01','RB02','RB03']:
 old=b.read(R.parent/mission/'failed-downloads.json',{})
 for x in old.get('items',[])+old.get('previouslyFailed',[]):
  if x.get('status')=='unattempted' or not (x.get('error') or x.get('status')=='failed'):continue
  source=x.get('source','ia');failed[(source,x['sourceId'])]=x
archive=b.ROOT/'ARCHIVE/rb04-initial-20261007';archive.mkdir(parents=True,exist_ok=True)
if not (R/'embedding-before.json').exists():
 for name in ['REPORT.md','acquisition-manifest.json']:
  if (R/name).exists() and not (archive/name).exists():shutil.copy2(R/name,archive/name)
 b.save(R/'embedding-before.json',b.read(b.ROOT/'KnowledgeBase/embedding-progress.json'))
for source in ['tcp','ccel','ia','monergism']:
 f={'authors':authors,'primaryAuthorOnly':True,'authorIdentityRules':rules,
    'deferHardDownloads':True,'skipIds':[id for s,id in failed if s==source]}
 if source=='tcp':
  f['authorIdentityRules']=[r|({'requireReligiousSubjectsWhenUndated':True} if 'Watson' in r['namePattern'] else {}) for r in rules]
 if source=='ia':
  f['collections']=['Princeton','americana','toronto','europeanlibraries','library_of_congress',
   'cdl','bostonpubliclibrary','getty','wellcomelibrary','gutenberg','microfilm']
  f['iaQuery']='mediatype:texts AND date:[1600-01-01 TO 1930-12-31] AND NOT access-restricted-item:true AND ('+' OR '.join('creator:"'+a+'"' for a in authors)+')'
 b.save(R/'filters'/f'{source}.json',f)
relevant=[x for (source,id),x in failed.items() if b.matches(x|{'subjects':'','sourceId':'prior-'+id}, {'authors':authors,'primaryAuthorOnly':True,'authorIdentityRules':rules})]
config={'mission':'RB04','title':'salvation, justification, assurance and sanctification',
 'filters':{source:f'filters/{source}.json' for source in ['tcp','ccel','ia','monergism']},
 'finalizeOnly':True,'previouslyFailed':relevant,
 'scope':'Complete offered historical author corpora for John Owen, Thomas Goodwin, Richard Sibbes, Thomas Watson, Thomas Brooks, John Flavel, Thomas Boston, John Bunyan, Andrew Fuller, Abraham Booth and Jonathan Edwards. TCP CC0 TEI; CCEL offered ThML; IA institutional and official microfilm editions dated 1600-1930 with existing TXT/EPUB; Monergism offered free EPUB/PDF editions. Canonical author identities exclude unrelated namesakes; contributor and edition notices retained. Private local import and embedding.'}
b.save(R/'mission.json',config)
print(json.dumps({'before':b.read(R/'embedding-before.json')['total'],'priorFailed':len(relevant),'filters':list(config['filters'])}))
