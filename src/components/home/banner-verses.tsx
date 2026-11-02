// The home page banners' verses are the site's own short wording, cut by hand for the banner, so they are not verse ids:
// each language's is cut the same way from that language's Bible (banner-verses.test.ts checks every piece against it).
import { useCurrentBible } from "@/lib/verses";
import { useSiteLanguage, type LanguageCode } from "@/lib/language";

export type BannerVerseName = "isaiah" | "john" | "peter" | "galatians";

export const BANNER_VERSES: Record<LanguageCode, Record<BannerVerseName, string>> = {
  en: {
    isaiah: "The grass withers and the flowers fall, but the word of our God stands forever.",
    john: "You pore over the Scriptures… These are the very words that testify about Me.",
    peter: "Always be prepared to give a defense\nto everyone who asks you the reason\nfor the hope that is in you.",
    galatians: "Carry one another’s burdens,\nand in this way you will fulfill the law of Christ.",
  },
  es: {
    isaiah: "Sécase la hierba, cáese la flor: mas la palabra del Dios nuestro permanece para siempre.",
    john: "Escudriñad las Escrituras… ellas son las que dan testimonio de mí.",
    peter: "Estad siempre aparejados para responder\ná cada uno que os demande razón\nde la esperanza que hay en vosotros.",
    galatians: "Sobrellevad los unos las cargas de los otros;\ny cumplid así la ley de Cristo.",
  },
  "pt-BR": {
    isaiah: "A erva seca, a flor murcha; mas a palavra do nosso Deus permanece para sempre.",
    john: "Vocês examinam as Escrituras… e são elas mesmas que dão testemunho a meu respeito.",
    peter: "Estejam sempre preparados para responder\na todo aquele que pedir a razão\nda esperança que há em vocês.",
    galatians: "Carreguem os fardos uns dos outros,\ne assim cumpram a lei de Cristo.",
  },
  "zh-Hans": {
    isaiah: "草必枯干，花必凋残，惟有我们 神的话必永远立定。",
    john: "你们查考圣经……给我作见证的就是这经。",
    peter: "有人问你们心中盼望的缘由，\n就要常作准备，\n以温柔、敬畏的心回答各人。",
    galatians: "你们各人的重担要互相担当，\n如此，就完全了基督的律法。",
  },
  ar: {
    isaiah: "يَبِسَ ٱلْعُشْبُ، ذَبُلَ ٱلزَّهْرُ. وَأَمَّا كَلِمَةُ إِلَهِنَا فَتَثْبُتُ إِلَى ٱلْأَبَدِ.",
    john: "فَتِّشُوا ٱلْكُتُبَ… وَهِيَ ٱلَّتِي تَشْهَدُ لِي.",
    peter: "مُسْتَعِدِّينَ دَائِمًا لِمُجَاوَبَةِ\nكُلِّ مَنْ يَسْأَلُكُمْ\nعَنْ سَبَبِ ٱلرَّجَاءِ ٱلَّذِي فِيكُمْ.",
    galatians: "اِحْمِلُوا بَعْضُكُمْ أَثْقَالَ بَعْضٍ،\nوَهَكَذَا تَمِّمُوا نَامُوسَ ٱلْمَسِيحِ.",
  },
  hi: {
    isaiah: "घास तो सूख जाती, और फूल मुर्झा जाता है; परन्तु हमारे परमेश्वर का वचन सदैव अटल रहेगा।",
    john: "तुम पवित्रशास्त्र में ढूँढ़ते हो… और यह वही है, जो मेरी गवाही देता है।",
    peter: "जो कोई तुम से तुम्हारी आशा के विषय में कुछ पूछे,\nतो उसे उत्तर देने के लिये\nसर्वदा तैयार रहो।",
    galatians: "तुम एक दूसरे के भार उठाओ,\nऔर इस प्रकार मसीह की व्यवस्था को पूरी करो।",
  },
};

