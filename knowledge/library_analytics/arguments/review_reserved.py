"""Blind reserved source/context judgments; extractor semantics frozen first."""
from pathlib import Path
from .inputs import ROOT,read,write_json,sha

ROWS=[
('338dc505fd2581a9dd72','plain','source-author',False,True,[],'Baxter verse, damaged final rest word; retain damage.'),
('dcdbecf6255ae638b8ed','report','Baxter',True,False,[],'Author reports his own soul speaking, with Psalm language.'),
('222065647405344fbd79','plain','source-author',False,False,['unless thou shine on it with the light'],'Baxter prayer, line-wrapped necessary divine illumination.'),
('b50aa124903a0da1f00e','objection','unresolved',True,False,[],'Unnamed competing soul-preexistence positions.'),
('468dc80252c7dd592dec','plain','provider',True,False,['unless otherwise indicated'],'Edition notice, not Calvin doctrine.'),
('6220f7062167d4db2dda','plain','provider',True,True,[],'Publisher use notice; not source author assertion.'),
('a994a8b0e6f79d008c19','report','Jesus',True,False,[],'Luke quotation; Jesus speaking, not Calvin.'),
('a71d37101cc8ffaedd6c','plain','source-author',False,False,['as long as it is possible for him'],'Contrasting exhortation, not formal reply.'),
('7c297e30e0f293091710','plain','source-author',False,True,[],'Flavel statement about pre-creation divine delight; parenthetic qualification retained.'),
('a66d504b958b5cf7e5d0','report','scripture',True,False,[],'Reference description of Christ being rich, 2 Corinthians/Philippians.'),
('ce34365e1a3e9b8a50b3','plain','source-author',False,True,['except you can sleep quietly in his arms'],'Conditional rest from temptation.'),
('cd3912147e9839ff191d','objection','unresolved',True,True,[],'Hypothetical objector; lack of witnesses.'),
('8d2768bc03ccdea0c89c','plain','source-author',False,False,[],'Analogy with on the contrary; not a reply.'),
('3149e4ac720819235336','plain','editor',True,False,['except viij'],'Flood statement in translator/prefatory argument, eight exception.'),
('1b7c58b8b4d638879ac5','plain','editor',True,True,[],'Preface describes Luther/Melanchthon third person.'),
('e914fe76533d23440bbd','report','scripture',True,False,[],'Scriptural greater-is-He proposition, not author speaking it first.'),
('bb65e382003703ddc736','plain','unresolved',True,False,['Although that all were of one will'],'Allegorical interpretation with concession, uncertain Luther/Melanchthon voice.'),
('e36abced6c1338cb1034','front-matter','editor',True,True,[],'Table-of-contents heading; not an actual argument clause.'),
('d8e53c11506575595d5e','plain','source-author',False,True,['without any teaching from man'],'Author recounts traditions about Antony/Christianus, not their asserting voices.'),
('b149cf605b447b6a5400','plain','source-author',False,True,['without the interposition of man'],'Contrary example of Philip and eunuch, not objection reply marker.'),
('59892de35160b8a27fca','plain','source-author',False,True,['except perhaps what is false'],'Ownership qualification.'),
('bf35b7a7d0f9dc2164fe','plain','source-author',False,False,['if it can'],'Rhetorical objection question in key analogy, not a quoted opposing position.'),
('88dd2513c0643c967349','report','Jesus',True,True,[],'Christ on unexpected return; old spelling sayth missed by modern grammar.'),
('54993b6705bd4266db92','report','scripture',True,False,[],'Hosea scriptural admonisher, source follows punctuation.'),
('763303510fbfe40dc0c8','report','Christ',True,True,['Except ye wheat corne'],'Christ quotation with except-condition; saith alternative spelling.'),
('6e9bf90739068eefdff1','plain','source-author',False,True,[],'Spurgeon states sermon intention.'),
('c09a8d122638729912da','quotation','unresolved',True,False,[],'Unnamed hearer asks encouragement, not Spurgeon assertion.'),
('c350cb1f7086a4962665','plain','source-author',False,True,['unless you reap some good results'],'Exhortation with both outcome condition and perseverance qualification.'),
('d73133f48f19b8f2b23d','plain','source-author',False,False,[],'OCR-damaged author preface; notwithstanding not lexical denial.'),
('ce2529c5987a145a150c','plain','source-author',False,True,['unless she be either intaugled'],'Fly analogy; OCR broken sentence affects location completeness.'),
('864b9cee567a3681b41e','report','scripture',True,False,['Except a corn of wheat'],'Quoted John wheat-grain condition in damaged text.'),
('50dd6f9c3d2062564e65','plain','source-author',False,True,['if thou he'],'Opposing conditional assurance, not formal reply.'),
('789b4729cda01b7f5c26','objection','unresolved',True,False,[],'You will say opposing position.'),
('3819d692e2d2a818573e','plain','provider',True,True,[],'Google public-domain notice, OCR thai for that.'),
('91470e3e9c33f42fcc0f','plain','editor',True,False,[],'Legal registration record, not sermon/author claim or actual Sherman speech.'),
('186b4a0eace4a9bc618a','plain','editor',True,False,['Unless this be effected'],'Preface condition on education/regeneration, actual editorial voice.'),
('3dafd30c981a29fd624e','plain','source-author',False,True,['though not properly an imperfection'],'Edwards editor of Brainerd speaking concessively, not asserting objection itself.'),
('3722da0bfb56f5102ed5','plain','source-author',False,True,['If you cannot answer'],'Exhortation, answer is ordinary verb, not reply to an objection.'),
('0240de08ed8456e56f1f','front-matter','editor',True,True,[],'Contents entry; source proposition location is missing from this selected line.'),
('f3fb844022cf49c7116d','front-matter','editor',True,False,[],'Contents description of objection, not an objector statement.'),
('3b062bdbd6eff2f8abf8','front-matter','editor',True,False,[],'Contents reference to what doctrine says, not quoted speaker.'),
('0ff530f0c0b8544e372a','front-matter','editor',True,True,['unless a man be a believer'],'Contents summary; condition accurate words but coarser evidence role.'),
('846cc26927f9ecab8b2d','quotation','unresolved',True,False,['If it be said'],'Owen quotes adversary section; cannot attribute I answer to Owen.'),
('91a36e10a22d2c70e827','report','God',True,False,[],'Ezekiel quoted lemma names Lord God.'),
('59a4503557837e4edca4','plain','source-author',False,True,['only of Egyptians'],'Historical interpretation and quoted lemma mixed; only Egyptians limits fish referents.'),
('026a016b1f9fca2e1c31','plain','source-author',False,False,['Unless by Cush'],'Gill alternative geography qualification; former reading preferred.'),
('a86331b2fead1529aa27','plain','provider',True,True,[],'Google notice, not Baxter.'),
('02cf8dd55349206faae4','report','unresolved',True,False,['As if he had said'],'Hypothetical divine speech, no locally exact speaker resolution in fragment.'),
('8899056bd82924cf31b7','plain','source-author',False,True,['except yourself'],'Baxter dedication distinction between forgiving others and self.'),
('62434da35ccea1483faa','reply','source-author',False,True,['If you say again'],'Explicit I answer after quoted reader objection; source author candidate allowed.'),
('b74febe65665c9d0a339','quotation','unresolved',True,False,[],'Quoted objection inside Rushworth discussion; damaged relation to narrator.'),
('e244e5d91f9dba3b8832','plain','provider',True,True,['except as permitted'],'Publisher copyright notice; legal wording is held source, no policy action inferred.'),
('f53da5735ee6553d6bcd','plain','editor',True,True,['whether they were ever published separately'],'Editorial publication history, not Calvin narration.'),
('0063c99289bc56ff5bef','report','scripture',True,True,[],'Isaiah reported content with additive not only and real did not open.'),
('9de14792069a5d574815','objection','unresolved',True,True,['when we see so many people resist'],'Author warns of a demonic objection; actual position opposing gospel.'),
('986b25e76c9ae715fead','plain','source-author',False,False,[],'Contrast description of persecution, not formal reply.'),
('77288d455abfbc8ec444','plain','editor',True,True,[],'Posthumous commendation of Flavel; composite source explicitly includes prefatory contributor.'),
('5d9203fbeaddfc3f99c5','quotation','scripture',True,False,['except they be sent'],'Romans question quoted in catechism.'),
('7d2be066f3d0e36c8d10','plain','unresolved',True,False,[],'Catechism question about quoted catechism wording; mixed institution/author voices.'),
('a46221b976b2da7fd5ca','plain','provider',True,False,['unless a copyright notice is included'],'Gutenberg boilerplate, not Luther/translator doctrinal claim.'),
('5381e7cc49638018643f','plain','provider',True,True,[],'Gutenberg editorial practice notice.'),
('f82faaa823528d30af6b','report','Christ',True,False,[],'Narrator reports Christ farewell in Gospel reference.'),
('19b5da93df2e9c19727b','reply','Luther',False,False,[],'Catechetical explicit Answer; actual author Luther, translators remain separate.'),
('3d9d6aab0a9140daeaf2','quotation','scripture',True,True,[],'1 Timothy quotation in prefatory material, not Augustine.'),
('0a87e678a23492f9a552','report','Augustine',True,False,[],'Translator to-reader preface reports Augustine.'),
('e36650317079f21eaf88','plain','source-author',False,True,['except he shall continue unto thend'],'Augustine translation argument on perseverance with condition.'),
('02a9c047a7c68083f834','plain','source-author',False,True,[],'Homily opening author speaks first person; translated composite metadata cannot prove it alone.'),
('30a61218f56fd1024fef','plain','source-author',False,False,[],'Describes contrasting apparent fortunes; no formal reply, page crossing.'),
('9b4eb953b97288f7ebc0','plain','source-author',False,True,['excepte he hym selfe destroy it'],'Said adjective; virtue condition in archaic spelling.'),
('8e4e26dfa2a80af53bfa','plain','source-author',False,False,['except Adam by his own'],'Rhetorical Adam responsibility condition.'),
]

