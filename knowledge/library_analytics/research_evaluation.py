"""Fresh KR evaluation intents. No invented answers or relevance judgments."""
from .inputs import digest

VERSION='kr100-evaluation-v1'
FAMILIES={
 'passage-exposition':[
  'Romans 3:21–26 and justification','Romans 4 and Abraham’s faith','Romans 6 and union with Christ',
  'Romans 8:1–17 and adoption','Romans 9 and election','Ephesians 1:3–14 and predestination',
  'Ephesians 2:1–10 and grace','Ephesians 4:1–16 and church unity','Galatians 3 and the covenant',
  'Galatians 5 and the fruit of the Spirit','Hebrews 6 and apostasy','Hebrews 8 and the new covenant',
  'Hebrews 10 and assurance','John 3 and regeneration','John 6 and coming to Christ',
  'John 17 and sanctification','1 Corinthians 11 and the Lord’s Supper','James 2 and faith and works',
  '1 Peter 1 and holiness','Psalm 51 and repentance'],
 'author-comparison':[
  'Owen and Goodwin on assurance','Gill and Boyce on justification','Dagg and Keach on baptism',
  'Coxe and Witsius on covenant theology','Booth and Fuller on the gospel invitation',
  'Edwards and Sibbes on religious affections','Watson and Boston on repentance',
  'Bunyan and Flavel on perseverance','Calvin and Hodge on adoption','Charnock and Gill on divine simplicity',
  'Owen and Turretin on satisfaction','Beddome and Collins on catechetical instruction',
  'Tombes and Danvers on infant baptism','Brooks and Goodwin on temptation','Manton and Durham on sanctification',
  'Burroughs and Watson on contentment','Ball and Witsius on the covenant of grace',
  'Matthew Henry and Barnes on James 2','Augustine and Calvin on grace','Aquinas and Owen on justification'],
 'practical-sermons':[
  'bereavement and hope','anxiety and prayer','repentance after serious sin','assurance under doubt',
  'forgiveness after injury','patience under suffering','contentment in poverty','pride and humility',
  'family worship','care for the poor','reconciliation in the church','temptation and perseverance',
  'preparation for the Lord’s Supper','baptism and discipleship','work and vocation','witness and conversion',
  'spiritual dryness','the use of Scripture in prayer','illness and mortality','gratitude and worship'],
 'quotations-parallels':[
  'Augustine quotations in Calvin','Chrysostom quotations in Owen','Bernard quotations in Puritan sermons',
  'Aquinas quotations in Protestant theology','Luther quotations in Bunyan','Calvin quotations in Gill',
  'Scripture wording shared by Henry and Barnes','catechism wording shared by Collins and Keach',
  'confessional wording shared by Boyce and Dagg','covenant wording shared by Ball and Witsius',
  'assurance wording shared by Brooks and Sibbes','communion wording shared by Owen and Watson',
  'prayer wording shared by Flavel and Bunyan','atonement wording shared by Fuller and Booth',
  'God’s attributes wording shared by Charnock and Gill','adoption wording shared by Goodwin and Owen',
  'law and gospel wording shared by Boston and Bunyan','repentance wording shared by Manton and Watson',
  'translated patristic quotations and their originals','common biblical quotations versus distinctive reuse'],
 'history':[
  'the 1644 London Baptist confession','the 1677 and 1689 Baptist confession witnesses',
  'Keach’s catechetical context','Collins and seventeenth-century Baptist education',
  'Tombes and baptism controversy','Kiffin and church membership','Spilsbury and church constitution',
  'Booth and eighteenth-century Baptist theology','Fuller and missionary controversy',
  'Gill’s historical references','Witsius and Reformed covenant debates','Owen and Restoration nonconformity',
  'Bunyan’s imprisonment and literary chronology','Boston and the Marrow controversy',
  'Edwards and revival narratives','Boyce and theological education','Dagg and American Baptist doctrine',
  'patristic authorship versus later editorial attribution','ancient place names in Bible dictionaries',
  'archaeological discovery dates versus ancient event dates'],
 'multilingual':[
  'Latin gratia and English grace','Latin iustificatio and English justification',
  'Latin fides and English faith','Latin caritas and English love','Latin sacramentum and English sacrament',
  'Latin testamentum and English covenant','Latin paenitentia and English repentance',
  'Latin sanctificatio and English sanctification','Latin ecclesia and English church',
  'Latin praedestinatio and English predestination','Greek pistis and English faith',
  'Greek charis and English grace','Greek dikaiosyne and English righteousness',
  'Greek baptisma and English baptism','Greek ekklesia and English church',
  'Hebrew berit and English covenant','Hebrew hesed and English mercy',
  'Hebrew ruach and English spirit','Psalm numbering in Latin and English editions',
  'translator notes versus the original author’s words'],
}


def questions():
    result=[]
    templates={
      'passage-exposition':'Find held sections explaining {topic}; distinguish exposition from incidental citation.',
      'author-comparison':'Locate and compare {topic}, preserving objections, qualifications and edition identities.',
      'practical-sermons':'Find attributed sermon sections addressing {topic}, with their surrounding pastoral context.',
      'quotations-parallels':'Locate evidence for {topic}; distinguish quotation, common formula and unproven influence.',
      'history':'Locate held evidence for {topic}, separating event, composition, edition and acquisition dates.',
      'multilingual':'Locate source sections for {topic}, preserving language, sense, translator and numbering uncertainty.'}
    for family,topics in FAMILIES.items():
        ranked=sorted(topics,key=lambda topic:digest({'family':family,'topic':topic}))
        for i,topic in enumerate(ranked):
            result.append({'id':'kr-question-'+digest({'family':family,'topic':topic})[:24],
                'family':family,'split':'development' if i<12 else 'reserved',
                'question':templates[family].format(topic=topic),
                'judgment_state':'unreviewed-intent; no gold answer or relevance labels',
                'coverage_state':'not-yet-assessed; shortages must be reported by later retrieval evaluation'})
    return result


TARGETS={
 'section_release':{'input_accounting':1.0,'reconstructed_span_hash_failures':0,
   'parent_containment_failures':0,'failed_supported_jobs':0,
   'changed_input_release_policy':'no selection of a release with changed inputs',
   'calibration':'all available source adapters and native XML entry assets; missing strata explicit'},
 'later_retrieval_release':{'reserved_questions':48,'useful_top_five_minimum':0.85,
   'location_and_attribution_precision_minimum':0.95,
   'rule':'not evaluated by KR-101; never tune against reserved questions'},
 'review':'Automatic structural/hash checks are separate from human relevance, boundary semantics and doctrinal review.'}
