"""Human-readable L03 contents transcription; no sermon prose is regenerated.

Rows are edition units, not a census of delivered occasions. Printed starts come
from contents/opening headings; PDF locators are checked by the catalog builder.
"""
import json
from bible.paths import SITE

GROUPS = []
def group(key, author, item, title, offset, rows, classification='printed-sermon', note=''):
    members=[]
    for n,line in enumerate(rows.strip().splitlines(),1):
        page,ref,name=line.split('|')
        members.append(dict(position=n,title=name,printedPage=int(page),pdfPage=int(page)+offset,
                            mainText=ref or None,classification=classification,notes=[]))
    GROUPS.append(dict(key=key,author=author,item=item,title=title,notes=[note] if note else [],members=members))

group('whitefield-works-5','whitefield','worksofreverendg05whit','Works, volume V: sermons I–XXXI',10, '''
3|Genesis 3:15|The Seed of the Woman, and the Seed of the Serpent
21|Genesis 5:24|Walking with God
36|Genesis 22:12|Abraham's Offering Up His Son Isaac
52|Joshua 24:15|The Great Duty of Family-Religion
65|Psalms 45:10-11|Christ the Best Husband
79|Psalms 105:45|Britain's Mercies, and Britain's Duty
94|Psalms 107:30-31|Thankfulness for Mercies Received, a Necessary Duty
107|Ecclesiastes 4:9-12|The Necessity and Benefits of Religious Society
123|Ecclesiastes 7:16|The Folly and Danger of Not Being Righteous Enough
143|Ecclesiastes 7:16|A Preservative Against Unsettled Notions, and Want of Principles
161|Ecclesiastes 12:1|The Benefits of an Early Piety
178|Isaiah 54:5|Christ the Believer's Husband
197|Jeremiah 18:1-6|The Potter and the Clay
216|Jeremiah 23:6|The Lord Our Righteousness
235|Daniel 9:24|The Righteousness of Christ an Everlasting Righteousness
251|Matthew 1:21|The Observation of the Birth of Christ, the Duty of All Christians
262|Matthew 4:1-11|The Temptation of Christ
276|Matthew 5:34|The Heinous Sin of Profane Cursing and Swearing
287|Matthew 6:13|Christ the Support of the Tempted
299|Matthew 8:22|Worldly Business No Plea for the Neglect of Religion
318|Matthew 11:28|Christ the Only Rest for the Weary and Heavy Laden
329|Matthew 8:23-34|The Folly and Danger of Parting with Christ for the Pleasures and Profits of Life
338|Matthew 18:3|Marks of a True Conversion
353|Matthew 22:42|What Think Ye of Christ?
373|Matthew 25:13|The Wise and Foolish Virgins
392|Matthew 25:46|The Eternity of Hell-Torments
404|Mark 10:52|Blind Bartimeus
418|Luke 8:18|Directions How to Hear Sermons
428|Luke 9:23|The Extent and Reasonableness of Self-Denial
440|Luke 9:28-36|Christ's Transfiguration
456|Luke 10:42|The Care of the Soul Urged as the One Thing Needful
''',note='1772 posthumous collection. Asterisks in the contents identify first publication from author manuscripts; printed numbering is not a delivery chronology.')
group('whitefield-works-6','whitefield','worksofreverendg06whit','Works, volume VI: sermons XXXII–LVII',10,'''
3|Luke 13:3|A Penitent Heart, the Best New Year's Gift
20|Luke 14:22-24|The Gospel Supper
36|Luke 18:14|The Pharisee and Publican
49|Luke 19:9-10|The Conversion of Zaccheus
64|John 2:11|The Marriage of Cana
79|John 5:39|The Duty of Searching the Scriptures
89|John 7:37-39|The Indwelling of the Spirit, the Common Privilege of All Believers
103|John 11:43-44|The Resurrection of Lazarus
127|John 16:8|The Holy Spirit Convincing the World of Sin, Righteousness, and Judgment
143|Acts 9:22|Saul's Conversion
161|Acts 19:2|Marks of Having Received the Holy Ghost
174|Acts 26:28|The Almost Christian
187|1 Corinthians 1:30|Christ, the Believer's Wisdom, Righteousness, Sanctification, and Redemption
203|1 Corinthians 2:2|The Knowledge of Jesus Christ the Best Knowledge
214|1 Corinthians 6:11|Of Justification by Christ
227|1 Corinthians 13:8|The Great Duty of Charity Recommended
241|2 Corinthians 2:11|Satan's Devices
257|2 Corinthians 5:17|On Regeneration
273|2 Corinthians 6:16|Christians, Temples of the Living God
287|2 Corinthians 13:5|Christ the Only Preservative Against a Reprobate Spirit
303|Ephesians 5:18|The Heinous Sin of Drunkenness
317|Philippians 3:10|The Power of Christ's Resurrection
331|1 Thessalonians 5:25|Intercession Every Christian's Duty
345|2 Timothy 3:12|Persecution Every Christian's Lot
361|Hebrews 4:9|An Exhortation to the People of God Not to Be Discouraged in Their Way
369|Zechariah 4:10|Sermon Before the Governor, Council, and House of Assembly in Georgia
''',note='1772 posthumous collection; continues volume V numbering. Separate from later Gurney shorthand reports.')
group('newton-six-discourses','newton','worksrevjohnne02newt','Six Discourses (or Sermons), as Intended for the Pulpit',12,'''
259|Jeremiah 17:9-10|The Deceitfulness of the Heart
276|1 Timothy 1:15|On the Saviour and His Salvation
290|Acts 11:26|On the Christian Name
304|Romans 8:32|All Things Given Us with Christ
321|John 5:39|On Searching the Scriptures
339|John 5:39|The Same Subject Continued
''','pulpit-discourse-delivery-unestablished','The title says intended for the pulpit; no actual delivery is inferred.')
group('newton-olney','newton','worksrevjohnne02newt','Twenty Sermons Preached in the Parish Church of Olney',12,'''
359|Matthew 11:25|The Small Success of the Gospel Ministry Considered
369|Matthew 11:25|In What Sense the Mysteries of the Gospel Are Hid from Many
382|Matthew 11:25|The Characters of Those from Whom the Gospel Doctrines Are Hid
392|Matthew 11:25|The Nature of Spiritual Revelation, and Who Are Favoured with It
404|Matthew 11:26|The Sovereignty of Divine Grace Asserted and Illustrated
414|Matthew 11:27|Of the Person of Christ
426|Matthew 11:27|Of the Authority of Christ
437|Matthew 11:27|The Glory and Grace of God Revealed in Jesus Christ
448|Matthew 11:28|Labouring and Heavy-Laden Sinners Described
458|Matthew 11:28|Of Coming to Christ
469|Matthew 11:28|The Present and Future Rest of Believers in Christ
480|Matthew 11:29|Of the Yoke of Christ
491|Matthew 11:30|The Service of Christ Easy and Pleasant to His People
503|Romans 14:16|Believers Cautioned Against Misconduct in Their Profession
515|Exodus 20:7|The Extent and Sanction of the Third Commandment
528|1 Corinthians 9:24|The Christian Life Compared to a Race
540|Micah 6:6-8|No Access to God but by the Gospel of Christ
550|James 2:26|Of a Living and a Dead Faith
563|Psalms 51:15|Guilt Removed, and Peace Restored
583|1 John 5:19|Of the Assurance of Faith
''','delivered-sermon','Series title attests preaching at Olney; individual delivery dates remain unknown unless explicitly documented.')
group('newton-messiah','newton','worksrevjohnne04newt','Messiah: Fifty Expository Discourses',38,'''
1|Isaiah 40:1-2|The Consolation
16|Isaiah 40:3-5|The Harbinger
29|Haggai 2:6-7|The Shaking of the Heavens and the Earth
42|Malachi 3:1-3|The Lord Coming to His Temple
55|Isaiah 7:14|Immanuel
68|Isaiah 40:9|Salvation Published from the Mountains
79|Isaiah 60:1-3|The Morning Light
91|Isaiah 9:2|The Sun Rising Upon a Dark World
103|Isaiah 9:6|The Characters and Names of Messiah
115|Luke 2:8-14|The Angel's Message and Song
127|Zechariah 9:9-10|Messiah's Entrance into Jerusalem
138|Isaiah 35:5-6|Effects of Messiah's Appearance
149|Isaiah 40:11|The Great Shepherd
163|Matthew 11:28|Rest for the Weary
173|Matthew 11:29-30|Messiah's Easy Yoke
184|John 1:29|The Lamb of God, the Great Atonement
198|Isaiah 53:3|Messiah Despised and Rejected of Men
209|Isaiah 50:6|Voluntary Suffering
219|Isaiah 53:4-5|Messiah Suffering and Wounded for Us
230|Isaiah 53:6|Sin Charged Upon the Surety
240|Psalms 22:7-8|Messiah Derided Upon the Cross
250|Psalms 69:20|Messiah Unpitied, and Without a Comforter
260|Lamentations 1:12|No Sorrow Like Messiah's Sorrow
270|Isaiah 53:8|Messiah's Innocence Vindicated
280|Psalms 16:10|Messiah Rising from the Dead
292|Psalms 24:7-10|The Ascension of Messiah to Glory
302|Hebrews 1:5|Messiah the Son of God
313|Hebrews 1:6|Messiah Worshipped by Angels
324|Psalms 68:18|Gifts Received for the Rebellious
335|Psalms 68:11|The Publication of the Gospel
346|Romans 10:15|The Gospel Message, Glad Tidings
357|Romans 10:18|The Progress of the Gospel
369|Psalms 2:1-3|Opposition to Messiah Unreasonable
379|Psalms 2:4|Opposition to Messiah Vain
389|Psalms 2:9|Opposition to Messiah Ruinous
400|Revelation 19:6|The Lord Reigneth
411|Revelation 11:15|The Extent of Messiah's Spiritual Kingdom
425|Revelation 19:16|King of Kings, and Lord of Lords
435|Job 19:25-26|Job's Faith and Expectation
449|1 Corinthians 15:20|The Lord Is Risen Indeed
458|1 Corinthians 15:21-22|Death by Adam, Life by Christ
468|1 Corinthians 15:51-52|The General Resurrection
479|1 Corinthians 15:54|Death Swallowed Up in Victory
490|1 Corinthians 15:55-57|Triumph Over Death and the Grave
502|Romans 8:31|Divine Support and Protection
514|Romans 8:33|Accusers Challenged
527|Romans 8:34|The Intercession of Christ
539|Revelation 5:9|The Song of the Redeemed
556|Revelation 5:12|The Chorus of Angels
569|Revelation 5:13|The Universal Chorus
''','author-abridged-delivered-sermon','Preached at St Mary Woolnoth in 1784–1785 (1786 first-edition title). The preface says most discourses were considerably abridged for print. Reprinted here in 1810; not verbatim delivery transcripts.')
group('newton-occasional','newton','worksrevjohnne05newt','Works, volume V: seven occasional sermons',10,'''
127|Ephesians 4:15|The Subject and Temper of the Gospel Ministry
137|Jeremiah 5:29|The Guilt and Danger of Such a Nation as This
167|1 Thessalonians 2:8|On the Death of Dr. Conyers
191|Proverbs 11:30|The Best Wisdom
225|1 Thessalonians 4:16-17|The Great Advent
249|Jonah 3:9|The Imminent Danger and Only Sure Resource of This Nation
273|Hosea 11:8-9|Motives to Humiliation and Praise
''',note='Sermons embedded among tracts, memoir and letters. Contents position is editorial, not delivery order.')
group('newton-love','newton','worksrevjohnne06newt','Works, volume VI: sermon on the love of Christ',16,'''
489|2 Corinthians 5:14-15|The Constraining Influence of the Love of Christ
''',note='1811 posthumous collected volume. Executors distinguish this previously published 1800 sermon from their letters and miscellaneous essays.')
group('edwards-farewell','edwards','worksofpresidents01edwa','Farewell Sermon',6,'''
629|2 Corinthians 1:14|Farewell Sermon
''',note='Posthumous 1830 collected edition. Original 1751 imprint reproduced on printed p.626. June 22, 1750 in the title describes rejection by the congregation; do not automatically use it as the delivery date.')
group('edwards-sermon-derived','edwards','worksofpresidents03edwa','Sermon-derived works in volume III',14,'''
165|Isaiah 51:8|A History of the Work of Redemption
551|1 John 4:1|The Distinguishing Marks of a Work of the Spirit of God
''','sermon-derived-work','Long-form editorial/publication units; not counted as two discrete delivered sermons. Prefaces and publishers frame these works separately from the discourses they originated in.')
group('edwards-five','edwards','worksofpresidents05edwa','Five Discourses on Important Subjects',16,'''
351|Romans 4:5|Justification by Faith Alone
453|Luke 16:16|Pressing into the Kingdom of God
484|Ruth 1:16|Ruth's Resolution
498|Romans 3:19|The Justice of God in the Damnation of Sinners
535|Revelation 5:5-6|The Excellency of Christ
''','delivered-sermon','Preface attests Northampton preaching and explains that Justification combines two lectures and is much enlarged for publication; other four have little added. First published 1738; collected here 1830.')
group('edwards-twenty','edwards','worksofpresidents06edwa','Twenty Sermons on Various Subjects',14,'''
5|Genesis 6:22|The Manner of Seeking Salvation
23|1 Kings 18:21|The Unreasonableness of Indetermination in Religion
35|Acts 4:11|Unbelievers Contemn the Glory of Christ
45|Luke 17:32|The Folly of Looking Back in Fleeing Out of Sodom (I)
53|Luke 17:32|The Folly of Looking Back in Fleeing Out of Sodom (II)
58|Luke 16:31|Scripture Warnings Best Adapted to the Conversion of Sinners
69|Job 27:10|Hypocrites Deficient in the Duty of Prayer (I)
79|Job 27:10|Hypocrites Deficient in the Duty of Prayer (II)
89|Ezekiel 22:14|Future Punishment Unavoidable (I)
97|Ezekiel 22:14|Future Punishment Unavoidable (II)
106|Matthew 25:46|The Eternity of Hell Torments
125|John 14:27|The Peace Which Christ Gives
137|1 Corinthians 16:1-2|The Perpetuity of the Sabbath
148|1 Corinthians 16:1-2|The Change of the Sabbath (I)
162|1 Corinthians 16:1-2|The Change of the Sabbath (II)
171|Matthew 16:17|The Reality of Spiritual Light
189|Isaiah 62:4-5|The Church's Marriage
217|Ezekiel 19:12|A Strong Rod Broken and Withered
232|James 2:19|True Grace Distinguished from the Experience of Devils
''',note='Contains nineteen bodies: original no. XVIII, the Brainerd funeral sermon, is explicitly redirected to volume X, p.454. Son Jonathan Edwards transcribed the manuscripts; his preface is dated December 21, 1779. The son is editor, not preacher of these sermons.')
group('edwards-practical','edwards','worksofpresidents06edwa','Practical Sermons',14,'''
266|Hebrews 5:12|Christian Knowledge
284|Psalms 73:25|God the Portion of the Christian
293|Psalms 46:10|Divine Sovereignty
304|Psalms 25:11|Pardon for the Greatest Sinners
314|Psalms 65:2|The Most High a Prayer-Hearing God
328|Psalms 139:23-24|The Necessity of Self-Examination
366|Ezekiel 23:37-39|A Warning to Professors of Religion
381|Acts 17:31|The Final Judgment
414|Psalms 36:2|Self-Flatteries
424|Ezekiel 15:2-4|The Wicked Useful in Their Destruction Only
440|Isaiah 33:14|Sinners in Zion
458|1 Thessalonians 2:16|Wrath Upon the Wicked to the Uttermost
466|Revelation 18:20|The End of the Wicked Contemplated by the Righteous
486|Ephesians 5:16|Preciousness of Time
498|Proverbs 27:1|Procrastination
517|Exodus 20:15|Dishonesty
536|Deuteronomy 15:7-12|Christian Charity
569|1 Corinthians 5:11|The Nature and End of Excommunication
''',note='Posthumous collection: contents identifies Edinburgh publication by John Erskine in 1788 (verify scan). Continuation contents leaf appears in the acquired volume VII, PDF p.12; bodies are in volume VI.')
group('edwards-eight','edwards','worksofpresidents07edwa','Eight Sermons on Various Subjects',12,'''
3|Psalms 94:8-11|Man's Natural Blindness in Religion
31|Romans 5:10|Men Naturally God's Enemies
66|Ephesians 3:10|Wisdom Displayed in Salvation
115|Genesis 39:12|Joseph's Temptation and Deliverance
135|Hebrews 11:13-14|The Christian Pilgrim
149|1 Corinthians 1:29-31|God Glorified in Man's Dependence
163|Deuteronomy 32:35|Sinners in the Hands of an Angry God
178|Hebrews 13:17|The Watchman's Duty and Account
''',note='The editor explicitly combines three short sermons into the first treatise; contents units are not a delivery count. Miscellaneous observations after these eight are excluded.')
group('edwards-seventeen','edwards','worksofpresidents08edwa','Seventeen Occasional Sermons',10,'''
5|Acts 16:29-30|Natural Men in a Dreadful Condition
44|Hosea 5:15|God Makes Men Sensible of Their Misery Before He Reveals His Mercy and Love
70|Hosea 2:15|Hope and Comfort Usually Follow Genuine Humiliation and Repentance
105|Romans 9:18|God's Sovereignty in the Salvation of Men
123|Philippians 3:17|The Character of Paul an Example to Christians
159|Luke 22:44|Christ's Agony
195|Romans 2:8-9|The Portion of the Wicked
227|Romans 2:10|The Portion of the Righteous
281|Matthew 5:8|The Pure in Heart Blessed
305|Revelation 14:2|Praise, One of the Chief Employments of Heaven
320|Matthew 11:16-19|Wicked Men Inconsistent with Themselves
355|Isaiah 32:2|Safety, Fullness, and Sweet Refreshment, to Be Found in Christ
379|1 Peter 2:9|Christians a Chosen Generation, a Royal Priesthood, a Holy Nation, a Peculiar People
418|Hebrews 13:8|Jesus Christ the Same Yesterday, Today, and Forever
437|John 5:35|The True Excellency of a Gospel Minister
455|John 13:15-16|Christ the Example of Ministers
471|Matthew 14:12|Sorrows of the Bereaved Spread Before Jesus
''',note='Posthumous collected edition, 1830. Seventeen published units; no inference of seventeen unique delivery occasions.')
group('edwards-brainerd','edwards','worksofpresident10edwa','Funeral Sermon on David Brainerd',0,'''
454|2 Corinthians 5:8|True Saints, When Absent from the Body, Are Present with the Lord
''',note='Embedded after Brainerd memoir; same work as no. XVIII cross-reference in volume VI. Pemberton’s earlier ordination sermon is a different author and is excluded.')
group('ryle-race','ryle','thechristianrace00ryleuoft','The Christian Race and Other Sermons',18,'''
1|Jeremiah 17:9-10|A Bad Heart
15|John 3:3|Regeneration (I)
28|John 3:3|Regeneration (II)
42|John 3:3|Regeneration (III)
57|John 3:16|Saving Faith
67|Matthew 11:28|Come Unto Me
79|Jeremiah 23:6|The Lord Our Righteousness
97|Luke 18:9|Self-Righteousness
114|John 10:27-28|The Character of the True Christian
126|John 10:27-28|The Privileges of the True Christian
139|2 Corinthians 6:1|The Grace of God in Vain
154|Hebrews 12:1-2|The Christian Race
168|Matthew 22:42|What Think Ye of Christ?
179|Hebrews 13:8|The Unchanging Christ
196|Matthew 25:1-13|The Second Advent (The Ten Virgins)
219|Mark 6:34|The Compassion of Jesus
231|Mark 8:36|Profit and Loss
244|Genesis 5:24|Enoch Walking with God
258|Daniel 6:5|Daniel Found Faithful
269|Revelation 3:12|A Pillar in God's Temple
280|Revelation 3:20|Knocking, Knocking
292|Revelation 7:14-17|The Blood of the Lamb
312|Revelation 21:27|Heaven
325|2 Timothy 4:6-8|Ready to Be Offered
''',note='Hodder & Stoughton, 1900. Preface by T. J. Madden, Liverpool, March 1, 1900: Ryle authorized Madden to select manuscripts for this ministry memorial. No individual preaching dates established; 1900 alone does not establish posthumous publication.')
group('ryle-children','ryle','twobearsandothe00rylegoog','The Two Bears, and Other Sermons for Children',12,'''
1|2 Kings 2:23-24|The Two Bears
21|2 John 1:4|Children Walking in Truth
43|Proverbs 30:24-28|Little and Wise
63|Revelation 21:4|No More Crying!
83||The Happy Little Girl
89||Little Things
111|Proverbs 8:17|Seeking the Lord Early
''',note='William Hunt edition, cataloged 1869; scan title date needs visual verification. Book includes short pastoral pieces, not seven securely documented delivered sermons. Children are the intended audience.')

