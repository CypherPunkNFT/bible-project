import type { TestimonyNode } from "../lib/testimonies";

const SAMPLE_DETAILS: Record<string, { publishedAt: string; happenedWhen: string }> = {
  daniel: { publishedAt: "2026-09-20T16:00:00Z", happenedWhen: "Spring 2022" },
  maya: { publishedAt: "2026-09-22T16:00:00Z", happenedWhen: "2024–2025" },
  elias: { publishedAt: "2026-09-23T16:00:00Z", happenedWhen: "Winter 2023" },
  anna: { publishedAt: "2026-09-24T16:00:00Z", happenedWhen: "Over the past few years" },
  joseph: { publishedAt: "2026-09-25T16:00:00Z", happenedWhen: "Summer 2025" },
  ruth: { publishedAt: "2026-09-26T16:00:00Z", happenedWhen: "2023" },
  samuel: { publishedAt: "2026-09-28T16:00:00Z", happenedWhen: "2025" },
  leah: { publishedAt: "2026-09-30T16:00:00Z", happenedWhen: "Spring 2026" },
  noah: { publishedAt: "2026-10-02T16:00:00Z", happenedWhen: "An ongoing journey" },
};

/** Fictional UI examples. Never imported into a production database or presented as real testimony. */
export const TESTIMONY_DEMO: TestimonyNode[] = [
  { id: "daniel", parentId: null, name: "Daniel", title: "Someone made room for my questions.", theme: "An invitation", body: "In this fictional example, Daniel describes a friend who listened patiently when he had difficult questions about faith. Reading the Gospels together gave him a way to begin again. His invitation to others is simple: there is room to tell your story, even when it is still unfolding." },
  { id: "maya", parentId: "daniel", name: "Maya", title: "I learned that I could begin again.", theme: "New beginnings", body: "In this fictional example, Maya shares how a season of disappointment led her back to prayer. A small group welcomed her without asking her to have everything resolved. She wants her story to make space for another person's first step." },
  { id: "elias", parentId: "daniel", name: "Elias", title: "Faith became something we lived together.", theme: "Community", body: "In this fictional example, Elias remembers the people who showed up when his family needed help. Their steady care made the words he heard on Sundays tangible. He is learning to offer the same patient presence to his neighbours." },
  { id: "anna", parentId: "daniel", name: "Anna", title: "The Psalms gave me words.", theme: "Prayer", body: "In this fictional example, Anna describes reading the Psalms during a difficult season. Their prayers helped her speak honestly rather than pretend to be fine. Sharing that experience became an invitation for a friend to speak honestly too." },
  { id: "joseph", parentId: "maya", name: "Joseph", title: "A conversation I kept coming back to.", theme: "Questions", body: "In this fictional example, Joseph tells of a conversation that stayed with him. He began reading Luke with a friend, asking questions along the way. His story is about the slow discovery of trust and the gift of someone willing to listen." },
  { id: "ruth", parentId: "maya", name: "Ruth", title: "Grace changed how I saw my story.", theme: "Grace", body: "In this fictional example, Ruth describes learning to receive forgiveness and extend it to others. Her testimony is a beginning rather than a polished ending. She shares it in the hope that someone else will feel less alone." },
  { id: "samuel", parentId: "elias", name: "Samuel", title: "Small acts of love taught me to hope.", theme: "Hope", body: "In this fictional example, Samuel reflects on meals delivered, visits made, and prayers offered through a hard year. The care of his community helped him see faith in everyday life. He now looks for small ways to pass that care on." },
  { id: "leah", parentId: "anna", name: "Leah", title: "I found a place to belong.", theme: "Belonging", body: "In this fictional example, Leah recalls the first time she felt free to ask for prayer. A friendship grew from that moment, and with it a deeper interest in Scripture. She tells her story to welcome the person who is standing at the edge of a community." },
  { id: "noah", parentId: "joseph", name: "Noah", title: "Learning to listen, one day at a time.", theme: "Trust", body: "In this fictional example, Noah speaks about making space for Scripture in a busy life. The change came through ordinary habits and honest conversations. His next step is to invite someone else into the conversation." },
].map((node) => ({ ...node, ...SAMPLE_DETAILS[node.id] }));
