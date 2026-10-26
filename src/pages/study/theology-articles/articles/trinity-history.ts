// Part four: the two councils that wrote the doctrine down, and the four errors they ruled out.
// The creed of 325 and the synod of 381 are quoted from this project's copy of the Nicene and
// Post-Nicene Fathers; the creed of 381 is quoted from this site's own creeds collection.
import type { ArticleSection } from "../model";

export const HISTORY: ArticleSection = {
  id: "the-councils",
  kicker: "Where the words came from",
  title: "Nicaea 325, Constantinople 381.",
  lede: "The doctrine was not invented at a council. It was written down at two of them, fifty-six years apart, because a particular set of answers had been tried and had failed.",
  body: [
    {
      kind: "p",
      text: "The church did not set out to produce a doctrine of the Trinity. It set out to answer a question that would not go away: when Scripture calls Jesus the Son of God, does it mean that he is God, or that he is the highest of the things God made? Everything in the next two centuries follows from the fact that those two answers cannot both be held.",
    },

    { kind: "h", text: "Alexandria, about 318: the question gets a sharp form" },
    {
      kind: "p",
      text: "A presbyter of Alexandria named Arius gave the second answer, carefully and in writing. His case was not stupid, which is why it took sixty years to settle. If the Son is begotten, he argued, then there was a point from which he is; if he is from the Father, then the Father is the source and the Son is not; and whatever is not the source is, in the end, among the things that came to be. So the Son is the first and greatest of all creatures, made before time, through whom everything else was made — but not God as the Father is God. The slogan the council later quoted back at his party was “there was a time when he was not”.",
    },
    {
      kind: "p",
      text: "The appeal of this is that it keeps the arithmetic simple. There is one God, the Father; the Son is an exalted creature; nothing needs to be said about three being one. The price is the entire worshipping practice of the church, which was already praying to Jesus, baptising into his name alongside the Father’s, and calling him Lord in the sense Israel reserved for God.",
    },

    { kind: "h", text: "Nicaea, 325: one word decides it" },
    {
      kind: "p",
      text: "The emperor Constantine summoned the bishops to Nicaea, in what is now Turkey, in 325. The traditional count, repeated in the ancient sources, is three hundred and eighteen. What they produced was short, and it has a single word at the centre of it.",
    },
    {
      kind: "quote",
      source: "socrates-history",
      locator: "Book I, ch. 8, quoting Eusebius’s letter to his diocese",
      speaker: "The Creed of Nicaea, 325",
      text: "We believe in one God, the Father Almighty, Maker of all things visible and invisible:—and in one Lord Jesus Christ, the Son of God, the only-begotten of the Father, that is of the substance of the Father; God of God, Light of light, true God of true God; begotten not made, consubstantial with the Father; by whom all things were made both which are in heaven and on earth; who for the sake of us men, and on account of our salvation, descended, became incarnate, was made man, suffered and rose again on the third day; he ascended into the heavens, and will come to judge the living and the dead. [We believe] also in the Holy Spirit.",
    },
    {
      kind: "p",
      text: "The decisive word is the one translated “consubstantial”: in Greek homoousios, from the same ousia, the same essence or being. It is not a biblical word, and that was the chief objection to it at the time. The council used it anyway, because every biblical phrase that had been tried could be signed by Arius’s party with their fingers crossed. “Of God”, “like the Father”, “from the Father” — all of these can be said of a creature. “Of the same being as the Father” cannot.",
    },
    {
      kind: "p",
      text: "Paired with it is the phrase that is still recited every Sunday: begotten, not made. Arius’s whole case rested on treating “begotten” as a soft word for “made”. The creed separates them permanently. Begetting is a relation inside God; making is what God does to things that are not God.",
    },
    {
      kind: "p",
      text: "The council also said what homoousios must not be taken to mean, and the clarification is a direct hit on two of the errors in this article. Eusebius, who was there and was no enthusiast for the word, records both the emperor’s gloss and the council’s own:",
    },
    {
      kind: "quote",
      source: "socrates-history",
      locator: "Book I, ch. 8",
      speaker: "Eusebius of Caesarea, reporting Nicaea",
      text: "with the insertion, however, of that single word “homoousios” (consubstantial), an expression which the emperor himself explained, as not indicating corporeal affections or properties; and consequently that the Son did not subsist from the Father either by division or abscission",
    },
    {
      kind: "quote",
      source: "socrates-history",
      locator: "Book I, ch. 8",
      speaker: "Eusebius of Caesarea, reporting Nicaea",
      text: "it was generally admitted that ousias (of the essence or substance) simply implied that the Son is of the Father indeed, but does not subsist as a part of the Father.",
    },
    {
      kind: "p",
      text: "“Not by division or abscission.” “Not as a part of the Father.” In the same session in which the church affirmed that the Son is of one being with the Father, it denied that he is a slice of the Father — which is exactly what the water analogy and the three-sided figures suggest, and exactly what the modern label “partialism” names. The council saw that danger in the word it was adopting, and fenced it in advance.",
    },
    {
      kind: "p",
      text: "Then, unusually for a creed, it names the positions it is excluding. These are the anathemas, and they are a list of sentences the church refused to allow.",
    },
    {
      kind: "quote",
      source: "socrates-history",
      locator: "Book I, ch. 8",
      speaker: "The anathemas of Nicaea, 325",
      text: "But those who say ‘There was a time when he was not,’ or ‘He did not exist before he was begotten,’ or ‘He was made of nothing’ or assert that ‘He is of other substance or essence than the Father,’ or that the Son of God is created, or mutable, or susceptible of change, the Catholic and apostolic Church of God anathematizes.",
    },

    { kind: "h", text: "What Nicaea left unfinished" },
    {
      kind: "p",
      text: "Read the creed of 325 again and notice how it ends. “[We believe] also in the Holy Spirit.” That is the whole of it. One clause, no description, nothing about what the Spirit is or how the Spirit stands to the Father and the Son. The council had been called about the Son, and about the Son it was exhaustive; on the Spirit it said the minimum.",
    },
    {
      kind: "p",
      text: "So the same argument came round again, one person later. If the Son is God, is the Spirit? A party in the following generation said no — that the Spirit is a created power, a servant, the greatest of ministering beings. Their opponents called them Pneumatomachi, the Spirit-fighters; in the historical narratives of the period they appear under the name Macedonians, after Macedonius of Constantinople. Their leaders were invited to the next council and walked out of it.",
    },
    {
      kind: "p",
      text: "The theological work that answered them was done in the 370s by the three Cappadocians in part three of this article. Basil wrote On the Holy Spirit for exactly this dispute — his argument from how the church actually prays and baptises, and his insistence that the persons are not counted by addition. Gregory of Nazianzus preached the five Theological Orations in Constantinople itself, the last of them entirely on the Spirit. By the time the bishops met, the case had been made.",
    },

    { kind: "h", text: "Constantinople, 381: the rest of the creed" },
    {
      kind: "p",
      text: "The emperor Theodosius summoned the second council to Constantinople in May 381. The historian Socrates, writing some sixty years later, gives the number and the business.",
    },
    {
      kind: "quote",
      source: "socrates-history",
      locator: "Book V, ch. 8",
      speaker: "Socrates Scholasticus",
      text: "The emperor making no delay summoned a Synod of the prelates of his own faith, in order that he might establish the Nicene Creed, and appoint a bishop of Constantinople … amounting in all to one hundred and fifty.",
    },
    {
      kind: "p",
      text: "A hundred and fifty bishops, and the brief was “to establish the Nicene Creed” — not to replace it. What they did was finish it. The result is the creed almost all churches still recite, and the part that was new in 381 is the part about the Spirit.",
    },
    {
      kind: "quote",
      source: "nicene-creed",
      locator: "The creed of 381, the article on the Holy Spirit, as this site holds it",
      speaker: "The Niceno-Constantinopolitan Creed",
      text: "And we believe in the Holy Ghost, the Lord and Giver of Life; who proceeds from the Father and the Son; who with the Father and the Son together is worshipped and glorified; who spoke by the prophets.",
    },
    {
      kind: "p",
      text: "Look at what the clause does. It does not say the Spirit is homoousios — the council avoided repeating the word that had caused sixty years of trouble. It says something harder to argue with: the Spirit is worshipped and glorified together with the Father and the Son. Whatever may be worshipped is God; the church worships the Spirit; therefore. And it calls the Spirit “the Lord and Giver of Life”, which is not language that can be used of a creature.",
    },
    {
      kind: "p",
      text: "Then, in 381, the council said the Spirit “proceeds from the Father” and stopped there, following the words of Jesus in John 15:26. The Latin text of the creed in this site’s copy of Schaff keeps that exactly.",
    },
    {
      kind: "quote",
      source: "schaff-creeds",
      locator: "The creed of 381, Latin version of Dionysius Exiguus",
      speaker: "The Niceno-Constantinopolitan Creed, Latin",
      text: "Et in Spiritum Sanctum, Dominum et vivificantem, ex Patre procedentem, cum Patre et Filio adorandum et conglorificandum, qui locutus est per sanctos prophetas.",
    },
    {
      kind: "caution",
      title: "The words “and the Son” are not from 381",
      text: "The English copy quoted above reads “who proceeds from the Father and the Son”. The two added words are the Filioque — Latin for “and the Son” — and they are a later Western addition, not part of what the hundred and fifty bishops wrote. They spread through the Latin church over the following centuries and became one of the standing causes of the division between East and West in 1054. Schaff’s own edition on this site brackets them, “[and the Son]”, to mark them as an interpolation; the Latin text of 381 above has only ex Patre procedentem, from the Father. If you are reading the creed to find out what 381 said, read the clause without them.",
    },
    {
      kind: "p",
      text: "One footnote with a human shape to it. Gregory of Nazianzus — whose Oration 31 supplies the strongest disclaimer in part three of this article — was bishop of Constantinople when the council opened and presided over part of it. He resigned in the middle of the proceedings, amid a dispute over his appointment, and went home to Nazianzus. The man whose preaching had won the argument about the Spirit was not there to sign the clause.",
    },

    { kind: "h", text: "The four errors, and what each one loses" },
    {
      kind: "p",
      text: "Everything the two councils ruled out can be sorted into four mistakes. Three of them have ancient names. The fourth has a modern one.",
    },
    {
      kind: "list",
      label: "What the councils refused",
      items: [
        {
          term: "Modalism, or Sabellianism",
          text: "One person in three modes, successively or by appearance. Named for Sabellius, who taught at Rome in the early third century. It keeps the oneness and loses the three: nobody can be sent, nobody can be prayed to, and the scene at the Jordan becomes a performance. This is where the water analogy and the man with three jobs end up.",
        },
        {
          term: "Arianism",
          text: "The Son is the first and highest creature, not God in the sense the Father is. It keeps a kind of three and loses the oneness, because now the one God is the Father alone and the other two are magnificent creatures. Ruled out at Nicaea in 325 by homoousios, “begotten, not made”, and the anathemas.",
        },
        {
          term: "Tritheism",
          text: "Three Gods of the same kind, like three men — the error Gregory of Nyssa was accused of and spent a whole treatise answering. It keeps the three and loses the one. No council legislated against it by that name, because nobody taught it on purpose; it is where the other repairs land when you push them. Schaff names it in a single sentence beside Sabellianism, below.",
        },
        {
          term: "Partialism",
          text: "Each person is a third of God; you need all three to make a deity. It loses both at once — no person is fully God, and the one God is an assembly. “Partialism” is a modern teaching label and not a word any council used, which is worth saying plainly. But the thing it names was refused at Nicaea in as many words: the Son is of the Father and yet “does not subsist as a part of the Father”, and not by “division or abscission”.",
        },
      ],
    },
    {
      kind: "p",
      text: "Philip Schaff, whose collection of the creeds this site holds, puts the double refusal in one sentence in his notes on the Athanasian Creed — and in doing so names the two ditches in the vocabulary of a nineteenth-century editor rather than a fourth-century bishop:",
    },
    {
      kind: "quote",
      source: "schaff-creeds",
      locator: "Notes on the Athanasian Creed, on verse 4",
      speaker: "Philip Schaff",
      text: "But the tri-personality of God is not a numerical or essential trinity of three beings (like Abraham, Isaac, and Jacob), for this would be tritheism; nor is it, on the other hand, merely a threefold aspect and mode of manifestation, in the Sabellian or Swedenborgian sense; but it is a real, objective, and eternal, though ineffable, distinction in the one Divine being",
    },
    {
      kind: "p",
      text: "“Real, objective, and eternal, though ineffable.” Each of those four words is load-bearing. Real and objective, against modalism: the distinction is in God and not in our perception of God. Eternal, against Arianism: it did not begin. Ineffable, against every diagram in this article, including the good ones.",
    },
    {
      kind: "p",
      text: "Schaff is also the reason this site’s copy of the Athanasian Creed says “Essence” where the Book of Common Prayer says “Substance”. His note explains the choice: substantia and essentia both translate the Greek ousia, but modern English hears “substance” as matter or stuff, and “essence” or “being” carries the sense better.",
    },

    { kind: "h", text: "What the councils were actually doing" },
    {
      kind: "p",
      text: "It is easy to read this history as the church deciding what to believe by a show of hands. That is not what the documents look like. Both creeds are shorter than the arguments that produced them, both are built out of the language of Scripture wherever Scripture has language, and both import a technical word only where every ordinary word had been found to be sayable by someone who meant the opposite. The councils were not adding to the faith. They were putting a fence around a reading of the New Testament that the church had been praying for three centuries, at the points where somebody had just walked off the edge.",
    },
    {
      kind: "p",
      text: "Which brings this article back where part three left it. The councils tell you what cannot be said. They do not give you a picture, and they never claimed to. Nicaea does not explain how the Son is of one being with the Father; it rules out the explanations that fail. Constantinople does not explain the procession of the Spirit; it says the Spirit is worshipped with the Father and the Son, and leaves it there.",
    },
    {
      kind: "p",
      text: "That is the shape of the whole doctrine, and the reason this article has spent as much space on disclaimers as on analogies. One God, three persons: the confession is firm, the fences are precise, and in between there is a God who is not the size of our illustrations. Augustine said three persons so as not to be silent. Aquinas said the doctrine confirms but does not prove. Gregory said let the images and the shadows go. The councils wrote the fences. None of them handed over a picture, because there was never one to hand over.",
    },
  ],
};