def revise(key, n, **fields):
    g=next(g for g in GROUPS if g['key']==key)
    g['members'][n-1].update(fields)

# Contents-page references and the location of the actual sermon heading can
# differ. Keep the published reference, with the independently checked PDF start.
for n,pdf in {3:48,10:151,11:169,12:181,21:318,22:329,23:346}.items():
    revise('whitefield-works-5',n,pdfPage=pdf)
for n,p in {3:38,11:159,12:171,21:308,22:319,23:336}.items():revise('whitefield-works-5',n,printedPage=p)
for key in ['newton-six-discourses','newton-olney']:
    for r in next(g for g in GROUPS if g['key']==key)['members']:r['pdfPage']+=2
revise('edwards-farewell',1,printedPage=626,pdfPage=636)
revise('edwards-sermon-derived',2,printedPage=559,pdfPage=573)
revise('edwards-twenty',13,pdfPage=152)
for n,p in {1:279,7:379,13:482}.items():revise('edwards-practical',n,pdfPage=p)
revise('edwards-practical',1,printedPage=265)
revise('edwards-practical',7,printedPage=365)
revise('edwards-seventeen',9,pdfPage=290)
revise('edwards-seventeen',5,mainText='Philippians 3:17')
revise('edwards-eight',5,mainText='Hebrews 11:13-14',notes=['Contents says Hebrews 11; OCR misreads the heading as xi. Verify against the quoted words.'])
revise('edwards-brainerd',1,printedPage=453,pdfPage=465)
for n,p in {9:129,15:213,18:261,22:314}.items():revise('ryle-race',n,pdfPage=p)
for n,p in {9:111,15:195,18:243,22:296}.items():revise('ryle-race',n,printedPage=p)
for n,p in {1:139,2:149,3:177,4:201,5:235,6:259,7:283}.items():revise('newton-occasional',n,pdfPage=p)
revise('newton-love',1,pdfPage=509,mainText='2 Corinthians 5:13-15',classification='author-reconstructed-delivered-sermon',notes=['Advertisement, PDF p.508: not an exact copy of delivery; reconstructed after an interval without notes, with impaired recollection.'])
revise('ryle-children',5,classification='pastoral-illustration',notes=['Short railway encounter narrative; no main-text heading and no delivery attestation. Excluded from sermon counts.'])
revise('ryle-children',6,classification='pastoral-address',notes=['Illustrated address about little things, introduced by the Birds Nest institution. No single opening main text or dated delivery established. Excluded from sermon counts.'])
revise('edwards-eight',1,classification='sermon-derived-editorial-compilation',notes=['Editor W. at printed p.3 says three short unfinished sermons were recast as a treatise; Glasgow 1785 form also mentioned.'])
revise('edwards-five',1,classification='author-expanded-sermon-compilation',notes=['Author preface pp.348–349: originally two public lectures, substantially enlarged for print. Not one delivery.'])
revise('ryle-race',7,notes=['Printed contents gives Jeremiah 23:17 (visually checked); actual sermon heading PDF p.97 and quoted words identify Jeremiah 23:6. Retain this source misprint separately from OCR errors.'])
revise('whitefield-works-6',17,notes=['Contents OCR says 1 Corinthians; actual heading PDF p.251 says 2 Corinthians 2:11.'])
revise('newton-messiah',42,notes=['Printed heading identifies 1 Corinthians 15:51–52; quotation extends into verse 53. Preserve heading range separately from extended quotation.'])
for n,count in [(6,4),(11,2),(13,2)]:
    revise('edwards-practical',n,classification='sermon-derived-editorial-compilation',notes=[f'Opening footnote identifies the substance of {count} posthumous discourses, not a single delivered sermon.'])
