// Advent (design 4.2): 29 day entries by calendar date (27 November to 25 December) and 5 candle panels.
import { p, type CountdownDay, type DayPanel } from "./types";

export const ADVENT_DAYS: CountdownDay[] = [
  {
    key: "nov-27",
    at: { date: "11-27" },
    title: "Longing for God to come",
    readings: [p("ISA 64:1-4", "reading", "Isaiah's cry for God to tear open the heavens: the longing Advent begins with.")],
    card: p("ISA 64:1", "card", "A one-line prayer of longing for God to come down."),
    reflection:
      "Isaiah prays one of the boldest prayers of longing in the Bible: “If only You would rend the heavens and come down.” His people felt that God was far away, yet they remembered times when he had acted beyond anything they expected. Advent begins with that ache. God answered it at Bethlehem, though not as Isaiah pictured: he came down quietly, as a child. The same longing still stands, because Christ has promised to come again. Isaiah ends in hope, with a God who acts “on behalf of those who wait for Him.”",
    prayer:
      "Lord, we long for you to come near. Thank you for coming to us in Jesus. Teach us to wait for his return with hope rather than worry, trusting that you act for those who wait for you. Amen.",
    question: "What are you longing for God to do this Advent?",
  },
  {
    key: "nov-28",
    at: { date: "11-28" },
    title: "Keep watch",
    readings: [p("MRK 13:32-37", "reading", "Jesus on his return: no one knows the hour, so stay awake and keep at the work he gave.")],
    card: p("MRK 13:33", "card", "Jesus' own call to stay alert for his coming."),
    reflection:
      "Jesus tells his disciples that no one knows the day or hour of his return, so they are to keep watch. He compares himself to a master who goes on a journey and gives each servant a task, with the doorkeeper told to stay awake. Watching here is not anxious clock-watching; it is getting on faithfully with the work he has given while expecting him home. Advent remembers that Christ came once, in Bethlehem, and looks ahead to his coming again. His last word in the passage is for everyone: “Keep watch.”",
    prayer:
      "Lord Jesus, you have promised to come again. Keep us awake to you, faithful in the work you have given us, and glad rather than afraid when we think of your return. Amen.",
    question: "What does keeping watch for Jesus look like in an ordinary week?",
  },
  {
    key: "nov-29",
    at: { date: "11-29" },
    title: "Waiting for the morning",
    readings: [p("PSA 130:1-8", "reading", "A prayer from the depths that turns into patient hope, like a watchman waiting for dawn.")],
    card: p("PSA 130:5", "card", "Waiting for the Lord, with hope resting on his word."),
    reflection:
      "The psalmist cries to the Lord “out of the depths,” knowing that if God kept a record of sins no one could stand. Yet he finds forgiveness with God, and so he waits, like a night watchman longing for the first light. His hope rests on God's word, not on his own goodness. The psalm ends with a promise that the Lord himself will redeem his people from all their sin. Jesus came to do exactly that (Matthew 1:21), and Christians now wait for the morning of his return with the same patient hope.",
    prayer:
      "Lord, when we feel low, help us to wait for you as watchmen wait for the morning. Thank you that with you there is forgiveness, and full redemption through Jesus. Amen.",
    question: "When have you had to wait through a long night for something, and what helped?",
  },
  {
    key: "nov-30",
    at: { date: "11-30" },
    title: "Salvation is nearer now",
    readings: [p("ROM 13:11-14", "reading", "Paul's wake-up call: the night is nearly over and the day of Christ is close.")],
    card: p("ROM 13:12", "card", "The night nearly over, and the armor of light to put on."),
    reflection:
      "Paul tells the Christians in Rome that it is time to wake up, because “our salvation is nearer now than when we first believed.” He pictures history as a night that is nearly over, with the day of Christ's return about to break. So believers can set aside the deeds of darkness and dress, as it were, in the armor of light, clothing themselves with the Lord Jesus Christ. This is not a way to earn salvation; it is how people live who already belong to the coming day. Advent is a good season to wake up to that.",
    prayer:
      "Father, thank you that the night is nearly over and the day is near. Help us to put on the Lord Jesus, and to live now as people who belong to his coming day. Amen.",
    question: "What helps you feel awake to God, rather than half asleep, in a busy December?",
  },
  {
    key: "dec-01",
    at: { date: "12-01" },
    title: "The first promise",
    readings: [p("GEN 3:8-15", "reading", "God seeks Adam and Eve after they hide, and speaks the first promise of victory over evil.")],
    card: p("GEN 3:15", "card", "The promise that the woman's offspring will crush the serpent's head."),
    reflection:
      "After Adam and Eve disobey God, they hide among the trees, but God comes looking for them and calls, “Where are you?” There is sorrow and judgment in this chapter, yet even here God speaks a promise. He tells the serpent that a child of the woman will one day crush its head, though he himself will be wounded. Christians have long seen this as the first hint of the gospel, and Paul echoes it when he writes that God will soon crush Satan (Romans 16:20). The Christmas story starts in a garden, with God seeking people who hid.",
    prayer:
      "Father, thank you that you came looking for Adam and Eve when they hid, and that you come looking for us too. Thank you for sending Jesus to defeat evil for good. Amen.",
    question: "Why do you think God went looking for Adam and Eve instead of waiting for them to come back?",
  },
  {
    key: "dec-02",
    at: { date: "12-02" },
    title: "A blessing for every family on earth",
    readings: [p("GEN 12:1-3", "reading", "God calls Abram and promises a blessing that will reach every family on earth.")],
    card: p("GEN 12:3", "card", "All the families of the earth blessed through Abram's line."),
    reflection:
      "God calls Abram to leave his country and his father's household and go to a land he has not yet seen. With the call comes a promise: a great nation, a great name, and a blessing that reaches far beyond one family, for “all the families of the earth will be blessed through you.” Paul says this promise was the gospel announced in advance, and that it reaches the nations through Christ, Abraham's descendant (Galatians 3:8, 16). Every family that hears the Christmas story today is part of what God promised Abram long ago.",
    prayer:
      "Lord, thank you for the promise you made to Abram, and for keeping it in Jesus. Thank you that your blessing has reached our family. Help us to share it gladly with others. Amen.",
    question: "What is it like to trust someone when you cannot see where the road is going?",
  },
  {
    key: "dec-03",
    at: { date: "12-03" },
    title: "God will provide the lamb",
    readings: [p("GEN 22:6-14", "reading", "Abraham and Isaac on the mountain, where God stops Abraham's hand and provides a ram.")],
    card: p("GEN 22:8", "card", "Abraham's answer to his son's question: God himself will provide the lamb."),
    reflection:
      "The story of Abraham and Isaac on the mountain is one of the hardest in Genesis, and it is told plainly. God tests Abraham by asking for his son, and as they climb, Isaac asks where the lamb is. Abraham answers, “God Himself will provide the lamb.” At the last moment the angel stops him, and a ram caught in a thicket is offered instead. Isaac is spared. Hebrews says Abraham trusted that God could even raise the dead (Hebrews 11:17-19). Later John the Baptist pointed to Jesus as “the Lamb of God, who takes away the sin of the world” (John 1:29).",
    prayer:
      "Father, some stories in the Bible are hard to understand. Thank you that you stopped Abraham's hand and spared Isaac, and that you have given us the Lamb we needed in Jesus. Amen.",
    question: "Isaac asked his father an honest question. What hard questions would you like to bring to God?",
  },
  {
    key: "dec-04",
    at: { date: "12-04" },
    title: "The scepter of Judah",
    readings: [p("GEN 49:8-10", "reading", "Jacob's blessing on Judah: a lion, and a scepter that will not depart until its true King comes.")],
    card: p("GEN 49:10", "card", "The promise of a King from Judah whom the nations will obey."),
    reflection:
      "As Jacob nears death, he blesses his sons, and to Judah he gives a promise of kingship: the scepter will not depart from Judah until the one comes whom the nations will obey. Judah is pictured as a young lion. Centuries later King David came from this tribe, and so did Jesus, the son of David (Hebrews 7:14). Revelation calls the risen Christ “the Lion of the tribe of Judah” (Revelation 5:5). The child born in Bethlehem is the King this old blessing was waiting for, and one day every nation will honor him.",
    prayer:
      "Lord Jesus, you are the King promised to Judah long ago. Thank you that your rule is good and fair. We gladly give you our loyalty, and look forward to the day all nations honor you. Amen.",
    question: "What makes Jesus different from other kings and rulers in history?",
  },
  {
    key: "dec-05",
    at: { date: "12-05" },
    title: "The Passover lamb",
    readings: [p("EXO 12:21-27", "reading", "The first Passover: a lamb for each family, the blood on the door, and a story to tell children.")],
    card: p("EXO 12:13", "card", "The blood as a sign, and the Lord's promise to pass over."),
    reflection:
      "On the night of the first Passover, each Israelite family offered a lamb and brushed its blood on the doorframe of their house. When the Lord passed through Egypt in judgment, he passed over every house marked by the blood, and the family inside was safe. Moses told them to keep remembering this, and to explain it when their children asked, “What does this service mean to you?” Paul writes that “Christ, our Passover lamb, has been sacrificed” (1 Corinthians 5:7). The baby of Bethlehem came to be that Lamb, so that all who trust him are safe.",
    prayer:
      "Father, thank you that Jesus is our Passover Lamb, and that we are safe because of what he has done, not because of anything we do. Help us to tell this story to our children. Amen.",
    question: "If a child asked you what Christmas means to you, what would you say?",
  },
  {
    key: "dec-06",
    at: { date: "12-06" },
    title: "A prophet like Moses",
    readings: [p("DEU 18:15-19", "reading", "Moses promises another prophet who will speak God's own words, one the people must hear.")],
    card: p("DEU 18:15", "card", "A prophet like Moses, and the simple command to listen to him."),
    reflection:
      "At Mount Sinai the people were so frightened by God's voice and the great fire that they asked Moses to speak to them instead. God agreed, and promised to raise up another prophet like Moses, from among their own people, who would speak God's words. “You must listen to him,” Moses said. Peter, preaching in the temple, says this promise was fulfilled in Jesus (Acts 3:22-26). Jesus does more than pass on God's message: he is God's Word in person. At Christmas God speaks to us not through fire but through a child.",
    prayer:
      "Father, thank you for speaking to us through your Son. Open our ears to listen to Jesus, and give us glad hearts to follow what he says. Amen.",
    question: "Whose voices do we listen to most, and how can we make room to hear Jesus?",
  },
  {
    key: "dec-07",
    at: { date: "12-07" },
    title: "Ruth, Boaz and a redeemer",
    readings: [p("RUT 4:13-17", "reading", "The end of Ruth's story: a redeemer, a baby in Bethlehem, and the family line of David.")],
    card: p("RUT 4:14", "card", "The women of Bethlehem praise the Lord for Naomi's redeemer."),
    reflection:
      "The book of Ruth ends with a wedding and a baby. Naomi had lost her husband and both her sons, but Boaz, a relative who acted as her family's redeemer, married her widowed daughter-in-law Ruth, and the Lord gave them a son. The women of Bethlehem praised God that Naomi had not been left “without a kinsman-redeemer.” The boy, Obed, became the grandfather of King David. Ruth was a foreigner from Moab, yet Matthew names her in the family line of Jesus (Matthew 1:5). God was quietly preparing Bethlehem for its greatest son.",
    prayer:
      "Lord, thank you for your kindness to Naomi and Ruth when life had been hard. Thank you that Jesus is our Redeemer, and that your family has room for people from every nation. Amen.",
    question: "Where have you seen God bring something good out of a sad time?",
  },
  {
    key: "dec-08",
    at: { date: "12-08" },
    title: "David's throne forever",
    readings: [p("2SA 7:8-16", "reading", "God's covenant with David: a house, a kingdom and a throne that will last forever.")],
    card: p("2SA 7:16", "card", "The promise of a throne established forever."),
    reflection:
      "David wanted to build a house for God, a temple, but God turned the idea around: the Lord himself would build a house for David, a family line of kings. He promised to raise up a descendant whose kingdom would be established, and said, “Your house and kingdom will endure forever before Me.” David's royal line seemed to end in exile, but the promise stood. When the angel came to Mary, he said that God would give her son “the throne of His father David,” and that his kingdom would never end (Luke 1:32-33). God keeps his word.",
    prayer:
      "Faithful God, thank you that you keep your promises, even when they seem to have failed. Thank you for Jesus, the King whose kingdom will never end. Amen.",
    question: "Which of God's promises do you find hardest to keep trusting, and why?",
  },
  {
    key: "dec-09",
    at: { date: "12-09" },
    title: "The Son, the King",
    readings: [p("PSA 2:6-12", "reading", "God installs his King and calls him Son, and invites the rulers of the earth to take refuge in him.")],
    card: p("PSA 2:7", "card", "The Lord's decree to his King: you are my Son."),
    reflection:
      "Psalm 2 pictures the nations plotting against the Lord and his anointed king, while God calmly declares, “I have installed My King on Zion.” Then the king speaks the Lord's decree: “You are My Son.” The rulers of the earth are told to be wise and serve the Lord, and the psalm ends gently: “Blessed are all who take refuge in Him.” The New Testament hears the Father speaking to Jesus in this psalm (Acts 13:33; Hebrews 1:5). The baby in the manger is that Son and King, and the safest place in the world is with him.",
    prayer:
      "Father, thank you for sending your Son as our King. When the world feels unsettled, help us to take refuge in him and to serve you with joy. Amen.",
    question: "What does it mean to take refuge in someone, and when have you needed that?",
  },
  {
    key: "dec-10",
    at: { date: "12-10" },
    title: "Immanuel",
    readings: [p("ISA 7:10-14", "reading", "A frightened king refuses a sign, and God gives one anyway: a son called Immanuel.")],
    card: p("ISA 7:14", "card", "The sign of Immanuel, which Matthew 1:23 sees fulfilled in Jesus."),
    reflection:
      "King Ahaz was afraid of the armies gathering against Jerusalem, and when God offered him a sign, he refused to ask. So God gave a sign anyway: “the virgin will be with child and will give birth to a son, and will call Him Immanuel.” Matthew tells us that this name means “God with us,” and that the promise came true when Jesus was born to Mary (Matthew 1:22-23). Isaiah's sign was given to a frightened king who would not trust. God's answer to fear was his own presence, and at Christmas he came to be with us in person.",
    prayer:
      "Lord, thank you that in Jesus you are God with us. When we are afraid, remind us that you are near, and help us to trust you more than our fears. Amen.",
    question: "How might it change an ordinary day to remember that God is with us?",
  },
  {
    key: "dec-11",
    at: { date: "12-11" },
    title: "A child is born",
    readings: [p("ISA 9:2-7", "reading", "A great light for people in darkness, and the child whose peace will have no end.")],
    card: p("ISA 9:6", "card", "The four names of the promised child, loved at every Christmas."),
    reflection:
      "Isaiah speaks to people walking in darkness and promises a great light. The reason for their joy is a birth: “For unto us a child is born, unto us a son is given.” This child will carry the government on his shoulders and bear names no ordinary king could carry: Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace. His peace will have no end, and he will reign on David's throne forever. Matthew sees the light of this chapter dawning when Jesus began his work in Galilee (Matthew 4:13-16). A child is God's answer to the world's darkness.",
    prayer:
      "Lord Jesus, you are Wonderful Counselor, Mighty God, Everlasting Father and Prince of Peace. Shine your light into the dark places of our world and our hearts, and reign over us. Amen.",
    question: "Which of the four names in Isaiah 9:6 means the most to you this year, and why?",
    hymn: "gutenberg-watts-psalms-98-2-joy-to-the-world-the-lord-is-come",
  },
  {
    key: "dec-12",
    at: { date: "12-12" },
    title: "The shoot from Jesse's stump",
    readings: [p("ISA 11:1-10", "reading", "New life from a cut-down family tree: a Spirit-filled King and a world at peace.")],
    card: p("ISA 11:1", "card", "A shoot from the stump of Jesse, David's father: hope where all seemed lost."),
    reflection:
      "Isaiah pictures the family tree of David, which began with Jesse, cut down to a stump, and then a fresh shoot springing up from it. The Spirit of the Lord will rest on this new King, giving him wisdom and understanding, and he will judge the poor with fairness. Then the picture widens into a world at peace, where the wolf lives with the lamb and “a little child will lead them.” Paul quotes this chapter about Christ, the Root of Jesse in whom the nations hope (Romans 15:12). That peace began at Christmas and will be complete when he returns.",
    prayer:
      "Lord, when things in our world look cut down and finished, remind us that you bring new life. Thank you for Jesus, the shoot from Jesse's stump, and for the peace he brings. Amen.",
    question: "Isaiah imagines a wolf and a lamb living together. What would peace look like where we live?",
  },
  {
    key: "dec-13",
    at: { date: "12-13" },
    title: "Comfort, and a voice in the wilderness",
    readings: [p("ISA 40:1-11", "reading", "Comfort for God's people, a voice preparing the way, and the Lord coming as a shepherd.")],
    card: p("ISA 40:11", "card", "The coming Lord as a shepherd who carries the lambs close to his heart."),
    reflection:
      "Isaiah 40 opens with tender words: “Comfort, comfort My people,” says God, for their sin has been pardoned. A voice calls for a highway to be prepared in the wilderness, because the Lord is coming. People fade like grass, but the word of our God stands forever. All four Gospels say John the Baptist was that voice, preparing the way for Jesus (Mark 1:2-3). The one who comes is mighty, yet the chapter ends with a shepherd who gathers the lambs in his arms and carries them close to his heart.",
    prayer:
      "Lord, thank you for your comfort and your pardon. Prepare our hearts for Jesus this Christmas, and carry close to your heart anyone who feels weak or alone today. Amen.",
    question: "Who in our lives needs comfort this December, and how could we show it?",
  },
  {
    key: "dec-14",
    at: { date: "12-14" },
    title: "Why he came: the Servant who suffers",
    readings: [p("ISA 53:1-6", "reading", "The Servant despised and wounded for our sins, read as Jesus in Acts 8:32-35.")],
    card: p("ISA 53:5", "card", "Pierced for our sins, so that we might have peace and healing."),
    reflection:
      "Isaiah describes a Servant of the Lord who grows up quietly, like a tender shoot, and is despised and rejected. People think he is being punished for his own wrongs, but the truth is the opposite: “He was pierced for our transgressions,” and “by His stripes we are healed.” We have all wandered like sheep, and the Lord laid our sin on him. Philip explained this chapter as the good news about Jesus (Acts 8:32-35). The manger leads to the cross. The child was born to take our place and bring us peace with God.",
    prayer:
      "Lord Jesus, thank you that you came to carry our sins and take our punishment. We could never earn your peace, so we receive it gladly as a gift. Amen.",
    question: "Why do you think the Christmas story and the Easter story belong together?",
    hymn: "gutenberg-watts-hymns-2-9-alas-and-did-my-saviour-bleed",
  },
  {
    key: "dec-15",
    at: { date: "12-15" },
    title: "The righteous Branch",
    readings: [p("JER 23:5-6", "reading", "A promised King from David's line who will rule justly and be called our righteousness.")],
    card: p("JER 23:5", "card", "The righteous Branch from David who will reign wisely."),
    reflection:
      "In Jeremiah's day the kings of Judah had failed their people badly, like careless shepherds. God promised that the days were coming when he would raise up for David “a righteous Branch,” a King who would rule wisely and do what is just and right. His name would be “The LORD Our Righteousness.” That name is a gift as well as a title: Paul writes that Christ Jesus has become our righteousness (1 Corinthians 1:30). We do not make ourselves right with God; the King born at Bethlehem shares his own righteousness with us.",
    prayer:
      "Father, thank you for Jesus, the righteous King. Thank you that he is our righteousness, and that we stand before you because of him, not because of our own goodness. Amen.",
    question: "What makes a leader good, and how does Jesus show us that?",
  },
  {
    key: "dec-16",
    at: { date: "12-16" },
    title: "Little Bethlehem",
    readings: [p("MIC 5:2-5", "reading", "A ruler from tiny Bethlehem whose origins are from eternity, and who will be our peace.")],
    card: p("MIC 5:2", "card", "Bethlehem named as the Messiah's birthplace, as Matthew 2:6 recalls."),
    reflection:
      "Micah speaks to Bethlehem, a town so small it was hardly counted among the clans of Judah, and promises that a ruler over Israel will come from it. Yet this ruler's origins are “of old, from the days of eternity.” He will shepherd his flock in the strength of the Lord, his greatness will reach the ends of the earth, and “He will be our peace.” When the wise men asked where the Messiah would be born, the scribes pointed to this very prophecy (Matthew 2:4-6). God often chooses small places and ordinary people for his greatest work.",
    prayer:
      "Lord, thank you that you chose little Bethlehem for the birth of your Son, and that you notice small places and ordinary people. Be our peace this Christmas. Amen.",
    question: "Why do you think God chose a small town like Bethlehem for Jesus to be born?",
  },
  {
    key: "dec-17",
    at: { date: "12-17" },
    title: "The messenger before the Lord",
    readings: [p("MAL 3:1-4", "reading", "The last prophet promises a messenger, then the Lord himself coming to refine his people.")],
    card: p("MAL 3:1", "card", "A messenger to prepare the way, which Jesus applies to John the Baptist."),
    reflection:
      "In the last book of the Old Testament, God promises to send a messenger to prepare the way, and then the Lord himself will suddenly come to his temple. Malachi asks a sobering question: “who can endure the day of His coming?” The Lord will come like a refiner's fire, not to destroy but to purify his people, like silver made clean. Jesus said John the Baptist was this messenger (Matthew 11:10). After Malachi the prophets fall silent for about four hundred years, until an angel appears to an old priest in the temple.",
    prayer:
      "Lord, thank you that when you come near, you come to make your people clean. Prepare our hearts for Jesus, and do your gentle, refining work in us. Amen.",
    question: "Malachi says God refines his people like silver. What do you think God is shaping in you?",
  },
  {
    key: "dec-18",
    at: { date: "12-18" },
    title: "An angel in the temple",
    readings: [p("LUK 1:5-17", "reading", "An angel meets the old priest Zechariah in the temple with news of a son, John.")],
    card: p("LUK 1:17", "card", "John's calling: to make ready a people prepared for the Lord."),
    reflection:
      "Zechariah and Elizabeth were faithful, elderly, and had no children. While Zechariah was burning incense in the temple, an angel of the Lord appeared and told him, “your prayer has been heard.” Elizabeth would have a son named John, who would go before the Lord in the spirit and power of Elijah, turning the hearts of fathers to their children and making ready a people prepared for the Lord. These words pick up the promise at the very end of Malachi (Malachi 4:5-6). After centuries of silence, God was speaking again, and his promises were on the move.",
    prayer:
      "Father, thank you that you hear our prayers, even the ones we have prayed for many years. Turn our hearts toward each other and toward you as we prepare for Jesus. Amen.",
    question: "What prayer have you been praying for a long time, and how do you keep hoping?",
  },
  {
    key: "dec-19",
    at: { date: "12-19" },
    title: "Zechariah's silence, Elizabeth's joy",
    readings: [p("LUK 1:18-25", "reading", "Zechariah doubts and falls silent, and Elizabeth rejoices that God has shown her favor.")],
    card: p("LUK 1:25", "card", "Elizabeth's thanks that the Lord has shown her favor."),
    reflection:
      "Zechariah found the angel's message hard to believe and asked how he could be sure, since he and his wife were old. The angel, Gabriel, told him he would be unable to speak until the promise came true. So Zechariah came out of the temple silent, making signs to the waiting crowd. Meanwhile Elizabeth became pregnant, and she rejoiced: “The Lord has done this for me.” God did not cancel his promise because Zechariah doubted. Our weak faith cannot stop God from keeping his word, and his kindness often comes before we are ready for it.",
    prayer:
      "Lord, sometimes we find your promises hard to believe. Thank you that you are faithful even when our faith is weak. Help us to trust you, and to see your kindness in our lives. Amen.",
    question: "Zechariah was silent for months. What might we notice about God if we were quieter this week?",
  },
  {
    key: "dec-20",
    at: { date: "12-20" },
    title: "“I am the Lord’s servant”",
    readings: [p("LUK 1:26-38", "reading", "Gabriel's message to Mary, and her trusting answer.")],
    card: p("LUK 1:38", "card", "Mary's answer to the angel, as Luke records it."),
    reflection:
      "God sent the angel Gabriel to Mary, a young woman in Nazareth engaged to Joseph, a descendant of David. He told her she had found favor with God and would give birth to a son named Jesus, who would be called the Son of the Most High and reign forever. Mary asked how this could be, since she was a virgin, and Gabriel said the Holy Spirit would come upon her, for “no word from God will ever fail.” Mary answered simply: “I am the Lord’s servant.” Her trust in God's word is a picture of faith for all of us.",
    prayer:
      "Father, thank you for Mary's trust in your word. Give us that same readiness to say yes to you, knowing that no word from you will ever fail. Amen.",
    question: "What do you think helped Mary to answer the angel the way she did?",
  },
  {
    key: "dec-21",
    at: { date: "12-21" },
    title: "Mary visits Elizabeth; Mary's song",
    readings: [p("LUK 1:39-56", "reading", "Two expectant mothers meet, Elizabeth blesses Mary, and Mary sings God's praise.")],
    card: p("LUK 1:46-47", "card", "The opening of Mary's song of praise to God her Savior."),
    reflection:
      "Mary hurried to the hill country to visit her relative Elizabeth, and as soon as Elizabeth heard her greeting, the baby leaped in her womb. Filled with the Holy Spirit, Elizabeth called Mary blessed among women, blessed because she believed the Lord's word. Mary answered with a song of praise: “My soul magnifies the Lord.” She sings of a God who looks on the humble, lifts up the lowly, fills the hungry with good things, and keeps his promise to Abraham. Her song points away from herself to God her Savior, and invites us to praise him too.",
    prayer:
      "Lord, our souls magnify you too. Thank you for noticing the humble and filling the hungry with good things. Thank you that you always keep your promises. Amen.",
    question: "If you wrote a short song of thanks to God this year, what would you put in it?",
  },
  {
    key: "dec-22",
    at: { date: "12-22" },
    title: "Zechariah's song: the sunrise from on high",
    readings: [p("LUK 1:67-79", "reading", "Zechariah, his voice restored, sings of salvation and of the Dawn coming from on high.")],
    card: p("LUK 1:78-79", "card", "God's tender mercy as a sunrise shining on those in darkness."),
    reflection:
      "When baby John was named, Zechariah's voice returned, and filled with the Holy Spirit he sang. He praised God for raising up a mighty Savior from David's house, as the prophets had promised, and for remembering his covenant with Abraham. Then he turned to his little son: John would go before the Lord to prepare his way. Zechariah ends with a lovely picture: because of God's tender mercy, “the Dawn will visit us from on high, to shine on those who live in darkness.” After a long night of waiting, the sunrise was very close.",
    prayer:
      "Lord God, thank you for your tender mercy, which sent Jesus like the sunrise into our darkness. Guide our feet into the path of peace. Amen.",
    question: "Where would you most like to see God's light shine this Christmas?",
  },
  {
    key: "dec-23",
    at: { date: "12-23" },
    title: "Joseph",
    readings: [p("MAT 1:18-25", "reading", "Joseph's dilemma, the angel's message in a dream, and his quiet obedience.")],
    card: p("MAT 1:23", "card", "Immanuel, God with us: Matthew reads Isaiah 7:14 as fulfilled in Jesus."),
    reflection:
      "Joseph learned that Mary, the young woman he was engaged to, was expecting a child, and being a righteous man he planned to end the engagement quietly rather than shame her. Then an angel spoke to him in a dream: the child was from the Holy Spirit, and Joseph was to name him Jesus, “because He will save His people from their sins.” Matthew tells us this fulfilled Isaiah's promise of Immanuel, God with us. Joseph woke up and did as he was told. His quiet obedience gave Jesus a home and a place in David's line.",
    prayer:
      "Father, thank you for Joseph's kindness and quiet obedience. Thank you that Jesus came to save his people from their sins. Help us to trust you when your plans surprise us. Amen.",
    question: "Joseph had to change his plans. When has a change of plans turned out to be a gift?",
  },
  {
    key: "dec-24",
    at: { date: "12-24" },
    label: "Christmas Eve",
    title: "No room",
    readings: [p("LUK 2:1-7", "reading", "The journey to Bethlehem and the birth of Jesus, laid in a manger.")],
    card: p("LUK 2:7", "card", "The Son of God wrapped in cloths and laid in a manger."),
    reflection:
      "A decree from Caesar Augustus sent Joseph from Nazareth to Bethlehem, the town of David, with Mary, who was expecting her child. The most powerful man in the world thought he was simply counting his people, but God was keeping the promise he made through Micah. While they were in Bethlehem, Mary gave birth to her firstborn son, wrapped him in cloths, and laid him in a manger, “because there was no room for them in the inn.” The Son of God arrived without fuss or welcome. Tonight we welcome him with joy.",
    prayer:
      "Lord Jesus, you came quietly and humbly, laid in a manger because there was no room. Thank you for coming for us. Make our hearts and our home a place of welcome for you. Amen.",
    question: "Why do you think God let his Son be born in such a humble place?",
  },
  {
    key: "dec-25",
    at: { date: "12-25" },
    label: "Christmas Day",
    title: "Good news of great joy; the Word became flesh",
    readings: [
      p("LUK 2:8-20", "reading", "The angels' announcement to the shepherds, and their visit to the manger."),
      p("JHN 1:1-14", "reading", "The same Christmas told from eternity: the Word who was God became flesh."),
    ],
    card: p("LUK 2:11", "card", "The angel's announcement: a Savior born today, Christ the Lord."),
    reflection:
      "On the night Jesus was born, an angel appeared to shepherds near Bethlehem with “good news of great joy that will be for all the people”: a Savior had been born, Christ the Lord. The shepherds hurried to find him, then went out praising God. John tells the same story from eternity's side: the Word who was with God and was God “became flesh and made His dwelling among us.” Every promise of Advent comes true in this one child. And the one who came as a baby will come again in glory.",
    prayer:
      "Father, thank you for the good news of great joy: a Savior born for us, Christ the Lord. Thank you that your Word became flesh. Fill our home with wonder and praise today. Amen.",
    question: "What part of the Christmas story do you notice in a new way this year?",
    hymn: "ccel-watts-psalms-hymns-i-4-1-shepherds-rejoice-lift-up-your-eyes",
  },
];

