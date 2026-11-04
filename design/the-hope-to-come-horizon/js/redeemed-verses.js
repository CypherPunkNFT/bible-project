// The verses section 03 adds to the study, copied from the site's Berean text (data/text/bsb) by script on 2026-11-03.
// They open in the same verse sheet as the rest. js/lost.js checks every quoted phrase against them as the page loads.
Object.assign(HP.passages, {
 "TIT.2.14": {
  "label": "Titus 2:14",
  "code": "TIT",
  "chapters": [
   2
  ],
  "verses": [
   {
    "c": 2,
    "v": 14,
    "t": "He gave Himself for us to redeem us from all lawlessness and to purify for Himself a people for His own possession, zealous for good deeds."
   }
  ]
 },
 "REV.5.9": {
  "label": "Revelation 5:9",
  "code": "REV",
  "chapters": [
   5
  ],
  "verses": [
   {
    "c": 5,
    "v": 9,
    "t": "And they sang a new song: “Worthy are You to take the scroll and open its seals, because You were slain, and by Your blood You purchased for God those from every tribe and tongue and people and nation."
   }
  ]
 },
 "GAL.3.13": {
  "label": "Galatians 3:13",
  "code": "GAL",
  "chapters": [
   3
  ],
  "verses": [
   {
    "c": 3,
    "v": 13,
    "t": "Christ redeemed us from the curse of the law by becoming a curse for us. For it is written: “Cursed is everyone who is hung on a tree.”"
   }
  ]
 },
 "ACT.3.21": {
  "label": "Acts 3:21",
  "code": "ACT",
  "chapters": [
   3
  ],
  "verses": [
   {
    "c": 3,
    "v": 21,
    "t": "Heaven must take Him in until the time comes for the restoration of all things, which God announced long ago through His holy prophets."
   }
  ]
 },
 "1PE.1.18-19": {
  "label": "1 Peter 1:18–19",
  "code": "1PE",
  "chapters": [
   1
  ],
  "verses": [
   {
    "c": 1,
    "v": 18,
    "t": "For you know that it was not with perishable things such as silver or gold that you were redeemed from the empty way of life you inherited from your forefathers,"
   },
   {
    "c": 1,
    "v": 19,
    "t": "but with the precious blood of Christ, a lamb without blemish or spot."
   }
  ]
 },
 "EPH.1.7": {
  "label": "Ephesians 1:7",
  "code": "EPH",
  "chapters": [
   1
  ],
  "verses": [
   {
    "c": 1,
    "v": 7,
    "t": "In Him we have redemption through His blood, the forgiveness of our trespasses, according to the riches of His grace"
   }
  ]
 }
});

// The two rows of section 03 that the study leaves with no prophet between were given one at the owner's request
// (2026-11-03), so every card has words on its gold belt. Copied from the same Berean text by script; the cards check each
// phrase against its verse as the page loads.
Object.assign(HP.passages, {
 "ISA.27.1": {
  "label": "Isaiah 27:1",
  "code": "ISA",
  "chapters": [
   27
  ],
  "verses": [
   {
    "c": 27,
    "v": 1,
    "t": "In that day the LORD will take His sharp, great, and mighty sword, and bring judgment on Leviathan the fleeing serpent —Leviathan the coiling serpent—and He will slay the dragon of the sea."
   }
  ]
 },
 "ISA.55.13": {
  "label": "Isaiah 55:13",
  "code": "ISA",
  "chapters": [
   55
  ],
  "verses": [
   {
    "c": 55,
    "v": 13,
    "t": "Instead of the thornbush, a cypress will grow, and instead of the brier, a myrtle will spring up; they will make a name for the LORD, an everlasting sign, never to be destroyed.”"
   }
  ]
 }
});
HP.lostMiddle = {
 "The deceiver": [
  {
   "r": "ISA.27.1",
   "label": "Isaiah 27:1",
   "t": "Leviathan the fleeing serpent"
  }
 ],
 "The curse": [
  {
   "r": "ISA.55.13",
   "label": "Isaiah 55:13",
   "t": "Instead of the thornbush, a cypress will grow"
  }
 ]
};

