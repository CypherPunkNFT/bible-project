// Confirmation or profession of faith (design 5): the one faith occasion the life-event packs do not have. Written in
// the site's Southern Baptist voice (DOCTRINAL-FOUNDATION.md, Article 7), saying plainly how Baptists differ.
import { sp } from "../sympathy/types";
import type { Occasion } from "./types";

export const CONFIRMATION: Occasion = {
  slug: "confirmation",
  group: "faith",
  title: "Confirmation or profession of faith",
  heading: "Bible Verses for a Confirmation or Profession of Faith",
  intro:
    "These Bible verses are for a young person confessing faith in Jesus Christ before the church, and for the family and friends celebrating with them. There are passages to read at the service, short verses for a card, and a blessing to pray over them. Each is in the Berean Standard Bible with a line on why it fits.",
  explainer: {
    title: "Confirmation, and how Baptists differ",
    paragraphs: [
      "Lutheran, Anglican, Methodist, Catholic and some Reformed churches confirm young people who were baptized as infants: at confirmation they take up for themselves the faith in which they were baptized.",
      "Baptist churches do not confirm. A person who has trusted in Christ confesses him in baptism by immersion and joins the church as a member. Someone confirmed after infant baptism would be asked to be baptized as a believer before joining a Baptist church.",
      "These verses suit a young person's own confession of faith, whichever service their church holds.",
    ],
  },
  sections: [
    {
      id: "readings", title: "Readings for the service",
      passages: [
        sp("ROM 10:9-10", "reading", "Confess with your mouth that Jesus is Lord and believe in your heart: what the day is about."),
        sp("2TI 3:14-17", "reading", "Continue in what you have learned from childhood: the Scriptures that make one wise for salvation."),
        sp("JOS 24:14-15", "reading", "Choose this day whom you will serve: Joshua's call to a whole people, and his own answer."),
        sp("MAT 16:13-17", "reading", "\"Who do you say I am?\" Peter's confession that Jesus is the Christ."),
        sp("EPH 2:8-10", "reading", "Saved by grace through faith, not by works, and made for the good works God prepared."),
        sp("ROM 12:1-2", "reading", "A life offered to God and a mind renewed: the shape of the years ahead."),
      ],
    },
    {
      id: "card", title: "Short verses for a card or program",
      passages: [
        sp("1TI 4:12", "card", "Let no one despise your youth: an example to others in faith and love."),
        sp("PHP 1:6", "card", "He who began a good work in you will carry it on to completion."),
        sp("ROM 1:16", "card", "Not ashamed of the gospel, the power of God for salvation."),
        sp("MAT 10:32", "card", "Jesus' promise to everyone who confesses him before others."),
        sp("1CO 16:13", "card", "Stand firm in the faith: four short commands for a young believer."),
        sp("JOS 24:15b", "card", "As for me and my house: a family's answer.", { part: "As for me and my house, we will serve the LORD!”" }),
      ],
    },
    {
      id: "blessing", title: "A blessing to close",
      passages: [
        sp("2TH 2:16-17", "blessing", "May the Lord himself encourage your heart and strengthen you in every good word and deed."),
      ],
    },
  ],
  more: [{ href: "/life-events/baptism", title: "Verses for a baptism, with a card to print" }],
  certificate: "profession",
};
