// The thread: recorded words, word for word from the KJV, each line with its verse. Checked by extract.cjs: every
// piece of every line must be in its verse (an ellipsis " … " marks a shortening), and every line marked as Jesus'
// words must lie inside the KJV's red-letter runs.
// who: "j" Jesus · "s" the apostle (self) · "o" someone else (name) · "v" a voice, angel or vision (name) · "n" narration.
const J = (v, t) => ({ who: "j", v, t });
const S = (v, t, name) => ({ who: "s", v, t, ...(name ? { name } : {}) });
const O = (name, v, t) => ({ who: "o", name, v, t });
const V = (name, v, t) => ({ who: "v", name, v, t });
const N = (v, t) => ({ who: "n", v, t });

const peter = [
  { id: "jesus", title: "With Jesus", sub: "The Gospels, in the order of Robertson's harmony", items: [
    { key: "m0", lines: [O("Andrew, his brother", 43001041, "We have found the Messias, which is, being interpreted, the Christ."), N(43001042, "And he brought him to Jesus."), J(43001042, "Thou art Simon the son of Jona: thou shalt be called Cephas,"), N(43001042, "which is by interpretation, A stone.")] },
    { key: "m1", tabs: [
      { book: "MAT", lines: [N(40004018, "Jesus, walking by the sea of Galilee, saw two brethren, Simon called Peter, and Andrew his brother, casting a net into the sea: for they were fishers."), J(40004019, "Follow me, and I will make you fishers of men."), N(40004020, "And they straightway left their nets, and followed him.")] },
      { book: "MRK", lines: [N(41001016, "he saw Simon and Andrew his brother casting a net into the sea: for they were fishers."), J(41001017, "Come ye after me, and I will make you to become fishers of men."), N(41001018, "And straightway they forsook their nets, and followed him.")] },
      { book: "LUK", lines: [J(42005004, "Launch out into the deep, and let down your nets for a draught."), S(42005005, "Master, we have toiled all the night, and have taken nothing: nevertheless at thy word I will let down the net."), N(42005006, "they inclosed a great multitude of fishes: and their net brake."), S(42005008, "Depart from me; for I am a sinful man, O Lord."), J(42005010, "Fear not; from henceforth thou shalt catch men."), N(42005011, "they forsook all, and followed him.")] },
    ] },
    { key: "m2", tabs: [
      { book: "MRK", lines: [N(41001030, "But Simon’s wife’s mother lay sick of a fever, and anon they tell him of her."), N(41001031, "And he came and took her by the hand, and lifted her up; and immediately the fever left her, and she ministered unto them.")] },
      { book: "MAT", lines: [N(40008014, "And when Jesus was come into Peter’s house, he saw his wife’s mother laid, and sick of a fever."), N(40008015, "And he touched her hand, and the fever left her: and she arose, and ministered unto them.")] },
      { book: "LUK", lines: [N(42004038, "Simon’s wife’s mother was taken with a great fever; and they besought him for her."), N(42004039, "And he stood over her, and rebuked the fever; and it left her:")] },
    ] },
    { key: "m3", tabs: [
      { book: "MRK", lines: [N(41003014, "And he ordained twelve, that they should be with him, and that he might send them forth to preach,"), N(41003016, "And Simon he surnamed Peter;")] },
      { book: "LUK", lines: [N(42006013, "of them he chose twelve, whom also he named apostles;"), N(42006014, "Simon, (whom he also named Peter,) and Andrew his brother,")] },
    ] },
    { key: "m4", tabs: [
      { book: "MRK", lines: [N(41005037, "And he suffered no man to follow him, save Peter, and James, and John the brother of James.")] },
      { book: "LUK", lines: [N(42008051, "he suffered no man to go in, save Peter, and James, and John, and the father and the mother of the maiden.")] },
    ] },
    { key: "m5", tabs: [
      { book: "MAT", lines: [N(40010002, "The first, Simon, who is called Peter, and Andrew his brother;"), J(40010005, "Go not into the way of the Gentiles, and into any city of the Samaritans enter ye not:")] },
      { book: "MRK", lines: [N(41006007, "began to send them forth by two and two;"), J(41006010, "In what place soever ye enter into an house, there abide till ye depart from that place.")] },
      { book: "LUK", lines: [J(42009003, "Take nothing for your journey, neither staves, nor scrip, neither bread, neither money; neither have two coats apiece.")] },
    ] },
    { key: "m6", lines: [S(40014028, "Lord, if it be thou, bid me come unto thee on the water."), J(40014029, "Come."), N(40014029, "he walked on the water, to go to Jesus."), S(40014030, "Lord, save me."), J(40014031, "O thou of little faith, wherefore didst thou doubt?")] },
    { key: "m7", lines: [J(43006067, "Will ye also go away?"), S(43006068, "Lord, to whom shall we go? thou hast the words of eternal life."), S(43006069, "And we believe and are sure that thou art that Christ, the Son of the living God.")] },
    { key: "m8", tabs: [
      { book: "MAT", lines: [J(40016015, "But whom say ye that I am?"), S(40016016, "Thou art the Christ, the Son of the living God."), J(40016017, "Blessed art thou, Simon Bar-jona: for flesh and blood hath not revealed it unto thee, but my Father which is in heaven."), J(40016018, "And I say also unto thee, That thou art Peter, and upon this rock I will build my church; and the gates of hell shall not prevail against it.")] },
      { book: "MRK", lines: [J(41008029, "But whom say ye that I am?"), S(41008029, "Thou art the Christ.")] },
      { book: "LUK", lines: [J(42009020, "But whom say ye that I am?"), S(42009020, "The Christ of God.")] },
    ] },
    { key: "m9", tabs: [
      { book: "MAT", lines: [S(40016022, "Be it far from thee, Lord: this shall not be unto thee."), J(40016023, "Get thee behind me, Satan: thou art an offence unto me: for thou savourest not the things that be of God, but those that be of men.")] },
      { book: "MRK", lines: [N(41008032, "And Peter took him, and began to rebuke him."), J(41008033, "Get thee behind me, Satan: for thou savourest not the things that be of God, but the things that be of men.")] },
    ] },
    { key: "m10", tabs: [
      { book: "MAT", lines: [S(40017004, "Lord, it is good for us to be here: if thou wilt, let us make here three tabernacles; one for thee, and one for Moses, and one for Elias."), V("A voice out of the cloud", 40017005, "This is my beloved Son, in whom I am well pleased; hear ye him."), J(40017007, "Arise, and be not afraid.")] },
      { book: "MRK", lines: [S(41009005, "Master, it is good for us to be here: and let us make three tabernacles; one for thee, and one for Moses, and one for Elias."), N(41009006, "For he wist not what to say; for they were sore afraid."), V("A voice out of the cloud", 41009007, "This is my beloved Son: hear him.")] },
      { book: "LUK", lines: [S(42009033, "Master, it is good for us to be here: and let us make three tabernacles; one for thee, and one for Moses, and one for Elias:"), N(42009033, "not knowing what he said."), V("A voice out of the cloud", 42009035, "This is my beloved Son: hear him.")] },
    ] },
    { key: "m11", lines: [O("They that received tribute money", 40017024, "Doth not your master pay tribute?"), S(40017025, "Yes."), J(40017025, "What thinkest thou, Simon? of whom do the kings of the earth take custom or tribute? of their own children, or of strangers?"), S(40017026, "Of strangers."), J(40017026, "Then are the children free."), J(40017027, "go thou to the sea, and cast an hook, and take up the fish that first cometh up; and when thou hast opened his mouth, thou shalt find a piece of money: that take, and give unto them for me and thee.")] },
    { key: "m12", lines: [S(40018021, "Lord, how oft shall my brother sin against me, and I forgive him? till seven times?"), J(40018022, "I say not unto thee, Until seven times: but, Until seventy times seven.")] },
    { key: "m13", tabs: [
      { book: "MAT", lines: [S(40019027, "Behold, we have forsaken all, and followed thee; what shall we have therefore?")] },
      { book: "MRK", lines: [S(41010028, "Lo, we have left all, and have followed thee.")] },
      { book: "LUK", lines: [S(42018028, "Lo, we have left all, and followed thee.")] },
    ] },
    { key: "m14", lines: [N(41011020, "they saw the fig tree dried up from the roots."), S(41011021, "Master, behold, the fig tree which thou cursedst is withered away.")] },
    { key: "m15", lines: [N(41013003, "Peter and James and John and Andrew asked him privately,"), S(41013004, "Tell us, when shall these things be? and what shall be the sign when all these things shall be fulfilled?", "Peter, James, John and Andrew")] },
    { key: "m16", lines: [J(42022008, "Go and prepare us the passover, that we may eat.")] },
    { key: "m17", lines: [S(43013006, "Lord, dost thou wash my feet?"), J(43013007, "What I do thou knowest not now; but thou shalt know hereafter."), S(43013008, "Thou shalt never wash my feet."), J(43013008, "If I wash thee not, thou hast no part with me."), S(43013009, "Lord, not my feet only, but also my hands and my head."), J(43013010, "He that is washed needeth not save to wash his feet, but is clean every whit: and ye are clean, but not all.")] },
    { key: "m18", lines: [N(43013024, "Simon Peter therefore beckoned to him, that he should ask who it should be of whom he spake.")] },
    { key: "m19", tabs: [
      { book: "MAT", lines: [S(40026033, "Though all men shall be offended because of thee, yet will I never be offended."), J(40026034, "Verily I say unto thee, That this night, before the cock crow, thou shalt deny me thrice."), S(40026035, "Though I should die with thee, yet will I not deny thee.")] },
      { book: "MRK", lines: [S(41014029, "Although all shall be offended, yet will not I."), J(41014030, "Verily I say unto thee, That this day, even in this night, before the cock crow twice, thou shalt deny me thrice."), S(41014031, "If I should die with thee, I will not deny thee in any wise.")] },
      { book: "LUK", lines: [J(42022031, "Simon, Simon, behold, Satan hath desired to have you, that he may sift you as wheat:"), J(42022032, "But I have prayed for thee, that thy faith fail not: and when thou art converted, strengthen thy brethren."), S(42022033, "Lord, I am ready to go with thee, both into prison, and to death."), J(42022034, "I tell thee, Peter, the cock shall not crow this day, before that thou shalt thrice deny that thou knowest me.")] },
      { book: "JHN", lines: [S(43013036, "Lord, whither goest thou?"), J(43013036, "Whither I go, thou canst not follow me now; but thou shalt follow me afterwards."), S(43013037, "Lord, why cannot I follow thee now? I will lay down my life for thy sake."), J(43013038, "Wilt thou lay down thy life for my sake? Verily, verily, I say unto thee, The cock shall not crow, till thou hast denied me thrice.")] },
    ] },
    { key: "m20", tabs: [
      { book: "MAT", lines: [J(40026038, "My soul is exceeding sorrowful, even unto death: tarry ye here, and watch with me."), N(40026040, "And he cometh unto the disciples, and findeth them asleep,"), J(40026040, "What, could ye not watch with me one hour?")] },
      { book: "MRK", lines: [N(41014037, "And he cometh, and findeth them sleeping,"), J(41014037, "Simon, sleepest thou? couldest not thou watch one hour?")] },
    ] },
    { key: "m21", lines: [N(43018010, "Then Simon Peter having a sword drew it, and smote the high priest’s servant, and cut off his right ear. The servant’s name was Malchus."), J(43018011, "Put up thy sword into the sheath: the cup which my Father hath given me, shall I not drink it?")] },
    { key: "m22", tabs: [
      { book: "MAT", lines: [O("A damsel", 40026069, "Thou also wast with Jesus of Galilee."), S(40026070, "I know not what thou sayest."), O("Another maid", 40026071, "This fellow was also with Jesus of Nazareth."), S(40026072, "I do not know the man."), O("They that stood by", 40026073, "Surely thou also art one of them; for thy speech bewrayeth thee."), S(40026074, "I know not the man."), N(40026074, "And immediately the cock crew."), N(40026075, "And he went out, and wept bitterly.")] },
      { book: "MRK", lines: [O("One of the maids of the high priest", 41014067, "And thou also wast with Jesus of Nazareth."), S(41014068, "I know not, neither understand I what thou sayest."), O("A maid", 41014069, "This is one of them."), N(41014070, "And he denied it again."), O("They that stood by", 41014070, "Surely thou art one of them: for thou art a Galilaean, and thy speech agreeth thereto."), S(41014071, "I know not this man of whom ye speak."), N(41014072, "And the second time the cock crew."), N(41014072, "And when he thought thereon, he wept.")] },
      { book: "LUK", lines: [O("A certain maid", 42022056, "This man was also with him."), S(42022057, "Woman, I know him not."), O("Another", 42022058, "Thou art also of them."), S(42022058, "Man, I am not."), O("Another", 42022059, "Of a truth this fellow also was with him: for he is a Galilæan."), S(42022060, "Man, I know not what thou sayest."), N(42022061, "And the Lord turned, and looked upon Peter."), N(42022062, "And Peter went out, and wept bitterly.")] },
      { book: "JHN", lines: [O("The damsel that kept the door", 43018017, "Art not thou also one of this man’s disciples?"), S(43018017, "I am not."), O("They", 43018025, "Art not thou also one of his disciples?"), S(43018025, "I am not."), O("One of the servants of the high priest", 43018026, "Did not I see thee in the garden with him?"), N(43018027, "Peter then denied again: and immediately the cock crew.")] },
    ] },
    { key: "m23", lines: [V("A young man in the sepulchre", 41016007, "But go your way, tell his disciples and Peter that he goeth before you into Galilee: there shall ye see him, as he said unto you.")] },
    { key: "m24", tabs: [
      { book: "LUK", lines: [N(42024012, "Then arose Peter, and ran unto the sepulchre; and stooping down, he beheld the linen clothes laid by themselves, and departed, wondering in himself at that which was come to pass.")] },
      { book: "JHN", lines: [O("Mary Magdalene", 43020002, "They have taken away the Lord out of the sepulchre, and we know not where they have laid him."), N(43020004, "So they ran both together: and the other disciple did outrun Peter, and came first to the sepulchre."), N(43020006, "Then cometh Simon Peter following him, and went into the sepulchre, and seeth the linen clothes lie,")] },
    ] },
    { key: "m25", tabs: [
      { book: "LUK", lines: [O("The eleven, and them that were with them", 42024034, "The Lord is risen indeed, and hath appeared to Simon.")] },
      { book: "1CO", lines: [N(46015005, "And that he was seen of Cephas, then of the twelve:")] },
    ] },
    { key: "m26", lines: [S(43021003, "I go a fishing."), O("The other disciples", 43021003, "We also go with thee."), J(43021005, "Children, have ye any meat?"), J(43021006, "Cast the net on the right side of the ship, and ye shall find."), O("The disciple whom Jesus loved", 43021007, "It is the Lord."), N(43021007, "he girt his fisher’s coat unto him, (for he was naked,) and did cast himself into the sea."), N(43021011, "Simon Peter went up, and drew the net to land full of great fishes, an hundred and fifty and three:"),
      J(43021015, "Simon, son of Jonas, lovest thou me more than these?"), S(43021015, "Yea, Lord; thou knowest that I love thee."), J(43021015, "Feed my lambs."), J(43021016, "Simon, son of Jonas, lovest thou me?"), S(43021016, "Yea, Lord; thou knowest that I love thee."), J(43021016, "Feed my sheep."), J(43021017, "Simon, son of Jonas, lovest thou me?"), N(43021017, "Peter was grieved because he said unto him the third time, Lovest thou me?"), S(43021017, "Lord, thou knowest all things; thou knowest that I love thee."), J(43021017, "Feed my sheep."),
      J(43021018, "Verily, verily, I say unto thee, When thou wast young, thou girdedst thyself, and walkedst whither thou wouldest: but when thou shalt be old, thou shalt stretch forth thy hands, and another shall gird thee, and carry thee whither thou wouldest not."), N(43021019, "This spake he, signifying by what death he should glorify God."), J(43021019, "Follow me."), S(43021021, "Lord, and what shall this man do?"), J(43021022, "If I will that he tarry till I come, what is that to thee? follow thou me.")] },
  ] },
  { id: "acts", title: "In Acts", sub: "Speaking for the apostles, and a voice from heaven", items: [
    { key: "a0", lines: [N(44001015, "Peter stood up in the midst of the disciples, and said, (the number of names together were about an hundred and twenty,)"), S(44001016, "Men and brethren, this scripture must needs have been fulfilled, which the Holy Ghost by the mouth of David spake before concerning Judas,"), S(44001022, "must one be ordained to be a witness with us of his resurrection.")] },
    { key: "a1", lines: [S(44002014, "Ye men of Judæa, and all ye that dwell at Jerusalem, be this known unto you, and hearken to my words:"), S(44002036, "Therefore let all the house of Israel know assuredly, that God hath made that same Jesus, whom ye have crucified, both Lord and Christ."), O("They that heard", 44002037, "Men and brethren, what shall we do?"), S(44002038, "Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost.")] },
    { key: "a2", lines: [S(44003004, "Look on us."), S(44003006, "Silver and gold have I none; but such as I have give I thee: In the name of Jesus Christ of Nazareth rise up and walk.")] },
    { key: "a3", lines: [S(44004010, "by the name of Jesus Christ of Nazareth, whom ye crucified, whom God raised from the dead, even by him doth this man stand here before you whole."), S(44004012, "Neither is there salvation in any other:"), S(44004019, "Whether it be right in the sight of God to hearken unto you more than unto God, judge ye.", "Peter and John"), S(44004020, "For we can not but speak the things which we have seen and heard.", "Peter and John")] },
    { key: "a4", lines: [S(44005003, "Ananias, why hath Satan filled thine heart to lie to the Holy Ghost, and to keep back part of the price of the land?"), S(44005029, "We ought to obey God rather than men.", "Peter and the other apostles")] },
    { key: "a5", lines: [N(44008014, "they sent unto them Peter and John:"), S(44008020, "Thy money perish with thee, because thou hast thought that the gift of God may be purchased with money.")] },
    { key: "a6", lines: [S(44009034, "Æneas, Jesus Christ maketh thee whole: arise, and make thy bed."), S(44009040, "Tabitha, arise."), N(44009040, "And she opened her eyes: and when she saw Peter, she sat up.")] },
    { key: "a7", lines: [V("A voice", 44010013, "Rise, Peter; kill, and eat."), S(44010014, "Not so, Lord; for I have never eaten any thing that is common or unclean."), V("The voice, the second time", 44010015, "What God hath cleansed, that call not thou common."), S(44010034, "Of a truth I perceive that God is no respecter of persons:"), S(44010035, "But in every nation he that feareth him, and worketh righteousness, is accepted with him."), O("They that were of the circumcision", 44011003, "Thou wentest in to men uncircumcised, and didst eat with them.")] },
    { key: "a8", lines: [V("The angel of the Lord", 44012007, "Arise up quickly."), N(44012007, "And his chains fell off from his hands."), V("The angel of the Lord", 44012008, "Cast thy garment about thee, and follow me."), S(44012011, "Now I know of a surety, that the Lord hath sent his angel, and hath delivered me out of the hand of Herod,"), O("They, in the house of Mary", 44012015, "Thou art mad."), O("They, in the house of Mary", 44012015, "It is his angel."), N(44012016, "But Peter continued knocking:")] },
    { key: "a9", lines: [S(44015007, "Men and brethren, ye know how that a good while ago God made choice among us, that the Gentiles by my mouth should hear the word of the gospel, and believe."), S(44015011, "But we believe that through the grace of the Lord Jesus Christ we shall be saved, even as they.")] },
  ] },
  { id: "letters", title: "In the letters", sub: "Paul's words about him, and the letters in his name", items: [
    { key: "a11", lines: [O("Paul, writing to the Galatians", 48002011, "But when Peter was come to Antioch, I withstood him to the face, because he was to be blamed."), O("Paul, writing to the Galatians", 48002014, "If thou, being a Jew, livest after the manner of Gentiles, and not as do the Jews, why compellest thou the Gentiles to live as do the Jews?")] },
    { key: "a13", lines: [S(60001001, "Peter, an apostle of Jesus Christ, to the strangers scattered throughout Pontus, Galatia, Cappadocia, Asia, and Bithynia,"), S(60005012, "By Silvanus, a faithful brother unto you, as I suppose, I have written briefly,"), S(60005013, "The church that is at Babylon, elected together with you, saluteth you; and so doth Marcus my son.")] },
    { key: "e1", lines: [S(61001014, "Knowing that shortly I must put off this my tabernacle, even as our Lord Jesus Christ hath shewed me.")] },
  ] },
];

