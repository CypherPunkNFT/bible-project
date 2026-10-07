import { StudyCredits, StudyHeader } from "@/components/study/StudyParts";
import { STUDY_HOME, selectStudySection, useStudyView } from "@/components/study/study-view";
import { LetterGroupPage } from "@/components/letters/LetterGroupPage";
import { LettersOverview } from "@/components/letters/LettersOverview";
import type { LetterGroup } from "@/data/letters/types";

/**
 * The New Testament letters in four groups — Paul's letters, Hebrews, James–Peter–Jude, the letters of John. The
 * contents cards choose a group; each group is a full page built from the sourced research in
 * BibleProject/Research/Letters/ (data in src/data/letters/, components in src/components/letters/).
 */
export default function LettersPage() {
  const view = useStudyView("letters");
  const home = view === STUDY_HOME.letters;
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <StudyHeader
        eyebrow="Study · New Testament letters"
        title="The letters of the New Testament."
        lead={<p>Twenty-one letters in four groups. Choose one to see who wrote them and why, how each is built, the words it leans on, the people and places it names, and the Scriptures it quotes.</p>}
      />
      <div id={view} data-study-panel className="study-section-anchor">
        {/* Before a card is chosen the page shows what all 21 letters share; a group page offers the way back. */}
        {home ? <LettersOverview /> : <>
          <button type="button" className="lg-back" onClick={(e) => selectStudySection("letters", STUDY_HOME.letters!, { x: e.clientX, y: e.clientY })}>← All the letters</button>
          <LetterGroupPage key={view} groupId={view as LetterGroup["id"]} />
        </>}
      </div>
      <StudyCredits>
        Section headings: the Berean Standard Bible (public domain), as published on eBible.org. Places: OpenBible.info Bible geocoding (CC BY). Every other claim
        cites its source on the page; the research behind it checks each Bible reference against the King James text.
      </StudyCredits>
    </div>
  );
}