/** The words around each emblem's ring, shown while it is hovered, by their English in emblem-designs.tsx. */
export const RING_VERSES: Record<Exclude<LanguageCode, "en">, Record<string, string>> = {
  es: {
    "the word of our God stands forever": "la palabra del Dios nuestro permanece para siempre",
    "Open my eyes that I may see wondrous things": "Abre mis ojos, y miraré las maravillas",
    "my rock, my fortress, and my deliverer": "roca mía y castillo mío, y mi libertador",
    "love your neighbor as yourself": "amarás á tu prójimo como á ti mismo",
  },
  "pt-BR": {
    "the word of our God stands forever": "a palavra do nosso Deus permanece para sempre",
    "Open my eyes that I may see wondrous things": "Abre os meus olhos, para que eu veja as maravilhas",
    "my rock, my fortress, and my deliverer": "a minha rocha, a minha fortaleza e o meu libertador",
    "love your neighbor as yourself": "você amará o seu próximo como a si mesmo",
  },
  "zh-Hans": {
    "the word of our God stands forever": "惟有我们 神的话必永远立定",
    "Open my eyes that I may see wondrous things": "求你开我的眼睛，使我看出你律法中的奇妙",
    "my rock, my fortress, and my deliverer": "我的岩石，我的山寨，我的救主",
    "love your neighbor as yourself": "要爱人如己",
  },
  ar: {
    "the word of our God stands forever": "كَلِمَةُ إِلَهِنَا فَتَثْبُتُ إِلَى ٱلْأَبَدِ",
    "Open my eyes that I may see wondrous things": "ٱكْشِفْ عَنْ عَيْنَيَّ فَأَرَى عَجَائِبَ",
    "my rock, my fortress, and my deliverer": "صَخْرَتِي وَحِصْنِي وَمُنْقِذِي",
    "love your neighbor as yourself": "تُحِبُّ قَرِيبَكَ كَنَفْسِكَ",
  },
  hi: {
    "the word of our God stands forever": "हमारे परमेश्वर का वचन सदैव अटल रहेगा",
    "Open my eyes that I may see wondrous things": "मेरी आँखें खोल दे, कि मैं तेरी व्यवस्था की अद्भुत बातें देख सकूँ",
    "my rock, my fortress, and my deliverer": "मेरी चट्टान, और मेरा गढ़ और मेरा छुड़ानेवाला",
    "love your neighbor as yourself": "एक दूसरे से अपने समान प्रेम रखना",
  },
};

/** The blessing at the foot of the home page: each verse's lead-in and its gold ending, cut the same way. */
export const BLESSING_VERSES: Record<LanguageCode, Record<"numbers" | "joshua", [string, string]>> = {
  en: {
    numbers: ["May the LORD bless you and keep you;", "may the LORD cause His face to shine upon you and be gracious to you."],
    joshua: ["Be strong and courageous. Do not be afraid; do not be discouraged,", "for the LORD your God is with you wherever you go."],
  },
  es: {
    numbers: ["Jehová te bendiga, y te guarde:", "Haga resplandecer Jehová su rostro sobre ti, y haya de ti misericordia."],
    joshua: ["Mira que te mando que te esfuerces y seas valiente: no temas ni desmayes,", "porque Jehová tu Dios será contigo en donde quiera que fueres."],
  },
  "pt-BR": {
    numbers: ["O SENHOR te abençoe e te guarde.", "O SENHOR faça resplandecer o seu rosto sobre ti, e tenha misericórdia de ti."],
    joshua: ["Seja forte e corajoso. Não tenha medo. Não se apavore,", "pois o SENHOR, seu Deus, está com você por onde quer que você andar."],
  },
  "zh-Hans": {
    numbers: ["愿耶和华赐福给你，保护你。", "愿耶和华使他的脸光照你，赐恩给你。"],
    joshua: ["你当刚强壮胆！不要惧怕，也不要惊惶；", "因为你无论往哪里去，耶和华—你的 神必与你同在。"],
  },
  ar: {
    numbers: ["يُبَارِكُكَ ٱلرَّبُّ وَيَحْرُسُكَ.", "يُضِيءُ ٱلرَّبُّ بِوَجْهِهِ عَلَيْكَ وَيَرْحَمُكَ."],
    joshua: ["تَشَدَّدْ وَتَشَجَّعْ! لَا تَرْهَبْ وَلَا تَرْتَعِبْ", "لِأَنَّ ٱلرَّبَّ إِلَهَكَ مَعَكَ حَيْثُمَا تَذْهَبُ."],
  },
  hi: {
    numbers: ["यहोवा तुझे आशीष दे और तेरी रक्षा करे:", "यहोवा तुझ पर अपने मुख का प्रकाश चमकाए, और तुझ पर अनुग्रह करे।"],
    joshua: ["हियाव बाँधकर दृढ़ हो जा; भय न खा, और तेरा मन कच्चा न हो;", "क्योंकि जहाँ-जहाँ तू जाएगा वहाँ-वहाँ तेरा परमेश्वर यहोवा तेरे संग रहेगा।"],
  },
};

/** What these Bibles are called in their own language, for readers of that language. */
export const BIBLE_OWN_NAMES: Record<string, string> = {
  cuv: "和合本",
  svd: "ترجمة فان دايك",
  irv: "इंडियन रिवाइज्ड वर्जन",
};

export function BannerVerse({ name }: { name: BannerVerseName }) {
  const language = useSiteLanguage();
  const bible = useCurrentBible();
  return <span lang={bible.lang} dir={bible.dir} translate="no">“{BANNER_VERSES[language][name]}”</span>;
}

export function RingVerseWords({ english }: { english: string }) {
  const language = useSiteLanguage();
  const bible = useCurrentBible();
  const words = language === "en" ? english : RING_VERSES[language][english] ?? english;
  return <span lang={bible.lang} dir={bible.dir} translate="no">“{words[0].toUpperCase() + words.slice(1)}”</span>;
}
