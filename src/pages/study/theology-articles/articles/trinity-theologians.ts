// Part three: the analogies the great theologians did offer, each one placed beside the limit its own
// author set on it. Every quotation here was read in the edition named in model.ts SOURCES; the Lewis
// material is described rather than quoted, because Mere Christianity is still in copyright.
import type { ArticleSection } from "../model";

export const THEOLOGIANS: ArticleSection = {
  id: "the-theologians",
  kicker: "The analogies of the great theologians",
  title: "Every picture came with its own warning.",
  lede: "Augustine, Aquinas, the Cappadocians and C. S. Lewis all reached for an image. Each of them wrote down, in the same breath, how far it could be trusted — and that disclaimer is the most useful part.",
  body: [
    {
      kind: "p",
      text: "What follows is not a better set of analogies. It is a set of analogies with their failure points published by the people who made them. Read that way, they teach two things at once: something about God, and something about the limits of thinking about God.",
    },

    { kind: "h", text: "Augustine: lover, beloved, and love" },
    {
      kind: "p",
      text: "Augustine worked at On the Trinity for roughly twenty years and fifteen books, and he was reluctant to release it. His method is to look for traces of the Trinity in the one created thing made in God’s image — the human mind. The first trace he finds is not in the mind’s faculties but in love itself.",
    },
    {
      kind: "quote",
      source: "augustine-trinity",
      locator: "Book VIII, ch. 10, §14",
      speaker: "Augustine",
      text: "But what is love or charity, which divine Scripture so greatly praises and proclaims, except the love of good? But love is of some one that loves, and with love something is loved. Behold, then, there are three things: he that loves, and that which is loved, and love.",
    },
    {
      kind: "p",
      text: "The attraction of this is that it finds threeness inside something that is obviously one. One act of love is not one thing; it necessarily has a structure of three. You cannot subtract the beloved and still have love, or subtract the love and still have a lover. Each requires the other two, and what you have is not three loves but one. For a doctrine that needs distinction without division, that is a real gain on anything the water or the three jobs can offer.",
    },

    { kind: "h", text: "Augustine: memory, understanding, will" },
    {
      kind: "p",
      text: "Augustine’s second and better-known trace is inside a single mind. He first tries mind, knowledge and love, then replaces it with a stronger triad: memory, understanding and will.",
    },
    {
      kind: "quote",
      source: "augustine-trinity",
      locator: "Book X, ch. 11, §18",
      speaker: "Augustine",
      text: "Since, then, these three, memory, understanding, will, are not three lives, but one life; nor three minds, but one mind; it follows certainly that neither are they three substances, but one substance.",
    },
    {
      kind: "p",
      text: "Why he preferred this one: memory, understanding and will are not three parts of a mind, each holding a share. Each is the whole mind doing something — the whole mind as remembering, the whole mind as knowing, the whole mind as choosing. That is much closer to the thing the creeds insist on: each person is wholly God, not a third of God. And the three are ordered, as the persons are: the understanding forms a word from what memory holds, and the will proceeds from both.",
    },
    {
      kind: "caution",
      title: "Augustine’s own disclaimer",
      text: "In his last book Augustine returns to his own analogies and takes them apart. The likeness of memory to the Father, he says, is “incomparably unequal, yet of some sort, whatever it be”; the likeness of understanding to the Son holds only “in its own great disparity”; the likeness of love to the Spirit is “some, however exceedingly unequal, likeness of the Holy Spirit”. And then he names the break that cannot be repaired by any refinement: the three in a human mind are not three persons but one, while in God they are three persons and one God. The image is an image of the Trinity; it is not a small Trinity.",
    },
    {
      kind: "quote",
      source: "augustine-trinity",
      locator: "Book XV, ch. 23, §43",
      speaker: "Augustine",
      text: "it is nevertheless not the case, that, as in that image of the Trinity, these three are not one man, but belong to one man, so in the Highest Trinity itself, of which this is an image, these three belong to one God, but they are one God, and these are three persons, not one.",
    },
    {
      kind: "p",
      text: "Earlier in the work he had already said why no vocabulary was going to be adequate. The famous sentence is not a flourish; it is an admission of defeat about language, offered in defence of using the words anyway.",
    },
    {
      kind: "quote",
      source: "augustine-trinity",
      locator: "Book V, ch. 9, §10",
      speaker: "Augustine",
      text: "Yet, when the question is asked, What three? human language labors altogether under great poverty of speech. The answer, however, is given, three “persons,” not that it might be [completely] spoken, but that it might not be left [wholly] unspoken.",
    },
    {
      kind: "p",
      text: "That is the most honest line in the literature. The church says “three persons” not because the phrase captures God, but because silence would be worse. And the fifteen books end not with a conclusion but with a prayer, and a request to be forgiven for how much he has said.",
    },
    {
      kind: "quote",
      source: "augustine-trinity",
      locator: "Book XV, ch. 28, §51",
      speaker: "Augustine",
      text: "Directing my purpose by this rule of faith, so far as I have been able, so far as Thou hast made me to be able, I have sought Thee, and have desired to see with my understanding what I believed; and I have argued and labored much. … May I remember Thee, understand Thee, love Thee. Increase these things in me, until Thou renewest me wholly. … O Lord the one God, God the Trinity, whatever I have said in these books that is of Thine, may they acknowledge who are Thine; if anything of my own, may it be pardoned both by Thee and by those who are Thine. Amen.",
    },
    {
      kind: "p",
      text: "Note what the prayer does with his own analogy. “May I remember Thee, understand Thee, love Thee” is memory, understanding and will — turned from a diagram into a petition. The triad was never meant to end as an explanation.",
    },

    { kind: "h", text: "Thomas Aquinas: the word in the mind, the love in the will" },
    {
      kind: "p",
      text: "Aquinas takes Augustine’s mental triad and makes it precise. In the Summa Theologiae he asks not what the persons resemble but how there can be any procession at all in a God who is simple and unchanging. His answer is that the only kind of procession that does not require parts or motion is the kind that happens inside a mind.",
    },
    {
      kind: "quote",
      source: "aquinas-summa",
      locator: "First Part, q. 27, a. 1",
      speaker: "Thomas Aquinas",
      text: "Rather it is to be understood by way of an intelligible emanation, for example, of the intelligible word which proceeds from the speaker, yet remains in him. … For whenever we understand, by the very fact of understanding there proceeds something within us, which is a conception of the object understood.",
    },
    {
      kind: "p",
      text: "A thought is genuinely produced by the mind that thinks it, and genuinely distinct from the act of thinking — and yet it never leaves the mind, and nothing is divided or diminished in producing it. That is the model for the Son: the Word, eternally proceeding from the Father, remaining in him, equal to him. Then Aquinas asks whether there is any second procession, and finds one in the will.",
    },
    {
      kind: "quote",
      source: "aquinas-summa",
      locator: "First Part, q. 27, a. 3",
      speaker: "Thomas Aquinas",
      text: "The procession of the Word is by way of an intelligible operation. The operation of the will within ourselves involves also another procession, that of love, whereby the object loved is in the lover. … Hence, besides the procession of the Word in God, there exists in Him another procession called the procession of love.",
    },
    {
      kind: "p",
      text: "Two processions, and only two, because a mind has only these two kinds of inner act: knowing and loving. The procession of the Word is called generation, and so the Word is the Son; the procession of love is not generation, and so has no comparable name — the tradition calls it spiration, and the one who proceeds is the Holy Spirit. This is why the creeds are careful that the Son is “begotten” and the Spirit “proceeding”, and refuse to use the one word for the other.",
    },
    {
      kind: "caution",
      title: "Aquinas’s own disclaimer",
      text: "Five questions later Aquinas asks directly whether the Trinity can be known by natural reason, and answers no — flatly, and with an argument about the damage done by pretending otherwise. His worry is not only that a bad proof is bad logic. It is that offering one to an unbeliever hands them a reason to laugh at the faith, because they will assume the bad argument is what Christians are actually standing on.",
    },
    {
      kind: "quote",
      source: "aquinas-summa",
      locator: "First Part, q. 32, a. 1",
      speaker: "Thomas Aquinas",
      text: "It is impossible to attain to the knowledge of the Trinity by natural reason. … Therefore, he who attempts to prove the trinity of persons by natural reason, derogates from faith in two ways. First, as regards the dignity of faith itself, which consists in its being concerned with invisible things, that exceed human reason … Secondly, as regards the utility of drawing others to the faith. For when anyone in the endeavor to prove the faith brings forward reasons which are not cogent, he falls under the ridicule of the unbelievers: since they suppose that we stand upon such reasons, and that we believe on such grounds.",
    },
    {
      kind: "p",
      text: "And in the replies to that same article he says what his own analogy of the mind is for. Reason can be used in two ways: to prove a principle, or to show that an already-held principle hangs together. Trinitarian arguments are the second kind only.",
    },
    {
      kind: "quote",
      source: "aquinas-summa",
      locator: "First Part, q. 32, a. 1, reply to objection 2",
      speaker: "Thomas Aquinas",
      text: "In the second way, reasons avail to prove the Trinity; as, when assumed to be true, such reasons confirm it. We must not, however, think that the trinity of persons is adequately proved by such reasons.",
    },
    {
      kind: "p",
      text: "So the most systematic account of the Trinity ever written is explicitly offered downstream of faith, not as a route into it. Aquinas thought the mental analogy showed that the doctrine is coherent. He denied that it showed the doctrine is true.",
    },

    { kind: "h", text: "Basil of Caesarea: stop counting" },
    {
      kind: "p",
      text: "The three Cappadocians — Basil, his brother Gregory of Nyssa and their friend Gregory of Nazianzus — did the work in the 370s and 380s that made the second council possible. Basil’s contribution to the analogy question is to attack the arithmetic itself. His opponents were counting the Spirit as a third item and worrying about the total.",
    },
    {
      kind: "quote",
      source: "basil-spirit",
      locator: "On the Holy Spirit, ch. 18, §§44–45",
      speaker: "Basil of Caesarea",
      text: "Count, if you must; but you must not by counting do damage to the faith. … For we do not count by way of addition, gradually making increase from unity to multitude, and saying one, two, and three,—nor yet first, second, and third. For “I,” God, “am the first, and I am the last.”",
    },
    {
      kind: "p",
      text: "This is a disclaimer about a whole class of analogies rather than about one picture. Every illustration that works by assembling three somethings into one something — three leaves of a clover, three sides of a triangle, three parts of an egg — has already made the mistake Basil names, because it treats the persons as quantities to be summed. One plus one plus one is a true statement about apples and a false one about God.",
    },

    { kind: "h", text: "Gregory of Nyssa: three men, and why the comparison breaks" },
    {
      kind: "p",
      text: "Gregory of Nyssa was handed the hardest version of the objection by a correspondent named Ablabius, and his reply is the short treatise On “Not Three Gods”. The objection is the social analogy used as a weapon: if three men who share one human nature are correctly called three men, why are Father, Son and Spirit not correctly called three Gods?",
    },
    {
      kind: "quote",
      source: "nyssa-ablabius",
      locator: "To Ablabius, opening",
      speaker: "Ablabius’s objection, as Gregory states it",
      text: "Peter, James, and John, being in one human nature, are called three men: and there is no absurdity in describing those who are united in nature, if they are more than one, by the plural number of the name derived from their nature.",
    },
    {
      kind: "p",
      text: "Gregory’s first move is unexpected: he does not defend the analogy, he attacks the ordinary speech on which it rests. Strictly, he says, “three men” is sloppy. Human nature is one; what there are three of is persons bearing it. We call them three men out of habit, not accuracy.",
    },
    {
      kind: "quote",
      source: "nyssa-ablabius",
      locator: "To Ablabius",
      speaker: "Gregory of Nyssa",
      text: "the practice of calling those who are not divided in nature by the very name of their common nature in the plural, and saying they are “many men,” is a customary abuse of language, and that it would be much the same thing to say they are “many human natures.”",
    },
    {
      kind: "caution",
      title: "Gregory of Nyssa’s own disclaimer",
      text: "Having used the comparison, Gregory then states exactly where it fails — and it is not a detail. Three men are rightly counted as three because they act separately: each works on his own account, in his own circumstances, with his own result. The Father, the Son and the Spirit never do. Every divine act is one act of all three. So the one feature that makes “three men” a plural in the first place is missing from God, and the analogy cannot survive its own strongest point.",
    },
    {
      kind: "quote",
      source: "nyssa-ablabius",
      locator: "To Ablabius",
      speaker: "Gregory of Nyssa",
      text: "But in the case of the Divine nature we do not similarly learn that the Father does anything by Himself in which the Son does not work conjointly, or again that the Son has any special operation apart from the Holy Spirit; but every operation which extends from God to the Creation, and is named according to our variable conceptions of it, has its origin from the Father, and proceeds through the Son, and is perfected in the Holy Spirit.",
    },
    {
      kind: "p",
      text: "And so, he adds, whatever God does “comes to pass by the action of the Three, yet what does come to pass is not three things.” Three men who build three houses have built three houses. The Father, Son and Spirit who give life give one life.",
    },

    { kind: "h", text: "Gregory of Nazianzus: let the images go" },
    {
      kind: "p",
      text: "The strongest disclaimer in the whole tradition belongs to Gregory of Nazianzus, in the fifth of the Theological Orations — the sermons that earned him the title “the Theologian”. He had evidently tried hard to find a usable picture, and he reports the search as a failure.",
    },
    {
      kind: "quote",
      source: "nazianzus-oration-31",
      locator: "Oration 31, §31",
      speaker: "Gregory of Nazianzus",
      text: "I have very carefully considered this matter in my own mind, and have looked at it in every point of view, in order to find some illustration of this most important subject, but I have been unable to discover any thing on earth with which to compare the nature of the Godhead. For even if I did happen upon some tiny likeness it escaped me for the most part, and left me down below with my example.",
    },
    {
      kind: "p",
      text: "He then names the two candidates he had considered, and they are precisely the two still in circulation sixteen centuries later. First, the water images — in this translation “an eye, a fountain, a river”, the first term read as a spring in some versions: one source, flowing, numerically one thing in three forms.",
    },
    {
      kind: "quote",
      source: "nazianzus-oration-31",
      locator: "Oration 31, §31",
      speaker: "Gregory of Nazianzus",
      text: "I picture to myself an eye, a fountain, a river, as others have done before, to see if the first might be analogous to the Father, the second to the Son, and the third to the Holy Ghost. … But I was afraid in the first place that I should present a flow in the Godhead, incapable of standing still; and secondly that by this figure a numerical unity would be introduced. For the eye and the spring and the river are numerically one, though in different forms.",
    },
    {
      kind: "p",
      text: "Read that second fear again: “a numerical unity would be introduced … numerically one, though in different forms.” That is modalism, identified and rejected in the fourth century, in the very picture that is still drawn on whiteboards today. Then he turns to the other favourite, the sun with its ray and its light.",
    },
    {
      kind: "quote",
      source: "nazianzus-oration-31",
      locator: "Oration 31, §32",
      speaker: "Gregory of Nazianzus",
      text: "Again I thought of the sun and a ray and light. But here again there was a fear lest people should get an idea of composition in the Uncompounded Nature, such as there is in the Sun and the things that are in the Sun. And in the second place lest we should give Essence to the Father but deny Personality to the Others, and make Them only Powers of God, existing in Him and not Personal. For neither the ray nor the light is another sun, but they are only effulgences from the Sun, and qualities of His essence.",
    },
    {
      kind: "p",
      text: "Two different failures, carefully distinguished. The water picture loses the three. The sunlight picture keeps a kind of three but demotes two of them to properties of the first — the Son and the Spirit become effects of the Father rather than persons with him. Gregory considers a third illustration, a trembling sunbeam on a wall, and rejects it too, because something has to set a beam moving and nothing moves God.",
    },
    {
      kind: "caution",
      title: "Gregory of Nazianzus’s own disclaimer",
      text: "His conclusion is not a better analogy. It is a decision to stop looking, and it is the sentence to remember whenever anyone offers a tidy explanation of the Trinity — including the explanations in this article.",
    },
    {
      kind: "quote",
      source: "nazianzus-oration-31",
      locator: "Oration 31, §33",
      speaker: "Gregory of Nazianzus",
      text: "In a word, there is nothing which presents a standing point to my mind in these illustrations from which to consider the Object which I am trying to represent to myself, unless one may indulgently accept one point of the image while rejecting the rest. Finally, then, it seems best to me to let the images and the shadows go, as being deceitful and very far short of the truth; and clinging myself to the more reverent conception, and resting upon few words, using the guidance of the Holy Ghost …",
    },
    {
      kind: "p",
      text: "“Indulgently accept one point of the image while rejecting the rest” is the whole discipline in a phrase. An analogy is allowed to make one point. It is not allowed to make a second one on its own authority.",
    },

    { kind: "h", text: "C. S. Lewis: a cube, and a man at prayer" },
    {
      kind: "p",
      text: "The most widely read modern treatment is the fourth book of Mere Christianity, which Lewis called “Beyond Personality”. That book is still in copyright, so what follows describes his argument and points to where it can be read, rather than reproducing his words.",
    },
    {
      kind: "summary",
      source: "lewis-mere-christianity",
      locator: "Book IV, ch. 2, “The Three-Personal God”",
      text: "Lewis builds his picture out of dimensions. In one dimension you can only have a line. In two, lines combine into a figure — a square is made of four lines without ceasing to be one square. In three, figures combine into a solid — a cube is made of six squares without ceasing to be one cube. At each level the simpler thing is not abandoned but taken up: you do not stop having lines when you start having squares. His suggestion is that the same relation holds between human personality and God’s: on our level, one being means one person, and that remains true of us; on God’s level, one being is three persons, in a way that includes rather than contradicts what personality means down here.",
    },
    {
      kind: "p",
      text: "The strength of this over the water and the three jobs is that it does not try to divide one thing into three. It says the opposite: that the threeness is a richer kind of unity than we have language for, in the way a cube is a richer kind of thing than a square and not a square cut into pieces. It also explains why the doctrine feels like an arithmetical trick from where we stand, without conceding that it is one.",
    },
    {
      kind: "summary",
      source: "lewis-mere-christianity",
      locator: "Book IV, ch. 2, “The Three-Personal God”",
      text: "He then moves from geometry to something ordinary. Picture an ordinary Christian kneeling to pray. The one he is praying to is God. But what is prompting him to pray at all is also God, at work within him. And his whole knowledge of the God he is addressing comes through Christ, who is beside him and praying for him. So God is the goal he is reaching toward, the power moving him toward it, and the road he travels on — the entire threefold life of God going on in one bedroom while one unremarkable person says his prayers.",
    },
    {
      kind: "p",
      text: "This is the most useful thing in Lewis’s chapter, and it is not an analogy at all. It is a description of what Christians think is actually happening when they pray — which is why it does not break the way the illustrations do. The doctrine is not being compared to something; it is being located in an ordinary evening.",
    },
    {
      kind: "caution",
      title: "Lewis’s own disclaimer",
      text: "Lewis attaches the limit to the cube himself: a creature that perceived only two dimensions could never properly imagine a cube, and we are in that position with respect to a three-personal God. He is explicit that we cannot fully conceive such a being. The dimensions picture is therefore an explanation of why the doctrine is hard to hold in the mind, not a description of what God is. Pushed past that it misleads in a particular way — it suggests the persons are something like faces or sides of one divine solid, which is partialism, and it has no room at all for the persons addressing one another.",
    },
    {
      kind: "summary",
      source: "lewis-mere-christianity",
      locator: "Book II, ch. 2, “The Invasion”",
      text: "Earlier in the same book Lewis answers the complaint that drives most of the bad analogies: that the doctrine is needlessly complicated. His reply is that anyone inventing a religion would have made it simpler, because simplicity is cheap when you are not answerable to anything. Christianity cannot compete on simplicity with made-up religions, because it is dealing with something that is actually there — and real things are more complicated than we would have guessed. He makes the same point about the universe itself: nobody would have predicted its actual shape, and its awkwardness is a mark of its reality.",
    },
    {
      kind: "p",
      text: "That argument cuts both ways, and should. The complexity of the doctrine is not evidence that it is true. But it does remove the easiest objection to it — that it is too convoluted to have come from anywhere but a committee. The doctrine is convoluted in the way a report is convoluted and a slogan is not.",
    },

    { kind: "h", text: "What the four have in common" },
    {
      kind: "p",
      text: "Augustine finds the best analogy anyone has found and then spends his last book showing it is “incomparably unequal”. Aquinas builds the most exact account there is and then says it proves nothing and that pretending otherwise invites ridicule. Gregory of Nyssa uses the social analogy and then dismantles it with his own strongest argument. Gregory of Nazianzus rejects the two most popular pictures in Christian history and tells his congregation to let the images go. Lewis offers a cube and then says you cannot imagine one from two dimensions.",
    },
    {
      kind: "p",
      text: "None of them abandoned the doctrine. All of them abandoned the hope of a picture that would contain it. That is the difference between the analogies in this section and the ones in the last: not that these are better, but that each arrives with its own limit attached, in the handwriting of the person who drew it.",
    },
  ],
};
