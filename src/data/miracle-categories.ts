/**
 * This site's own grouping of the miracles of Jesus (A. T. Robertson's 35, keyed by his titles), in the usual
 * categories. Where a healing came with a demon cast out, the Gospel's own wording decides (Matthew 12:22 says the
 * blind and dumb man was "possessed with a devil", so he is under demons).
 */
export const MIRACLE_CATEGORIES = [
  { id: "healing", name: "Healing" },
  { id: "demons", name: "Casting out demons" },
  { id: "raising", name: "Raising the dead" },
  { id: "nature", name: "Wonders over nature" },
  { id: "provision", name: "Provision" },
] as const;

export type MiracleCategory = (typeof MIRACLE_CATEGORIES)[number]["id"];

export const MIRACLE_CATEGORY: Record<string, MiracleCategory> = {
  "The Water Made Wine": "provision",
  "The Courtier's Son": "healing",
  "The First Draught of Fishes": "provision",
  "The Capernaum Demoniac": "demons",
  "Simon's Mother-in-law": "healing",
  "A Leper": "healing",
  "The Paralytic": "healing",
  "The Impotent Man": "healing",
  "The Man with a Withered Hand": "healing",
  "The Centurion's Servant": "healing",
  "The Widow's Son": "raising",
  "A Blind and Dumb Man": "demons",
  "The Stilling of the Storm": "nature",
  "The Gadarene Demoniacs": "demons",
  "The Woman with an Issue of Blood": "healing",
  "Jairus' Daughter": "raising",
  "Two Blind Men": "healing",
  "A Dumb Demoniac": "demons",
  "The Five Thousand Fed": "provision",
  "Jesus Walking on the Water": "nature",
  "The Phoenician Woman's Daughter": "demons",
  "The Deaf and Dumb Man": "healing",
  "The Four Thousand Fed": "provision",
  "A Blind Man Healed": "healing",
  "The Demoniac Boy": "demons",
  "The Shekel in the Fish's Mouth": "provision",
  "The Man Born Blind": "healing",
  "The Woman with an Infirmity": "healing",
  "The Man with the Dropsy": "healing",
  "The Raising of Lazarus": "raising",
  "The Ten Lepers": "healing",
  "Blind Bartimæus and His Companion": "healing",
  "The Fig Tree Cursed": "nature",
  "Malchus' Ear": "healing",
  "The Second Draught of Fishes": "provision",
};
