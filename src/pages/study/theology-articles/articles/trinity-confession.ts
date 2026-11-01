// Part one of the Trinity article: what the doctrine actually says, and the passages it was built to
// account for. Every Scripture block names complete verses; the words are the reader's Bible's.
import type { ArticleSection } from "../model";

export const CONFESSION: ArticleSection = {
  id: "what-it-is",
  kicker: "What the Trinity is",
  title: "One God. Three persons.",
  lede: "The confession takes one sentence to say and a lifetime to think about: there is one God, and he is Father, Son and Holy Spirit.",
  body: [
    {
      kind: "p",
      text: "Christians believe in one God. Not one God made of three parts, and not three Gods who agree with one another, but one God — one being, one essence, one divine nature — who exists eternally as three distinct persons: the Father, the Son and the Holy Spirit. Each is wholly God. None is either of the others. There are not three Gods, and there is not one person playing three roles.",
    },
    {
      kind: "p",
      text: "That is the whole doctrine. Everything else in this article is either the evidence that forced the church to say it, the errors it was written to exclude, or an honest account of how little any picture of it can carry.",
    },
    { kind: "h", text: "Two things said at once" },
    {
      kind: "p",
      text: "The doctrine exists because Scripture says two things and never softens either one. The first is that God is one. Israel’s own creed is a single line, recited daily, and the New Testament never withdraws it.",
    },
    {
      kind: "scripture",
      book: "DEU",
      chapter: 6,
      verses: [4],
      reference: "Deuteronomy 6:4",
      note: "The Shema. This site holds it in the creeds collection as Israel’s own confession.",
    },
    {
      kind: "scripture",
      book: "ISA",
      chapter: 43,
      verses: [10],
      reference: "Isaiah 43:10",
    },
    {
      kind: "p",
      text: "The second is that the Father is God, the Son is God and the Holy Spirit is God — and that they are distinguished from one another in the same breath in which they are named together. Paul writes Israel’s creed again with the Lord Jesus inside it, where the word “Lord” had stood for the divine name:",
    },
    {
      kind: "scripture",
      book: "1CO",
      chapter: 8,
      verses: [6],
      reference: "1 Corinthians 8:6",
    },
    {
      kind: "p",
      text: "Hold those two together and you have the problem the doctrine of the Trinity is the answer to. Give up the first and you have three Gods. Give up the second and you have to explain away most of the New Testament. The church refused to give up either.",
    },
    { kind: "h", text: "Three at once: the baptism of Jesus" },
    {
      kind: "p",
      text: "If the three were only three names for one person, there is one scene the Gospels should never have been able to describe. All four of them describe it.",
    },
    {
      kind: "scripture",
      book: "MAT",
      chapter: 3,
      verses: [16, 17],
      reference: "Matthew 3:16–17",
    },
    {
      kind: "p",
      text: "Three at once, in one moment, at one river. The Son is standing in the water. The Spirit descends on him. The Father speaks from heaven about him — in the third person, which a single speaker cannot do about himself. Whatever the doctrine of the Trinity is, it is the attempt to say what this scene requires: one God who is at the same time the one who speaks, the one spoken of, and the one who comes down.",
    },
    { kind: "h", text: "One name, three persons: the command to baptise" },
    {
      kind: "p",
      text: "The risen Jesus gives the church its founding instruction, and the grammar of it is the doctrine in miniature.",
    },
    {
      kind: "scripture",
      book: "MAT",
      chapter: 28,
      verses: [19, 20],
      reference: "Matthew 28:19–20",
    },
    {
      kind: "p",
      text: "“In the name” is singular — one name, not three. And three are named inside it, each with its own article in the Greek, each distinguished from the others. Baptism, the act by which a person is handed over to God, is performed into a single name that has three persons in it. This is not a later theological construction laid over the text; it is the text the construction had to account for.",
    },
    {
      kind: "p",
      text: "The same triple shape runs through the letters without ever being argued for, which is the surest sign that it was assumed rather than invented.",
    },
    {
      kind: "scripture",
      book: "2CO",
      chapter: 13,
      verses: [14],
      reference: "2 Corinthians 13:14",
    },
    {
      kind: "scripture",
      book: "EPH",
      chapter: 4,
      verses: [4, 5, 6],
      reference: "Ephesians 4:4–6",
    },
    { kind: "h", text: "Before the world existed" },
    {
      kind: "p",
      text: "John’s Gospel puts the distinction before creation, in a sentence built so that neither half can be dropped.",
    },
    {
      kind: "scripture",
      book: "JHN",
      chapter: 1,
      verses: [1],
      reference: "John 1:1",
    },
    {
      kind: "p",
      text: "“With God” makes the Word someone other than the one he is with. “Was God” makes him no less than the one he is with. Either clause on its own would be easy. Together they are the doctrine. A few verses later John says it again, with the Son on the Father’s side and the Son himself God:",
    },
    {
      kind: "scripture",
      book: "JHN",
      chapter: 1,
      verses: [18],
      reference: "John 1:18",
    },
    { kind: "h", text: "John 17: God addressing God" },
    {
      kind: "p",
      text: "The longest recorded prayer of Jesus is the hardest single passage for any account of God that has only one person in it. Here one who is God speaks to one who is God, about a glory they held together before anything was made.",
    },
    {
      kind: "scripture",
      book: "JHN",
      chapter: 17,
      verses: [5],
      reference: "John 17:5",
    },
    {
      kind: "scripture",
      book: "JHN",
      chapter: 17,
      verses: [21],
      reference: "John 17:21",
    },
    {
      kind: "p",
      text: "Read that as a man talking to himself and it collapses into nonsense: nobody is glorified by himself in his own presence, and nobody is sent by himself from himself. Read it as one divine person addressing another within the one God, and every word of it stands. The same holds for the Spirit, whom the Son sends and who comes from the Father:",
    },
    {
      kind: "scripture",
      book: "JHN",
      chapter: 15,
      verses: [26],
      reference: "John 15:26",
    },
    {
      kind: "p",
      text: "And the Spirit is not a force or an influence. Peter, confronting a man who had lied about a gift of money, names the Spirit and then names God, as the same one:",
    },
    {
      kind: "scripture",
      book: "ACT",
      chapter: 5,
      verses: [3, 4],
      reference: "Acts 5:3–4",
    },
    { kind: "h", text: "The four words the church settled on" },
    {
      kind: "p",
      text: "To say both things at once without contradiction, the church had to use one word for what God is and a different word for who God is. The distinction is the whole technical content of the doctrine, and Basil of Caesarea states it as plainly as anyone ever has.",
    },
    {
      kind: "quote",
      source: "basil-spirit",
      locator: "Letter 236, §6",
      speaker: "Basil of Caesarea",
      text: "The distinction between ousia and hupostasis is the same as that between the general and the particular; as, for instance, between the animal and the particular man. Wherefore, in the case of the Godhead, we confess one essence or substance so as not to give a variant definition of existence, but we confess a particular hypostasis, in order that our conception of Father, Son and Holy Spirit may be without confusion and clear.",
    },
    {
      kind: "list",
      label: "The working vocabulary",
      items: [
        { term: "Essence, substance, being", text: "What God is. There is one of these. The Greek is ousia, the Latin substantia or essentia. When the creeds say the Son is “of one substance with the Father”, this is the word." },
        { term: "Person, hypostasis", text: "Who God is. There are three of these. Not three centres of a divided God and not three roles of a single actor, but three who each possess the one divine essence wholly, and who stand in real relation to one another." },
        { term: "Begotten", text: "What Scripture says of the Son in relation to the Father, and only of the Son. The creeds are careful to add “begotten, not made”: a relation within God, not an act of creation, and not an event in time." },
        { term: "Proceeding", text: "What Scripture says of the Spirit in relation to the Father (John 15:26), and only of the Spirit. The Athanasian Creed is deliberate that this is “neither made, nor created, nor begotten; but proceeding”." },
      ],
    },
    {
      kind: "p",
      text: "With those words in place, the shortest full statement in the Christian tradition can be made in a line. The Athanasian Creed — Latin, and certainly not written by Athanasius, whatever its name says; scholars place its composition in the fifth or sixth century, and this site’s collection dates the received text at about 800 — fences the doctrine on both sides at once:",
    },
    {
      kind: "quote",
      source: "athanasian-creed",
      locator: "Quicunque vult, §§3–4",
      speaker: "The Athanasian Creed",
      text: "And the catholic faith is this: that we worship one God in Trinity, and Trinity in Unity; neither confounding the Persons, nor dividing the Essence.",
    },
    {
      kind: "p",
      text: "That is the sentence most often quoted in English as “neither confounding the Persons, nor dividing the Substance” — the wording of the Book of Common Prayer. Both render the same Latin, substantiam separantes; this site’s copy of the creed translates substantia as “Essence”, which is why the words above read that way. The creed then spells out what it has just forbidden, clause by clause: the Father is God, the Son is God, the Holy Spirit is God, “and yet they are not three Gods; but one God”, and “the whole three Persons are coeternal, and coequal”.",
    },
    {
      kind: "p",
      text: "Gregory of Nazianzus, preaching in Constantinople in the year the second council met, put the same double guard in one sentence, naming the two errors by the names of the men who taught them.",
    },
    {
      kind: "quote",
      source: "nazianzus-oration-31",
      locator: "Oration 31, §30",
      speaker: "Gregory of Nazianzus",
      text: "For it is equally impious to confuse the Persons with the Sabellians, or to divide the Natures with the Arians.",
    },
    {
      kind: "p",
      text: "Those are the two ditches on either side of the road, and everything that follows in this article is about them: the analogies that quietly drive into the first one, the theologians who marked the road and said how far their markings could be trusted, and the two councils at which the church wrote the warnings down.",
    },
  ],
};