revise('edwards-practical',13,notes=['Opening footnote identifies two posthumous discourses and prints March 1773, after Edwards’s death. Retained as a source conflict; no delivery date inferred.'])
for g in GROUPS:
    if g['key']=='edwards-practical':g['notes']=['Contents says first published Edinburgh 1778; individual footnotes also identify 1788 material. This collected division must not receive a uniform first-publication date. Contents continuation leaf is misplaced in volume VII, PDF p.12; bodies are in volume VI.']
    if g['key']=='ryle-children':g['notes']=['William Hunt, 1869: date visually verified on title page, PDF p.9. Seven contents entries include two pastoral pieces distinguished from the five sermon-form texts. Intended audience: children.']

def dated(key,n,kind,value,locator,note):
    r=next(g for g in GROUPS if g['key']==key)['members'][n-1]
    r.setdefault('dates',[]).append(dict(event=kind,value=value,precision='range' if '/' in value else {4:'year',7:'month',10:'day'}[len(value)],label=note,locator=locator))

for n,date,pub,pdf in [(1,'1779-12-19','1780',137),(2,'1781-02-21','1781',147),(3,'1786-05-07','1786',175),(4,'1787-11-21','1787',199),(5,'1789-04-23','1789',233),(6,'1794-02-28','1794',257),(7,'1797-12-19',None,281)]:
    dated('newton-occasional',n,'delivery',date,f'PDF p.{pdf}, individual title','Explicit preaching date; occasion preserved in title-page witness.')
    if pub:dated('newton-occasional',n,'original-publication',pub,f'PDF p.{pdf}, individual title','Explicit first-printed year; distinct from 1810 collected edition.')