def main():
    freeze=read(ROOT/'evaluation/tuning-complete.json')
    if sha(Path(__file__).with_name('extractor.py'))!=freeze['extractor_sha256'] or sha(Path(__file__).with_name('contract.py'))!=freeze['contract_sha256']:raise ValueError('Reserved evaluation requires unchanged frozen semantics')
    expected={'case-'+r[0]:{'type':r[1],'speaker':r[2],'must_protect':r[3],'negation':r[4],'qualifications':r[5],'reason':r[6]} for r in ROWS}
    cases=read(ROOT/'evaluation/frozen.json')['cases']+read(ROOT/'evaluation/frozen-extra.json')['cases'];ids={c['id'] for c in cases if c['split']=='reserved'}
    if set(expected)!=ids:raise ValueError('Manual reserved judgments mismatch: '+str(ids-set(expected)))
    value={'reviewer_type':'model-assisted implementation-agent source/context review; no human/independent review','model':'GPT-6 session model; backend revision unavailable','prompt_version':'kr130-content-rubric-v1','cost':'Session cost not exposed; zero external generation/API calls','frozen_hashes':[sha(ROOT/'evaluation/frozen.json'),sha(ROOT/'evaluation/frozen-extra.json')],'tuning_freeze_sha256':sha(ROOT/'evaluation/tuning-complete.json'),'judgments':expected}
    path=ROOT/'evaluation/reserved-review.json'
    if path.exists() and read(path)!=value:raise ValueError('Reserved judgments immutable once recorded')
    if not path.exists():write_json(path,value)
    print(len(expected),'reserved source judgments; no post-reserved tuning')
if __name__=='__main__':main()
