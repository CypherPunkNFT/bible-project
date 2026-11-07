// The study page's Atlas window, under the two doors (owner, 2026-11-06): the map full width with the nine categories
// and the chosen place laid over it (mock-up version 3), outlined in indigo the way the doors are outlined in gold and
// orange (the colour of mock-up version 1), with version 1's full-size "Enter the full Atlas" button.
import { AtlasMap, type Inset } from "./AtlasMap";
import { Caveat, EnterAtlas, GroupedCategories, PlaceNote, useAtlasChoice } from "./parts";
import { RefText } from "./RefText";

/** Room the map keeps clear for the panels laid over its left and right, so places are not hidden under them. */
const PANEL_INSET: Inset = { left: 252, right: 332 };

export default function AtlasStage() {
  const choice = useAtlasChoice(), { category } = choice;
  return <section className="hub-section atlas-section in-doors am-section am-v3 am-toned atlas-stage" id="world" aria-label="The Atlas"><div className="am-window">
    <div className="am-scene"><AtlasMap category={category} chosen={choice.chosen.key} choose={choice.choose} inset={PANEL_INSET} />
      <div className="am-over-left"><GroupedCategories choice={choice} /></div>
      <div className="am-over-right"><p className="am-intro"><RefText text={category.intro} /></p><PlaceNote choice={choice} /><Caveat c={category} /></div>
      <div className="am-over-top"><EnterAtlas /></div>
    </div>
  </div></section>;
}
