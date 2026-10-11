import { Link } from 'react-router-dom';
import { PARABLES } from '@/data/parables';

export function ParableScope() {
  return <details className="pb-count-note" id="parable-count">
    <summary>Are these all the parables? Why lists give different totals</summary>
    <div><p>This collection now contains {PARABLES.length} studies of parables and shorter comparisons in Matthew, Mark and Luke. That is the size of this collection, not a universally agreed biblical total.</p>
      <p>Some lists count developed stories and kingdom comparisons; broader lists also include images such as the lamp, the blind guides and the speck and beam. We include those short images and label them in the reader. Similar Gospel accounts share a study, but the talents and minas, and Matthew’s royal wedding and Luke’s great supper, remain separate because their settings and details differ.</p>
      <p>The six categories are ways to browse, not exclusive theological definitions. Each study has one main home; many touch more than one theme.</p>
      <p>John’s shepherd and vine discourses are related figurative teaching, treated separately from this Synoptic collection: <Link to="/read/kjv/JHN/10?hl=1-18">John 10:1–18</Link> and <Link to="/read/kjv/JHN/15?hl=1-8">John 15:1–8</Link>. Other brief sayings can also be included under a wider definition; this page does not claim that every figure of speech is a distinct parable.</p>
      <p className="pb-count-sources">Inventory checked against the Gospel texts and the thirty chapters in R. C. Trench’s <a href="https://archive.org/details/notesonparableso00tren" target="_blank" rel="noreferrer">Notes on the Parables of Our Lord</a>. For the counting question, see Arland Hultgren’s <a href="https://www.workingpreacher.org/theology-and-interpretation/preaching-the-parables-part-one" target="_blank" rel="noreferrer">discussion of parables and shorter comparisons</a>; compare <a href="https://www.esv.org/resources/esv-global-study-bible/chart-40-03/" target="_blank" rel="noreferrer">Crossway’s Gospel reference chart</a>. These sources inform the inventory; the study notes are original readings of the linked Scripture passages.</p>
    </div>
  </details>;
}
