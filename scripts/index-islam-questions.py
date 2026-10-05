"""Build a sourced editorial comparison desk; never manufacture debate transcripts."""
import importlib.util
from pathlib import Path
SITE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('l10',SITE/'scripts/catalog-islam-studies.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
OUT=c.OUT; write=c.write

def ref(key,locator):return dict(workId='work-l10-'+key,url=c.URL.get(key,c.acq.BOOKS[key][2] if key in c.acq.BOOKS else ''),locator=locator)
def q(ch,v):return dict(url=f'https://quran.com/{ch}/{v}',locator=f'Qur’an {ch}:{v}',translator='Mustafa Khattab, The Clear Quran',role='opposing-position',verification='Displayed English translation and passage context consulted; no independent Arabic philological certification.')
def bible(book,ch,v,end=None):return c.h.passage([book,ch,v,ch,end or v],'citation','Editorial comparison anchor; not an assertion that the paired apologist expounds this entire range.')
def standard(ch,part):return dict(workId=f'work-l08-wcf-chapter-{ch:03}',locator=f'Westminster Confession {ch}.{part}',role='confessional-standard')

def build():
    cards=[]
    def card(key,question,teaching,muslim,premises,objection,reply,christian,context,passages,limits,holdings):
        cards.append(dict(id='question-l10-'+key,topic=key,question=question,christianClaim=teaching,muslimClaim=muslim,premises=premises,seriousObjection=objection,christianResponse=reply,
          attribution='Editorial reconstruction anchored to the sources below. Only explicitly named article arguments are attributed to an apologist; this is not a debate transcript or a claim of consensus among Muslims.',
          christianEvidence=christian,muslimEvidence=context,scripture=passages,relatedHoldingIds=['work-l10-'+x for x in holdings],limitations=limits,reviewState='draft-source-comparison',winnerDeclared=False))
    card('god','Does shared monotheism mean agreement about who God is?',
      'Reformed Christianity confesses one God and inseparable Father, Son and Spirit; knowing the Father includes the Son.',
      'Qur’an 112 affirms divine unity and rejects begetting. This supplies an actual point of disagreement, while sharing a word for God alone settles neither reference nor doctrinal agreement.',
      ['Distinguish numerical monotheism, reference to the Creator, and agreement about divine identity.','A doctrinal disagreement does not by itself prove speakers intend different creators.'],
      'If both communities intend the Creator of Abraham, denying all common reference may confuse false beliefs about someone with referring to someone else.',
      'State the Christian disagreement precisely: the Father is revealed in the Son, and triune identity is essential to Christian worship. Defend that revelation rather than making the Arabic word Allah the argument.',
      [standard(2,'1-3'),ref('zwemer-god','Preface pp. 7-9; chapter VIII begins p. 107')],[q(112,3)],
      [bible('Deuteronomy',6,4),bible('John',14,6,11)],['Zwemer’s generalizations about Islamic piety are historically situated; they are not evidence about every Muslim.','Reference and worship questions need separate philosophical treatment.'],['zwemer-god','white-trinity'])
    card('trinity','Is the Trinity three gods or divine physical procreation?',
      'Westminster 2.3 distinguishes three persons in one undivided divine essence. Eternal sonship is not physical reproduction.',
      'Qur’an 4:171 rejects Three and divine sonship; 5:116 condemns taking Jesus and Mary as deities beside God.',
      ['Identify the doctrine being criticized before evaluating it.','Qur’an 5:116 names Jesus and Mary; it does not explicitly call that grouping the Christian Trinity.'],
      'Denying physical procreation does not answer the Muslim objection to any divine Son or to personal plurality within God.',
      'Explain the person/essence distinction, then defend its scriptural basis. Matthew 28:19 provides a triadic baptismal formula; it requires argument alongside biblical monotheism, not a bare assertion that one verse settles every metaphysical objection.',
      [standard(2,'3')],[q(4,171),q(5,116),q(112,3)],
      [bible('Matthew',28,19),bible('Deuteronomy',6,4),bible('John',1,1,3)],['Translations Three and Trinity involve different degrees of interpretation; see quotation audit.','The White/Bux event is a source lead; no arguments or timestamps are attributed from its unviewed recording.'],['white-trinity','zwemer-god'])
    card('christ','Do the Gospels preserve Jesus’ divine identity or develop it later?',
      'White’s Toronto report maintains that Jesus’ divine identity is rooted in Jesus himself, not merely later Gospel redaction.',
      'Ally’s attributed reflection acknowledges high Christology in the Gospels but explains it as development from a human Jesus; he appeals to differences between Mark and later accounts.',
      ['Distinguish what a Gospel says from whether it reliably preserves Jesus’ teaching.','Ally’s redaction argument needs premises about literary dependence, chronology and the significance of editorial differences.'],
      'Quoting John’s high Christology alone does not answer whether that presentation is historically early or reliable.',
      'Compare parallel accounts and consider pre-Gospel evidence such as Philippians 2:6-11. A development thesis must account for early worship and testimony; a Christian reply must defend dating and interpretation rather than presume them.',
      [ref('white-canada','Report paragraphs on deity and critical method')],[dict(**ref('ally-deity','Opening thesis; eight Matthew/Mark comparisons'),role='opposing-position')],
      [bible('Philippians',2,6,11),bible('Mark',9,5),bible('Matthew',17,4)],['Ally’s claims about Bruce/Bauckham have not been checked against their original books.','His example 4 cites episode-opening verses rather than the precise God/my Father sayings; check Mark 3:35 and Matthew 12:50.','Article-to-article disagreement verified; actual live exchange unviewed.'],['white-deity','white-canada','ally-deity'])
    card('crucifixion','Was Jesus crucified, and what would establish that historically?',
      'White separates the historical occurrence of crucifixion from its saving meaning. Piper appeals to early Christian testimony and the difficulty of inventing a crucified Messiah.',
      'Qur’an 4:157 denies that they killed or crucified Jesus and describes an appearance; translations differ in how explicitly they supply a substitute.',
      ['An early witness and a later revelation claim are different kinds of evidence.','The bracketed another in Sahih International is an interpretive supplement; it is not a named substitute in this verse.'],
      'A Muslim who accepts Qur’anic revelation may regard it as correcting historical inference. Early Christian testimony could also be disputed for bias.',
      'Assess Paul’s testimony, its transmission and independent corroboration, then examine the grounds for accepting the later revelation. Explain why bias does not automatically make testimony false, while acknowledging that early testimony alone is not a complete historical demonstration.',
      [ref('white-sacrifice','Opening: historical event versus willing sacrifice'),ref('piper-cross','The Historical Evidence; An Improbable Myth')],[q(4,157)],
      [bible('1 Corinthians',15,3,8),bible('Mark',15,24,39)],['Tacitus and Ignatius quoted by these apologists remain secondary citations here; original editions not yet collated.','The embarrassment argument supports an inference; it is not a logically conclusive proof.'],['white-sacrifice','piper-cross','zwemer-christ'])
    card('resurrection','Is Jesus’ resurrection the same claim as his being raised to God?',
      'Paul connects Christ’s death, burial, resurrection and appearances; bodily resurrection is essential to his gospel.',
      'Qur’an 4:158 says God raised Jesus to himself. Qur’an 19:33 speaks of birth, death and being raised alive; this alone does not establish the Christian death-burial-third-day sequence.',
      ['Separate resurrection after death, exaltation/rescue, and future general resurrection.','Do not assume Muslims reject resurrection as a category.'],
      'Even sincere reports of appearances do not alone establish that God raised a dead body; alternative explanations and prior beliefs about miracles matter.',
      'Evaluate the cumulative testimony and its alternatives, including whether Jesus died. State the theological inference openly and avoid treating a claim of many witnesses as many independently preserved testimonies.',
      [ref('piper-cross','The Historical Evidence, discussion of 1 Corinthians 15')],[q(4,158),q(19,33)],
      [bible('1 Corinthians',15,3,8),bible('1 Corinthians',15,12,20),bible('Luke',24,36,43)],['No new eligible-author resurrection debate fully reviewed. Existing Craig–Ally app record is contextual, not an admission of Craig into the core author roster.','Historical alternatives require fuller primary-source review.'],['piper-cross','white-sacrifice'])
    card('scripture','Does Qur’anic recognition of earlier revelation validate the extant Bible?',
      'Reformed teaching locates authority in the inspired Scriptures; textual transmission must still be investigated historically.',
      'Qur’an 5:48 describes the Qur’an as confirming earlier Scripture and exercising authority over it. It does not by itself identify the Injil with every wording in the four canonical Gospels.',
      ['Distinguish original revelation, surviving manuscripts, interpretation and canon.','A corruption claim needs a specified text, change, time and evidence; an inerrancy claim does not erase manuscript variants.'],
      'A Muslim may accept an original Gospel while denying the reliability or interpretation of surviving Christian books.',
      'Ask for concrete manuscript and historical evidence, compare actual variants, and test whether proposed corruption explains the disputed doctrine. The confirmation argument needs additional premises about which texts were accessible and affirmed.',
      [standard(1,'4,8')],[q(5,48)],
      [bible('2 Timothy',3,15,17),bible('Luke',1,1,4)],['No manuscript-level collation completed in this batch.','White’s book and Dublin debate are bibliography leads only; no chapter or live argument invented.'],['white-bible-quran','white-quran'])
    card('revelation','How should competing claims to divine revelation be tested?',
      'Galatians 1:8 rejects a message contrary to the apostolic gospel, even with an angelic claim; Hebrews 1 centers revelation on the Son.',
      'Qur’an 4:163 places revelation to Muhammad in continuity with Noah, Abraham, Jesus and other prophets.',
      ['Each tradition makes an authority claim, not merely a neutral historical report.','A Christian canonical test expresses Christian commitments; a Muslim need not already accept that authority.'],
      'Rejecting the Qur’an solely because it differs from Christian Scripture can seem circular to someone who disputes that Scripture’s authority.',
      'Make the internal Christian test explicit, then separately offer public reasons for trusting the apostolic witness. Apply comparable standards to competing historical claims, textual evidence and alleged prophecy.',
      [standard(1,'1,4-5')],[q(4,163)],
      [bible('Galatians',1,6,9),bible('Hebrews',1,1,4)],['No neutral method automatically decides all presuppositions.','This is an editorial framework, not a paraphrase of the unviewed Dublin event.'],['white-quran','white-bible-quran'])
    card('salvation','Why does Christian forgiveness require Christ’s atonement?',
      'Christian justification joins divine grace, Christ’s redemptive work and faith; White’s printed case argues for a willing sacrifice.',
      'Qur’an 39:53-54 joins mercy with a call to return to God; 4:48 distinguishes association with God from sins God may forgive. This cannot fairly be reduced to earning salvation with no mercy.',
      ['Different accounts of forgiveness rest on different accounts of sin, justice and mediation.','Christian grace is not permission to continue in sin; Muslim mercy must be represented from its own texts.'],
      'If God can pardon, why is a substitute necessary, and how can another’s suffering be just?',
      'Explain the Christian claim that the Son gives himself willingly and that God’s grace and justice meet in Christ, using Romans 3:24-26 and John 10:17-18. The moral objection to representation still needs an argument, not merely the word sacrifice.',
      [ref('white-sacrifice','Opening and closing: willing sacrifice'),standard(11,'1-3')],[q(39,53),q(4,48)],
      [bible('Romans',3,24,26),bible('John',10,17,18),bible('Romans',6,1,2)],['Interpretations of repentance, intercession and forgiveness vary; this does not survey all Islamic schools.','Sin and Salvation is linked for further review, not treated as already transcribed.'],['white-salvation','white-sacrifice'])
    card('prophethood','Do biblical promises identify Muhammad as a coming prophet?',
      'Acts 3 applies the prophet-like-Moses text to Jesus, and John 14:26 explicitly identifies the promised Helper as the Holy Spirit.',
      'Qur’an 33:40 identifies Muhammad with the seal of the prophets; 61:6 presents Jesus announcing a messenger named Ahmad.',
      ['Compare each text within its own speaker, audience and literary context.','A Qur’anic assertion of prediction is distinct from locating that prediction in extant biblical wording.'],
      'A Muslim may argue that the extant Bible obscures a prediction or that the texts have a broader referent than Christian interpreters allow.',
      'Read Deuteronomy 18 alongside Acts 3 and John’s Helper promises. Require textual evidence for proposed alterations and explain why the identified referent fits the whole passage; do not rely on an unverified Greek/Arabic word resemblance.',
      [standard(8,'1')],[q(33,40),q(61,6)],
      [bible('Deuteronomy',18,15,18),bible('Acts',3,22,26),bible('John',14,16,17),bible('John',14,26)],['No claim made that Hussain used these exact arguments in the unviewed debate.','Greek parakletos/periklutos claims and specific manuscript allegations require independent verification.'],['white-prophecy','zwemer-christ'])
    write(OUT/'questions.json',dict(date=c.DAY,scope='Nine editorial source comparisons; supporting texts are citations, not verified exposition coverage.',questions=cards))
    lines=['# Christianity and Islam: nine questions','',
      'Source comparisons prepared 2026-10-05. These are editorial study notes, not debate transcripts or fully reviewed public teaching. Muslim claims below are contextual sources, distinct from recommended Christian teaching. See [the collection report](REPORT.md) for acquisition and review limits.','']
    for item in cards:
        lines += [f"## {item['topic'].capitalize()}: {item['question']}",'',f"**Christian claim.** {item['christianClaim']}",'',f"**Muslim claim.** {item['muslimClaim']}",'',
          '**Premises to examine.** '+' '.join(item['premises']),'',f"**Serious objection.** {item['seriousObjection']}",'',f"**Christian response.** {item['christianResponse']}",'',
          '**Scripture companions:** '+ '; '.join(p['reference'] for p in item['scripture'])+'.','', '**Source locators:**','']
        for side in ['christianEvidence','muslimEvidence']:
            for e in item[side]:
                url=e.get('url') or '../../catalog/works/'+e['workId']+'.json'
                lines.append('- '+('Christian: ' if side=='christianEvidence' else 'Contextual Muslim: ')+f"[{e['locator']}]({url})")
        lines += ['', '**Still unresolved.** '+' '.join(item['limitations']),'']
    (OUT/'QUESTIONS.md').write_text('\n'.join(lines),encoding='utf-8',newline='\n')
    quotes=[
      ('q4157-sahih','q4157-translations','Qur’an 4:157','Sahih International','but [another] was made to resemble him to them','Brackets retained: another supplies an interpretive identification; no substitute is named in the verse.'),
      ('q4157-pickthall','q4157-translations','Qur’an 4:157','Marmaduke Pickthall','but it appeared so unto them','Less explicit about the mechanism than the bracketed Sahih International wording.'),
      ('q4171-pickthall','q4171-translations','Qur’an 4:171','Marmaduke Pickthall','say not "Three"','Read with the surrounding rejection of sonship and description of Jesus; not a standalone account of Nicene doctrine.'),
      ('q4171-yusuf','q4171-translations','Qur’an 4:171','Yusuf Ali','Say not "Trinity"','Translator supplies the doctrinal label where another translation has Three.'),
      ('q1123-pickthall','q1123-translations','Qur’an 112:3','Marmaduke Pickthall','He begetteth not nor was begotten.','Do not restrict the theological rejection to physical reproduction without further argument.')]
    manifest={f['key']:f for f in c.read(OUT/'acquisition-manifest.json')['files']}
    audits=[]
    for key,cache,loc,translator,text,note in quotes:
        f=manifest[cache]
        audits.append(dict(id=key,role='opposing-position',url=f['url'],locator=loc,translator=translator,exactExcerpt=text,contextNote=note,evidenceKey=cache,evidenceSha256=f['sha256'],verification='English wording collated against named translator display; spelling, punctuation and brackets retained.',limitations='No independent Arabic philological, manuscript or edition authentication. No full translation republished.'))
    write(OUT/'quotation-audit.json',dict(date=c.DAY,verifiedExcerpts=audits,pending=[
      dict(source='White opening statement',item='Ignatius, Smyrnaeans 1-2; ancient chronology assertions',reason='Quoted through a modern apologist, not checked against a critical edition.'),
      dict(source='Piper article',item='Tacitus, Annals 15.44; Kateregga/Shenk; Neill',reason='Bibliographic footnotes identified; underlying complete editions not independently collated.'),
      dict(source='Ally reflection',item='Bruce, Bauckham and reported live dialogue',reason='Attribution to Ally documented; original scholarly sources and recording not independently verified.'),
      dict(source='Zwemer scans',item='Palmer Quran and al-Tha‘labi narratives',reason='Named source chain retained; no independent Arabic/translation collation.')]))
    write(OUT/'app-crosswalk.json',dict(date=c.DAY,mode='Documentary cross-reference only; no migration or publication changes',links=[dict(questionId='question-l10-'+topic,appPath='content/apologetics/'+path,relation=relation) for topic,path,relation in [
      ('god','debates/craig-ally-god.json','Contextual debate; Craig not admitted as eligible core teacher'),('resurrection','debates/craig-ally-resurrection.json','Contextual debate; body review not repeated'),('christ','studies/islam-jesus.json','Existing editorial guide; independent review workflow'),('trinity','studies/islam-trinity.json','Existing editorial guide; independent review workflow'),('crucifixion','studies/islam-cross.json','Existing editorial guide; independent review workflow')]]))
    print('Nine question maps and five collated translation excerpts written.')

if __name__=='__main__':build()
