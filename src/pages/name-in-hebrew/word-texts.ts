// What the page says about each Bible word people type as a name (bible-words.json, keyed by its first key). Kept in
// page code so the translation collector reads it; the words and verses themselves are built from Strong's
// (scripts/name-in-hebrew/build_name_forms.py).
export const WORD_TEXT: Record<string, string> = {
  god: "The Bible's usual word for God: Elohim in Hebrew, Theos in Greek.",
  lord: "God's own name, YHWH, which the Berean Standard Bible writes as “the LORD”. The Greek New Testament says Kyrios, “Lord”.",
  christ: "The Anointed One: Messiah in Hebrew, Christ in Greek. Jesus is the Christ.",
  christian: "A follower of Christ. The disciples were first called Christians at Antioch.",
  grace: "Grace: God's undeserved favor.",
  faith: "Faith: trust in God, and faithfulness.",
  hope: "Hope: sure expectation of what God has promised.",
  joy: "Joy: gladness, the joy of the LORD.",
  peace: "Peace: shalom in Hebrew, wholeness and well-being.",
  love: "Love: “God is love.”",
  amen: "Amen: “truly”, “so be it”.",
  hosanna: "Hosanna: “save, we pray”, a cry of praise from Psalm 118:25.",
  selah: "Selah: a word in the Psalms, probably a pause or a musical sign; its exact meaning is uncertain.",
};
