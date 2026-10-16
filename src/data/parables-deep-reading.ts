export type ParableReadingNote = {
  title: string;
  text: string;
  sources: { label: string; href: string }[];
};

const matthew = { label: 'Douglas Sean O’Donnell · Matthew', href: 'https://www.thegospelcoalition.org/commentary/matthew/' };
const luke = { label: 'Peter G. Bolt · Luke', href: 'https://www.thegospelcoalition.org/commentary/luke/' };
const henry = (chapter: string, href: string) => ({ label: `Matthew Henry · ${chapter}`, href: `https://www.ccel.org/ccel/henry/mhc5.${href}.html` });

/** Step 4: interpretive notes for the seven difficult studies. Scripture remains primary. */
export const PARABLE_DEEP_READINGS: Partial<Record<string, ParableReadingNote[]>> = {
  talents: [
    {
      title: 'What is being entrusted?',
      text: 'In Matthew 25:14–15, the master entrusts his own property to his servants. A talent is a monetary amount; the text separately mentions each servant’s ability. Applying the story to our abilities is reasonable, but it is an application, not the meaning of the word. Notice the identical welcome given to the servants with different totals in verses 21 and 23. The story does not rank their worth by income. Its place among Jesus’ warnings to remain ready makes faithful service during his absence the central concern. O’Donnell likewise reads readiness here as active faithfulness, rather than merely waiting.',
      sources: [matthew, henry('Matthew 25:14–30', 'Matt.xxvi')],
    },
    {
      title: 'Does fear tell the truth about the master?',
      text: 'The third servant calls his master harsh, but that accusation comes from the servant, not an explanatory statement by Jesus. The reply in verses 26–27 exposes a contradiction: even on the servant’s account of the master, burying the money makes little sense. Henry reads the reply as answering the servant on his own terms. We should therefore hesitate to turn the accusation into a definition of God. Yet the ending remains severe: the servant’s refusal has consequences. The question is not whether every venture succeeds or every Christian becomes wealthy. It is whether professed service becomes obedient action, or whether fear is used to excuse withholding what was entrusted.',
      sources: [henry('Matthew 25:24–30', 'Matt.xxvi')],
    },
  ],
  minas: [
    {
      title: 'Why tell this story on the way to Jerusalem?',
      text: 'Luke supplies the reason in 19:11: the listeners expect God’s kingdom to appear immediately. The nobleman’s journey, absence and return interrupt that expectation. Unlike Matthew’s talents, ten servants share ten minas, and the reports describe one mina entrusted to each reporting servant. Henry reads the royal departure and return in relation to Christ and the servants’ responsibility. That is the main reading followed here: it fits the stated setting and the later welcome of Jesus as king in 19:38. It does not require treating every feature of the ruler’s conduct as a direct description of Jesus.',
      sources: [henry('Luke 19:11–27', 'Luke.xx')],
    },
    {
      title: 'How should we face the violent ending?',
      text: 'Bolt proposes a substantially different reading: the ruler embodies oppressive kingship, and the protesting servant exposes it. The ruler’s violence gives that reading force; Luke elsewhere contrasts Gentile domination with Jesus’ service (22:25–27). The difficulty is fitting this contrast reading to the delayed return and reckoning introduced by 19:11. Here those features favor Henry’s stewardship reading, while the cruelty remains a warning against making the characters match Christ at every point. Also distinguish the groups: the unproductive servant loses the mina in verse 24; the hostile citizens face execution in verse 27. However the royal imagery is understood, this is no instruction for disciples to punish unbelievers. Jesus commands love for enemies in Luke 6:27–36.',
      sources: [luke, henry('Luke 19:11–27', 'Luke.xx')],
    },
  ],
  'wedding-feast': [
    {
      title: 'Why does the invitation lead to another judgment?',
      text: 'The gathering of both bad and good from the roads in Matthew 22:10 makes the generosity of the invitation unmistakable. But entering the room does not make the king’s inspection disappear. The garment scene addresses the response of someone already among the guests. It prevents us from reading the replacement of the first invitees as an assurance that the new guests need no changed response. The ending about calling and choosing holds invitation and judgment together; it supplies neither a percentage of humanity who will be saved nor permission to decide which neighbors are beyond God’s invitation.',
      sources: [henry('Matthew 22:1–14', 'Matt.xxiii')],
    },
    {
      title: 'What does the wedding garment signify?',
      text: 'Matthew does not explain the garment’s symbolism or say that the king supplied clothing at the door. An imagined custom should not carry the interpretation. Henry connects the garment with Christ’s righteousness and the renewed life of a Christian; O’Donnell emphasizes faith expressed in righteous deeds. These emphases can belong together, though neither phrase is an explicit identification supplied by the story. The reading offered here is a fitting response to the king’s gracious invitation, expressed in a transformed life. The guest’s silence makes his failure inexcusable within the story. It does not establish a dress code for church, or suggest that poverty makes someone unfit for God’s welcome.',
      sources: [henry('Matthew 22:11–14', 'Matt.xxiii'), matthew],
    },
  ],
  'shrewd-manager': [
    {
      title: 'What exactly earns the praise?',
      text: 'The manager sees that his position is ending and acts to secure a welcome elsewhere. Luke 16:8 singles out his shrewdness, not his character as a whole. The debt reductions are clear: a hundred measures of oil become fifty, and a hundred of wheat become eighty. Their financial basis is not explained. Henry treats the reductions as further wrongdoing; Darrell Bock tentatively favors the surrender of the manager’s own commission, partly because praise seems more understandable on that reading. Interest cancellation is another proposed explanation. Each reconstructs something the text leaves unstated. The secure point is the manager’s decisive preparation for the future, not a proven ancient bookkeeping arrangement.',
      sources: [henry('Luke 16:1–13', 'Luke.xvii'), { label: 'Darrell L. Bock · The shrewd steward', href: 'https://www.biblegateway.com/resources/ivp-nt/Parable-Shrewd-Steward' }],
    },
    {
      title: 'Can money buy an eternal welcome?',
      text: 'Read verse 9 with the instructions that follow it. Jesus demands trustworthiness with possessions and ends by denying that we can serve both God and money. A scheme for buying God’s favor would miss that demand. The connection is between present stewardship and a future beyond the life of our wealth: use temporary resources for people rather than treating accumulation as your master. Compare Luke 12:32–34, where the Father’s gift of the kingdom comes before the command to give to the needy. Generosity answers that gift. The story’s unsettling example presses disciples to take their future seriously without making fraud, manipulation or self-interest the rule for Christian conduct.',
      sources: [henry('Luke 16:9–13', 'Luke.xvii')],
    },
  ],
  'midnight-friend': [
    {
      title: 'Persistence, boldness, or both?',
      text: 'The KJV’s “importunity” in Luke 11:8 raises an interpretive question. Henry stresses persevering prayer; Bolt emphasizes shameless boldness in asking a friend. The scene narrates a request and an objection, not a series of repeated visits. Persistence is therefore a reading of the encounter and its teaching, rather than an action we should add to the plot. Both readings recognize a person who brings a pressing need despite the awkward hour. The following commands to ask, seek and knock encourage confident prayer. They do not specify how many repetitions force an answer. Keep the distinction between the narrated scene and the habit of prayer Jesus teaches through it.',
      sources: [henry('Luke 11:5–13', 'Luke.xii'), luke],
    },
    {
      title: 'Is God the reluctant neighbor?',
      text: 'Jesus moves from the midnight request to parents who know how to give good gifts, then to the Father who gives the Holy Spirit (11:11–13). The argument grows from imperfect human responses to the Father’s goodness. It does not ask us to imagine God asleep, irritated or unwilling until sufficiently pressured. Nor is the promise a technique for obtaining every requested outcome on our preferred schedule. The named gift in Luke is the Holy Spirit. Notice also why the bread is needed: someone has arrived whom the requester cannot feed. One fitting application is to bring another person’s need to God, confident in his goodness even when our own resources are inadequate.',
      sources: [henry('Luke 11:9–13', 'Luke.xii')],
    },
  ],
  lazarus: [
    {
      title: 'Is poverty itself what saves Lazarus?',
      text: 'The contrast begins at a gate: one man enjoys daily abundance while another longs for what falls from his table. Luke has just identified the Pharisees as lovers of money (16:14), so the reversal confronts an audience tempted to treat wealth as a sign of standing before God. Yet the story never states that poverty earns salvation, or that every rich person is condemned simply for possessing money. Bock points to Luke’s wider treatment of wealth, including Zacchaeus, as a check on that conclusion. The question sharpened here is what the rich man’s life reveals: need lay immediately beside him, while his brothers still have Moses and the prophets to hear and obey.',
      sources: [{ label: 'Darrell L. Bock · The rich man and Lazarus', href: 'https://www.biblegateway.com/resources/ivp-nt/Parable-Rich-Man-Lazarus' }],
    },
    {
      title: 'What can we conclude about the life to come?',
      text: 'The reversal after death and the uncrossable gulf give the warning its seriousness. Henry treats the scene as instruction about the coming life; Bock reads its imagery in relation to the intermediate state. Calling it a story does not make its warning unreal, but neither does every spatial detail supply a complete geography of the afterlife. The brothers are still alive, and the final exchange turns their attention back to Scripture. Even a messenger risen from the dead would not compel hearts that refuse Moses and the prophets. The name Lazarus does not establish that this is a report about the man raised in John 11. The urgent response is to hear God’s word and heed the neighbor at the gate now.',
      sources: [henry('Luke 16:19–31', 'Luke.xvii'), { label: 'Darrell L. Bock · The rich man and Lazarus', href: 'https://www.biblegateway.com/resources/ivp-nt/Parable-Rich-Man-Lazarus' }],
    },
  ],
  'sheep-goats': [
    {
      title: 'Who are “the least of these my brethren”?',
      text: 'Matthew’s wording deserves attention. Jesus identifies his disciples as his brothers in 12:49–50; in 10:40–42, receiving his messengers means receiving him, even in giving a disciple a cup of water. Those connections favor reading the brethren here as Jesus’ vulnerable followers, including his messengers. O’Donnell follows that reading. A broader Christian application sees Christ encountered in anyone in need; Benedict XVI exemplifies it in Deus caritas est, section 15. The narrower identification has stronger support from Matthew’s repeated language, but it must not become an excuse to neglect other people. Jesus’ Good Samaritan story in Luke 10 challenges attempts to restrict whom we will love.',
      sources: [matthew, { label: 'Benedict XVI · Deus caritas est §15', href: 'https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20051225_deus-caritas-est.html' }],
    },
    {
      title: 'Do these acts earn the kingdom?',
      text: 'The King invites the righteous to inherit a kingdom prepared for them (25:34), yet he also names the concrete care they gave. We should not erase either the gift or the judgment according to their response. Henry understands these deeds as evidence of love to Christ, rather than a price paid for salvation. That reading also fits Ephesians 2:8–10, where salvation is God’s gift and the saved are created for good works. This is a theological reading across passages, not a replacement for Matthew’s own emphasis. Hunger, estrangement, nakedness, sickness and imprisonment are real claims upon a disciple’s care. Both groups’ surprise warns that their treatment of people mattered to the King more deeply than they understood.',
      sources: [henry('Matthew 25:31–46', 'Matt.xxvi')],
    },
  ],
};
