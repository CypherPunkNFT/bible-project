# Study parent hub: direction 1

Owner-requested mockup, 2026-10-09. Preview: <http://127.0.0.1:8931/mockups/study-hub-v1/>.

The proposed parent of two Study collections: **Scripture & Theology** and **Academic Studies**. The existing Study collection supplies the first branch. Academic study covers history and archaeology, manuscripts and languages, and theologians and their works. Scholars remains a second entrance through people and their work.

This prototype contains the shared site header and footer, two illustrated entrances, working local search over fourteen existing destinations, a linked Hezekiah reading path, and an entrance to Scholars. The illustrations are schematic SVG drawings, not reproductions of particular artifacts.

## Current links and scope

- Scripture & Theology opens the current `/study` collection.
- Academic Studies opens the two existing case studies at `/review/research/cases`; its dedicated landing page is a later mockup.
- The reading path connects the Sennacherib source edition, the Hezekiah case, and the 2 Kings 19 lesson.
- Scholars opens the existing `/teachers/scholars` catalogue. Replacing its modal with an expanded profile is a later change.

No production route or existing collection was moved. This is a local design option, not an accepted or released design.

## Verification

Checked in Edge at 390, 768, 1024 and 1440 pixels, each in light and dark themes. No horizontal overflow, empty icons, page errors or failing asset responses. Verified search suggestions, matching historical and theological entries, no-results state, Escape, and clearing. All six main destinations loaded their actual content. Desktop, tablet and phone screenshots were visually inspected.

Re-run the local check with `node .local/check-study-hub-v1.mjs`. Screenshots and the result report are in `design/review/study-hub-v1/`; these review outputs and the local check script are ignored by Git.

The shared gallery catalogue and README already contain another chat's uncommitted work. `gallery-entry.json` preserves the card to merge after that work finishes; the direct preview is available now.
