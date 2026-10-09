import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { DEBATES, PATHS, STUDIES, TOPICS, WORLDVIEWS } from "../src/data/apologetics-library";

for (const theme of ["light", "dark"] as const) {
  test(`apologetics: the ${theme} universe and collections fit the viewport`, async ({ page }, testInfo) => {
    if (testInfo.project.name === "phone") await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: theme });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/apologetics");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A reason for the hope.");
    await expect(page.getByRole("navigation", { name: "Explore connected topics" }).getByRole("link")).toHaveCount(TOPICS.length);
    await expect(page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Apologetics", exact: true })).toHaveAttribute("aria-current", "page");
    await page.evaluate(() => document.fonts.ready);
    await mkdir("front-end capture/2026-10-04", { recursive: true });
    await page.screenshot({ path: `front-end capture/2026-10-04/apologetics-universe-${testInfo.project.name}-${theme}.png` });
    await page.locator(".ap-topic-grid").screenshot({ path: `front-end capture/2026-10-04/apologetics-fields-${testInfo.project.name}-${theme}.png` });
    for (const route of ["", "/questions", "/study/suffering", "/paths/begin", "/worldviews", "/worldviews/islam", "/worldviews/buddhism", "/worldviews/hinduism", "/debates", "/debates/craig-hitchens", "/practice", "/sources", "/saved", "/topics/reformed", "/texts", "/texts?view=authors", "/study/election"]) {
      await page.goto("/apologetics" + route);
      await expect(page.locator(".ap-page h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
      await expect(page.locator(".ap-page")).not.toContainText("coming soon");
    }
    expect(errors).toEqual([]);
  });
}