dated('newton-love',1,'delivery','1800-03-30','PDF p.505','Charity sermon before the Lord Mayor, aldermen and sheriffs for Langbourn-Ward Charity School.')
dated('newton-love',1,'original-publication','1800','Executors advertisement, PDF pp.9–11','Executors identify prior publication in 1800.')
for n in range(1,51):
    dated('newton-messiah',n,'delivery','1784/1785','1786 first-edition title; 1810 preface, PDF pp.9–16','Series-level range only, St Mary Woolnoth. No individual day inferred.')
    dated('newton-messiah',n,'original-publication','1786','1786 first-edition bibliography','First edition of Messiah; this copy is the 1810 reprint.')
for n in [13,15,17,23,30]:
    dated('whitefield-works-5',n,'original-publication','1772','Contents, PDF pp.9–12, asterisk legend','Marked as first publication from author’s own manuscript; posthumous publication does not mean posthumous delivery.')
for n in [19,26]:dated('whitefield-works-6',n,'original-publication','1772','Contents, PDF pp.9–12, asterisk legend','Marked as first publication from author’s own manuscript.')
dated('whitefield-works-5',6,'delivery','1746-08-24','PDF p.89, sermon title','Philadelphia; thanksgiving for suppression of the rebellion, as the historical title describes it.')
dated('whitefield-works-5',7,'delivery','1738-05-17','PDF p.104, sermon title','Source prints Sunday, May 17, 1738, aboard Whitaker near Savannah. Calendar/day discrepancy not silently corrected; date is a printed witness.')
dated('whitefield-works-6',26,'delivery','1770-01-28','PDF p.379, sermon title','Before Georgia governor, council and house of assembly.')
dated('edwards-farewell',1,'original-publication','1751','PDF p.632, reproduced original imprint','Boston: S. Kneeland. The June 22, 1750 title date concerns rejection, not an independently verified delivery date.')
for n in range(1,6):dated('edwards-five',n,'original-publication','1738','Volume V, preface PDF pp.363–366','First-publication date preserved by the preface; distinct from the 1830 volume.')
for n,val,pdf in [(17,'1746-09-19',203),(18,'1748-06-26',231),(19,'1752-09-28',246)]:dated('edwards-twenty',n,'delivery',val,f'PDF p.{pdf}, opening footnote','Explicit preaching date; 1752 witness explicitly says New Style. Earlier dates retained in source calendar without conversion.')
dated('edwards-twenty',16,'original-publication','1734','PDF p.185, footnote','Published at hearers’ request in 1734; preaching at Northampton attested, exact delivery date not assigned.')
for n,val in [(6,'1731-07-08'),(7,'1741-07-08')]:dated('edwards-eight',n,'delivery',val,f'PDF p.{next(g for g in GROUPS if g["key"]=="edwards-eight")["members"][n-1]["pdfPage"]}, footnote','Explicit preached date, retained as printed without calendar conversion.')
for n,val in [(15,'1744-08-30'),(16,'1749-06-28'),(17,'1741-09-03')]:dated('edwards-seventeen',n,'delivery',val,f'Opening footnote for sermon {n}','Explicit ordination/funeral preaching date; source calendar retained.')
dated('edwards-seventeen',10,'delivery','1734-11-07','PDF p.315, Thanksgiving sermon heading','Thanksgiving sermon dated in heading.')

if __name__=='__main__':
    out=SITE/'content/library/reports/historic-preaching/components.json'
    out.write_text(json.dumps(GROUPS,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
    print('Groups:',len(GROUPS),'components:',sum(len(g['members']) for g in GROUPS))
