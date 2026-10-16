"""Implementation-agent manual source review, separate from frozen sampling."""
from .inputs import ROOT,read,write_json,sha

# IDs, rhetorical reading, expected asserting/reported speaker, protection,
# lexical negation, required limiting words. Judged from held context, not output.
ROWS=[
('1abfa1816dbdb5d34be8','unsupported','unresolved',True,False,[], 'Welsh mislabeled English; saith is Welsh numeral, not speech.'),
('9168d7490c4be2867ad5','report','Pighius',True,False,['Although'],'Pronoun resolves to Pighius in surrounding source.'),
('e59c84b9d2ba5787ecb3','report','Calvin',True,True,['without the Holy Spirit'], 'Editorial third-person summary, not Calvin speaking directly.'),
('cbd83fb13a87d96e557c','objection','unresolved',True,False,['if God controls all things'],'Unnamed opposing position.'),
('9243804a3116e07dddb3','reply','source-author',False,False,['the only true consensus'],'Explicit first-person reply.'),
('72bcb19335c71f55315b','quotation','unresolved',True,True,['unless it proceeds from a perfect love for God'],'Quotation speaker not proven by this local context.'),
('8f3722b478da8e9a8876','plain','source-author',False,True,[],'Wrapped author advice; full clause needed.'),
('d60ec94e002cc529cbca','report','Augustin',True,False,[],'Augustine reports Menandrian practice, not endorsing it.'),
('68a4b859ea31acb09373','quotation','scripture',True,True,['except ye be Reprobates'],'Quoted 2 Corinthians 13:5; not Flavel as speaker.'),
('96c779482a530a9d016f','quotation','Augustin',True,False,[],'Retractions extract attribution explicit in heading.'),
('ec2041936d4f85f67212','quotation','Augustin',True,True,[],'Retractions extract author known; narrator not generic editor.'),
('c292e4c53346f5b76552','quotation','Augustin',True,False,['unless he had condemned the opinions'],'Quoted Retractions, limiting acquittal inference.'),
('dfd14b52b98e1d3d87b9','plain','source-author',False,False,[],'May be said introduces author future prayer, not an objection.'),
('661f1eb8ce55875d78fc','plain','source-author',False,False,[],'Narrative criticism, answer is a noun, not a reply marker.'),
('1cb6b2efd2a3ab167a93','plain','unresolved',True,True,[],'Compiled patristic attributed extracts; no sole Chrysostom speaker.'),
('28aee8f3a632b660c0ba','report','Salust',True,True,[],'Translator dedication with local Salust reference.'),
('3f4bed8aeb2f40f5101f','plain','unresolved',True,False,[],'Contrast is not formal reply; composite patristic voice.'),
('d62956ecaea7ae814487','plain','editor',True,True,[],'Life of Bunyan editorial biography.'),
('3cc38aceed681e7c9213','report','Bunyan',True,True,[],'Biography reports Bunyan through scriptural language.'),
('fcc3a0221de1db5d8afd','plain','editor',True,True,['not always dispel'],'Biographer speaking, qualified ability to dispel.'),
('554611b0692effa43456','plain','unresolved',True,False,[],'Damaged text and opposite side, no reply marker.'),
('feabc2ee2064dd07c967','reply','source-author',False,True,['If this objection carrieth truth in it'],'Author reductio responds to objection; mixed OCR/page unit.'),
('89618589c4e33c2b70a3','report','God',True,False,[],'He reports God through Jeremiah context.'),
('4501f240b517bf24671d','plain','source-author',False,True,[],'Direct pastoral prohibition.'),
('67e01da2ab59675459be','plain','source-author',False,False,['unless they riveted attention'],'Author description of preaching with scope condition.'),
('63b16951a2971463590c','quotation','unresolved',True,True,['when I pray'],'Hypothetical distressed hearer quoted; answer is noun.'),
('70dd09c46865b6100ae1','plain','unresolved',True,True,[],'Preface voice unresolved from OCR; not guaranteed Owen.'),
('8d7e3f8b12278dfba6da','report','scripture',True,False,[],'Lord/Peter quotation inside patristic quotation.'),
('66ad4dbefc788f399be6','quotation','unresolved',True,True,['unless our Master'],'Quoted patristic statement with OCR, speaker uncertain.'),
('bbe812d109737618233d','plain','source-author',False,False,[],'Contrary conclusion, not formal reply.'),
('5875b4354cc94e9cad28','objection','unresolved',True,False,[],'Opposing position truncated by OCR.'),
('e658ecc8767ab1eda930','plain','editor',True,True,[],'Not only additive but no longer is real negation; editorial introduction.'),
('71281be8b37eeaea743c','plain','editor',True,False,['except that one'],'Editor argument about human extremes.'),
('0409162778f72537e1fa','plain','editor',True,False,['if this can be said'],'Rhetorical question, no named reported proposition.'),
('4b7f4ff03c11320263f8','objection','unresolved',True,True,[],'Described objection to revival experiences.'),
('108e7aed94585f4b28b2','plain','source-author',False,True,['If it were possible'],'Hypothetical angels; would answer not actual reply.'),
('a24d3c412c7a9d5d7537','quotation','scripture',True,True,[],'Minutes record sermon quoting Matthew 16:18.'),
('1657b1f5581de106aeb7','plain','institution',True,False,[],'Institutional salutation; said adjective, not speech verb.'),
('569dd2df74b5c3eae1f9','plain','source-author',False,True,[],'Dedication speaking as Baxter, OCR corruption retained.'),
('a645031433d553edbf3c','plain','source-author',False,False,[],'Not onely/but also is additive, not negation.'),
('49b31053d5f66783da4f','quotation','scripture',True,True,[],'3 John verse, not Calvin writing first person.'),
('ddad088af2ace0fda7f3','plain','source-author',False,True,['except it be so farre forth as thou takest care'],'Prayer explicitly qualified providential safety.'),
('c7e3d477d85304b41260','quotation','scripture',True,True,[],'Commandment quotation, not Luther actual speaker.'),
('56d9ecbcf7e24613bd16','report','God',True,False,[],'OCR lie for He; contextual God speech.'),
('08a62949008c2ca4bc3e','plain','provider',True,True,[],'Google copyright front matter, not Flavel.'),
('298927c0098b025ea067','plain','unresolved',True,True,[],'Composite devotional voice, not proven Augustine authorship.'),
('61d8046a83497defad85','report','the soul',True,False,[],'Personified soul quoting Psalm; not Augustine speaker.'),
('45ed343d471cb2081723','plain','unresolved',True,True,['except thou reveale thy selfe'],'Devotional prayer in compiled/translated text.'),
('f903c1f53a604be00407','plain','unresolved',True,True,[],'Compiled prayer instruction; no sole historical speaker proven.'),
('4912319abed7de121847','plain','unresolved',True,False,['except when they may be shewed'],'Conditional advice in compiled manual.'),
('7591568564c298e40bd5','plain','editor',True,True,[],'Compiler first-person preface, not Chrysostom.'),
]

def main():
    path=ROOT/'evaluation/development-review.json'
    expected={('case-'+r[0]):{'type':r[1],'speaker':r[2],'must_protect':r[3],'negation':r[4],'qualifications':r[5],'reason':r[6]} for r in ROWS}
    cases=read(ROOT/'evaluation/frozen.json')['cases']+read(ROOT/'evaluation/frozen-extra.json')['cases'];ids={c['id'] for c in cases if c['split']=='development'}
    if ids!=set(expected):raise ValueError('Manual review must cover exact frozen development set: '+str(ids-set(expected)))
    value={'reviewer_type':'model-assisted implementation-agent source/context review; no human/independent review','model':'GPT-6 session model; backend revision unavailable','prompt_version':'kr130-content-rubric-v1','cost':'Session cost not exposed; zero external generation/API calls','frozen_hashes':[sha(ROOT/'evaluation/frozen.json'),sha(ROOT/'evaluation/frozen-extra.json')],'judgments':expected}
    if path.exists() and read(path)!=value:raise ValueError('Review immutable once recorded')
    if not path.exists():write_json(path,value)
    print(len(expected),'development judgments')
if __name__=='__main__':main()