export const ADVENT_PANELS: DayPanel[] = [
  {
    key: "candle-1",
    on: { week: 0 },
    heading: "First Sunday of Advent: the candle of hope",
    passage: p("ISA 9:2", "card", "The prophecy candle: a great light promised to people walking in darkness."),
    line: "We light the first candle, the prophecy candle, for hope, because God promised that a great light would shine in the darkness, and he keeps his promises.",
    hymn: "gutenberg-watts-psalms-121-2-to-heaven-i-lift-my-waiting-eyes",
  },
  {
    key: "candle-2",
    on: { week: 1 },
    heading: "Second Sunday of Advent: the candle of peace",
    passage: p("LUK 2:14", "card", "The Bethlehem candle: the angels' song of peace over the little town."),
    line: "We light the second candle, the Bethlehem candle, for peace, because in that little town the Prince of Peace was born to bring us peace with God.",
    hymn: "gutenberg-watts-hymns-2-136-the-king-of-glory-sends-his-son",
  },
  {
    key: "candle-3",
    on: { week: 2 },
    heading: "Third Sunday of Advent: the candle of joy",
    passage: p("LUK 2:10", "card", "The shepherds' candle: good news of great joy for all the people."),
    line: "We light the third candle, the shepherds' candle, for joy, because the angel brought ordinary shepherds the best news the world has ever heard.",
    hymn: "ccel-watts-psalms-hymns-i-4-1-shepherds-rejoice-lift-up-your-eyes",
  },
  {
    key: "candle-4",
    on: { week: 3 },
    heading: "Fourth Sunday of Advent: the candle of love",
    passage: p("JHN 3:16", "card", "The angels' candle: the love that sent God's one and only Son."),
    line: "We light the fourth candle, the angels' candle, for love, because God so loved the world that he gave his one and only Son.",
    hymn: "gutenberg-watts-hymns-1-3-behold-the-grace-appears",
  },
  {
    key: "candle-christ",
    on: { before: 0 },
    heading: "Christmas Day: the Christ candle",
    passage: p("JHN 8:12", "card", "The Christ candle: Jesus, the light of the world."),
    line: "We light the Christ candle in the middle, because Jesus, the light of the world, has come, and whoever follows him will never walk in darkness.",
    hymn: "gutenberg-watts-psalms-98-2-joy-to-the-world-the-lord-is-come",
  },
];