test("apologetics: search, shareable filters and empty recovery", async ({ page }) => {
  await page.goto("/apologetics");
  await page.getByRole("searchbox", { name: "Find an apologetics question" }).fill("manuscripts");
  await page.getByRole("button", { name: "Search apologetics" }).click();
  await expect(page).toHaveURL(/\/apologetics\/questions\?q=manuscripts$/);
  await page.getByRole("button", { name: "Bible & reliability", exact: true }).click();
  await expect(page.locator(".ap-study-card")).not.toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Search studies" })).toHaveValue("manuscripts");
  await expect(page.getByRole("button", { name: "Bible & reliability", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("searchbox", { name: "Search studies" }).fill("zzqqxx"); // one made-up word: a multi-word query falls back to studies with any of its words
  await expect(page.getByRole("heading", { name: "No studies match that search." })).toBeVisible();
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(page.locator(".ap-study-card")).toHaveCount(STUDIES.length);
  await page.goto("/apologetics/topics/jesus");
  await expect(page.locator(".ap-study-card")).toHaveCount(STUDIES.filter((study) => study.topic === "jesus").length);
});

test("apologetics: Scripture preview is lazy and its reader links retain the passage", async ({ page }) => {
  const texts: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/data/text/")) texts.push(request.url()); });
  await page.goto("/apologetics/study/jesus");
  await expect(page.locator(".ap-passages")).toBeVisible();
  expect(texts).toEqual([]);
  await page.getByRole("button", { name: "Read the first passage here" }).click();
  await expect(page.locator(".ap-passage-preview")).toContainText("the Word was made flesh");
  expect(texts.length).toBeGreaterThan(0);
  await page.locator(".ap-passages").getByRole("link", { name: "John 20:24–31", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/kjv\/JHN\/20\?hl=24-31$/);
});

test("apologetics: bookmarks, reflection and learning progress persist and can be changed", async ({ page }) => {
  await page.goto("/apologetics/study/jesus");
  await page.getByRole("button", { name: "Save study", exact: true }).click();
  await page.locator(".ap-note textarea").fill("Compare John 1 with Thomas's confession in John 20.");
  await page.getByRole("button", { name: "Mark this study as read" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Saved to my study" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".ap-note textarea")).toHaveValue("Compare John 1 with Thomas's confession in John 20.");
  await expect(page.getByRole("button", { name: "Marked as read" })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/apologetics/paths/begin");
  await expect(page.locator(".ap-path-progress")).toContainText("1 of 6 read");
  await page.goto("/apologetics/saved");
  await expect(page.locator(".ap-study-card")).toHaveCount(1);
  await expect(page.locator(".ap-reflections")).toContainText("Thomas's confession");
  await page.getByRole("button", { name: /^Unsave:/ }).click();
  await expect(page.locator(".ap-study-card")).toHaveCount(0);
  await page.goto("/apologetics/study/jesus");
  await page.locator(".ap-note textarea").fill("");
  await page.getByRole("button", { name: "Marked as read" }).click();
  await page.goto("/apologetics/saved");
  await expect(page.locator(".ap-desk-counts")).toContainText("0 reflections");
  await expect(page.locator(".ap-desk-counts")).toContainText("0 read");
});

test("apologetics: worldview comparison and sources lead to actual studies", async ({ page }) => {
  await page.goto("/apologetics/worldviews/islam");
  await expect(page.getByRole("navigation", { name: "Comparison questions" }).getByRole("button")).toHaveCount(WORLDVIEWS.find((item) => item.id === "islam")!.rows.length);
  await expect(page.locator(".wv-study-cards > article")).toHaveCount(WORLDVIEWS.find((item) => item.id === "islam")!.studies.length);
  await page.locator(".wv-source-roadmap button").nth(2).click();
  await expect(page.locator('.ap-source-grid .wv-open-source[href="https://quran.com/en/an-nisa/157"]')).toBeVisible();
  await page.locator(".wv-study-link").click();
  await expect(page).toHaveURL(/\/apologetics\/study\/islam-jesus$/);
  await expect(page.locator(".ap-objection")).toBeVisible();
  await page.goto("/apologetics/sources");
  await page.getByRole("button", { name: "Manuscript", exact: true }).click();
  await expect(page.locator(".ap-source-room > article")).toHaveCount(1);
  await expect(page.locator(".ap-source-room")).toContainText("Codex Sinaiticus");
  await expect(page.locator('.ap-source-backlinks a[href="/apologetics/study/manuscripts"]')).toBeVisible();
});

test("apologetics: each debate has a real transcript, a reading guide and connected studies", async ({ page }) => {
  await page.goto("/apologetics/debates");
  await expect(page.locator(".ap-debate-list > a")).toHaveCount(3);
  for (const debate of DEBATES) {
    await page.goto("/apologetics/debates/" + debate.id);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(debate.title);
    await expect(page.getByRole("link", { name: "Open the full transcript" })).toHaveAttribute("href", /^https:\/\/www.reasonablefaith.org\/media\/debates\//);
    await expect(page.locator(".ap-debate-study ol li")).toHaveCount(3);
    await expect(page.locator(".ap-study-card")).toHaveCount(debate.studies.length);
  }
});

test("apologetics: conversation scenarios explain choices and keep separate reflections", async ({ page }) => {
  await page.goto("/apologetics/practice");
  await page.locator(".ap-practice-options button").nth(0).click();
  await expect(page.locator(".ap-practice-feedback")).toContainText("Consider a different first step.");
  await page.locator(".ap-practice-options button").nth(1).click();
  await expect(page.locator(".ap-practice-feedback")).toContainText("A thoughtful place to begin.");
  await page.locator(".ap-note textarea").fill("Make room to hear the person before answering.");
  await page.getByRole("button", { name: "The Trinity", exact: true }).click();
  await expect(page.locator(".ap-practice-feedback")).toHaveCount(0);
  await expect(page.locator(".ap-note textarea")).toHaveValue("");
  await page.locator(".ap-practice-options button").nth(0).click();
  await expect(page.locator(".ap-practice-feedback")).toContainText("A thoughtful place to begin.");
  await page.getByRole("button", { name: "Grief & suffering", exact: true }).click();
  await expect(page.locator(".ap-note textarea")).toHaveValue("Make room to hear the person before answering.");
  await page.getByRole("group", { name: "Conversation steps" }).getByRole("button", { name: /Invite/ }).click();
  await expect(page.locator(".ap-step-detail")).toContainText("Would you like to keep exploring this with me?");
});

test("apologetics: deep links cover the complete library and preserve legacy entries", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The route audit is viewport-independent.");
  for (const [type, collection] of [["study", STUDIES], ["topics", TOPICS], ["paths", PATHS], ["worldviews", WORLDVIEWS]] as const) {
    for (const item of collection) {
      await page.goto(`/apologetics/${type}/${item.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.title);
      if (type === "study") {
        const study = STUDIES.find((entry) => entry.id === item.id)!;
        await expect(page.locator(".ap-article .ap-citations")).toHaveCount(5 + study.reasoning.length + study.sections.length);
        await expect(page.locator(".ap-study-sources .ap-source-role").filter({ hasText: "Reformed" }).first()).toBeVisible();
      }
    }
  }
  await page.goto("/apologetics#foundations");
  await expect(page).toHaveURL(/\/apologetics\/paths\/begin$/);
  await page.goto("/apologetics/study/missing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This study could not be found.");
  await page.getByRole("link", { name: "Back to Apologetics", exact: true }).click();
  await expect(page).toHaveURL(/\/apologetics$/);
});

test("apologetics: moral goodness is qualified and its sources are inspectable", async ({ page }, testInfo) => {
  if (testInfo.project.name === "phone") await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/apologetics/study/morality");
  await expect(page.locator(".ap-answer")).toContainText("Not if ‘good’ means righteous before God.");
  await expect(page.locator(".ap-answer")).toContainText("still bear God's image");
  await expect(page.locator(".ap-answer")).toContainText("do not earn salvation");
  await expect(page.locator('.ap-answer a[href="https://opc.org/wcf.html"]')).toContainText("16.7");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("morality.png"), fullPage: true });
  await page.locator(".ap-answer").getByRole("link", { name: "Romans 3:10–12", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/kjv\/ROM\/3\?hl=10-12$/);
  await page.goto("/apologetics/worldviews/secular");
  await expect(page.locator(".ap-comparison-row").first()).toContainText("No fallen person is righteous by nature");
  await expect(page.locator(".ap-comparison-row .ap-citations")).toHaveCount(6);
  await page.goto("/apologetics/sources");
  await expect(page.getByRole("region", { name: "Our doctrinal basis" })).toContainText("final authority");
  await expect(page.locator(".ap-source-room")).toContainText("Catholic contribution · limited scope");
  await expect(page.locator(".ap-source-room")).toContainText("Primary record · not a teaching authority");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.locator(".ap-source-policy").screenshot({ path: testInfo.outputPath("source-policy.png") });
});

test("apologetics: study and library downloads match the documents rendered on the site", async ({ page, request }, testInfo) => {
  await page.goto("/apologetics/study/morality");
  const studyLink = page.getByRole("link", { name: "Download this study" });
  await expect(studyLink).toHaveAttribute("href", "/content/apologetics/study-morality.md");
  const downloading = page.waitForEvent("download"); await studyLink.click();
  const download = await downloading; expect(download.suggestedFilename()).toBe("study-morality.md");
  expect(await download.failure()).toBeNull();
  const markdown = await request.get("/content/apologetics/study-morality.md");
  expect(markdown.ok()).toBe(true); const text = await markdown.text();
  expect(text).toContain(STUDIES.find((s) => s.id === "morality")!.answer);
  expect(text).toContain("Romans 3:10-12"); expect(text).toContain("https://opc.org/wcf.html");
  await page.goto("/apologetics/sources");
  await expect(page.getByRole("link", { name: "Study documents · Markdown" })).toHaveAttribute("href", "/content/apologetics/library.md");
  await expect(page.getByRole("link", { name: "Structured collection · JSON" })).toHaveAttribute("href", "/content/apologetics/library.json");
  const response = await request.get("/content/apologetics/library.json"); expect(response.ok()).toBe(true);
  const corpus = await response.json();
  expect(corpus.documents.filter((d: { kind: string }) => d.kind === "study")).toHaveLength(STUDIES.length);
  expect(corpus.documents.find((d: { kind: string; id: string }) => d.kind === "study" && d.id === "morality").content.answer.text).toBe(STUDIES.find((s) => s.id === "morality")!.answer);
  expect(corpus.documents.every((d: Record<string, unknown>) => !("reviews" in d) && !("publication" in d))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.locator(".ap-document-downloads").screenshot({ path: testInfo.outputPath("document-downloads.png") });
});


test("apologetics: four worldview collections, shareable questions and local reflections", async ({ page }) => {
  await page.goto("/apologetics/worldviews");
  await expect(page.locator(".wv-collection")).toHaveCount(4);
  for (const item of WORLDVIEWS) {
    await page.locator(`.wv-collection[href="/apologetics/worldviews/${item.id}"]`).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.title);
    const buttons = page.getByRole("navigation", { name: "Comparison questions" }).getByRole("button");
    for (let i = 0; i < item.rows.length; i++) {
      const questionButton = item.id === "islam" ? page.getByRole("navigation", { name: "Comparison questions" }).getByRole("button", { name: item.rows[i].question, exact: true }) : buttons.nth(i);
      await questionButton.click();
      await expect(questionButton).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".wv-current-question h3")).toHaveText(item.rows[i].question);
      if (item.id === "islam") {
        const explanation = page.locator(".wv-perspective .wv-claim-explanation summary");
        if (await explanation.count()) await explanation.click();
      }
      await expect(page.locator(".wv-perspective .wv-position-copy p")).toHaveText(item.rows[i].other.split("\n\n"));
      await expect(page.locator(".wv-study-link")).toHaveAttribute("href", `/apologetics/study/${item.rows[i].study}`);
    }
    await page.reload();
    await expect(buttons.last()).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.getByRole("link", { name: "All worldviews", exact: true }).click();
  }
  await page.goto("/apologetics/worldviews/islam?question=invalid");
  await expect(page.locator(".wv-current-question h3")).toHaveText("Who is Jesus?");
  await page.getByRole("button", { name: "Write a reflection" }).click();
  await page.locator(".ap-note textarea").fill("Ask how my neighbour understands Jesus in Quran 4:171.");
  await page.reload();
  await page.getByRole("button", { name: "Write a reflection" }).click();
  await expect(page.locator(".ap-note textarea")).toHaveValue("Ask how my neighbour understands Jesus in Quran 4:171.");
  await page.goto("/apologetics/saved");
  await expect(page.locator('.ap-reflections a[href="/apologetics/worldviews/islam"]')).toContainText("Christianity & Islam");
  await page.goto("/apologetics/worldviews/buddhism");
  await page.getByRole("button", { name: "Write a reflection" }).click();
  await expect(page.locator(".ap-note textarea")).toHaveValue("");
});


test("apologetics: contextual sources and illustrated study cards support a reading task", async ({ page }) => {
  await page.goto("/apologetics/worldviews/islam");
  await expect(page.locator(".wv-reading-aim")).toContainText("trusting Jesus");
  const roadmap = page.locator(".wv-source-roadmap button");
  await expect(roadmap).toHaveCount(4);
  for (let stage = 0; stage < 4; stage++) {
    await roadmap.nth(stage).click();
    const passages = page.getByRole("navigation", { name: "Passages in this stage" }).getByRole("button");
    const readings = page.locator(".wv-analysis-card");
    for (let i = 0; i < await passages.count(); i++) {
      await passages.nth(i).click();
      await expect(readings.first().locator(".wv-source-purpose")).not.toBeEmpty();
      await expect(readings.first().locator(".wv-reading-task")).not.toBeEmpty();
      await expect(readings.first().locator(".wv-christian-counterpart .ap-citations")).not.toBeEmpty();
    }
    await expect(page.locator(".wv-reading-plan")).not.toContainText("Nicene Creed");
  }
  await roadmap.first().click();
  const sources = page.locator(".wv-context-card");
  await expect(sources.first().locator(".wv-source-purpose")).not.toBeEmpty();
  await expect(sources.first().locator(".wv-reading-task")).toContainText("Read all four verses together");
  await expect(sources.first().getByRole("link", { name: "Open the full text" })).toHaveAttribute("href", "https://quran.com/al-ikhlas");
  const relation = sources.first().locator(".wv-reading-connections a").first();
  const question = await relation.innerText();
  await relation.click();
  await expect(page.locator(".wv-current-question h3")).toHaveText(question.trim());
  const cards = page.locator(".wv-study-card");
  await expect(cards.first().locator(".wv-study-art")).toBeVisible();
  const save = cards.first().getByRole("button", { name: /^Save:/ });
  await save.click();
  await page.reload();
  await expect(cards.first().getByRole("button", { name: /^Unsave:/ })).toHaveAttribute("aria-pressed", "true");
  await cards.first().locator("a").click();
  await expect(page).toHaveURL(/\/apologetics\/study\/islam-jesus$/);
});


test("apologetics: Islam uses independent cards and exact question links", async ({ page }) => {
  await page.goto("/apologetics/worldviews/islam?question=sonship");
  await expect(page.locator(".wv-current-question h3")).toHaveText("What does Son of God mean?");
  await expect(page.getByRole("article", { name: "Christian truth", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Islamic perspective", exact: true })).toBeVisible();
  await expect(page.locator(".wv-question-nav button svg")).toHaveCount(0);
  const colors = await page.locator(".wv-positions article").evaluateAll(cards => cards.map(card => getComputedStyle(card).backgroundImage));
  expect(colors[0]).not.toBe(colors[1]);
  await page.reload();
  await expect(page.locator(".wv-current-question h3")).toHaveText("What does Son of God mean?");
  await page.locator(".wv-source-roadmap button").nth(1).click();
  await page.getByRole("navigation", { name: "Passages in this stage" }).getByRole("button").nth(1).click();
  await page.locator('.wv-reading-connections a[href$="?question=created-jesus#comparison"]').first().click();
  await expect(page.locator(".wv-current-question h3")).toHaveText("Was Jesus created?");
  await page.locator(".wv-claim-context-link").click();
  await expect(page.locator(".wv-analysis-heading .ap-eyebrow")).toContainText("3:59");
  await page.goto("/apologetics/worldviews/islam?question=islam-trinity");
  await expect(page.locator(".wv-current-question h3")).toHaveText("What does one God mean?");
});

test("apologetics: a worldview study returns to its originating collection and question", async ({ page }) => {
  await page.goto("/apologetics/worldviews/islam?question=comparison-2");
  await expect(page.locator(".wv-claims-connected .wv-claims-heading")).toBeVisible();
  await expect(page.locator(".wv-current-question")).not.toContainText("Question 02");
  await page.locator(".wv-study-link").click();
  const back = page.locator(".ap-study-heading .ap-back");
  await expect(back).toHaveText("Christianity & Islam");
  await page.reload();
  await back.click();
  await expect(page).toHaveURL(/worldviews\/islam\?question=comparison-2#comparison$/);
  await expect(page.locator(".wv-current-question h3")).toHaveText("What does one God mean?");
});