// Three rows of section 03 whose two ends did not read as loss and answer were given other words at the owner's request
// (2026-11-03): the deceiver is thrown out, the corrupt earth is made new, the barred way becomes the right to the tree.
// Copied from the same Berean text by script; both ends of each share the word given, and the cards check every phrase.
Object.assign(HP.passages, {
 "GEN.6.11": {
  "label": "Genesis 6:11",
  "code": "GEN",
  "chapters": [
   6
  ],
  "verses": [
   {
    "c": 6,
    "v": 11,
    "t": "Now the earth was corrupt in the sight of God, and full of violence."
   }
  ]
 },
 "REV.22.14": {
  "label": "Revelation 22:14",
  "code": "REV",
  "chapters": [
   22
  ],
  "verses": [
   {
    "c": 22,
    "v": 14,
    "t": "Blessed are those who wash their robes, so that they may have the right to the tree of life and may enter the city by its gates."
   }
  ]
 }
});
HP.lostEnds = {
 "The deceiver": {
  "last": "REV.20.10",
  "lastText": "the devil who had deceived them was thrown into the lake of fire",
  "kind": "shares",
  "word": "deceived"
 },
 "The sky": {
  "start": "GEN.6.11",
  "startText": "the earth was corrupt in the sight of God",
  "kind": "shares",
  "word": "earth"
 },
 "The tree": {
  "last": "REV.22.14",
  "lastText": "the right to the tree of life",
  "kind": "shares",
  "word": "tree of life"
 }
};

