import { Link } from 'react-router-dom';
import { PARABLES, PARABLE_FORMS } from '@/data/parables';

export function ParableScope() {
  return <details className="pb-count-note" id="parable-count">
    <summary>Are these all the parables? Why lists give different totals</summary>
    <div><p>This collection contains {PARABLES.length} studies in Matthew, Mark and Luke. That is the size of this collection, not a universally agreed biblical total.</p>
      <p>Our reading labels distinguish narrative parables (stories with particular characters and unfolding action), brief comparisons (compact scenes, images and hypothetical examples), and related figurative teaching (the returning spirit and the sheep-and-goats judgment scene). These are editorial reading aids; some passages sit across the boundaries.</p>
      <p>{Object.entries(PARABLE_FORMS).map(([form, label]) => `${label}: ${PARABLES.filter(story => story.form === form).length}`).join(' · ')}.</p>
      <p>The collection includes kingdom stories and short comparisons such as salt, the lamp, the eye, the measure and a father’s gifts. Shared imagery may bring Gospel passages into one study without implying one occasion. The talents and minas, and Matthew’s royal wedding and Luke’s great supper, remain separate because their settings and details differ. The divided kingdom and the strong man also remain distinct comparisons within the same argument.</p>
      <p>The seven categories are ways to browse, not exclusive theological definitions. Each study has one main home; many touch more than one theme.</p>
      <p>John’s shepherd and vine discourses fall outside this Synoptic collection: <Link to="/read/kjv/JHN/10?hl=1-18">John 10:1–18</Link> and <Link to="/read/kjv/JHN/15?hl=1-8">John 15:1–8</Link>. Other images, such as the narrow gate, the hen gathering her chicks and the harvest’s labourers, can support further studies. They are not counted here. This is a curated collection with an explained scope, not a claim to include every figure of speech.</p>
      <p className="pb-count-sources">Inventory checked against the Gospel texts and the thirty chapters in R. C. Trench’s <a href="https://archive.org/details/notesonparableso00tren" target="_blank" rel="noreferrer">Notes on the Parables of Our Lord</a>. For the counting question, see Arland Hultgren’s <a href="https://www.workingpreacher.org/theology-and-interpretation/preaching-the-parables-part-one" target="_blank" rel="noreferrer">discussion of parables and shorter comparisons</a>; compare <a href="https://www.esv.org/resources/esv-global-study-bible/chart-40-03/" target="_blank" rel="noreferrer">Crossway’s Gospel reference chart</a>. These sources inform the inventory; the study notes are original readings of the linked Scripture passages.</p>
    </div>
  </details>;
}