const paul = [
  { id: "jesus", title: "With the risen Lord", sub: "Acts tells the road to Damascus three times; the accounts are in tabs", items: [
    { key: "m0", tabs: [
      { book: "ACT 9", label: "Acts 9 · Luke's account", lines: [N(44009003, "suddenly there shined round about him a light from heaven:"), J(44009004, "Saul, Saul, why persecutest thou me?"), S(44009005, "Who art thou, Lord?"), J(44009005, "I am Jesus whom thou persecutest: it is hard for thee to kick against the pricks."), S(44009006, "Lord, what wilt thou have me to do?"), J(44009006, "Arise, and go into the city, and it shall be told thee what thou must do.")] },
      { book: "ACT 22", label: "Acts 22 · Paul to the crowd", lines: [J(44022007, "Saul, Saul, why persecutest thou me?"), S(44022008, "Who art thou, Lord?"), J(44022008, "I am Jesus of Nazareth, whom thou persecutest."), N(44022009, "And they that were with me saw indeed the light, and were afraid; but they heard not the voice of him that spake to me."), S(44022010, "What shall I do, Lord?"), J(44022010, "Arise, and go into Damascus; and there it shall be told thee of all things which are appointed for thee to do.")] },
      { book: "ACT 26", label: "Acts 26 · Paul before Agrippa", lines: [J(44026014, "Saul, Saul, why persecutest thou me? it is hard for thee to kick against the pricks."), S(44026015, "Who art thou, Lord?"), J(44026015, "I am Jesus whom thou persecutest."), J(44026016, "But rise, and stand upon thy feet: for I have appeared unto thee for this purpose, to make thee a minister and a witness"), J(44026018, "To open their eyes, and to turn them from darkness to light, and from the power of Satan unto God,")] },
    ] },
    { key: "c0", lines: [J(44009010, "Ananias."), O("Ananias of Damascus", 44009010, "Behold, I am here, Lord."), J(44009011, "Arise, and go into the street which is called Straight, and enquire in the house of Judas for one called Saul, of Tarsus: for, behold, he prayeth,"), O("Ananias of Damascus", 44009013, "Lord, I have heard by many of this man, how much evil he hath done to thy saints at Jerusalem:"), J(44009015, "Go thy way: for he is a chosen vessel unto me, to bear my name before the Gentiles, and kings, and the children of Israel:"), O("Ananias of Damascus", 44009017, "Brother Saul, the Lord, even Jesus, that appeared unto thee in the way as thou camest, hath sent me, that thou mightest receive thy sight, and be filled with the Holy Ghost.")] },
    { key: "c3", lines: [S(48001015, "But when it pleased God, who separated me from my mother’s womb, and called me by his grace,"), S(48001016, "To reveal his Son in me, that I might preach him among the heathen;"), S(48001017, "but I went into Arabia, and returned again unto Damascus.")] },
    { key: "m1", lines: [S(46015008, "And last of all he was seen of me also, as of one born out of due time.")] },
    { key: "m2", lines: [J(44022018, "Make haste, and get thee quickly out of Jerusalem: for they will not receive thy testimony concerning me."), S(44022019, "Lord, they know that I imprisoned and beat in every synagogue them that believed on thee:"), J(44022021, "Depart: for I will send thee far hence unto the Gentiles.")] },
    { key: "m3", lines: [J(44018009, "Be not afraid, but speak, and hold not thy peace:"), J(44018010, "For I am with thee, and no man shall set on thee to hurt thee: for I have much people in this city.")] },
    { key: "m4", lines: [J(44023011, "Be of good cheer, Paul: for as thou hast testified of me in Jerusalem, so must thou bear witness also at Rome.")] },
    { key: "m5", lines: [S(47012008, "For this thing I besought the Lord thrice, that it might depart from me."), J(47012009, "My grace is sufficient for thee: for my strength is made perfect in weakness."), S(47012009, "Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.")] },
  ] },
  { id: "acts", title: "In Acts", sub: "With crowds, gaolers, governors and a king", items: [
    { key: "a0", lines: [N(44007058, "the witnesses laid down their clothes at a young man’s feet, whose name was Saul.")] },
    { key: "a5", lines: [N(44013009, "Then Saul, (who also is called Paul,) filled with the Holy Ghost,"), S(44013046, "It was necessary that the word of God should first have been spoken to you: but seeing ye put it from you, and judge yourselves unworthy of everlasting life, lo, we turn to the Gentiles.", "Paul and Barnabas")] },
    { key: "a7", lines: [O("The keeper of the prison at Philippi", 44016030, "Sirs, what must I do to be saved?"), S(44016031, "Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house.", "Paul and Silas"), S(44017022, "Ye men of Athens, I perceive that in all things ye are too superstitious."), S(44017023, "I found an altar with this inscription, TO THE UNKNOWN GOD. Whom therefore ye ignorantly worship, him declare I unto you.")] },
    { key: "a8", lines: [S(44021013, "What mean ye to weep and to break mine heart? for I am ready not to be bound only, but also to die at Jerusalem for the name of the Lord Jesus.")] },
    { key: "a9", lines: [S(44025011, "I appeal unto Cæsar."), O("Festus", 44025012, "Hast thou appealed unto Cæsar? unto Cæsar shalt thou go."), O("Festus", 44026024, "Paul, thou art beside thyself; much learning doth make thee mad."), S(44026025, "I am not mad, most noble Festus; but speak forth the words of truth and soberness."), O("King Agrippa", 44026028, "Almost thou persuadest me to be a Christian."), S(44026029, "I would to God, that not only thou, but also all that hear me this day, were both almost, and altogether such as I am, except these bonds.")] },
    { key: "a10", lines: [N(44028030, "And Paul dwelt two whole years in his own hired house, and received all that came in unto him,"), N(44028031, "Preaching the kingdom of God, and teaching those things which concern the Lord Jesus Christ, with all confidence, no man forbidding him.")] },
  ] },
  { id: "letters", title: "In the letters", sub: "His own words at the end", items: [
    { key: "e1", lines: [S(55004006, "For I am now ready to be offered, and the time of my departure is at hand."), S(55004007, "I have fought a good fight, I have finished my course, I have kept the faith:")] },
  ] },
];