// Four cards for section 03 that are not in the study, added at the owner's request (2026-11-04) from LOST_CARDS_LIST.md:
// life out of death and glory out of shame. This page's matching, not the study's. Copied from the same Berean text by
// script; lost-cards.html shows them after the study's rows and checks every phrase as it loads.
Object.assign(HP.passages, {
 "EZK.37.11": {
  "label": "Ezekiel 37:11",
  "code": "EZK",
  "chapters": [
   37
  ],
  "verses": [
   {
    "c": 37,
    "v": 11,
    "t": "Then He said to me, “Son of man, these bones are the whole house of Israel. Look, they are saying, ‘Our bones are dried up, and our hope has perished; we are cut off.’"
   }
  ]
 },
 "EZK.37.5": {
  "label": "Ezekiel 37:5",
  "code": "EZK",
  "chapters": [
   37
  ],
  "verses": [
   {
    "c": 37,
    "v": 5,
    "t": "This is what the Lord GOD says to these bones: I will cause breath to enter you, and you will come to life."
   }
  ]
 },
 "1CO.15.52": {
  "label": "1 Corinthians 15:52",
  "code": "1CO",
  "chapters": [
   15
  ],
  "verses": [
   {
    "c": 15,
    "v": 52,
    "t": "in an instant, in the twinkling of an eye, at the last trumpet. For the trumpet will sound, the dead will be raised imperishable, and we will be changed."
   }
  ]
 },
 "GEN.3.19": {
  "label": "Genesis 3:19",
  "code": "GEN",
  "chapters": [
   3
  ],
  "verses": [
   {
    "c": 3,
    "v": 19,
    "t": "By the sweat of your brow you will eat your bread, until you return to the ground— because out of it were you taken. For dust you are, and to dust you shall return.”"
   }
  ]
 },
 "ISA.26.19": {
  "label": "Isaiah 26:19",
  "code": "ISA",
  "chapters": [
   26
  ],
  "verses": [
   {
    "c": 26,
    "v": 19,
    "t": "Your dead will live; their bodies will rise. Awake and sing, you who dwell in the dust! For your dew is like the dew of the morning, and the earth will bring forth her dead."
   }
  ]
 },
 "PHP.3.21": {
  "label": "Philippians 3:21",
  "code": "PHP",
  "chapters": [
   3
  ],
  "verses": [
   {
    "c": 3,
    "v": 21,
    "t": "who, by the power that enables Him to subject all things to Himself, will transform our lowly bodies to be like His glorious body."
   }
  ]
 },
 "GEN.3.10": {
  "label": "Genesis 3:10",
  "code": "GEN",
  "chapters": [
   3
  ],
  "verses": [
   {
    "c": 3,
    "v": 10,
    "t": "“I heard Your voice in the garden,” he replied, “and I was afraid because I was naked; so I hid myself.”"
   }
  ]
 },
 "ISA.1.18": {
  "label": "Isaiah 1:18",
  "code": "ISA",
  "chapters": [
   1
  ],
  "verses": [
   {
    "c": 1,
    "v": 18,
    "t": "“Come now, let us reason together,” says the LORD. “Though your sins are like scarlet, they will be as white as snow; though they are as red as crimson, they will become like wool."
   }
  ]
 },
 "REV.7.14": {
  "label": "Revelation 7:14",
  "code": "REV",
  "chapters": [
   7
  ],
  "verses": [
   {
    "c": 7,
    "v": 14,
    "t": "“Sir,” I answered, “you know.” So he replied, “These are the ones who have come out of the great tribulation; they have washed their robes and made them white in the blood of the Lamb."
   }
  ]
 },
 "GEN.37.34": {
  "label": "Genesis 37:34",
  "code": "GEN",
  "chapters": [
   37
  ],
  "verses": [
   {
    "c": 37,
    "v": 34,
    "t": "Then Jacob tore his clothes, put sackcloth around his waist, and mourned for his son many days."
   }
  ]
 },
 "ISA.61.3": {
  "label": "Isaiah 61:3",
  "code": "ISA",
  "chapters": [
   61
  ],
  "verses": [
   {
    "c": 61,
    "v": 3,
    "t": "to console the mourners in Zion— to give them a crown of beauty for ashes, the oil of joy for mourning, and a garment of praise for a spirit of despair. So they will be called oaks of righteousness, the planting of the LORD, that He may be glorified."
   }
  ]
 },
 "REV.2.10": {
  "label": "Revelation 2:10",
  "code": "REV",
  "chapters": [
   2
  ],
  "verses": [
   {
    "c": 2,
    "v": 10,
    "t": "Do not fear what you are about to suffer. Look, the devil is about to throw some of you into prison to test you, and you will suffer tribulation for ten days. Be faithful even unto death, and I will give you the crown of life."
   }
  ]
 }
});
HP.lostAdded = [
 {
  "id": "lc-1",
  "name": "Dry bones",
  "kind": "page",
  "start": "EZK.37.11",
  "startLabel": "Ezekiel 37:11",
  "startText": "Our bones are dried up, and our hope has perished",
  "middle": [
   {
    "r": "EZK.37.5",
    "label": "Ezekiel 37:5",
    "t": "I will cause breath to enter you, and you will come to life"
   }
  ],
  "last": "1CO.15.52",
  "lastLabel": "1 Corinthians 15:52",
  "lastText": "the dead will be raised imperishable"
 },
 {
  "id": "lc-2",
  "name": "Dust to glory",
  "kind": "page",
  "start": "GEN.3.19",
  "startLabel": "Genesis 3:19",
  "startText": "For dust you are, and to dust you shall return",
  "middle": [
   {
    "r": "ISA.26.19",
    "label": "Isaiah 26:19",
    "t": "Your dead will live; their bodies will rise"
   }
  ],
  "last": "PHP.3.21",
  "lastLabel": "Philippians 3:21",
  "lastText": "transform our lowly bodies to be like His glorious body"
 },
 {
  "id": "lc-3",
  "name": "Scarlet to white",
  "kind": "page",
  "start": "GEN.3.10",
  "startLabel": "Genesis 3:10",
  "startText": "I was afraid because I was naked; so I hid myself",
  "middle": [
   {
    "r": "ISA.1.18",
    "label": "Isaiah 1:18",
    "t": "Though your sins are like scarlet, they will be as white as snow"
   }
  ],
  "last": "REV.7.14",
  "lastLabel": "Revelation 7:14",
  "lastText": "they have washed their robes and made them white in the blood of the Lamb"
 },
 {
  "id": "lc-4",
  "name": "Ashes to a crown",
  "kind": "page",
  "start": "GEN.37.34",
  "startLabel": "Genesis 37:34",
  "startText": "put sackcloth around his waist, and mourned for his son many days",
  "middle": [
   {
    "r": "ISA.61.3",
    "label": "Isaiah 61:3",
    "t": "a crown of beauty for ashes"
   }
  ],
  "last": "REV.2.10",
  "lastLabel": "Revelation 2:10",
  "lastText": "I will give you the crown of life"
 }
];
