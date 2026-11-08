// The hub's own set, "verses for any loss", and the guide to what to write in a sympathy card (design 4.2, 5.3).
// Every word here was written for this page, by hand, and checked against the tone rules of design 4.4.
import { sp, type SympathySet } from "./types";

export const JOHN_11_35_CONTEXT =
  "Jesus wept at the tomb of his friend Lazarus, though he knew he was about to raise him. Grief is not a failure of faith.";

export const HUB_SET: SympathySet = {
  slug: "",
  heading: "Bible Verses for Sympathy Cards",
  short: "Any loss",
  intro:
    "These Bible verses for sympathy cards are for anyone who wants to comfort a friend after a death, and does not know what to say. They speak of God who is near to the brokenhearted, who comforts those who mourn, and who does not hurry anyone through their grief. Below are short verses to send or write in a card, two longer passages to read slowly, a guide to what to write and what to leave out, and pages for particular losses. Every verse is in the Berean Standard Bible, with a line on why it fits.",
  passages: [
    sp("PSA 34:18", "card", "God's nearness to the brokenhearted: a verse that fits any loss and asks nothing of the one who reads it."),
    sp("MAT 5:4", "card", "Jesus calls those who mourn blessed, and promises them comfort."),
    sp("PSA 147:3", "card", "The God who binds up wounds, written for hearts that feel broken."),
    sp("2CO 1:3-4", "card", "The God of all comfort, who comforts us so that we can comfort one another."),
    sp("JHN 14:27", "card", "Jesus leaves his own peace with his friends, for hearts that are troubled and afraid."),
    sp("PSA 46:1", "card", "God as refuge and strength, ever present when trouble comes."),
    sp("DEU 33:27a", "card", "The everlasting arms underneath: for someone who feels they are falling.",
      { part: "The eternal God is your dwelling place, and underneath are the everlasting arms." }),
    sp("LAM 3:22-23", "card", "Mercies new every morning, written by someone grieving amid ruins."),
    sp("ROM 15:13", "card", "A prayer that the God of hope will fill the one you love with peace."),
    sp("1PE 5:7", "card", "An invitation to hand every care to God, because he cares."),
    sp("PSA 23:4", "card", "Walking through the valley of the shadow of death, and not alone."),
    sp("JHN 11:35", "card", "The shortest verse in the Bible: Jesus wept.", { context: JOHN_11_35_CONTEXT }),
    sp("PSA 30:5b", "card", "Weeping for the night, joy in the morning: a promise for the days ahead.",
      { part: "Weeping may stay the night, but joy comes in the morning.", later: true }),
    sp("REV 21:4", "card", "The day when God will wipe away every tear and death will be no more.", { later: true }),
    sp("PSA 23:1-6", "reading", "The shepherd psalm, read at more funerals than any other passage, from green pastures to the house of the LORD."),
    sp("JHN 11:32-36", "reading", "Mary's grief at her brother's tomb, and Jesus deeply moved, weeping with her."),
  ],
  card: { heading: "With deepest sympathy", inside: "Thinking of you, and holding you in my prayers." },
  topics: [{ slug: "bereavement", title: "Bereavement" }, { slug: "mourning", title: "Mourning" }, { slug: "sympathy", title: "Sympathy" }],
  related: [],
};

/** Short lines a visitor can use or adapt (design 5.3). "[their name]" is shown as it is; the site never fills it in. */
export const LINES_TO_USE: string[] = [
  "I'm so sorry. I'm holding you in my prayers.",
  "There are no words, but I love you and I'm here.",
  "I'll always remember [their name]'s laugh.",
  "I will miss [their name], who was always so kind to me.",
  "I'm bringing dinner on Thursday; no need to reply.",
  "I'd love to take the children for an afternoon next week, whenever suits you.",
  "Praying the Lord holds you close in the days ahead.",
  "You don't need to write back. I just wanted you to know I'm thinking of you.",
  "Thinking of you as [their name]'s birthday comes round.",
  "It has been a few months, and I still think of [their name] often. I'm here if you want to talk about them.",
];

/** Things often said kindly that can land hard, each with one gentle sentence of why (design 2.2, 5.3). */
export const LEAVE_OUT: { saying: string; why: string }[] = [
  { saying: "Everything happens for a reason.", why: "Even when it is meant as faith, it asks a grieving person to find a reason for their loss before they have had time to lament it." },
  { saying: "They're in a better place.", why: "Unless you know the family holds that hope, leave it out; even then, let them say it first, because it can sound like a reason to stop grieving." },
  { saying: "God needed another angel.", why: "People do not become angels when they die: Hebrews 12:22–23 keeps the spirits of the righteous distinct from the angels, and the saying makes God the one who took them away." },
  { saying: "At least…", why: "Anything that begins this way, however true, makes the loss smaller than it is." },
  { saying: "I know how you feel.", why: "Every grief is its own. Saying how sorry you are leaves room for theirs." },
  { saying: "God won't give you more than you can handle.", why: "It is not in the Bible. 1 Corinthians 10:13 is about temptation, and Paul wrote of being burdened far beyond his ability to endure (2 Corinthians 1:8)." },
  { saying: "Romans 8:28, in the first days.", why: "It is true and precious, but quoted in fresh grief it hurries a person past lament. Jesus wept at his friend's tomb (John 11:35); there is time for Romans 8 later." },
];

export const KEEP_SHOWING_UP =
  "Most cards arrive in the first week. A card a month later, at the first birthday, on the anniversary, or at the first Christmas without them is often the one a family remembers. Write the date in your calendar now.";