const thaddaeus = [
  { id: "jesus", title: "With Jesus", sub: "Three moments: the choosing, the sending, and one question", items: [
    { key: "m0", tabs: [
      { book: "MRK", lines: [N(41003014, "And he ordained twelve, that they should be with him, and that he might send them forth to preach,"), N(41003018, "and Thaddaeus,")] },
      { book: "LUK", lines: [N(42006013, "of them he chose twelve, whom also he named apostles;"), N(42006016, "And Judas the brother of James,")] },
    ] },
    { key: "m1", lines: [N(40010003, "Lebbaeus, whose surname was Thaddaeus;"), J(40010005, "Go not into the way of the Gentiles, and into any city of the Samaritans enter ye not:")] },
    { key: "m2", lines: [J(43014021, "He that hath my commandments, and keepeth them, he it is that loveth me: and he that loveth me shall be loved of my Father, and I will love him, and will manifest myself to him."), N(43014022, "Judas saith unto him, not Iscariot,"), S(43014022, "Lord, how is it that thou wilt manifest thyself unto us, and not unto the world?"), J(43014023, "If a man love me, he will keep my words: and my Father will love him, and we will come unto him, and make our abode with him.")] },
  ] },
  { id: "acts", title: "In Acts", sub: "Named once, in the upper room", items: [
    { key: "a0", lines: [N(44001013, "they went up into an upper room, where abode both Peter, and James, and John, … and Judas the brother of James.")] },
  ] },
];

module.exports = { "peter-mat-4-18": peter, "paul-act-7-58": paul, "judas-mat-10-3": thaddaeus };
