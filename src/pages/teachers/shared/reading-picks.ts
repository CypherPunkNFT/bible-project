import { MORE_PREACHER_READS, MORE_SCHOLAR_READS } from './reading-more';

export interface ReadingPick {
  profileId: string;
  author: string;
  title: string;
  label: string;
  reason: string;
  href: string;
  localRecord?: string;
}

// Explicit editions: profile "known work" links can be absent or point to another language.
export const READING_PICKS: Record<"preachers" | "scholars", ReadingPick[]> = {
  preachers: [
    { profileId: "author-john-calvin", author: "John Calvin", title: "Institutes of the Christian Religion", label: "1536 · Theology", reason: "A foundational account of Christian belief. Begin with Book I, on knowing God.", href: "https://www.ccel.org/ccel/calvin/institutes.toc.html", localRecord: "held-aedfd786fc341044222c2cf50b0506fa" },
    { profileId: "author-john-owen", author: "John Owen", title: "The Mortification of Sin", label: "1656 · Christian life", reason: "A searching, practical treatment of Romans 8:13 and the daily struggle with sin.", href: "/teachers/works/held-4603d4fd73838e698e523487eebb0484" },
    { profileId: "author-john-bunyan", author: "John Bunyan", title: "The Pilgrim’s Progress", label: "1678 · Allegory", reason: "Follow Christian’s journey through doubt, danger and hope in an unforgettable story.", href: "/teachers/works/held-14c3c96cab3e5a57cb088d7b58c98ff2" },
    { profileId: "author-jonathan-edwards", author: "Jonathan Edwards", title: "Religious Affections", label: "1746 · Spiritual discernment", reason: "What distinguishes lasting faith from passing feeling? Edwards examines the signs.", href: "/teachers/works/held-238dbbe338902d11dd1f514be5fe570d" },
    { profileId: "author-charles-spurgeon", author: "Charles Haddon Spurgeon", title: "Lectures to My Students", label: "1875 · Preaching", reason: "Candid counsel on prayer, character and preaching, from Spurgeon to future ministers.", href: "https://www.spurgeon.org/books/lectures-to-my-students", localRecord: "held-a45841bf4ec1f85d097fe0088a1f4d09" },
    ...MORE_PREACHER_READS,
  ],
  scholars: [
    { profileId: "josephus", author: "Flavius Josephus", title: "Antiquities of the Jews", label: "94 · Jewish history", reason: "Read a first-century Jewish historian’s account of his people, from creation onward.", href: "https://www.ccel.org/ccel/josephus/works/files/ant-1.htm" },
    { profileId: "eusebius", author: "Eusebius of Caesarea", title: "Church History", label: "325 · Early church", reason: "Trace the early church through a historian who preserves many earlier documents.", href: "https://www.ccel.org/ccel/schaff/npnf201.toc.html" },
    { profileId: "augustine", author: "Augustine of Hippo", title: "Confessions", label: "c. 400 · Christian thought", reason: "An intimate exploration of conversion, memory and desire, written as prayer.", href: "https://ccel.org/ccel/augustine/confess.i_1.html" },
    { profileId: "lightfoot", author: "J. B. Lightfoot · translator", title: "The Apostolic Fathers", label: "Early Christian texts", reason: "Meet the Christian voices just after the apostles through Lightfoot’s translation.", href: "https://www.ccel.org/ccel/lightfoot/fathers.toc.html" },
    { profileId: "edersheim", author: "Alfred Edersheim", title: "The Life and Times of Jesus the Messiah", label: "1883 · Gospel background", reason: "Explore a classic reconstruction of the Jewish setting of Jesus’ life and ministry.", href: "https://www.ccel.org/ccel/edersheim/lifetimes.toc.html" },
    ...MORE_SCHOLAR_READS,
  ],
};
