/* Subject navigation only. Every reading opens an existing collection, guide or local research example. */
window.STUDY_ROOT = '/mockups/study-hub-v3/';
const item = (kind, title, text, href, extra = {}) => ({kind, title, text, href, ...extra});
window.STUDY_BRANCHES = {
  theology: {
    label: 'Scripture & Theology', kicker: 'Begin with the passage', heading: 'Read. Understand.<br><em>Live the Word.</em>',
    lead: 'Explore the Bible’s books, follow its teaching, and consider the life it calls us to lead. Choose a subject. Find a place to begin.',
    tone: 'epistles', other: 'academic', otherLine: 'Explore the world behind the passage.',
    areas: [
      {id:'books', title:'Books & passages', short:'Read in context', art:'books', tone:'epistles', hint:'Understand a book’s shape, follow its message and read its passages together.',
        heading:'A passage belongs<br>to <em>a larger story.</em>', intro:'Begin with the shape of the biblical library. Then enter a book, read a letter, or follow a passage’s connections.',
        featured:item('Collection','Letters & their message','Twenty-one letters. Explore who they address, how their arguments unfold and what they teach.','/study/letters',{meta:'Four collections · Four ways in',art:'letters'}),
        group:'Get your bearings',items:[
          item('Tool','The shape of the Bible','Explore its sections, books and chapters.','/study/structure'),
          item('Guide','Christ in the letters','Who he is, what he did and life in him.','/study/letters/christ-in-the-letters'),
          item('Tool','Connections in Scripture','Follow references from one passage to another.','/study/references')],
        support:[['Open the Bible','/bible'],['Choose an edition','/study/versions']]},
      {id:'jesus',title:'Jesus & the Gospels',short:'Follow his life & teaching',art:'gospels',tone:'gospels',hint:'Read each Gospel in its own voice, then bring the accounts into conversation.',
        heading:'Four accounts.<br><em>One life.</em>',intro:'Meet Jesus through the portraits, teaching and encounters the Gospel writers give us. Compare the accounts without losing each writer’s voice.',
        featured:item('Guide','Four Gospel portraits','Explore what Matthew, Mark, Luke and John each bring into view.','/study/gospels#portraits',{meta:'Matthew · Mark · Luke · John',art:'gospels'}),
        group:'Follow the accounts',items:[
          item('Guide','Teaching journeys','Hear the teaching within its narrative setting.','/study/gospels#jesus'),
          item('Collection','Miracles & encounters','Read the signs, the people and the passages together.','/study/miracles'),
          item('Comparison','The Gospel harmony','Follow an event across the accounts that tell it.','/study/gospels#harmony')],support:[['Christ in the letters','/study/letters/christ-in-the-letters'],['Where Jesus speaks','/study/gospels#speech']]},
      {id:'doctrine',title:'God & Christian doctrine',short:'Trace what Scripture teaches',art:'doctrine',tone:'revelation',hint:'Begin with God’s names and character, then follow a teaching through its passages.',
        heading:'Know his character.<br><em>Follow his teaching.</em>',intro:'Move from the words of Scripture to the beliefs they express. Read the passages behind a doctrine and consider how they belong together.',
        featured:item('Collection','Names & descriptions of God','Explore the names and titles of the Father, the Son and the Holy Spirit, with their biblical passages.','/study/names',{meta:'Names · Character · Scripture',art:'doctrine'}),
        group:'Follow a teaching',items:[
          item('Collection','Topics in Scripture','Bring a subject’s passages together and read in context.','/topics'),
          item('Question','Does the Trinity mean three gods?','Follow the existing Apologetics discussion and its sources.','/apologetics/study/god'),
          item('Question','How does covenant theology connect the Bible?','Explore a theological account of the connections.','/apologetics/study/covenant')],support:[['Grace and good works','/apologetics/study/grace'],['Cross-reference tools','/study/references']]},
      {id:'life',title:'Prayer & Christian life',short:'Bring the Word into life',art:'prayer',tone:'poetry',hint:'Consider prayer, assurance and the ordinary practice of faith through Scripture.',
        heading:'Read with attention.<br><em>Respond with your life.</em>',intro:'Let a passage give shape to prayer and practice. Connect what you believe with how you live, hope and care for others.',
        featured:item('Passage study','Bring the threat before the Lord','Follow Hezekiah’s prayer in 2 Kings 19:14–19, from the danger before him to the God he addresses.','/review/research/study/prayer-under-pressure',{meta:'2 Kings 19:14–19',art:'prayer',preview:true}),
        group:'Continue in Scripture',items:[
          item('Guide','Life in Christ','Explore the life the New Testament letters describe.','/study/letters/christ-in-the-letters/life'),
          item('Question','Assurance in a struggling Christian life','Read the existing discussion of promise, faith and assurance.','/apologetics/study/assurance'),
          item('Collection','Prayer, faith and hope in Topics','Find a theme and follow its passages.','/topics')],support:[['Grace and good works','/apologetics/study/grace'],['The question of suffering','/apologetics/study/suffering']]},
      {id:'people',title:'People & writers of Scripture',short:'Meet the people behind the pages',art:'writers',tone:'history',hint:'Follow a life, meet a writer and open the books associated with them.',
        heading:'Meet a writer.<br><em>Follow the words.</em>',intro:'The biblical books come to us through many voices. Explore their lives and settings, while keeping tradition, attribution and anonymity in view.',
        featured:item('Collection','People & genealogies','Follow the families, prophets, rulers and apostles through the biblical narrative.','/study/people',{meta:'Lives · Families · Scripture',art:'writers'}),
        group:'Lives within the story',items:[
          item('Guide','The prophets','Explore the people, settings and messages of prophecy.','/study/people?view=prophets'),
          item('Guide','The apostles','Meet the apostles and follow their work.','/study/people?view=apostles'),
          item('Collection','Paul and his letters','Read the letters alongside their writer and recipients.','/study/letters/paul')],support:[['Follow Paul in the Atlas','/study/atlas/journeys?focus=paul&lens=story'],['People & families','/study/people?view=families']],writers:true},
    ],
  },
  academic: {
    label:'Academic Studies',kicker:'Follow the sources',heading:'Enter the world.<br><em>Understand the evidence.</em>',
    lead:'Explore the history, texts, languages and scholarship surrounding the Bible. Follow a question into the sources, their interpretation and their limits.',
    tone:'history',other:'theology',otherLine:'Return to the passage and its teaching.',
    areas:[
      {id:'history',title:'Biblical history & archaeology',short:'Events, places & surviving records',art:'inscription',tone:'history',hint:'Read ancient accounts beside material evidence, and ask what each can establish.',
        heading:'A world recorded.<br><em>A past to investigate.</em>',intro:'Begin with a historical question. Compare the biblical narrative with an ancient account, then examine the setting, source and limits of the comparison.',
        featured:item('Historical case','Hezekiah under siege','Read Sennacherib’s royal account beside the biblical story of Judah under threat.','/review/research/cases/hezekiah-assyria',{meta:'Judah · Assyria · Royal inscriptions',art:'inscription',preview:true}),
        group:'Explore the setting and source',items:[
          item('Source','Sennacherib 022','Inspect the named edition and the passage used in the case.','/review/research/works/sennacherib-022',{preview:true}),
          item('Guide','Rulers in the biblical world','Follow rulers and their settings through the existing People guide.','/study/people?view=rulers'),
          item('Atlas','Places behind the narrative','Find a place and open the passages associated with it.','/study/atlas/map')],support:[['Meet the historians','/teachers/scholars'],['Questions and arguments','/apologetics']]},
      {id:'texts',title:'Manuscripts & textual history',short:'The surviving witnesses',art:'manuscript',tone:'prophets',hint:'Identify a manuscript, compare what survives and follow a textual question.',
        heading:'The text survives<br><em>in witnesses.</em>',intro:'Each manuscript has a date, a history and a particular scope. Look closely at one witness, then consider how it contributes to a larger textual question.',
        featured:item('Textual case','Where does Mark end?','Examine the ending of Mark in Codex Sinaiticus and what this particular witness can tell us.','/review/research/cases/sinaiticus-mark-ending',{meta:'Codex Sinaiticus · Mark 16',art:'manuscript',preview:true}),
        group:'Transmission and reception',items:[
          item('Source','Mark in Codex Sinaiticus','Identify the witness and inspect the cited text.','/review/research/works/sinaiticus-mark',{preview:true}),
          item('Question','Has the Bible been changed?','Read the existing argument about textual transmission.','/apologetics/study/manuscripts'),
          item('Guide','How the letters were read','Explore reception, questions and comparison.','/study/letters/look-closer/read')],support:[['The question of the canon','/apologetics/study/canon'],['Versions & languages','/study/versions']]},
      {id:'languages',title:'Languages & translation',short:'Words, meaning & editions',art:'languages',tone:'poetry',hint:'Explore language in context, compare editions and meet the people who translated them.',
        heading:'Words in context.<br><em>Meaning in view.</em>',intro:'Compare editions, examine words within their passages, and discover the reference scholarship that supports careful reading.',
        featured:item('Collection','Versions & languages','See the editions in time, compare their coverage and choose a text to read.','/study/versions',{meta:'Editions · Coverage · Reading',art:'languages'}),
        group:'Look more closely',items:[
          item('Guide','Words across the letters','Explore the Greek words the Letters guides bring into view.','/study/letters/what-runs-through-them/words'),
          item('Tool','Versions through time','Place the collection’s editions on a timeline.','/study/versions#timeline'),
          item('People','Translators and reference scholars','Meet the scholars and the work behind the reading tools.','/teachers/scholars')],support:[['Choose a reading edition','/library'],['Compare the letters','/study/letters/look-closer']]},
      {id:'culture',title:'Ancient cultures & daily life',short:'Life behind the passage',art:'city',tone:'epistles',hint:'Enter the cities, journeys and social settings in which people lived and wrote.',
        heading:'People lived here.<br><em>Their words had a setting.</em>',intro:'Letters were written, carried and read in real communities. Explore those journeys and cities before returning to the words themselves.',
        featured:item('Guide','How the letters came to be','Explore when letters were written, where they travelled and how an ancient letter was formed.','/study/letters/how-the-letters-came-to-be',{meta:'Dates · Travel · Letter form',art:'letters'}),
        group:'Enter the world around the text',items:[
          item('Atlas','Ancient cities','Explore a city’s setting and biblical connections.','/study/atlas/cities'),
          item('Guide','The letter itself','Consider the shape, writing and carrying of an ancient letter.','/study/letters/how-the-letters-came-to-be/letter'),
          item('Journey','Paul: places and letters','Connect his correspondence with the places in its story.','/study/atlas/journeys?focus=paul&lens=letters')],support:[['Find a place','/study/atlas/map'],['Meet the people','/study/people']]},
      {id:'church',title:'Christian thought & church history',short:'People, ideas & their reception',art:'church',tone:'gospels',hint:'Follow Christian reading and teaching through writers, works and communities.',
        heading:'A long conversation.<br><em>Writers worth meeting.</em>',intro:'Explore how Christian texts were read, how questions developed and who contributed to the discussion. Begin with a guide, then follow its people and works.',
        featured:item('Guide','How the letters were read','Consider the questions readers have asked and how these letters were received.','/study/letters/look-closer/read',{meta:'Reading · Questions · Reception',art:'church'}),
        group:'Follow their work',items:[
          item('People','Scholars','Historians, theologians and the makers of reference works.','/teachers/scholars'),
          item('People','Preachers & authors','Explore the people who taught, preached and wrote.','/teachers/preachers-and-authors'),
          item('Reading outline','The early church','Browse the existing topic outlines and their source links.','/study/atlas/early-church',{outline:true})],support:[['The Reformation: an outline','/study/atlas/reformation'],['Christian traditions: an outline','/study/atlas/catholic-orthodox']],
        planned:['Shared roots','Oriental Orthodox churches','Separation & encounter','Worship & spiritual life']},
    ],
  },
};
