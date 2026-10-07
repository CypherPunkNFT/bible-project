/** Shared by the home previews and its content documentation. */
export const HOME_PATHS = [
  { title: "Bible", to: "/bible", subtitle: "Read & compare", color: "epistles" },
  { title: "Study", to: "/study", subtitle: "See the connections", color: "gospels" },
  { title: "Apologetics", to: "/apologetics", subtitle: "Explore the questions", color: "history" },
  { title: "Topics", to: "/topics", subtitle: "Follow a subject", color: "prophets" },
  { title: "Atlas", to: "/study/atlas", subtitle: "Enter the world", color: "poetry" },
] as const;
export const HOME_PREVIEWS = [
  { title: "Four accounts. One life.", label: "Jesus & the Gospels", to: "/study/gospels", art: "gospels", color: "gospels" },
  { title: "A place behind every story.", label: "Ancient Cities", to: "/study/atlas/cities", art: "cities", color: "history" },
  { title: "Grace, received by faith.", label: "Salvation", to: "/topics/c/salvation", art: "salvation", color: "revelation" },
  { title: "Let Scripture speak.", label: "The word of God", to: "/topics/c/scripture", art: "scripture", color: "prophets" },
  { title: "Called to follow.", label: "Journeys", to: "/study/atlas/journeys", art: "journeys", color: "epistles" },
  { title: "The world he made.", label: "Creation", to: "/topics/c/creation", art: "creation", color: "poetry" },
] as const;
export const HOME_STUDIES = [
  { title: "Jesus & the Gospels", text: "Compare four accounts of one life. Read the teaching in its setting.", to: "/study/gospels", art: "gospels", color: "gospels", note: "Gospel harmony · Teaching · Words of Jesus" },
  { title: "Connections in Scripture", text: "Follow a reference. See how one passage opens another.", to: "/study/references", art: "connections", color: "poetry", note: "Cross-references · Book-to-book connections" },
  { title: "The shape of the Bible", text: "Explore its books, chapters and literary forms at a glance.", to: "/study/structure", art: "structure", color: "history", note: "Books · Chapters · Literary forms" },
  { title: "His names", text: "Father, Son and Holy Spirit. Explore the names and their passages.", to: "/study/names", art: "god", color: "epistles", note: "Names · Character · Scripture" },
] as const;
export const HOME_TOPICS = [
  { title: "Who God is", text: "His nature, his character, his names.", to: "/topics/c/god", art: "god", color: "epistles" },
  { title: "Jesus Christ", text: "His person, his life, his saving work.", to: "/topics/c/christ", art: "christ", color: "gospels" },
  { title: "The Christian life", text: "Faith lived in the ordinary and the difficult.", to: "/topics/c/christian-life", art: "church", color: "poetry" },
] as const;
